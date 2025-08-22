// src/components/OrderManagement/OrderStats.js
import React from 'react';

function OrderStats({ newOrdersCount, confirmedOrdersCount, totalOrdersCount }) {
  return (
    <div className="order-stats">
      <div className="stat-item">
        <span className="stat-number">{newOrdersCount}</span>
        <span className="stat-label">처리대기</span>
      </div>
      <div className="stat-item">
        <span className="stat-number">{confirmedOrdersCount}</span>
        <span className="stat-label">진행 중</span>
      </div>
      <div className="stat-item">
        <span className="stat-number">{totalOrdersCount}</span>
        <span className="stat-label">총 주문</span>
      </div>
    </div>
  );
}

export default OrderStats;