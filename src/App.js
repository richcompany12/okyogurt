import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function AppContent() {
  const { currentUser, userRole, isAdmin, isShopOwner, isPartner } = useAuth();

  return (
    <Router>
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
    </Router>
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
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;