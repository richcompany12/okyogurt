// src/pages/OrderPage.js
import { useBusinessHours } from '../components/BusinessHoursChecker';
import ClosedNotice from '../components/ClosedNotice';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  deleteDoc,     // 기존
  setDoc,        // 🆕 추가
  updateDoc,     // 🆕 추가
  onSnapshot,
  query,
  orderBy,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import OrderForm from '../components/Order/OrderForm';
import './OrderPage.css';
import SimpleFooter from '../components/SimpleFooter';

// 🔧 임시 디버깅 로거 (버그 해결 후 제거 예정)
const debugLogger = {
  log: (step, message, data = null) => {
    try {
      const logs = JSON.parse(localStorage.getItem('mobile_debug_logs') || '[]');
      const logEntry = {
        timestamp: new Date().toISOString(),
        step: step,
        message: message,
        data: data,
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      logs.push(logEntry);
      
      // 최대 100개 로그만 유지 (용량 관리)
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('mobile_debug_logs', JSON.stringify(logs));
      console.log(`[DEBUG] ${step}: ${message}`, data);
    } catch (error) {
      console.error('로거 오류:', error);
    }
  },
  
  error: (step, error, additionalData = null) => {
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        step: step,
        error_message: error.message,
        error_stack: error.stack,
        additional_data: additionalData,
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      const logs = JSON.parse(localStorage.getItem('mobile_debug_logs') || '[]');
      logs.push({
        ...errorLog,
        type: 'ERROR'
      });
      
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('mobile_debug_logs', JSON.stringify(logs));
      console.error(`[DEBUG ERROR] ${step}:`, error, additionalData);
    } catch (logError) {
      console.error('에러 로거 오류:', logError);
    }
  }
};

// 🔧 PC에서 로그 확인용 헬퍼 함수 (개발자 콘솔에서 실행)
window.getDebugLogs = () => {
  const logs = JSON.parse(localStorage.getItem('mobile_debug_logs') || '[]');
  console.table(logs);
  return logs;
};

window.clearDebugLogs = () => {
  localStorage.removeItem('mobile_debug_logs');
  console.log('디버그 로그가 삭제되었습니다.');
};

const OrderPage = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  
  // 상태 관리
  const [store, setStore] = useState(null);
  const [menus, setMenus] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const businessStatus = useBusinessHours();
  const [tapCount, setTapCount] = useState(0);
  const [tapTimer, setTapTimer] = useState(null);

  // 🔧 페이지 로드 시 로깅
  useEffect(() => {
    debugLogger.log('PAGE_LOAD', '주문 페이지 로드됨', { storeId: storeId });
  }, []);

  // 상점 정보 로드
  useEffect(() => {
    const loadStoreData = async () => {
      try {
        debugLogger.log('STORE_LOAD_START', '상점 정보 로드 시작', { storeId: storeId });
        
        if (!storeId) {
          debugLogger.log('STORE_LOAD_NO_ID', '스토어 ID 없음');
          setLoading(false);
          return;
        }

        const storeDoc = await getDoc(doc(db, 'stores', storeId));
        
        if (storeDoc.exists()) {
          const storeData = { id: storeDoc.id, ...storeDoc.data() };
          setStore(storeData);
          debugLogger.log('STORE_LOAD_SUCCESS', '상점 정보 로드 성공', storeData);
        } else {
          debugLogger.log('STORE_LOAD_NOT_FOUND', '상점 정보 없음');
        }
        
        setLoading(false);
      } catch (error) {
        debugLogger.error('STORE_LOAD_ERROR', error, { storeId: storeId });
        setLoading(false);
      }
    };

    loadStoreData();
  }, [storeId]);

  // 메뉴 목록 로드
  useEffect(() => {
    debugLogger.log('MENU_LOAD_START', '메뉴 로드 시작');
    
    const menusQuery = query(
      collection(db, 'menus'),
      where('isAvailable', '==', true),
      orderBy('name')
    );

    const unsubscribe = onSnapshot(menusQuery, (snapshot) => {
      const menusList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      debugLogger.log('MENU_LOAD_SUCCESS', '메뉴 로드 성공', { count: menusList.length, menus: menusList });
      setMenus(menusList);
    }, (error) => {
      debugLogger.error('MENU_LOAD_ERROR', error);
      
      const fallbackQuery = query(
        collection(db, 'menus'),
        orderBy('name')
      );
      
      const fallbackUnsubscribe = onSnapshot(fallbackQuery, (snapshot) => {
        const menusList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        debugLogger.log('MENU_LOAD_FALLBACK_SUCCESS', 'Fallback 메뉴 로드 성공', { count: menusList.length });
        setMenus(menusList);
      });
      
      return () => fallbackUnsubscribe();
    });

    return () => unsubscribe();
  }, []);

  // 장바구니에 추가
  const addToCart = (menu, quantity = 1) => {
    debugLogger.log('ADD_TO_CART', '장바구니 추가', { menuId: menu.id, menuName: menu.name, quantity: quantity });
    
    const existingItem = cart.find(item => item.id === menu.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === menu.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, { ...menu, quantity }]);
    }
    
    setSelectedMenu(null);
  };

  // 장바구니 수량 변경
  const updateCartQuantity = (menuId, newQuantity) => {
    debugLogger.log('UPDATE_CART_QUANTITY', '장바구니 수량 변경', { menuId: menuId, newQuantity: newQuantity });
    
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== menuId));
    } else {
      setCart(cart.map(item =>
        item.id === menuId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  // 총 금액 계산
  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // 배송비 계산
  const getDeliveryFee = () => {
    return getTotalAmount() >= 11000 ? 0 : 10;
  };

  // 카테고리별 메뉴 그룹화
  const getMenusByCategory = () => {
    const grouped = menus.reduce((acc, menu) => {
      const category = menu.category && menu.category.trim() !== '' 
        ? menu.category 
        : '전체 메뉴';
      
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(menu);
      return acc;
    }, {});
    return grouped;
  };

const handleStoreNameTap = () => {
  debugLogger.log('STORE_NAME_TAP', '상점명 터치', { currentTapCount: tapCount });
  
  // 기존 타이머 클리어
  if (tapTimer) {
    clearTimeout(tapTimer);
  }
  
  const newTapCount = tapCount + 1;
  setTapCount(newTapCount);
  
  debugLogger.log('STORE_NAME_TAP_COUNT', '터치 횟수 증가', { newTapCount: newTapCount });
  
  // 7번 터치 시 어드민으로 이동
  if (newTapCount >= 7) {
    debugLogger.log('ADMIN_ACCESS', '어드민 페이지 접근', { tapCount: newTapCount });
    alert('🔑 관리자 모드로 이동합니다!');
    navigate('/admin');
    setTapCount(0);
    return;
  }
  
  // 3초 후 카운트 리셋
  const timer = setTimeout(() => {
    debugLogger.log('TAP_COUNT_RESET', '터치 카운트 리셋');
    setTapCount(0);
  }, 3000);
  
  setTapTimer(timer);
};

  // 이미지 URL 처리 함수
  const getImageUrl = (menu) => {
    return menu.image || menu.imageUrl || null;
  };

const addPointsToStore = async (orderData) => {
  try {
    debugLogger.log('POINTS_ADD_START', '포인트 적립 시작', { storeId: orderData.storeId, amount: orderData.amount });
    
    // 상점 정보 가져오기 (포인트 적립률 확인)
    const storeDoc = await getDoc(doc(db, 'stores', orderData.storeId));
    if (!storeDoc.exists()) {
      debugLogger.log('POINTS_NO_STORE', '상점 정보 없음 - 포인트 적립 건너뛰기');
      return;
    }
    
    const storeData = storeDoc.data();
    const pointRate = storeData.pointRate || 5; // 기본 5%
    const earnedPoints = Math.floor(orderData.amount * (pointRate / 100));
    
    debugLogger.log('POINTS_CALCULATED', '포인트 계산 완료', { 
      amount: orderData.amount, 
      pointRate: pointRate, 
      earnedPoints: earnedPoints 
    });
    
    if (earnedPoints <= 0) {
      debugLogger.log('POINTS_ZERO', '적립할 포인트가 0 - 건너뛰기');
      return;
    }

    // 2. 포인트 적립 내역 저장
    const pointRecord = {
      storeId: orderData.storeId,
      storeName: orderData.storeName,
      pointsEarned: earnedPoints,
      orderAmount: orderData.amount,
      pointRate: pointRate,
      type: 'earned',
      reason: `주문 결제 완료 - ${pointRate}% 자동 적립`,
      orderId: null, // Firebase 자동 생성 ID는 나중에
      orderNumber: orderData.orderNumber,
      customerPhone: orderData.phone,
      createdAt: new Date()
    };

    const pointDocRef = await addDoc(collection(db, 'store_points'), pointRecord);
    debugLogger.log('POINTS_RECORD_SAVED', '포인트 내역 저장 완료', { pointDocId: pointDocRef.id });

    // 3. 상점 포인트 잔액 업데이트
    const balanceRef = doc(db, 'store_point_balance', orderData.storeId);
    const balanceDoc = await getDoc(balanceRef);

    if (balanceDoc.exists()) {
      // 기존 잔액 업데이트
      const currentData = balanceDoc.data();
      await updateDoc(balanceRef, {
        totalPoints: (currentData.totalPoints || 0) + earnedPoints,
        totalEarned: (currentData.totalEarned || 0) + earnedPoints,
        updatedAt: new Date()
      });
      debugLogger.log('POINTS_BALANCE_UPDATED', '기존 잔액 업데이트 완료');
    } else {
      // 새 잔액 생성
      await setDoc(balanceRef, {
        storeId: orderData.storeId,
        storeName: orderData.storeName,
        totalPoints: earnedPoints,
        totalEarned: earnedPoints,
        totalUsed: 0,
        updatedAt: new Date()
      });
      debugLogger.log('POINTS_BALANCE_CREATED', '새 잔액 생성 완료');
    }

    debugLogger.log('POINTS_ADD_COMPLETE', '포인트 적립 완료', { earnedPoints: earnedPoints });
    
  } catch (error) {
    debugLogger.error('POINTS_ADD_ERROR', error, { orderData: orderData });
  }
};

  // 🔧 수정된 주문 처리 함수 - 상세 로깅 추가
 const handleOrderSubmit = async (customerInfo) => {
    try {
      debugLogger.log('ORDER_SUBMIT_START', '주문 처리 시작', { 
        paymentStatus: customerInfo.paymentStatus,
        paymentId: customerInfo.paymentId,
        phone: customerInfo.phone 
      });
      
      const orderNumber = 'ORD' + Date.now();
      debugLogger.log('ORDER_NUMBER_GENERATED', '주문번호 생성', { orderNumber: orderNumber });

      // 🔥 결제 정보가 포함된 주문 데이터
      const orderData = {
        // 기본 주문 정보
        orderNumber,
        storeId: storeId || 'unknown',
        storeName: store?.name || '알 수 없는 상점',
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category || '전체 메뉴'
        })),
        amount: getTotalAmount(),
        
        // 고객 정보
        phone: customerInfo.phone,
        tableNumber: customerInfo.tableNumber || null,
        specialRequests: customerInfo.specialRequests || null,
        
        // 🆕 결제 정보 추가
        paymentId: customerInfo.paymentId || null,
        paymentStatus: customerInfo.paymentStatus || 'pending',
        paymentResponse: customerInfo.paymentResponse || null,
        
        // 주문 상태
        status: customerInfo.paymentStatus === 'completed' ? 'paid' : 'pending',
        createdAt: new Date(),
        timestamp: Date.now()
      };

      debugLogger.log('ORDER_DATA_PREPARED', '주문 데이터 준비 완료', orderData);

      // Firebase 저장 시도
      debugLogger.log('FIREBASE_SAVE_START', 'Firebase 저장 시작');
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      debugLogger.log('FIREBASE_SAVE_SUCCESS', 'Firebase 저장 성공', { docId: docRef.id });

      // 저장 확인
      const savedDoc = await getDoc(docRef);
      if (savedDoc.exists()) {
        debugLogger.log('FIREBASE_SAVE_VERIFIED', '저장 확인 완료', savedDoc.data());
      } else {
        debugLogger.log('FIREBASE_SAVE_VERIFY_FAILED', '저장 확인 실패');
      }

      // 🔥 결제 성공 시에만 관리자 SMS 발송
      if (customerInfo.paymentStatus === 'completed') {
        debugLogger.log('SMS_SEND_START', 'SMS 발송 시작', { orderNumber: orderNumber });
        
        // 관리자 SMS (주문 접수 알림)
        sendOrderNotificationSMS(orderData)
          .then(() => {
            debugLogger.log('SMS_SEND_SUCCESS', 'SMS 발송 성공');
          })
          .catch(err => {
            debugLogger.error('SMS_SEND_ERROR', err, { orderData: orderData });
          });
        
        // 🆕 포인트 적립
        debugLogger.log('POINTS_START', '포인트 적립 시작');
        addPointsToStore(orderData)
          .then(() => {
            debugLogger.log('POINTS_SUCCESS', '포인트 적립 성공');
          })
          .catch(err => {
            debugLogger.error('POINTS_ERROR', err, { orderData: orderData });
          });

        // 성공 메시지 (결제 완료)
        debugLogger.log('ORDER_COMPLETE_PAID', '결제 완료 주문 처리 완료', { 
          orderNumber: orderNumber, 
          amount: getTotalAmount(), 
          docId: docRef.id 
        });
        
        alert(`🎉 결제가 완료되었습니다!\n\n📋 주문번호: ${orderNumber}\n💳 결제금액: ${getTotalAmount().toLocaleString()}원\n🆔 주문 ID: ${docRef.id}\n\n주문이 관리자에게 전달되었습니다.\n곧 배달 예정 시간을 안내해드리겠습니다!`);
      } else {
        // 일반 주문 (결제 없음 - 개발/테스트용)
        debugLogger.log('ORDER_COMPLETE_UNPAID', '미결제 주문 처리 완료', { 
          orderNumber: orderNumber, 
          amount: getTotalAmount(), 
          docId: docRef.id 
        });
        
        alert(`✅ 주문이 접수되었습니다!\n\n📋 주문번호: ${orderNumber}\n💰 금액: ${getTotalAmount().toLocaleString()}원\n🆔 주문 ID: ${docRef.id}\n\n주문 내역이 관리자에게 전달되었습니다.`);
      }
      
      // 완료 처리
      debugLogger.log('ORDER_CLEANUP_START', '주문 완료 후 정리 시작');
      setCart([]);
      setShowOrderForm(false);
      debugLogger.log('ORDER_CLEANUP_COMPLETE', '주문 완료 후 정리 완료');
      
      debugLogger.log('ORDER_SUBMIT_COMPLETE', '주문 처리 전체 완료');
      
    } catch (error) {
      debugLogger.error('ORDER_SUBMIT_ERROR', error, { 
        customerInfo: customerInfo, 
        cart: cart, 
        storeId: storeId 
      });
      
      alert(`주문 실패: ${error.message}\n\n다시 시도해주세요.`);
    }
  };

  // 🔧 수정된 관리자 SMS 함수 - 로깅 추가
 const sendOrderNotificationSMS = async (orderData) => {
  try {
    debugLogger.log('SMS_NOTIFICATION_START', 'SMS 알림 시작', { orderNumber: orderData.orderNumber });
    
    const SMS_ENDPOINT = 'https://sendtestsms-b245qv2hpq-uc.a.run.app';
    
    // 🆕 기존 간결한 형태로 복구
    const paymentStatus = orderData.paymentStatus === 'completed' ? '💳결제완료' : '⏳미결제';
    
    const adminMessage = `🆕새주문! ${paymentStatus} ${orderData.storeName} ${orderData.amount.toLocaleString()}원 ${orderData.phone} ${orderData.tableNumber || '포장'}`;

    debugLogger.log('SMS_MESSAGE_PREPARED', 'SMS 메시지 준비 완료', { 
      message: adminMessage, 
      endpoint: SMS_ENDPOINT 
    });

    const response = await fetch(SMS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: '01047474763',
        message: adminMessage
      })
    });

    debugLogger.log('SMS_FETCH_RESPONSE', 'SMS API 응답 받음', { 
      status: response.status, 
      statusText: response.statusText,
      ok: response.ok 
    });

    if (!response.ok) {
      throw new Error(`SMS API 오류: ${response.status} - ${response.statusText}`);
    }

    const responseText = await response.text();
    debugLogger.log('SMS_NOTIFICATION_SUCCESS', 'SMS 알림 완료', { responseText: responseText });

  } catch (error) {
    debugLogger.error('SMS_NOTIFICATION_ERROR', error, { orderData: orderData });
    throw error;
  }
};

  if (loading || businessStatus.isLoading) {
    return (
      <div className="order-loading">
        <div className="loading-animation">
          <div className="loading-circle"></div>
          <p>메뉴를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="order-error">
        <div className="error-content">
          <h2>상점을 찾을 수 없습니다</h2>
          <p>올바른 QR코드를 스캔해주세요.</p>
        </div>
      </div>
    );
  }

if (!businessStatus.isOpen) {
  return (
    <ClosedNotice 
      reason={businessStatus.reason}
      nextOpenTime={businessStatus.nextOpenTime}
      contactPhone={businessStatus.contactPhone}
      storeName={store?.name || '요거트퍼플'}
    />
  );
}

  const menusByCategory = getMenusByCategory();

  return (
    <div className="order-page">
      {/* 헤더 */}
      <header className="header">
        <div className="header-gradient">
          <button className="back-button" onClick={() => navigate('/')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          <div className="store-info">
            <h1 
  className="store-name" 
  onClick={handleStoreNameTap}
  style={{ cursor: 'pointer', userSelect: 'none' }}
>
  {store.name}
</h1>
            <p className="delivery-info">최소주문 11,000원 이상 무료배달</p>
          </div>

          {cart.length > 0 && (
            <button 
              className="cart-button"
              onClick={() => setShowCart(true)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.3 5.1 16.3H17M17 13V17C17 18.1 16.1 19 15 19H9C7.9 19 7 18.1 7 17V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="cart-count">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </button>
          )}
        </div>
      </header>

      {/* 메뉴 리스트 */}
      <main className="menu-container">
        {Object.entries(menusByCategory).map(([category, categoryMenus]) => (
          <section key={category} className="menu-category">
            <h2 className="category-title">{category}</h2>
            <div className="menu-grid">
              {categoryMenus.map(menu => (
                <div 
                  key={menu.id} 
                  className="menu-card"
                  onClick={() => setSelectedMenu(menu)}
                >
                  <div className="menu-image">
                    {getImageUrl(menu) ? (
                      <img 
                        src={getImageUrl(menu)} 
                        alt={menu.name}
                        onError={(e) => {
                          console.log('이미지 로드 실패:', menu.name, getImageUrl(menu));
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="image-placeholder" style={{ display: getImageUrl(menu) ? 'none' : 'flex' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
                      </svg>
                    </div>
                  </div>
                  <div className="menu-info">
                    <h3 className="menu-name">{menu.name}</h3>
                    <p className="menu-price">{menu.price?.toLocaleString()}원</p>
                    {menu.description && (
                      <p className="menu-description">{menu.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {menus.length === 0 && (
          <div className="empty-menu">
            <div className="empty-content">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
              </svg>
              <h3>준비 중인 메뉴입니다</h3>
              <p>곧 맛있는 메뉴들을 만나보실 수 있어요!</p>
            </div>
          </div>
        )}
      </main>

      {/* 메뉴 상세 모달 */}
      {selectedMenu && (
        <div className="modal-overlay" onClick={() => setSelectedMenu(null)}>
          <div className="menu-detail-modal" onClick={e => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setSelectedMenu(null)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            
            <div className="modal-image">
              {getImageUrl(selectedMenu) ? (
                <img 
                  src={getImageUrl(selectedMenu)} 
                  alt={selectedMenu.name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="image-placeholder large" style={{ display: getImageUrl(selectedMenu) ? 'none' : 'flex' }}>
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
                </svg>
              </div>
            </div>
            
            <div className="modal-content">
              <h2 className="modal-title">{selectedMenu.name}</h2>
              <p className="modal-price">{selectedMenu.price?.toLocaleString()}원</p>
              
              {selectedMenu.description && (
                <p className="modal-description">{selectedMenu.description}</p>
              )}
              
              <div className="quantity-selector">
                <span>수량</span>
                <div className="quantity-controls">
                  <button onClick={() => {
                    const qty = document.getElementById('quantity').value;
                    if (qty > 1) document.getElementById('quantity').value = qty - 1;
                  }}>-</button>
                  <input 
                    id="quantity"
                    type="number" 
                    min="1" 
                    defaultValue="1"
                    readOnly
                  />
                  <button onClick={() => {
                    const qty = document.getElementById('quantity').value;
                    document.getElementById('quantity').value = parseInt(qty) + 1;
                  }}>+</button>
                </div>
              </div>
              
              <button 
                className="add-to-cart-btn"
                onClick={() => {
                  const quantity = parseInt(document.getElementById('quantity').value);
                  addToCart(selectedMenu, quantity);
                }}
              >
                장바구니에 담기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 장바구니 모달 */}
      {showCart && (
        <div className="modal-overlay" onClick={() => setShowCart(false)}>
          <div className="cart-modal" onClick={e => e.stopPropagation()}>
            <div className="cart-header">
              <h2>장바구니</h2>
              <button onClick={() => setShowCart(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-info">
                    <h4>{item.name}</h4>
                    <p>{item.price?.toLocaleString()}원</p>
                  </div>
                  <div className="item-controls">
                    <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="cart-summary">
              <div className="summary-row">
                <span>상품 금액</span>
                <span>{getTotalAmount().toLocaleString()}원</span>
              </div>
              <div className="summary-row">
                <span>배송비</span>
                <span>{getDeliveryFee().toLocaleString()}원</span>
              </div>
              <div className="summary-total">
                <span>총 결제금액</span>
                <span>{(getTotalAmount() + getDeliveryFee()).toLocaleString()}원</span>
              </div>
              
              <button 
                className="checkout-btn"
                onClick={() => {
                  debugLogger.log('CHECKOUT_BUTTON_CLICKED', '주문하기 버튼 클릭', { 
                    totalAmount: getTotalAmount(),
                    cartItems: cart.length 
                  });
                  setShowCart(false);
                  setShowOrderForm(true);
                }}
                disabled={cart.length === 0 || getTotalAmount() < 11000}
              >
                {getTotalAmount() < 11000 ? '11,000원 이상 주문가능' : `${getTotalAmount().toLocaleString()}원 주문하기`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 주문 폼 모달 */}
      {showOrderForm && (
        <div className="modal-overlay" onClick={() => setShowOrderForm(false)}>
          <div className="order-form-modal" onClick={e => e.stopPropagation()}>
            <OrderForm
  cart={cart}
  totalPrice={getTotalAmount()}
  storeId={storeId}
  onSubmit={handleOrderSubmit}
  onBack={() => setShowOrderForm(false)}
/>
          </div>
        </div>
      )}

      {/* 플로팅 장바구니 버튼 */}
      {cart.length > 0 && !showCart && (
        <button 
          className="floating-cart"
          onClick={() => {
            debugLogger.log('FLOATING_CART_CLICKED', '플로팅 장바구니 버튼 클릭');
            setShowCart(true);
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.3 5.1 16.3H17M17 13V17C17 18.1 16.1 19 15 19H9C7.9 19 7 18.1 7 17V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="floating-count">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
          <span className="floating-total">{getTotalAmount().toLocaleString()}원</span>
        </button>
      )}
      <SimpleFooter />
    </div>
  );
};

export default OrderPage;