import React from 'react';
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
  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;