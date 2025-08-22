// src/components/OrderManagement/OrderDetailModal.js
import React from 'react';
import StatusBadge from '../common/StatusBadge';

function OrderDetailModal({ order, onClose, formatTime }) {
  if (!order) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>주문 상세 정보</h3>
          <button onClick={onClose} className="modal-close">
            ✕
          </button>
        </div>

        <div className="modal-content">
          <div className="order-summary">
            {/* 기본 주문 정보 */}
            <div className="detail-section">
              <h4>📋 주문 기본 정보</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">주문번호:</span>
                  <span className="value">#{order.orderNumber || order.id.slice(-6)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">상태:</span>
                  <span className="value"><StatusBadge status={order.status} /></span>
                </div>
                <div className="detail-item">
                  <span className="label">총 금액:</span>
                  <span className="value strong">{order.amount?.toLocaleString()}원</span>
                </div>
                <div className="detail-item">
                  <span className="label">주문시간:</span>
                  <span className="value">{formatTime(order.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* 상점 정보 */}
            {order.storeName && (
              <div className="detail-section">
                <h4>🏪 상점 정보</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">상점명:</span>
                    <span className="value">{order.storeName}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 고객 정보 */}
            <div className="detail-section">
              <h4>👤 고객 정보</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">전화번호:</span>
                  <a href={`tel:${order.phone}`} className="value phone-link">
                    {order.phone}
                  </a>
                </div>
                {order.tableNumber && (
                  <div className="detail-item">
                    <span className="label">테이블:</span>
                    <span className="value">{order.tableNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 주문 메뉴 */}
            {order.items && order.items.length > 0 && (
              <div className="detail-section">
                <h4>🍦 주문 메뉴</h4>
                <div className="menu-list">
                  {order.items.map((item, index) => (
                    <div key={index} className="menu-item-detail">
                      <div className="menu-info">
                        <span className="menu-name">{item.name}</span>
                        <span className="menu-quantity">x{item.quantity}</span>
                      </div>
                      <div className="menu-prices">
                        <span className="unit-price">단가: {item.price?.toLocaleString()}원</span>
                        <span className="total-price">{(item.price * item.quantity)?.toLocaleString()}원</span>
                      </div>
                    </div>
                  ))}
                  <div className="menu-total">
                    <strong>총 합계: {order.amount?.toLocaleString()}원</strong>
                  </div>
                </div>
              </div>
            )}

            {/* 요청사항 */}
            {order.specialRequests && (
              <div className="detail-section">
                <h4>📝 요청사항</h4>
                <div className="special-requests-detail">
                  {order.specialRequests}
                </div>
              </div>
            )}

            {/* 처리 상태별 추가 정보 */}
            {order.status === 'confirmed' && (
              <div className="detail-section">
                <h4>🚚 배달 정보</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">배달 예정시간:</span>
                    <span className="value">{order.deliveryTime}분</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">확인시간:</span>
                    <span className="value">{formatTime(order.confirmedAt)}</span>
                  </div>
                  {order.estimatedDeliveryTime && (
                    <div className="detail-item">
                      <span className="label">예상 완료시간:</span>
                      <span className="value">{formatTime(order.estimatedDeliveryTime)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {order.status === 'cancelled' && (
              <div className="detail-section">
                <h4>❌ 취소 정보</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">취소 사유:</span>
                    <span className="value">{order.cancelReason}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">취소시간:</span>
                    <span className="value">{formatTime(order.cancelledAt)}</span>
                  </div>
                </div>
              </div>
            )}

            {order.status === 'completed' && (
              <div className="detail-section">
                <h4>✅ 완료 정보</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">완료시간:</span>
                    <span className="value">{formatTime(order.completedAt)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 결제 정보 */}
            {order.paymentId && (
              <div className="detail-section">
                <h4>💳 결제 정보</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">결제 ID:</span>
                    <span className="value">{order.paymentId}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button onClick={onClose} className="btn-close">
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailModal;