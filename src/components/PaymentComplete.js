// src/components/PaymentComplete.js
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PaymentComplete = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const processPaymentComplete = async () => {
      try {
        const paymentId = searchParams.get('paymentId');
        const storeId = searchParams.get('storeId') || localStorage.getItem('currentStoreId');
        
        console.log('결제 완료 페이지 진입:', { paymentId, storeId });
        
        // 로그 저장
        const debugLog = {
          timestamp: new Date().toISOString(),
          type: 'PAYMENT_COMPLETE_REDIRECT',
          data: { paymentId, storeId, url: window.location.href }
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

        // OrderPage의 handleOrderSubmit 로직을 그대로 사용
        await saveOrderLikeOrderPage(storeId, cartItems, customerInfo, paymentId);
        
        // 완료 후 정리
        localStorage.removeItem('cart');
        localStorage.removeItem('pendingOrder');
        localStorage.removeItem('customerInfo');
        
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
        alert('결제는 완료되었지만 주문 처리 중 오류가 발생했습니다. 고객센터로 연락해주세요.');
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

  return (
    <div className="payment-complete">
      <div className="completion-message">
        <div className="success-icon">✅</div>
        <h2>결제가 완료되었습니다!</h2>
        <p>주문이 정상적으로 접수되었습니다.</p>
        <p>관리자에게 주문 내역이 전달되었으며,</p>
        <p>곧 배달 예정 시간을 안내해드리겠습니다.</p>
        <div className="redirect-notice">
          <p>🔄 잠시 후 주문 페이지로 이동합니다...</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentComplete;