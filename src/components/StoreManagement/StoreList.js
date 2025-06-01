// src/components/StoreManagement/StoreList.js
import React from 'react';
import StoreCard from './StoreCard';
import './StoreList.css';

const StoreList = ({ 
  stores, 
  loading, 
  isAdmin, 
  onQRCode, 
  onEdit, 
  onDelete 
}) => {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>상점 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🏪</div>
        <h3>등록된 상점이 없습니다</h3>
        <p>새로운 상점을 등록해보세요!</p>
        {isAdmin && (
          <button className="btn btn-primary">
            + 첫 번째 상점 등록하기
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="store-list">
      <div className="stores-header">
        <h3>등록된 상점 ({stores.length}개)</h3>
        <div className="stores-summary">
          <span className="active-count">
            운영중: {stores.filter(store => store.isActive).length}개
          </span>
          <span className="inactive-count">
            중지됨: {stores.filter(store => !store.isActive).length}개
          </span>
        </div>
      </div>
      
      <div className="stores-grid">
        {stores.map(store => (
          <StoreCard
            key={store.id}
            store={store}
            isAdmin={isAdmin}
            onQRCode={onQRCode}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default StoreList;