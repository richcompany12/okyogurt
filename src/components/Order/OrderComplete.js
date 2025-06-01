// src/components/Order/OrderComplete.js
import React, { useState, useEffect } from 'react';
import './OrderComplete.css';

const OrderComplete = ({ orderInfo, onNewOrder }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // 현재 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 예상 준비 시간 계산 (임의로 15-25분)
  const getEstimatedTime = () => {
    const estimatedMinutes = 15 + Math.floor(Math.random() * 10);
    const estimatedTime = new Date(orderInfo.createdAt.toDate().getTime() + estimatedMinutes * 60000);
    return estimatedTime;
  };

  // 주문 상태에 따른 메시지
  const getStatusMessage = (status) => {
    const messages = {
      pending: '주문 접수 중',
      confirmed: '주문 확인됨',
      preparing: '제조 중',
      ready: '완성! 픽업 대기',
      completed: '픽업 완료',
      cancelled: '주문 취소됨'
    };
    return messages[status] || '알 수 없는 상태';
  };

  // 주문 상태에 따른 아이콘
  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      confirmed: '✅',
      preparing: '👨‍🍳',
      ready: '🎉',
      completed: '✨',
      cancelled: '❌'
    };
    return icons[status] || '📋';
  };

  const estimatedTime = getEstimatedTime();
  const statusMessage = getStatusMessage(orderInfo.status);
  const statusIcon = getStatusIcon(orderInfo.status);

  return (
    <div className="order-complete">
      <div className="complete-container">
        {/* 성공 헤더 */}
        <div className="success-header">
          <div className="success-icon">🎉</div>
          <h2>주문이 완료되었습니다!</h2>
          <p>주문해주셔서 감사합니다</p>
        </div>

        {/* 주문 정보 카드 */}
        <div className="order-info-card">
          <div className="order-header">
            <div className="order-number">
              <h3>주문번호</h3>
              <span className="number">{orderInfo.orderNumber}</span>
            </div>
            <div className="order-status">
              <span className="status-icon">{statusIcon}</span>
              <span className="status-text">{statusMessage}</span>
            </div>
          </div>

          {/* 상점 정보 */}
          <div className="store-section">
            <h4>📍 픽업 매장</h4>
            <p className="store-name">{orderInfo.storeName}</p>
          </div>

          {/* 주문 내역 */}
          <div className="items-section">
            <h4>📋 주문 내역</h4>
            <div className="order-items">
              {orderInfo.items.map(item => (
                <div key={item.id} className="order-item">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">×{item.quantity}</span>
                  <span className="item-price">{(item.price * item.quantity).toLocaleString()}원</span>
                </div>
              ))}
            </div>
            <div className="total-section">
              <div className="total-row">
                <span>총 결제금액</span>
                <span className="total-amount">{orderInfo.totalPrice.toLocaleString()}원</span>
              </div>
            </div>
          </div>

          {/* 고객 정보 */}
          <div className="customer-section">
            <h4>👤 주문자 정보</h4>
            <div className="customer-info">
              <div className="info-row">
                <span className="label">이름:</span>
                <span>{orderInfo.customerInfo.name}</span>
              </div>
              <div className="info-row">
                <span className="label">전화번호:</span>
                <span>{orderInfo.customerInfo.phone}</span>
              </div>
              {orderInfo.customerInfo.email && (
                <div className="info-row">
                  <span className="label">이메일:</span>
                  <span>{orderInfo.customerInfo.email}</span>
                </div>
              )}
              <div className="info-row">
                <span className="label">결제방법:</span>
                <span>
                  {orderInfo.customerInfo.paymentMethod === 'card' && '💳 카드결제'}
                  {orderInfo.customerInfo.paymentMethod === 'cash' && '💵 현금결제'}
                  {orderInfo.customerInfo.paymentMethod === 'point' && '✨ 포인트결제'}
                </span>
              </div>
              {orderInfo.customerInfo.request && (
                <div className="info-row">
                  <span className="label">요청사항:</span>
                  <span>{orderInfo.customerInfo.request}</span>
                </div>
              )}
            </div>
          </div>

          {/* 시간 정보 */}
          <div className="time-section">
            <h4>⏰ 시간 정보</h4>
            <div className="time-info">
              <div className="time-row">
                <span className="label">주문시간:</span>
                <span>{orderInfo.createdAt.toDate().toLocaleString('ko-KR')}</span>
              </div>
              <div className="time-row highlight">
                <span className="label">예상 완성시간:</span>
                <span className="estimated-time">
                  {estimatedTime.toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <div className="time-row">
                <span className="label">현재시간:</span>
                <span>{currentTime.toLocaleTimeString('ko-KR')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="notice-section">
          <div className="notice-card">
            <h4>📢 픽업 안내</h4>
            <ul>
              <li>주문번호를 기억해 두시거나 스크린샷을 저장해 주세요</li>
              <li>예상 시간보다 조금 일찍 매장에 도착해 주세요</li>
              <li>주문 상태가 '완성! 픽업 대기'로 변경되면 픽업 가능합니다</li>
              <li>문의사항이 있으시면 매장으로 직접 연락해 주세요</li>
            </ul>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="action-buttons">
          <button 
            className="btn btn-secondary"
            onClick={() => window.print()}
          >
            📄 영수증 인쇄
          </button>
          
          <button 
            className="btn btn-primary"
            onClick={onNewOrder}
          >
            🍦 새 주문하기
          </button>
        </div>

        {/* 하단 메시지 */}
        <div className="footer-message">
          <p>🙏 요거트퍼플을 이용해 주셔서 감사합니다!</p>
          <small>맛있는 요거트로 만나뵙겠습니다 💜</small>
        </div>
      </div>
    </div>
  );
};

export default OrderComplete;