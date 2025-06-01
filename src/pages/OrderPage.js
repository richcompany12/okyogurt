// src/pages/ModernOrderPage.js
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

const ModernOrderPage = () => {
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

  // 상점 정보 로드
  useEffect(() => {
    const loadStoreData = async () => {
      try {
        if (!storeId) {
          setLoading(false);
          return;
        }

        const storeDoc = await getDoc(doc(db, 'stores', storeId));
        
        if (storeDoc.exists()) {
          setStore({ id: storeDoc.id, ...storeDoc.data() });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('상점 정보 로드 오류:', error);
        setLoading(false);
      }
    };

    loadStoreData();
  }, [storeId]);

  // 메뉴 목록 로드
  useEffect(() => {
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
      console.log('로드된 메뉴:', menusList);
      setMenus(menusList);
    }, (error) => {
      console.error('메뉴 로드 오류:', error);
      const fallbackQuery = query(
        collection(db, 'menus'),
        orderBy('name')
      );
      
      const fallbackUnsubscribe = onSnapshot(fallbackQuery, (snapshot) => {
        const menusList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Fallback 로드된 메뉴:', menusList);
        setMenus(menusList);
      });
      
      return () => fallbackUnsubscribe();
    });

    return () => unsubscribe();
  }, []);

  // 장바구니에 추가
  const addToCart = (menu, quantity = 1) => {
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
    return getTotalAmount() >= 12000 ? 0 : 10;
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

  // 이미지 URL 처리 함수
  const getImageUrl = (menu) => {
    return menu.image || menu.imageUrl || null;
  };

const addPointsToStore = async (orderData) => {
  try {
    console.log('=== 포인트 적립 시작 ===');
    
    // 상점 정보 가져오기 (포인트 적립률 확인)
    const storeDoc = await getDoc(doc(db, 'stores', orderData.storeId));
    if (!storeDoc.exists()) {
      console.log('상점 정보 없음 - 포인트 적립 건너뛰기');
      return;
    }
    
    const storeData = storeDoc.data();
    const pointRate = storeData.pointRate || 5; // 기본 5%
    const earnedPoints = Math.floor(orderData.amount * (pointRate / 100));
    
    console.log(`포인트 계산: ${orderData.amount}원 x ${pointRate}% = ${earnedPoints}P`);
    
    if (earnedPoints <= 0) {
      console.log('적립할 포인트가 0 - 건너뛰기');
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
    console.log('✅ 포인트 내역 저장 완료:', pointDocRef.id);

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
      console.log('✅ 기존 잔액 업데이트 완료');
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
      console.log('✅ 새 잔액 생성 완료');
    }

    console.log(`=== 포인트 적립 완료: ${earnedPoints}P ===`);
    
  } catch (error) {
    console.error('❌ 포인트 적립 오류:', error);
    // 포인트 적립 실패해도 주문은 계속 진행
  }
};

  // 수정된 주문 처리 함수 - 간단하고 안정적
 const handleOrderSubmit = async (customerInfo) => {
    try {
      console.log('=== 주문 처리 시작 ===');
      
      const orderNumber = 'ORD' + Date.now();
      console.log('주문번호:', orderNumber);
      console.log('받은 고객 정보:', customerInfo);

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

      console.log('저장할 주문 데이터:', orderData);

      // Firebase 저장
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      console.log('✅ 주문 저장 성공:', docRef.id);

      // 저장 확인
      const savedDoc = await getDoc(docRef);
      if (savedDoc.exists()) {
        console.log('✅ 저장 확인 완료:', savedDoc.data());
      }

 // 🔥 결제 성공 시에만 관리자 SMS 발송
if (customerInfo.paymentStatus === 'completed') {
  // 관리자 SMS (주문 접수 알림)
  sendOrderNotificationSMS(orderData)
    .then(() => console.log('✅ 관리자 SMS 발송 성공'))
    .catch(err => console.log('❌ 관리자 SMS 발송 실패:', err));
    
  // 🆕 여기에 포인트 적립 추가
  addPointsToStore(orderData)
    .then(() => console.log('✅ 포인트 적립 성공'))
    .catch(err => console.log('❌ 포인트 적립 실패:', err));

             // 성공 메시지 (결제 완료)
        alert(`🎉 결제가 완료되었습니다!\n\n📋 주문번호: ${orderNumber}\n💳 결제금액: ${getTotalAmount().toLocaleString()}원\n🆔 주문 ID: ${docRef.id}\n\n주문이 관리자에게 전달되었습니다.\n곧 배달 예정 시간을 안내해드리겠습니다!`);
      } else {
        // 일반 주문 (결제 없음 - 개발/테스트용)
        alert(`✅ 주문이 접수되었습니다!\n\n📋 주문번호: ${orderNumber}\n💰 금액: ${getTotalAmount().toLocaleString()}원\n🆔 주문 ID: ${docRef.id}\n\n주문 내역이 관리자에게 전달되었습니다.`);
      }
      
      // 완료 처리
      setCart([]);
      setShowOrderForm(false);
      
      console.log('=== 주문 처리 완료 ===');
      
    } catch (error) {
      console.error('❌ 주문 처리 실패:', error);
      alert(`주문 실패: ${error.message}\n\n다시 시도해주세요.`);
    }
  };

  // 🔄 기존 관리자 SMS 함수 업데이트 (결제 정보 포함)
 const sendOrderNotificationSMS = async (orderData) => {
  try {
    const SMS_ENDPOINT = 'https://sendtestsms-b245qv2hpq-uc.a.run.app';
    
    // 🆕 기존 간결한 형태로 복구
    const paymentStatus = orderData.paymentStatus === 'completed' ? '💳결제완료' : '⏳미결제';
    
    const adminMessage = `🆕새주문! ${paymentStatus} ${orderData.storeName} ${orderData.amount.toLocaleString()}원 ${orderData.phone} ${orderData.tableNumber || '포장'}`;

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

    console.log('관리자 SMS 발송 완료');
  } catch (error) {
    console.error('관리자 SMS 발송 오류:', error);
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
            <h1 className="store-name">{store.name}</h1>
            <p className="delivery-info">최소주문 12,000원 이상 무료배달</p>
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
    setShowCart(false);
    setShowOrderForm(true);
  }}
  disabled={cart.length === 0 || getTotalAmount() < 12000}
>
  {getTotalAmount() < 12000 ? '12,000원 이상 주문가능' : `${getTotalAmount().toLocaleString()}원 주문하기`}
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
          onClick={() => setShowCart(true)}
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

export default ModernOrderPage;