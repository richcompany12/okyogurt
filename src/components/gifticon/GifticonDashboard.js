// src/components/GifticonDashboard.js (업데이트된 버전)
import React, { useState } from 'react';
import GifticonCreate from './GifticonCreate';
import GifticonList from './GifticonList';
import GifticonScan from './GifticonScan';
import GifticonStats from './GifticonStats';
import AdminQRScanner from './AdminQRScanner'; // NEW!

function GifticonDashboard() {
  const [activeMenu, setActiveMenu] = useState('overview');

  const menuItems = [
    { id: 'overview', name: '대시보드', icon: '🏠' },
    { id: 'create', name: '기프티콘 생성', icon: '➕' },
    { id: 'list', name: '기프티콘 관리', icon: '📋' },
    { id: 'qr-scanner', name: 'QR 스캔', icon: '📱' }, // NEW!
    { id: 'scan', name: '수동 사용처리', icon: '✋' },
    { id: 'stats', name: '통계', icon: '📊' }
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case 'overview':
        return (
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Arial, sans-serif'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '60px',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              maxWidth: '800px',
              width: '90%'
            }}>
              {/* 헤더 */}
              <div style={{ marginBottom: '40px' }}>
                <div style={{ fontSize: '72px', marginBottom: '20px' }}>🎁</div>
                <h1 style={{ 
                  margin: '0 0 15px 0', 
                  color: '#333',
                  fontSize: '36px',
                  fontWeight: 'bold'
                }}>
                  요거트퍼플 기프티콘
                </h1>
                <p style={{ 
                  margin: '0', 
                  color: '#666',
                  fontSize: '18px',
                  lineHeight: '1.6'
                }}>
                  기프티콘 생성, 관리, 사용처리를 위한 통합 관리 시스템
                </p>
              </div>

              {/* 주요 기능 버튼들 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '40px'
              }}>
                {/* 기프티콘 생성 */}
                <button
                  onClick={() => setActiveMenu('create')}
                  style={{
                    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '15px',
                    padding: '25px 20px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    transition: 'transform 0.2s ease',
                    boxShadow: '0 5px 15px rgba(67, 233, 123, 0.3)'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-3px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>➕</div>
                  기프티콘 생성
                </button>

                {/* QR 스캔 */}
                <button
                  onClick={() => setActiveMenu('qr-scanner')}
                  style={{
                    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '15px',
                    padding: '25px 20px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    transition: 'transform 0.2s ease',
                    boxShadow: '0 5px 15px rgba(250, 112, 154, 0.3)'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-3px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>📱</div>
                  QR 스캔
                </button>

                {/* 기프티콘 관리 */}
                <button
                  onClick={() => setActiveMenu('list')}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '15px',
                    padding: '25px 20px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    transition: 'transform 0.2s ease',
                    boxShadow: '0 5px 15px rgba(102, 126, 234, 0.3)'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-3px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>📋</div>
                  기프티콘 관리
                </button>

                {/* 통계 */}
                <button
                  onClick={() => setActiveMenu('stats')}
                  style={{
                    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                    color: '#8B4513',
                    border: 'none',
                    borderRadius: '15px',
                    padding: '25px 20px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    transition: 'transform 0.2s ease',
                    boxShadow: '0 5px 15px rgba(252, 182, 159, 0.3)'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-3px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>📊</div>
                  통계 보기
                </button>
              </div>

              {/* 시스템 정보 */}
              <div style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '20px',
                fontSize: '14px',
                color: '#666'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                  🔧 시스템 정보
                </div>
                <div>Firebase 연동 완료 | 실시간 동기화 | QR 코드 지원</div>
              </div>
            </div>
          </div>
        );

      case 'create':
        return <GifticonCreate onBack={() => setActiveMenu('overview')} />;
      
      case 'list':
        return <GifticonList onBack={() => setActiveMenu('overview')} />;
      
      case 'qr-scanner':
        return <AdminQRScanner onBack={() => setActiveMenu('overview')} />; // NEW!
      
      case 'scan':
        return <GifticonScan onBack={() => setActiveMenu('overview')} />;
      
      case 'stats':
        return (
          <GifticonStats 
            onBack={() => setActiveMenu('overview')}
          />
        );

      default:
        return (
          <div style={{ padding: '50px', textAlign: 'center' }}>
            <h2>페이지를 찾을 수 없습니다</h2>
            <button 
              onClick={() => setActiveMenu('overview')}
              style={{
                padding: '10px 20px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              메인으로 돌아가기
            </button>
          </div>
        );
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* 사이드바 네비게이션 */}
      {activeMenu !== 'overview' && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          background: 'white',
          borderRadius: '15px',
          padding: '15px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              style={{
                background: activeMenu === item.id ? '#007bff' : '#f8f9fa',
                color: activeMenu === item.id ? 'white' : '#333',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {item.icon} {item.name}
            </button>
          ))}
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div>
        {renderContent()}
      </div>
    </div>
  );
}

export default GifticonDashboard;