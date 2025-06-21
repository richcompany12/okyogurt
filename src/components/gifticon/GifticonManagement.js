// src/components/gifticon/GifticonManagement.js
import React, { useState } from 'react';
import GifticonCreate from './GifticonCreate';
import GifticonList from './GifticonList';
import GifticonScan from './GifticonScan';
import './GifticonManagement.css';

function GifticonManagement() {
  const [activeTab, setActiveTab] = useState('list');

  const tabs = [
    { id: 'list', name: '기프티콘 목록', icon: '📋' },
    { id: 'create', name: '기프티콘 생성', icon: '➕' },
    { id: 'scan', name: 'QR 스캔', icon: '📱' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'create':
        return <GifticonCreate />;
      case 'list':
        return <GifticonList />;
      case 'scan':
        return <GifticonScan />;
      default:
        return <GifticonList />;
    }
  };

  return (
    <div className="gifticon-management">
      {/* 헤더 */}
      <div className="gifticon-header">
        <h1>🎁 기프티콘 관리</h1>
        <p>기프티콘을 생성하고 관리할 수 있습니다</p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="gifticon-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-text">{tab.name}</span>
          </button>
        ))}
      </div>

      {/* 콘텐츠 영역 */}
      <div className="gifticon-content">
        {renderContent()}
      </div>
    </div>
  );
}

export default GifticonManagement;