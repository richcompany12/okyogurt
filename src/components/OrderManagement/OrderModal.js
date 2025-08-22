// src/components/OrderManagement/OrderModal.js
import React from 'react';

function OrderModal({ 
  selectedOrder,
  deliveryTime,
  setDeliveryTime,
  cancelReason,
  setCancelReason,
  isProcessing,
  onConfirm,
  onCancel,
  onClose
}) {
  if (!selectedOrder) return null;

  // 배달 시간 옵션
  const deliveryTimeOptions = [
    { value: 5, label: '5분' },
    { value: 10, label: '10분' },
    { value: 15, label: '15분' },
    { value: 20, label: '20분' },
    { value: 30, label: '30분' },
    { value: 40, label: '40분' },
    { value: 50, label: '50분' },
    { value: 60, label: '60분' }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>주문 처리</h3>
          <button onClick={onClose} className="modal-close">
            ✕
          </button>
        </div>

        <div className="modal-content">
          <div className="order-summary">
            <h4>주문 정보</h4>
            <p>주문번호: #{selectedOrder.orderNumber || selectedOrder.id.slice(-6)}</p>
            {selectedOrder.storeName && <p>상점: {selectedOrder.storeName}</p>}
            <p>금액: {selectedOrder.amount?.toLocaleString()}원</p>
            <p>전화번호: {selectedOrder.phone}</p>
            {selectedOrder.tableNumber && <p>테이블: {selectedOrder.tableNumber}</p>}
            {selectedOrder.specialRequests && <p>요청사항: {selectedOrder.specialRequests}</p>}
            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div>
                <p><strong>주문 메뉴:</strong></p>
                <ul>
                  {selectedOrder.items.map((item, index) => (
                    <li key={index}>{item.name} x{item.quantity} - {(item.price * item.quantity).toLocaleString()}원</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="action-buttons">
            <div className="confirm-section">
              <h4>주문 확인</h4>
              <select 
                value={deliveryTime} 
                onChange={(e) => setDeliveryTime(e.target.value)}
              >
                <option value="">배달 시간 선택</option>
                {deliveryTimeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button 
                onClick={() => onConfirm(selectedOrder)}
                disabled={isProcessing || !deliveryTime}
                className="btn-confirm"
              >
                {isProcessing ? '처리 중...' : '주문 확인'}
              </button>
            </div>

            <div className="cancel-section">
              <h4>주문 취소</h4>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="취소 사유를 입력해주세요"
                rows="3"
              />
              <button 
                onClick={() => onCancel(selectedOrder)}
                disabled={isProcessing || !cancelReason.trim()}
                className="btn-cancel"
              >
                {isProcessing ? '처리 중...' : '주문 취소'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderModal;