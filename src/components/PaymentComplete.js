// src/components/PaymentComplete.js
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PaymentComplete = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  
useEffect(() => {
  const processPaymentComplete = async () => {
    try {
      // 🔍 디버깅용 로그
      console.log('=== 결제 완료 페이지 디버깅 ===');
      console.log('📍 현재 전체 URL:', window.location.href);
      console.log('📍 URL search 파라미터:', window.location.search);
      
      // 모든 URL 파라미터 개별 확인
      const allParams = {};
      searchParams.forEach((value, key) => {
        allParams[key] = value;
      });
      console.log('📍 모든 URL 파라미터:', allParams);
      
      // 파라미터 추출
      const paymentId = searchParams.get('paymentId') || searchParams.get('payment_id');
      const storeId = searchParams.get('storeId') || localStorage.getItem('currentStoreId');
      const code = searchParams.get('code');
      const message = searchParams.get('message');
      const errorCode = searchParams.get('error_code');
      const errorMsg = searchParams.get('error_msg');
      
      console.log('🔍 추출된 정보:', { 
        paymentId, 
        storeId, 
        code,
        message,
        errorCode, 
        errorMsg 
      });
      
      // 🚨 포트원 실패/취소 코드 확인
      const isPaymentFailed = 
        code === 'FAILURE_TYPE_PG' || 
        code === 'PAY_PROCESS_CANCELED' ||
        message?.includes('PAY_PROCESS_CANCELED') ||
        message?.includes('취소') ||
        errorCode ||
        errorMsg;
      
      if (isPaymentFailed) {
        setIsProcessing(false);
        console.log('❌ 결제 실패/취소 감지:', { 
          code, 
          message, 
          errorCode, 
          errorMsg 
        });
        
        // 사용자에게 명확한 안내
        if (message?.includes('취소')) {
          alert('결제가 취소되었습니다.');
        } else {
          alert(`결제에 실패했습니다.\n${message || errorMsg || '다시 시도해주세요.'}`);
        }
        
        // 로컬스토리지 정리하지 않음 (재결제 가능하도록)
        // localStorage.removeItem('cart');
        // localStorage.removeItem('pendingOrder');
        // localStorage.removeItem('customerInfo');
        
        // 원래 주문 페이지로 이동 (장바구니 유지)
        if (storeId) {
          navigate(`/order/${storeId}`);
        } else {
          navigate('/');
        }
        return;
      }
      
      // paymentId가 없고 에러도 없으면 잘못된 접근
      if (!paymentId) {
        console.log('❌ paymentId 없음 - 잘못된 접근');
        alert('결제 정보가 없습니다. 다시 주문해주세요.');
        navigate('/');
        return;
      }
      
      console.log('✅ 정상적인 결제 완료로 판단 - 주문 저장 진행');
      
      // 로그 저장
      const debugLog = {
        timestamp: new Date().toISOString(),
        type: 'PAYMENT_COMPLETE_SUCCESS',
        data: { paymentId, storeId, url: window.location.href, allParams }
      };
      
      const logs = JSON.parse(localStorage.getItem('mobile_debug_logs') || '[]');
      logs.push(debugLog);
      localStorage.setItem('mobile_debug_logs', JSON.stringify(logs));
      
      // 로컬스토리지에서 주문 정보 복원
      const pendingOrder = JSON.parse(localStorage.getItem('pendingOrder') || '{}');
      const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
      const customerInfo = JSON.parse(localStorage.getItem('customerInfo') || '{}');
      
      if (!storeId || cartItems.length === 0 || !customerInfo.phone) {
        console.error('필수 정보 누락:', { storeId, cartItems, customerInfo });
        alert('주문 정보가 손실되었습니다. 다시 주문해주세요.');
        navigate('/');
        return;
      }

      // 주문 저장 (결제 성공으로 판단된 경우에만)
      await saveOrderLikeOrderPage(storeId, cartItems, customerInfo, paymentId);
      
      console.log('✅ 주문 저장 완료');
      
      // 완료 후 정리
      localStorage.removeItem('cart');
      localStorage.removeItem('pendingOrder');
      localStorage.removeItem('customerInfo');
      
      // 성공 메시지
      alert('결제가 완료되었습니다! 주문이 접수되었습니다.');
      
      // 3초 후 해당 상점으로 이동
      setTimeout(() => {
        if (storeId) {
          navigate(`/order/${storeId}`);
        } else {
          navigate('/');
        }
      }, 3000);
      
    } catch (error) {
      console.error('❌ 결제 완료 처리 실패:', error);
      alert('결제 처리 중 오류가 발생했습니다. 고객센터로 연락해주세요.');
      
      // 에러 발생 시에도 로컬스토리지 정리
      //localStorage.removeItem('cart');
      //localStorage.removeItem('pendingOrder');
      //localStorage.removeItem('customerInfo');
      
      navigate('/');
    }
  };

  processPaymentComplete();
}, [navigate, searchParams]);

  // OrderPage의 handleOrderSubmit과 동일한 로직
  const saveOrderLikeOrderPage = async (storeId, cart, customerInfo, paymentId) => {
    try {
      const { collection, addDoc, doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      // 상점 정보 가져오기
      const storeDoc = await getDoc(doc(db, 'stores', storeId));
      const storeData = storeDoc.exists() ? storeDoc.data() : { name: '알 수 없는 상점' };
      
      const orderNumber = 'ORD' + Date.now();
      const totalAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

      // OrderPage와 동일한 주문 데이터 구조
      const orderData = {
        orderNumber,
        storeId: storeId,
        storeName: storeData.name,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category || '전체 메뉴'
        })),
        amount: totalAmount,
        phone: customerInfo.phone,
        tableNumber: customerInfo.tableNumber || null,
        specialRequests: customerInfo.specialRequests || null,
        paymentId: paymentId,
        paymentStatus: 'completed',
        paymentResponse: null,
        status: 'paid',
        createdAt: new Date(),
        timestamp: Date.now()
      };

      console.log('주문 데이터 저장 시작:', orderData);

      // Firebase 저장
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      console.log('✅ 주문 저장 성공:', docRef.id);

      // SMS 발송 (OrderPage와 동일한 로직)
      await sendOrderNotificationSMS(orderData);
      
      // 포인트 적립 (OrderPage와 동일한 로직)
      await addPointsToStore(orderData);

      console.log('🎉 주문 처리 완료:', { orderNumber, docId: docRef.id });
      
    } catch (error) {
      console.error('❌ 주문 저장 실패:', error);
      throw error;
    }
  };

  // OrderPage의 SMS 함수와 동일
  const sendOrderNotificationSMS = async (orderData) => {
    try {
      const SMS_ENDPOINT = 'https://sendtestsms-b245qv2hpq-uc.a.run.app';
      const adminMessage = `🆕새주문! 💳결제완료 ${orderData.storeName} ${orderData.amount.toLocaleString()}원 ${orderData.phone} ${orderData.tableNumber || '포장'}`;

      const response = await fetch(SMS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: '01047474763',
          message: adminMessage
        })
      });

      if (!response.ok) {
        throw new Error(`SMS API 오류: ${response.status}`);
      }

      console.log('✅ SMS 발송 성공');
    } catch (error) {
      console.error('❌ SMS 발송 실패:', error);
    }
  };

  // OrderPage의 포인트 함수와 동일
  const addPointsToStore = async (orderData) => {
    try {
      const { collection, addDoc, doc, getDoc, setDoc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const storeDoc = await getDoc(doc(db, 'stores', orderData.storeId));
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
        reason: `주문 결제 완료 - ${pointRate}% 자동 적립`,
        orderId: null,
        orderNumber: orderData.orderNumber,
        customerPhone: orderData.phone,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'store_points'), pointRecord);

      const balanceRef = doc(db, 'store_point_balance', orderData.storeId);
      const balanceDoc = await getDoc(balanceRef);

      if (balanceDoc.exists()) {
        const currentData = balanceDoc.data();
        await updateDoc(balanceRef, {
          totalPoints: (currentData.totalPoints || 0) + earnedPoints,
          totalEarned: (currentData.totalEarned || 0) + earnedPoints,
          updatedAt: new Date()
        });
      } else {
        await setDoc(balanceRef, {
          storeId: orderData.storeId,
          storeName: orderData.storeName,
          totalPoints: earnedPoints,
          totalEarned: earnedPoints,
          totalUsed: 0,
          updatedAt: new Date()
        });
      }

      console.log('✅ 포인트 적립 성공:', earnedPoints);
    } catch (error) {
      console.error('❌ 포인트 적립 실패:', error);
    }
  };

  if (isProcessing) {
  return (
    <div className="payment-complete">
      <div className="completion-message">
        <div className="success-icon">⏳</div>
        <h2>결제 정보를 확인하는 중...</h2>
        <p>잠시만 기다려주세요.</p>
      </div>
    </div>
  );
}
return null;
};

export default PaymentComplete;