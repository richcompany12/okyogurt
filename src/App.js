import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import OrderPage from './pages/OrderPage';
import UserOrder from './components/UserOrder';
// 🆕 법적 페이지들 import 추가
import TermsPage from './components/TermsPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import RefundPolicy from './components/RefundPolicy';
import CompanyInfo from './components/CompanyInfo';
import PaymentComplete from './components/PaymentComplete';
// 🎁 이 줄만 추가!
import CustomerGifticonCheck from './components/gifticon/CustomerGifticonCheck';
// 🚀 홍길동 스플래시 추가!
import SplashScreen from './components/SplashScreen/SplashScreen';
import './App.css';

// 접속 방식에 따른 뒤로가기 처리 훅
function useSmartBackNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showExitToast, setShowExitToast] = useState(false);
  const [isQRAccess, setIsQRAccess] = useState(false);
  const [qrStoreId, setQrStoreId] = useState(null);
  const backPressedOnce = useRef(false);
  const exitTimer = useRef(null);

  useEffect(() => {
    // QR 접속 여부 및 storeId 확인
    const checkQRAccess = window.location.pathname.startsWith('/order/') && 
                         (!document.referrer || 
                          window.history.length <= 1 ||
                          !document.referrer.includes(window.location.origin));
    
    if (checkQRAccess) {
      const storeId = window.location.pathname.split('/order/')[1];
      setIsQRAccess(true);
      setQrStoreId(storeId);
    }
  }, []);

  // 현재 위치가 홈화면인지 확인
  const isAtHome = () => {
    if (isQRAccess) {
      // QR 접속 고객의 홈화면: /order/:storeId
      return location.pathname === `/order/${qrStoreId}`;
    } else {
      // 일반 웹 접속 고객의 홈화면: /
      return location.pathname === '/';
    }
  };

  // 홈화면으로 이동
  const goHome = () => {
    if (isQRAccess && qrStoreId) {
      navigate(`/order/${qrStoreId}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  useEffect(() => {
    const handlePopState = (event) => {
      const currentlyAtHome = isAtHome();
      
      if (currentlyAtHome) {
        // 홈화면에서 뒤로가기 - 두 번 눌러서 종료
        if (backPressedOnce.current) {
          // 두 번째 뒤로가기 - 앱 종료 (브라우저 기본 동작 허용)
          setShowExitToast(false);
          return; // 기본 동작 허용하여 앱 종료
        } else {
          // 첫 번째 뒤로가기 - 토스트 표시
          event.preventDefault();
          
          backPressedOnce.current = true;
          setShowExitToast(true);
          
          // 2초 후 리셋
          exitTimer.current = setTimeout(() => {
            backPressedOnce.current = false;
            setShowExitToast(false);
          }, 2000);
        }
      } else {
        // 홈화면이 아닌 곳에서 뒤로가기 - 각자의 홈화면으로
        event.preventDefault();
        goHome();
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // 히스토리 엔트리 추가 (뒤로가기 감지용)
    window.history.pushState(null, null, window.location.pathname);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (exitTimer.current) {
        clearTimeout(exitTimer.current);
      }
    };
  }, [navigate, location.pathname, isQRAccess, qrStoreId]);

  return { showExitToast };
}

// 토스트 메시지 컴포넌트
function ExitToast({ show }) {
  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '25px',
      fontSize: '14px',
      zIndex: 9999,
      animation: 'fadeInUp 0.3s ease-out'
    }}>
      뒤로가기를 한 번 더 누르면 종료됩니다
    </div>
  );
}

function AppContent() {
  const { currentUser, userRole, isAdmin, isShopOwner, isPartner } = useAuth();
  const { showExitToast } = useSmartBackNavigation();

  return (
    <>
      <Routes>
        {/* 🆕 전략적 랜딩페이지 - 메인 홈 */}
        <Route path="/" element={<UserOrder />} />
        
        {/* QR코드로 접속하는 상점별 주문 페이지 */}
        <Route path="/order/:storeId" element={<OrderPage />} />
        
        {/* 🎁 이 줄만 추가! */}
        <Route path="/check/:gifticonId" element={<CustomerGifticonCheck />} />
        
        {/* 🆕 법적 페이지들 추가 */}
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/refund" element={<RefundPolicy />} />
        <Route path="/company" element={<CompanyInfo />} />
        <Route path="/payment-complete" element={<PaymentComplete />} />
        
        {/* 관리자 페이지 */}
        <Route path="/admin" element={
          !currentUser ? (
            <Login />
          ) : (!isAdmin && !isPartner) ? (
            <div style={{ 
              minHeight: '100vh', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: '#f5f7fa'
            }}>
              <div style={{
                background: 'white',
                padding: '40px',
                borderRadius: '12px',
                textAlign: 'center',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}>
                <h2>❌ 접근 권한이 없습니다</h2>
                <p>관리자 계정으로 로그인해주세요.</p>
                <button 
                  onClick={() => window.location.href = '/'}
                  style={{
                    background: '#6c5ce7',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginTop: '20px'
                  }}
                >
                  홈으로 돌아가기
                </button>
              </div>
            </div>
          ) : (
            <AdminDashboard />
          )
        } />
      </Routes>
      
      {/* 토스트 메시지 */}
      <ExitToast show={showExitToast} />
    </>
  );
}

function App() {
  const [showGlobalSplash, setShowGlobalSplash] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    // 앱 초기화 완료를 빠르게 처리
    const initApp = () => {
      // QR 스캔으로 접속했는지 확인
      const isQRAccess = window.location.pathname.startsWith('/order/') && 
                         (!document.referrer || 
                          window.history.length <= 1 ||
                          !document.referrer.includes(window.location.origin));
      
      console.log('🔍 접속 체크:', {
        pathname: window.location.pathname,
        referrer: document.referrer,
        historyLength: window.history.length,
        isQRAccess: isQRAccess
      });
      
      if (isQRAccess) {
        // QR 스캔 접속이면 스플래시 표시
        setShowGlobalSplash(true);
      }
      
      setIsAppReady(true);
    };

    // DOM이 준비되면 즉시 실행
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initApp);
    } else {
      initApp();
    }

    return () => {
      document.removeEventListener('DOMContentLoaded', initApp);
    };
  }, []);

  // 앱이 준비되지 않았으면 빈 화면 (리액트 로고 방지)
  if (!isAppReady) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        zIndex: 10000
      }} />
    );
  }

  // 글로벌 스플래시 표시 (QR 접속 시에만)
  if (showGlobalSplash) {
    return (
      <SplashScreen
        onComplete={() => setShowGlobalSplash(false)}
        duration={5000}
      />
    );
  }

  // 기존 앱 렌더링
  return (
    <AuthProvider>
      <div className="App">
        <Router>
          <AppContent />
        </Router>
      </div>
    </AuthProvider>
  );
}

export default App;