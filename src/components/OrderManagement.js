// src/components/OrderManagement.js
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import './OrderManagement.css';

function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deliveryTime, setDeliveryTime] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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

  useEffect(() => {
    // 실시간 주문 목록 가져오기
    const q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 주문 상태별 필터
  const getOrdersByStatus = (status) => {
    return orders.filter(order => order.status === status);
  };

  // 주문 확인 처리
  const handleConfirmOrder = async (order) => {
    if (!deliveryTime) {
      alert('배달 예정 시간을 선택해주세요.');
      return;
    }

    setIsProcessing(true);

    try {
      // Firestore 주문 상태 업데이트
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'confirmed',
        deliveryTime: parseInt(deliveryTime),
        confirmedAt: new Date(),
        estimatedDeliveryTime: new Date(Date.now() + parseInt(deliveryTime) * 60000)
      });

      // 🆕 고객에게 배달 예정 시간 SMS 발송
await sendCustomerConfirmationSMS({
  phone: order.phone,
  deliveryTime: deliveryTime,
  orderNumber: order.orderNumber || order.id.slice(-6),
  storeName: order.storeName || '요거트퍼플'
});

      alert(`주문이 확인되었습니다. ${deliveryTime}분 후 배달 예정입니다.`);
      setSelectedOrder(null);
      setDeliveryTime('');

    } catch (error) {
      console.error('주문 확인 오류:', error);
      alert('주문 확인 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

// 고객 주문 확인 SMS 발송 함수
const sendCustomerConfirmationSMS = async ({ phone, deliveryTime, orderNumber, storeName }) => {
  try {
    const SMS_ENDPOINT = 'https://sendtestsms-b245qv2hpq-uc.a.run.app';
    
    const customerMessage = `[${storeName}] 주문이 확인되었습니다! 🎉

📋 주문번호: ${orderNumber}
⏰ 배달예정: 약 ${deliveryTime}분 후
🚚 현재 음식을 준비 중입니다

맛있는 아이스크림을 준비해드리겠습니다! 🍦`;

    const response = await fetch(SMS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: phone.replace(/-/g, ''),
        message: customerMessage
      })
    });

    if (!response.ok) {
      throw new Error(`SMS API 오류: ${response.status}`);
    }

    console.log('고객 주문확인 SMS 발송 완료');
  } catch (error) {
    console.error('고객 SMS 발송 오류:', error);
    // SMS 실패해도 주문 확인은 계속 진행
  }
};

  // 주문 취소 처리
  const handleCancelOrder = async (order) => {
    if (!cancelReason.trim()) {
      alert('취소 사유를 입력해주세요.');
      return;
    }

    setIsProcessing(true);

    try {
      // Firestore 주문 상태 업데이트
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'cancelled',
        cancelReason: cancelReason,
        cancelledAt: new Date()
      });

// 고객 주문 취소 SMS 발송 함수
const sendCustomerCancellationSMS = async ({ phone, orderNumber, cancelReason, storeName }) => {
  try {
    const SMS_ENDPOINT = 'https://sendtestsms-b245qv2hpq-uc.a.run.app';
    
    const customerMessage = `[${storeName}] 주문이 취소되었습니다 😔

📋 주문번호: ${orderNumber}
❌ 취소 사유: ${cancelReason}

불편을 드려 죄송합니다.
다음에 더 좋은 서비스로 찾아뵙겠습니다. 🙏`;

    const response = await fetch(SMS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: phone.replace(/-/g, ''),
        message: customerMessage
      })
    });

    if (!response.ok) {
      throw new Error(`SMS API 오류: ${response.status}`);
    }

    console.log('고객 주문취소 SMS 발송 완료');
  } catch (error) {
    console.error('고객 취소 SMS 발송 오류:', error);
    // SMS 실패해도 주문 취소는 계속 진행
  }
};

      // 고객에게 주문 취소 SMS 발송
await sendCustomerCancellationSMS({
  phone: order.phone,
  orderNumber: order.orderNumber || order.id.slice(-6),
  cancelReason: cancelReason,
  storeName: order.storeName || '요거트퍼플'
});

      alert('주문이 취소되었습니다.');
      setSelectedOrder(null);
      setCancelReason('');

    } catch (error) {
      console.error('주문 취소 오류:', error);
      alert('주문 취소 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 배달 완료 처리
  const handleCompleteDelivery = async (order) => {
    setIsProcessing(true);

    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'completed',
        completedAt: new Date()
      });

      // TODO: 포인트 적립 처리 (나중에 구현)
      console.log('포인트 적립 처리:', order);

      alert('배달이 완료되었습니다.');

    } catch (error) {
      console.error('배달 완료 오류:', error);
      alert('배달 완료 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 프린트 함수 추가
const handlePrintOrder = (order) => {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>주문서 - ${order.orderNumber}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
            orientation: portrait;
          }
          
          @media print {
            @page {
              size: portrait;
              margin: 0;
            }
            
            body {
              transform: rotate(0deg);
              transform-origin: top left;
            }
          }
          
          body { 
            font-family: 'Courier New', monospace;
            font-size: 22px;
            font-weight: 900;
            line-height: 1.3;
            margin: 0;
            padding: 5mm;
            width: 70mm;
            color: #000000;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .center { text-align: center; }
          .left { text-align: left; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          
          .header {
            text-align: center;
            border-bottom: 1px dashed #333;
            padding-bottom: 5px;
            margin-bottom: 8px;
          }
          
          .store-name {
            font-size: 28px;
            font-weight: 900;
            margin-bottom: 3px;
            color: #000000;
          }
          
          .section {
            margin: 8px 0;
            border-bottom: 1px dashed #ccc;
            padding-bottom: 5px;
          }
          
          .section:last-child {
            border-bottom: none;
          }
          
          .row {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
            font-size: 20px;
            font-weight: 700;
          }
          
          .menu-item {
            margin: 1px 0;
            font-size: 20px;
            font-weight: 700;
          }
          
          .total-row {
            font-weight: 900;
            font-size: 24px;
            border-top: 2px solid #000;
            padding-top: 3px;
            margin-top: 5px;
            color: #000000;
          }
          
          .customer-info {
            font-size: 20px;
            font-weight: 700;
            margin: 2px 0;
            color: #000000;
          }
          
          .special-requests {
            font-size: 10px;
            border: 1px solid #ccc;
            padding: 3px;
            margin: 5px 0;
            word-wrap: break-word;
          }
          
          .footer {
            text-align: center;
            font-size: 10px;
            margin-top: 10px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <!-- 헤더 (상점명) -->
        <div class="header">
          <div class="store-name">🍦 ${order.storeName || '요거트퍼플'}</div>
          <div>주문번호: ${order.orderNumber || order.id.slice(-6)}</div>
        </div>

        <!-- 고객 정보 -->
        <div class="section">
          <div class="bold center">📞 고객 정보</div>
          <div class="customer-info">전화: ${order.phone}</div>
          ${order.tableNumber ? `<div class="customer-info">테이블: ${order.tableNumber}</div>` : ''}
        </div>

        <!-- 주문 메뉴 (필수) -->
        <div class="section">
          <div class="bold center">📋 주문 메뉴</div>
          ${order.items && order.items.length > 0 ? 
            order.items.map(item => 
              `<div class="menu-item">
                <div class="row">
                  <span>${item.name}</span>
                  <span>x${item.quantity}</span>
                </div>
                <div class="row">
                  <span>단가: ${item.price?.toLocaleString()}원</span>
                  <span>${(item.price * item.quantity)?.toLocaleString()}원</span>
                </div>
              </div>`
            ).join('') 
            : '<div class="menu-item">메뉴 정보 없음</div>'
          }
          
          <!-- 총액 -->
          <div class="total-row">
            <div class="row">
              <span>총 금액</span>
              <span>${order.amount?.toLocaleString() || '0'}원</span>
            </div>
          </div>
        </div>

        <!-- 주문 시각 -->
        <div class="section">
          <div class="bold center">⏰ 주문 정보</div>
          <div class="customer-info">주문시간: ${formatTime(order.createdAt)}</div>
          ${order.deliveryTime ? `<div class="customer-info">배달예정: ${order.deliveryTime}분 후</div>` : ''}
          ${order.status === 'paid' ? '<div class="customer-info">💳 결제완료</div>' : ''}
        </div>

        <!-- 요청사항 (있을 경우만) -->
        ${order.specialRequests ? `
        <div class="section">
          <div class="bold center">📝 요청사항</div>
          <div class="special-requests">${order.specialRequests}</div>
        </div>
        ` : ''}

        <!-- 푸터 -->
        <div class="footer">
          <div>━━━━━━━━━━━━━━━━━━━━</div>
          <div>맛있게 드세요! 🍦</div>
          <div>${new Date().toLocaleString('ko-KR')}</div>
        </div>
      </body>
    </html>
  `);
  
  printWindow.document.close();
  
  // 프린트 실행
  printWindow.onload = function() {
    printWindow.print();
    printWindow.close();
  };
};


// formatTime 함수도 같이 사용 (이미 있으면 그대로 두세요)
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

 const getStatusBadge = (status) => {
  const statusMap = {
    pending: { text: '대기중', class: 'status-pending' },
    paid: { text: '결제완료', class: 'status-paid' },      // 🆕 이 줄 추가
    confirmed: { text: '확인됨', class: 'status-confirmed' },
    cancelled: { text: '취소됨', class: 'status-cancelled' },
    completed: { text: '완료됨', class: 'status-completed' }
  };
    
    const statusInfo = statusMap[status] || { text: status, class: 'status-unknown' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  if (loading) {
    return <div className="loading">주문 목록을 불러오는 중...</div>;
  }

  const pendingOrders = getOrdersByStatus('pending');
  const paidOrders = getOrdersByStatus('paid');  
  const confirmedOrders = getOrdersByStatus('confirmed');
  const newOrders = [...paidOrders, ...pendingOrders];
  const recentOrders = orders.slice(0, 10);

  return (
    <div className="order-management">
      <div className="management-header">
        <h1>📋 주문 관리</h1>
        <div className="order-stats">
          <div className="stat-item">
  <span className="stat-number">{newOrders.length}</span>
  <span className="stat-label">처리대기</span>
</div>
          <div className="stat-item">
            <span className="stat-number">{confirmedOrders.length}</span>
            <span className="stat-label">진행 중</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{orders.length}</span>
            <span className="stat-label">총 주문</span>
          </div>
        </div>
      </div>

      {/* 대기 중인 주문 */}
     {newOrders.length > 0 && (
  <div className="order-section">
    <h2>🔔 새로운 주문 ({newOrders.length}개)</h2>
    <div className="orders-grid">
      {newOrders.map(order => (
              <div key={order.id} className="order-card urgent">
                <div className="order-header">
                  <span className="order-id">#{order.orderNumber || order.id.slice(-6)}</span>
                  {getStatusBadge(order.status)}
                  <button 
                    onClick={() => handlePrintOrder(order)}
                    className="btn-print"
                    title="프린트"
                  >
                    🖨️
                  </button>
                </div>
                
                {/* 상점 정보 추가 */}
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
                  {/* 수정: tableInfo → tableNumber */}
                  {order.tableNumber && (
                    <div className="detail-row">
                      <span className="label">테이블:</span>
                      <span className="value">{order.tableNumber}</span>
                    </div>
                  )}
                  {/* 수정: request → specialRequests */}
                  {order.specialRequests && (
                    <div className="detail-row">
                      <span className="label">요청사항:</span>
                      <span className="value">{order.specialRequests}</span>
                    </div>
                  )}
                  {/* 메뉴 정보 추가 */}
                  {order.items && order.items.length > 0 && (
                    <div className="detail-row">
                      <span className="label">메뉴:</span>
                      <span className="value">
                        {order.items.map(item => `${item.name}×${item.quantity}`).join(', ')}
                      </span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="label">주문시간:</span>
                    <span className="value">{formatTime(order.createdAt)}</span>
                  </div>
                </div>

                <div className="order-actions">
                  <button 
                    onClick={() => setSelectedOrder(order)}
                    className="btn-confirm"
                  >
                    주문 확인
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedOrder(order);
                      setCancelReason('');
                    }}
                    className="btn-cancel"
                  >
                    주문 취소
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 진행 중인 주문 */}
      {confirmedOrders.length > 0 && (
        <div className="order-section">
          <h2>🚚 배달 진행 중 ({confirmedOrders.length}개)</h2>
          <div className="orders-grid">
            {confirmedOrders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <span className="order-id">#{order.orderNumber || order.id.slice(-6)}</span>
                  {getStatusBadge(order.status)}
                  <button 
                    onClick={() => handlePrintOrder(order)}
                    className="btn-print"
                    title="프린트"
                  >
                    🖨️
                  </button>
                </div>

                {/* 상점 정보 추가 */}
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
                  {order.items && order.items.length > 0 && (
                    <div className="detail-row">
                      <span className="label">메뉴:</span>
                      <span className="value">
                        {order.items.map(item => `${item.name}×${item.quantity}`).join(', ')}
                      </span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="label">배달예정:</span>
                    <span className="value">{order.deliveryTime}분</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">확인시간:</span>
                    <span className="value">{formatTime(order.confirmedAt)}</span>
                  </div>
                </div>

                <div className="order-actions">
                  <button 
                    onClick={() => handleCompleteDelivery(order)}
                    disabled={isProcessing}
                    className="btn-complete"
                  >
                    배달 완료
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 최근 주문 내역 */}
      <div className="order-section">
        <h2>📊 최근 주문 내역</h2>
        <div className="orders-table">
          <div className="table-header">
            <span>주문번호</span>
            <span>상점</span>
            <span>금액</span>
            <span>전화번호</span>
            <span>상태</span>
            <span>주문시간</span>
            <span>액션</span>
          </div>
          {recentOrders.map(order => (
            <div key={order.id} className="table-row">
              <span>#{order.orderNumber || order.id.slice(-6)}</span>
              <span>{order.storeName || '정보없음'}</span>
              <span>{order.amount?.toLocaleString()}원</span>
              <span>{order.phone}</span>
              <span>{getStatusBadge(order.status)}</span>
              <span>{formatTime(order.createdAt)}</span>
              <span>
                <button 
                  onClick={() => handlePrintOrder(order)}
                  className="btn-print-small"
                  title="프린트"
                >
                  🖨️
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 주문 처리 모달 */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>주문 처리</h3>
              <button 
                onClick={() => {
                  setSelectedOrder(null);
                  setDeliveryTime('');
                  setCancelReason('');
                }}
                className="modal-close"
              >
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
                    onClick={() => handleConfirmOrder(selectedOrder)}
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
                    onClick={() => handleCancelOrder(selectedOrder)}
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
      )}
    </div>
  );
}

export default OrderManagement;