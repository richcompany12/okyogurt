const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const crypto = require('crypto');

admin.initializeApp();

// CoolSMS 설정
const COOLSMS_API_KEY = functions.config().coolsms.api_key;
const COOLSMS_API_SECRET = functions.config().coolsms.api_secret;
const COOLSMS_SENDER = functions.config().coolsms.sender; // 발신번호
const ADMIN_PHONE = functions.config().admin.phone || '01012345678'; // 관리자 번호

// CoolSMS 서명 생성
function makeSignature(method, uri, apiKey, apiSecret, salt, timestamp) {
  const data = `${method}${uri}${apiKey}${salt}${timestamp}`;
  return crypto.createHmac('sha256', apiSecret).update(data).digest('hex');
}

// SMS 발송 함수
async function sendSMS(to, message) {
  const timestamp = Date.now().toString();
  const salt = Math.random().toString(36).substr(2, 10);
  const method = 'POST';
  const uri = '/sms/v4/send';
  
  const signature = makeSignature(method, uri, COOLSMS_API_KEY, COOLSMS_API_SECRET, salt, timestamp);
  
  const data = {
    message: {
      to: to,
      from: COOLSMS_SENDER,
      text: message
    }
  };

  try {
    const response = await axios.post('https://api.coolsms.co.kr/sms/v4/send', data, {
      headers: {
        'Authorization': `HMAC-SHA256 apiKey=${COOLSMS_API_KEY}, date=${timestamp}, salt=${salt}, signature=${signature}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('SMS 발송 성공:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('SMS 발송 실패:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

// 새 주문 생성 시 관리자에게 알림
exports.onOrderCreated = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    const orderId = context.params.orderId;
    
    console.log('새 주문 생성:', orderId, order);
    
    // 관리자에게 새 주문 알림
    const adminMessage = `[요거트퍼플] 새 주문 접수
주문번호: #${orderId.slice(-6)}
금액: ${order.amount?.toLocaleString()}원
전화번호: ${order.phone}
${order.tableInfo ? `테이블: ${order.tableInfo}` : ''}
${order.request ? `요청: ${order.request}` : ''}

주문 확인: https://your-domain.com/admin`;

    const result = await sendSMS(ADMIN_PHONE, adminMessage);
    
    if (result.success) {
      console.log('관리자 알림 SMS 발송 완료');
    } else {
      console.error('관리자 알림 SMS 발송 실패:', result.error);
    }
    
    return null;
  });

// 주문 상태 변경 시 고객에게 알림
exports.onOrderUpdated = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const orderId = context.params.orderId;
    
    console.log('주문 상태 변경:', orderId, before.status, '->', after.status);
    
    // 주문 확인 시
    if (before.status === 'pending' && after.status === 'confirmed') {
      const customerMessage = `[요거트퍼플] 주문이 확인되었습니다!

주문번호: #${orderId.slice(-6)}
금액: ${after.amount?.toLocaleString()}원
배달예정: 약 ${after.deliveryTime}분 후

맛있는 아이스크림을 준비해드리겠습니다! 🍦`;

      const result = await sendSMS(after.phone, customerMessage);
      
      if (result.success) {
        console.log('주문 확인 SMS 발송 완료');
      } else {
        console.error('주문 확인 SMS 발송 실패:', result.error);
      }
    }
    
    // 주문 취소 시
    else if (before.status === 'pending' && after.status === 'cancelled') {
      const customerMessage = `[요거트퍼플] 주문이 취소되었습니다.

주문번호: #${orderId.slice(-6)}
취소사유: ${after.cancelReason || '기타'}

문의사항이 있으시면 연락주세요.
죄송합니다.`;

      const result = await sendSMS(after.phone, customerMessage);
      
      if (result.success) {
        console.log('주문 취소 SMS 발송 완료');
      } else {
        console.error('주문 취소 SMS 발송 실패:', result.error);
      }
    }
    
    return null;
  });

// 수동 SMS 발송 함수 (테스트용)
exports.sendTestSMS = functions.https.onRequest(async (req, res) => {
  // CORS 헤더 설정
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
  
  if (result.success) {
    res.json({ success: true, message: 'SMS 발송 완료', data: result.data });
  } else {
    res.status(500).json({ success: false, error: result.error });
  }
});