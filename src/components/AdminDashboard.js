// src/components/AdminDashboard.js
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import OrderManagement from './OrderManagement';
import StoreManagement from './StoreManagement';
import MenuManagement from './StoreManagement/MenuManagement';
import PointsManagement from '../pages/PointsManagement';
import BusinessHoursManagement from './BusinessHoursManagement';
import StatsDashboard from './StatsDashboard';
import AccountManagement from './AccountManagement';
import NotificationManager from './NotificationManager'; // 🆕 알림 시스템 추가
import './AdminDashboard.css';

function AdminDashboard() {
  const { currentUser, userRole, logout, isAdmin, isPartner } = useAuth();

  // 🔔 알림 토글 상태 (localStorage에서 읽기)
  const [notificationEnabled, setNotificationEnabled] = useState(() => {
    return localStorage.getItem('adminNotificationEnabled') === 'true';
  });

  // 권한에 따른 기본 메뉴 설정
  const getDefaultMenu = () => {
    if (isAdmin) {
      return 'orders'; // 관리자는 주문 관리가 기본
    } else {
      return 'points'; // store_owner는 포인트 내역이 기본
    }
  };

  const [activeMenu, setActiveMenu] = useState(getDefaultMenu());

  // 🔔 알림 토글 핸들러
  const handleNotificationToggle = () => {
    const newState = !notificationEnabled;
    setNotificationEnabled(newState);
    localStorage.setItem('adminNotificationEnabled', newState.toString());
    
    console.log('🔔 알림 토글:', newState ? 'ON' : 'OFF');
    
    if (newState) {
      // 토글을 켰을 때 페이지 새로고침으로 NotificationManager 활성화
      window.location.reload();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  const menuItems = [
    { id: 'orders', name: '주문 관리', icon: '📋', adminOnly: true },
    { id: 'business', name: '영업시간 관리', icon: '🕐', adminOnly: true },
    { id: 'stores', name: '상점 관리', icon: '🏪', adminOnly: true },
    { id: 'menu', name: '메뉴 관리', icon: '🍦', adminOnly: true },
    { id: 'points', name: '포인트 내역', icon: '💎', adminOnly: false },
    { id: 'accounts', name: '계정 관리', icon: '👤', adminOnly: true },
    { id: 'stats', name: '통계 분석', icon: '📊', adminOnly: true },
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case 'orders':
        return <OrderManagement />;
      case 'business':
        return <BusinessHoursManagement />;
      case 'stores':
        return <StoreManagement />;
      case 'menu':
        return <MenuManagement />;
      case 'points':
        return <PointsManagement />;
      case 'accounts':
        return <AccountManagement />;
      case 'stats':
        return <StatsDashboard />;
      default:
        return <OrderManagement />;
    }
  };

  return (
    <div className="admin-container">
      {/* 🔔 알림 시스템 - 토글이 ON일 때만 활성화 */}
      {isAdmin && notificationEnabled && <NotificationManager />}

      {/* 사이드바 */}
      <div className="admin-sidebar">
        <div className="admin-header">
          <h1>🍦 요거트퍼플</h1>
          <div className="admin-info">
            <div className="admin-email">{currentUser?.email}</div>
            <div className="admin-role">
              {userRole === 'super_admin' ? '메인 관리자' : 
               userRole === 'store_owner' ? '제휴상점 사장' : '관리자'}
            </div>
            
            {/* 🔔 알림 토글 - 슈퍼어드민만 보임 */}
            {isAdmin && (
              <div className="notification-toggle">
                <div className="toggle-container">
                  <span className="toggle-label">🔔 주문 알림</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notificationEnabled}
                      onChange={handleNotificationToggle}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="toggle-status">
                    {notificationEnabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="admin-nav">
          {menuItems.map(item => {
            // 제휴상점 사장은 admin 전용 메뉴 숨김
            if (item.adminOnly && !isAdmin) {
              return null;
            }

            return (
              <button
                key={item.id}
                className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
                onClick={() => setActiveMenu(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-text">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="admin-footer">
          <button onClick={handleLogout} className="logout-button">
            🚪 로그아웃
          </button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="admin-main">
        <div className="admin-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;