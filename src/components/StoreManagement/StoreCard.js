// src/components/StoreManagement/StoreCard.js
import React from 'react';
import './StoreCard.css';

const StoreCard = ({ 
  store, 
  isAdmin, 
  onQRCode, 
  onEdit, 
  onDelete 
}) => {
  return (
    <div className="store-card">
      <div className="store-header">
        <h3>{store.name}</h3>
        <span className={`status ${store.isActive ? 'active' : 'inactive'}`}>
          {store.isActive ? '운영중' : '중지됨'}
        </span>
      </div>
      
      <div className="store-info">
        <p><strong>주소:</strong> {store.address}</p>
        <p><strong>전화:</strong> {store.phone}</p>
        {store.description && (
          <p><strong>설명:</strong> {store.description}</p>
        )}
        
        {/* ✅ 추가: 포인트 적립률 표시 */}
        <p className="point-rate">
          <strong>포인트 적립률:</strong> 
          <span className={`rate-badge ${store.pointRate >= 8 ? 'high' : store.pointRate >= 5 ? 'normal' : 'low'}`}>
            {store.pointRate || 5}%
          </span>
          <small className="rate-example">
            (1만원 → {((store.pointRate || 5) * 100).toLocaleString()}P)
          </small>
        </p>
        
        {store.createdAt && (
          <p className="created-date">
            <strong>등록일:</strong> {store.createdAt.toDate?.().toLocaleDateString() || '날짜 정보 없음'}
          </p>
        )}
      </div>

      <div className="store-actions">
        <button 
          className="btn btn-qr"
          onClick={() => onQRCode(store)}
          title="QR코드 생성"
        >
          📱 QR코드
        </button>
        
        {isAdmin && (
          <>
            <button 
              className="btn btn-edit"
              onClick={() => onEdit(store)}
              title="상점 정보 수정"
            >
              ✏️ 수정
            </button>
            <button 
              className="btn btn-delete"
              onClick={() => onDelete(store.id)}
              title="상점 삭제"
            >
              🗑️ 삭제
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default StoreCard;