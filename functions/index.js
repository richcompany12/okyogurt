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