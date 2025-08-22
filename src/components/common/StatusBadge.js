// src/components/common/StatusBadge.js
import React from 'react';

function StatusBadge({ status }) {
  const statusMap = {
    pending: { text: '대기중', class: 'status-pending' },
    paid: { text: '결제완료', class: 'status-paid' },
    confirmed: { text: '확인됨', class: 'status-confirmed' },
    cancelled: { text: '취소됨', class: 'status-cancelled' },
    completed: { text: '완료됨', class: 'status-completed' }
  };
    
  const statusInfo = statusMap[status] || { text: status, class: 'status-unknown' };
  
  return (
    <span className={`status-badge ${statusInfo.class}`}>
      {statusInfo.text}
    </span>
  );
}

export default StatusBadge;