const {onRequest} = require('firebase-functions/v2/https');
const {defineSecret} = require('firebase-functions/params');
const admin = require('firebase-admin');
const axios = require('axios');
const crypto = require('crypto');

// Firebase Admin 초기화
admin.initializeApp();

// Secret 정의
const coolsmsApiKey = defineSecret('COOLSMS_API_KEY');
const coolsmsApiSecret = defineSecret('COOLSMS_API_SECRET');

// SMS 발송 함수
async function sendSMS(to, message) {
  try {
    const apiKey = coolsmsApiKey.value();
    const apiSecret = coolsmsApiSecret.value();
    const sender = '01081771258';
    
    // CoolSMS v4 API 인증
    const date = new Date().toISOString();
    const salt = Date.now().toString();
    
    // HMAC 서명 생성
    const stringToSign = date + salt;
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(stringToSign)
      .digest('hex');
    
    // API 요청 데이터
    const requestData = {
      message: {
        to: to,
        from: sender,
        text: message
      }
    };
    
    // HTTP 헤더
    const headers = {
      'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
      'Content-Type': 'application/json'
    };
    
    // CoolSMS API 호출
    const response = await axios.post('https://api.coolsms.co.kr/messages/v4/send', requestData, { headers });
    
    console.log('✅ SMS 발송 성공:', response.data);
    return { success: true, message: 'SMS 발송 완료', data: response.data };
  } catch (error) {
    console.error('❌ SMS 발송 오류:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

exports.sendTestSMS = onRequest({
  secrets: [coolsmsApiKey, coolsmsApiSecret]
}, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }
  
  const { to, message } = req.body;
  
  if (!to || !message) {
    res.status(400).json({ error: '전화번호와 메시지가 필요합니다.' });
    return;
  }
  
  const result = await sendSMS(to, message);
  res.json(result);
});

exports.checkNewOrders = onRequest(async (req, res) => {
  try {
    const db = admin.firestore();
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentOrders = await db.collection('orders')
      .where('createdAt', '>=', fiveMinutesAgo)
      .orderBy('createdAt', 'desc')
      .get();
    
    const orders = [];
    recentOrders.forEach(doc => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({ 
      success: true, 
      message: `최근 ${orders.length}개 주문 발견`,
      orders: orders
    });
  } catch (error) {
    console.error('주문 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

exports.testAdmin = onRequest(async (req, res) => {
  try {
    const db = admin.firestore();
    await db.collection('test').doc('admin-test').set({
      message: 'Admin SDK 작동 확인',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true, message: 'Admin SDK 정상 작동' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

exports.createStoreOwner = onRequest({
  secrets: [coolsmsApiKey, coolsmsApiSecret]
}, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }

  try {
    const { email, password, storeData, userData } = req.body;

    // 1. Admin SDK로 사용자 생성 (현재 로그인 상태에 영향 없음)
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: userData.name
    });

    // 2. Firestore에 사용자 정보 저장
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      ...userData,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 3. Firestore에 상점 정보 저장
    const storeRef = await admin.firestore().collection('stores').add({
      ...storeData,
      ownerId: userRecord.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 4. 사용자 문서에 storeId 업데이트
    await admin.firestore().collection('users').doc(userRecord.uid).update({
      storeId: storeRef.id
    });

    res.json({ 
      success: true, 
      userId: userRecord.uid,
      storeId: storeRef.id,
      message: '상점과 계정이 성공적으로 생성되었습니다.' 
    });

  } catch (error) {
    console.error('계정 생성 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 포트원 웹훅 처리 함수 (⚠️ 여기가 수정된 부분입니다)
exports.paymentwebhook = onRequest({
  cors: true,
  secrets: [coolsmsApiKey, coolsmsApiSecret]
}, async (req, res) => {
  console.log('🎯 포트원 웹훅 수신 시작');
  
  // CORS 헤더 설정
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }
  
  if (req.method !== 'POST') {
    console.log('❌ POST 요청이 아님:', req.method);
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const webhookData = req.body;
    console.log('📨 웹훅 데이터 수신:', JSON.stringify(webhookData, null, 2));
    
    // 포트원 웹훅 데이터 구조 확인
    if (!webhookData.type || !webhookData.data) {
      console.log('❌ 웹훅 데이터 구조 오류');
      res.status(400).json({ error: '잘못된 웹훅 데이터 구조' });
      return;
    }
    
    const { type, data } = webhookData;
    const { transactionId, paymentId, amount, status } = data;
    
    console.log('🔍 웹훅 정보:', { type, transactionId, paymentId, amount, status });
    
    // Transaction.Paid 이벤트만 처리 (결제 완료)
    if (type !== 'Transaction.Paid') {
      console.log(`⭐️ 처리 대상 아님: ${type}`);
      res.status(200).json({ message: '처리 대상이 아닌 이벤트입니다.' });
      return;
    }
    
    // paymentId 필수 확인
    if (!paymentId) {
      console.log('❌ paymentId 없음');
      res.status(400).json({ error: 'paymentId가 필요합니다.' });
      return;
    }
    
    // 🔍 중복 처리 방지 - 이미 처리된 주문인지 확인
    const db = admin.firestore();
    const existingOrderQuery = await db.collection('orders')
      .where('paymentId', '==', paymentId)
      .get();
    
    if (!existingOrderQuery.empty) {
      console.log(`⚠️ 이미 처리된 주문: ${paymentId}`);
      res.status(200).json({ message: '이미 처리된 주문입니다.' });
      return;
    }
    
    console.log('✅ 신규 주문 확인 - 주문 생성 진행');
    
    // 🎯 포트원 결제 정보 상세 조회 (추가 정보 획득)
    const paymentDetails = await getPaymentDetailsFromPortOne(paymentId);
    
    if (!paymentDetails) {
      console.log('❌ 포트원 결제 정보 조회 실패');
      res.status(500).json({ error: '결제 정보 조회 실패' });
      return;
    }
    
    console.log('💳 결제 상세 정보:', paymentDetails);
    
    // 🛒 주문 정보 복원 (결제 시 저장된 메타데이터에서)
    const orderInfo = paymentDetails.customData || paymentDetails.metadata;

    // ⚠️ 🔥 핵심 수정 부분: 기존의 즉시 긴급 알림을 클라이언트 처리 확인으로 변경
    if (!orderInfo || !orderInfo.storeId || !orderInfo.items) {
      console.log('⚠️ 주문 정보 부족, 클라이언트 처리 확인:', orderInfo);
      
      // 🔍 즉시 긴급 알림 대신 클라이언트 처리 확인
      const existingOrder = await db.collection('orders')
        .where('paymentId', '==', paymentId).get();
      
      if (!existingOrder.empty) {
        console.log('✅ 클라이언트에서 이미 처리됨');
        return res.status(200).json({ message: '클라이언트에서 이미 처리됨' });
      }
      
      console.log('⏳ 5초 대기 후 재확인...');
      
      // 5초 대기 후 재확인
      setTimeout(async () => {
        console.log('🔍 5초 후 재확인 시작');
        const orderAfterWait = await db.collection('orders')
          .where('paymentId', '==', paymentId).get();
        
        if (orderAfterWait.empty) {
          console.log('🚨 클라이언트 처리 실패 확인 - 긴급 알림 발송');
          await sendEmergencyAlert(paymentId, amount, '클라이언트 처리 실패');
        } else {
          console.log('✅ 클라이언트에서 처리 완료 확인됨');
        }
      }, 5000);
      
      return res.status(200).json({ message: '클라이언트 처리 대기 중' });
    }
    
    // 🏪 상점 정보 조회
    const storeDoc = await db.collection('stores').doc(orderInfo.storeId).get();
    const storeData = storeDoc.exists() ? storeDoc.data() : { name: '알 수 없는 상점' };
    
    // 📋 주문 데이터 생성
    const orderNumber = 'ORD' + Date.now() + '_WH'; // _WH = 웹훅으로 생성됨을 표시
    const orderData = {
      orderNumber,
      storeId: orderInfo.storeId,
      storeName: storeData.name || '알 수 없는 상점',
      items: orderInfo.items,
      amount: amount,
      phone: orderInfo.customerPhone,
      tableNumber: orderInfo.tableNumber || null,
      specialRequests: orderInfo.specialRequests || null,
      paymentId: paymentId,
      paymentStatus: 'completed',
      paymentResponse: paymentDetails,
      status: 'paid',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'webhook',
      timestamp: Date.now()
    };
    
    console.log('💾 주문 데이터 생성:', orderData);
    
    // 📄 재시도 로직으로 주문 저장
    const saveSuccess = await saveOrderWithRetry(orderData, 3);
    
    if (!saveSuccess) {
      console.log('💥 주문 저장 완전 실패');
      await sendEmergencyAlert(paymentId, amount, '웹훅에서 주문 저장 실패');
      res.status(500).json({ error: '주문 저장 실패' });
      return;
    }
    
    console.log('✅ 웹훅 주문 저장 성공');
    
    // 📱 관리자 SMS 발송
    try {
      await sendOrderNotificationSMS(orderData);
      console.log('✅ 관리자 SMS 발송 성공');
    } catch (smsError) {
      console.error('❌ SMS 발송 실패:', smsError);
      // SMS 실패해도 주문은 성공으로 처리
    }
    
    // 🎁 포인트 적립
    try {
      await addPointsToStore(orderData);
      console.log('✅ 포인트 적립 성공');
    } catch (pointError) {
      console.error('❌ 포인트 적립 실패:', pointError);
      // 포인트 실패해도 주문은 성공으로 처리
    }
    
    console.log('🎉 웹훅 처리 완전 성공');
    
    res.status(200).json({ 
      success: true, 
      message: '웹훅 처리 완료',
      orderNumber: orderData.orderNumber,
      orderId: orderData.id 
    });
    
  } catch (error) {
    console.error('💥 웹훅 처리 중 오류:', error);
    
    // 긴급 상황 알림
    try {
      const paymentId = req.body?.data?.paymentId || 'unknown';
      const amount = req.body?.data?.amount || 0;
      await sendEmergencyAlert(paymentId, amount, `웹훅 오류: ${error.message}`);
    } catch (alertError) {
      console.error('긴급 알림마저 실패:', alertError);
    }
    
    res.status(500).json({ 
      success: false, 
      error: '웹훅 처리 실패',
      message: error.message 
    });
  }
});

// 📄 재시도 로직으로 주문 저장 (기존과 동일)
async function saveOrderWithRetry(orderData, maxRetries = 3) {
  const db = admin.firestore();
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📄 주문 저장 시도 ${attempt}/${maxRetries}`);
      
      const docRef = await db.collection('orders').add(orderData);
      console.log(`✅ 주문 저장 성공: ${docRef.id} (${attempt}번째 시도)`);
      
      // 저장된 주문 ID를 orderData에 추가
      orderData.id = docRef.id;
      
      return true;
      
    } catch (error) {
      console.error(`❌ 주문 저장 실패 (${attempt}번째 시도):`, error);
      
      if (attempt === maxRetries) {
        console.error('💥 모든 재시도 실패');
        return false;
      }
      
      // 재시도 전 대기 (1초, 2초, 3초)
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
  return false;
}

// 💳 포트원 결제 정보 상세 조회 (기존과 동일)
async function getPaymentDetailsFromPortOne(paymentId) {
  try {
    // 포트원 API를 통한 결제 정보 조회
    // 실제 구현 시에는 포트원 API 키가 필요합니다
    console.log('💳 포트원 결제 정보 조회 시뮬레이션:', paymentId);
    
    // 임시로 기본 정보 반환 (실제로는 포트원 API 호출)
    return {
      paymentId: paymentId,
      amount: 0, // 웹훅 데이터에서 가져옴
      status: 'paid',
      customData: null, // 결제 시 저장한 주문 정보
      metadata: null
    };
    
  } catch (error) {
    console.error('포트원 API 조회 실패:', error);
    return null;
  }
}

// 🚨 긴급 알림 발송 (기존과 동일)
async function sendEmergencyAlert(paymentId, amount, errorMessage) {
  try {
    const emergencyMessage = `🚨 웹훅 긴급 상황!
    
💳 결제ID: ${paymentId}
💰 금액: ${amount?.toLocaleString() || '알 수 없음'}원
❌ 오류: ${errorMessage}

즉시 확인 필요!`;

    await sendSMS('01047474763', emergencyMessage);
    console.log('✅ 긴급 알림 발송 성공');
  } catch (error) {
    console.error('❌ 긴급 알림 발송 실패:', error);
  }
}

// 📱 주문 알림 SMS 발송 (기존과 동일)
async function sendOrderNotificationSMS(orderData) {
  const adminMessage = `🆕새주문! 💳웹훅처리 ${orderData.storeName} ${orderData.amount.toLocaleString()}원 ${orderData.phone} ${orderData.tableNumber || '포장'}`;
  
  await sendSMS('01047474763', adminMessage);
}

// 🎁 포인트 적립 (기존과 동일)
async function addPointsToStore(orderData) {
  const db = admin.firestore();
  
  const storeDoc = await db.collection('stores').doc(orderData.storeId).get();
  if (!storeDoc.exists()) return;
  
  const storeData = storeDoc.data();
  const pointRate = storeData.pointRate || 5;
  const earnedPoints = Math.floor(orderData.amount * (pointRate / 100));
  
  if (earnedPoints <= 0) return;

  const pointRecord = {
    storeId: orderData.storeId,
    storeName: orderData.storeName,
    pointsEarned: earnedPoints,
    orderAmount: orderData.amount,
    pointRate: pointRate,
    type: 'earned',
    reason: `웹훅 주문 결제 완료 - ${pointRate}% 자동 적립`,
    orderId: orderData.id,
    orderNumber: orderData.orderNumber,
    customerPhone: orderData.phone,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('store_points').add(pointRecord);

  const balanceRef = db.collection('store_point_balance').doc(orderData.storeId);
  const balanceDoc = await balanceRef.get();

  if (balanceDoc.exists()) {
    const currentData = balanceDoc.data();
    await balanceRef.update({
      totalPoints: (currentData.totalPoints || 0) + earnedPoints,
      totalEarned: (currentData.totalEarned || 0) + earnedPoints,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } else {
    await balanceRef.set({
      storeId: orderData.storeId,
      storeName: orderData.storeName,
      totalPoints: earnedPoints,
      totalEarned: earnedPoints,
      totalUsed: 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  console.log('✅ 포인트 적립 성공:', earnedPoints);
}