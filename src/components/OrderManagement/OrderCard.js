// src/components/OrderManagement/OrderCard.js
import React from 'react';
import StatusBadge from '../common/StatusBadge';

function OrderCard({ 
  order, 
  onPrint, 
  onConfirm, 
  onCancel, 
  onComplete,
  onViewDetail, // 🆕 추가
  formatTime,
  isUrgent = false 
}) {
  return (
    <div className={`order-card ${isUrgent ? 'urgent' : ''}`}>
      <div className="order-header">
  <span className="order-id">#{order.orderNumber || order.id.slice(-6)}</span>
  <StatusBadge status={order.status} />
  <div className="header-buttons">
    <button 
      onClick={() => onViewDetail(order)}
      className="btn-detail"
      title="상세보기"
    >
      🔍
    </button>
    <button 
      onClick={() => onPrint(order)}
      className="btn-print"
      title="수동 프린트"
    >
      🖨️
    </button>
  </div>
</div>
      
      {/* 상점 정보 */}
      {order.storeName && (
        <div className="store-info">
          <span className="store-name">🏪 {order.storeName}</span>
        </div>
      )}
      
      <div className="order-details">
        <div className="detail-row">
          <span className="label">금액:</span>
          <span className="value">{order.amount?.toLocaleString()}원</span>
        </div>
        <div className="detail-row">
          <span className="label">전화번호:</span>
          <span className="value">{order.phone}</span>
        </div>
        {order.tableNumber && (
          <div className="detail-row">
            <span className="label">테이블:</span>
            <span className="value">{order.tableNumber}</span>
          </div>
        )}
        {order.specialRequests && (
          <div className="detail-row">
            <span className="label">요청사항:</span>
            <span className="value">{order.specialRequests}</span>
          </div>
        )}
        {/* 메뉴 정보 */}
        {order.items && order.items.length > 0 && (
          <div className="detail-row">
            <span className="label">메뉴:</span>
            <span className="value">
              {order.items.map(item => `${item.name}×${item.quantity}`).join(', ')}
            </span>
          </div>
        )}
        
        {/* 주문 시간 또는 배달 예정 시간 */}
        {order.status === 'confirmed' ? (
          <>
            <div className="detail-row">
              <span className="label">배달예정:</span>
              <span className="value">{order.deliveryTime}분</span>
            </div>
            <div className="detail-row">
              <span className="label">확인시간:</span>
              <span className="value">{formatTime(order.confirmedAt)}</span>
            </div>
          </>
        ) : (
          <div className="detail-row">
            <span className="label">주문시간:</span>
            <span className="value">{formatTime(order.createdAt)}</span>
          </div>
        )}
      </div>

      {/* 액션 버튼들 - 상태에 따라 다르게 표시 */}
      <div className="order-actions">
        {(order.status === 'pending' || order.status === 'paid') && (
          <>
            <button onClick={() => onConfirm(order)} className="btn-confirm">
              주문 확인
            </button>
            <button onClick={() => onCancel(order)} className="btn-cancel">
              주문 취소
            </button>
          </>
        )}
        
        {order.status === 'confirmed' && (
          <button onClick={() => onComplete(order)} className="btn-complete">
            배달 완료
          </button>
        )}
      </div>
    </div>
  );
}

export default OrderCard;