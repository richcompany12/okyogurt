// src/components/OrderManagement.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  getDoc,
  limit 
} from 'firebase/firestore';
import { db } from '../firebase';
import './OrderManagement.css';
import './OrderManagement.mobile.css';

import StatusBadge from './common/StatusBadge';
import { ToastContainer } from './common/Toast';
import useToast from '../hooks/useToast';
import OrderCard from './OrderManagement/OrderCard';
import OrderStats from './OrderManagement/OrderStats';
import AutoPrintToggle from './OrderManagement/AutoPrintToggle';
import OrderModal from './OrderManagement/OrderModal';
import OrderDetailModal from './OrderManagement/OrderDetailModal';
import OrderFilters from './OrderManagement/OrderFilters';

function OrderManagement() {
  // 상태 관리
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deliveryTime, setDeliveryTime] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  
  // 필터링 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // 자동 프린트 상태
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);
  const [autoPrintedOrders, setAutoPrintedOrders] = useState(new Set());
  const previousOrdersRef = useRef([]);
  
  const { toasts, showSuccess, showError, showWarning, removeToast } = useToast();

  // 유틸리티 함수들
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
    return <StatusBadge status={status} />;
  };

  // 필터링 함수들
  const filterOrders = (ordersList) => {
    return ordersList.filter(order => {
      const matchesSearch = !searchTerm || 
  (order.orderNumber && order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
  order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
  (order.phone && order.phone.includes(searchTerm));

      const matchesStatus = !statusFilter || order.status === statusFilter;
      const matchesStore = !storeFilter || order.storeName === storeFilter;
      const matchesDate = !dateFilter || checkDateFilter(order.createdAt, dateFilter);

      return matchesSearch && matchesStatus && matchesStore && matchesDate;
    });
  };

  const checkDateFilter = (orderDate, filter) => {
    if (!orderDate || !filter) return true;
    
    const orderDateObj = orderDate.toDate ? orderDate.toDate() : new Date(orderDate);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    switch (filter) {
      case 'today':
        return orderDateObj >= todayStart;
      case 'yesterday':
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const yesterdayEnd = new Date(todayStart);
        return orderDateObj >= yesterdayStart && orderDateObj < yesterdayEnd;
      case 'week':
        const weekAgo = new Date(todayStart);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return orderDateObj >= weekAgo;
      case 'month':
        const monthAgo = new Date(todayStart);
        monthAgo.setDate(monthAgo.getDate() - 30);
        return orderDateObj >= monthAgo;
      default:
        return true;
    }
  };

  const clearFilters = () => {
  setSearchTerm('');
  setStatusFilter('');
  setDateFilter('');
  setStoreFilter('');
  setCurrentPage(1); // 🆕 페이지 초기화
};

  // 상점 목록 추출
  const uniqueStores = [...new Set(orders.map(order => order.storeName).filter(Boolean))];

  // Firebase 실시간 데이터 수신
  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // 자동 프린트 로직
      if (autoPrintEnabled && previousOrdersRef.current.length > 0) {
        const newPaidOrders = ordersList.filter(order => 
          order.status === 'paid' && 
          !autoPrintedOrders.has(order.id) &&
          !previousOrdersRef.current.some(prevOrder => prevOrder.id === order.id)
        );
        
        newPaidOrders.forEach(order => {
          console.log('🆕 새로운 주문 감지! 자동 출력 시작:', order.id);
          handleAutoPrint(order);
          setAutoPrintedOrders(prev => new Set([...prev, order.id]));
        });
      }
      
      setOrders(ordersList);
      previousOrdersRef.current = ordersList;
      setLoading(false);
    });

    return () => unsubscribe();
  }, [autoPrintEnabled, autoPrintedOrders]);

  // 자동 프린트 함수
  const handleAutoPrint = async (order) => {
    try {
      console.log('🖨️ 자동 프린트 실행:', order.orderNumber || order.id.slice(-6));
      
      let storeAddress = '주소 정보 없음';
      try {
        if (order.storeId) {
          const storeDoc = await getDoc(doc(db, 'stores', order.storeId));
          if (storeDoc.exists()) {
            storeAddress = storeDoc.data().address || '주소 정보 없음';
          }
        }
      } catch (error) {
        console.error('상점 정보 조회 오류:', error);
      }

      const orderDataWithAddress = {
        ...order,
        storeAddress: storeAddress,
        formattedCreatedAt: formatTime(order.createdAt)
      };

      const response = await fetch('http://localhost:3001/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderData: orderDataWithAddress })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ 자동 프린트 성공:', result.message, `(${result.method})`);
      } else {
        throw new Error(`프린터 서버 오류: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ 자동 프린트 실패:', error);
    }
  };

  // 주문 확인 처리
  const handleConfirmOrder = async (order) => {
    if (!deliveryTime) {
      showWarning('배달 예정 시간을 선택해주세요.');
      return;
    }

    setIsProcessing(true);

    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'confirmed',
        deliveryTime: parseInt(deliveryTime),
        confirmedAt: new Date(),
        estimatedDeliveryTime: new Date(Date.now() + parseInt(deliveryTime) * 60000)
      });

      await sendCustomerConfirmationSMS({
        phone: order.phone,
        deliveryTime: deliveryTime,
        orderNumber: order.orderNumber || order.id.slice(-6),
        storeName: order.storeName || '요거트퍼플',
        storeId: order.storeId
      });

      showSuccess(`주문이 확인되었습니다. ${deliveryTime}분 후 배달 예정입니다.`);
      setSelectedOrder(null);
      setDeliveryTime('');
    } catch (error) {
      console.error('주문 확인 오류:', error);
      showError('주문 확인 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 고객 주문 확인 SMS 발송
  const sendCustomerConfirmationSMS = async ({ phone, deliveryTime, orderNumber, storeName, storeId }) => {
    try {
      const SMS_ENDPOINT = 'https://sendtestsms-b245qv2hpq-uc.a.run.app';
      
      let additionalMessage = '';
      if (storeId === 'UEBDyBxc0omgPVUAd2It') {
        additionalMessage = `\n\n🏞️ 다음에도 패밀리풀에서 아래 링크로 주문하세요!\n👉 https://okyogurt-8923e.web.app/order/UEBDyBxc0omgPVUAd2It`;
      }

      const customerMessage = `[${storeName}] 주문이 확인되었습니다! 🎉

📋 주문번호: ${orderNumber}
⏰ 배달예정: 약 ${deliveryTime}분 후
🚚 현재 음식을 준비 중입니다

맛있는 아이스크림을 준비해드리겠습니다! 🍦${additionalMessage}`;

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
    }
  };

  // 주문 취소 처리
  const handleCancelOrder = async (order) => {
    if (!cancelReason.trim()) {
      showWarning('취소 사유를 입력해주세요.');
      return;
    }

    setIsProcessing(true);

    try {
      // 포트원 결제 취소
      if (order.paymentId) {
        console.log('포트원 결제 취소 시작:', order.paymentId);
        const cancelResponse = await fetch('https://cancelpayment-b245qv2hpq-uc.a.run.app', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId: order.paymentId,
            reason: cancelReason
          })
        });

        const responseText = await cancelResponse.text();
        console.log('Cancel Response Status:', cancelResponse.status);

        if (!cancelResponse.ok) {
          console.error('포트원 취소 실패:', cancelResponse.status, responseText);
          throw new Error(`포트원 결제 취소 실패: ${cancelResponse.status}`);
        }

        console.log('포트원 결제 취소 성공');
      }

      // Firestore 주문 상태 업데이트
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'cancelled',
        cancelReason: cancelReason,
        cancelledAt: new Date()
      });

      // 고객에게 취소 SMS 발송
      await sendCustomerCancellationSMS({
        phone: order.phone,
        orderNumber: order.orderNumber || order.id.slice(-6),
        cancelReason: cancelReason,
        storeName: order.storeName || '요거트퍼플'
      });

      showSuccess('주문이 취소되었습니다.');
      setSelectedOrder(null);
      setCancelReason('');
    } catch (error) {
      console.error('주문 취소 오류:', error);
      showError('주문 취소 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 고객 주문 취소 SMS 발송
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

      console.log('포인트 적립 처리:', order); // TODO: 포인트 적립 처리

      showSuccess('배달이 완료되었습니다.');
    } catch (error) {
      console.error('배달 완료 오류:', error);
      showError('배달 완료 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 수동 프린트 함수
  const handlePrintOrder = async (order) => {
    try {
      let storeAddress = '주소 정보 없음';
      try {
        if (order.storeId) {
          const storeDoc = await getDoc(doc(db, 'stores', order.storeId));
          if (storeDoc.exists()) {
            storeAddress = storeDoc.data().address || '주소 정보 없음';
          }
        }
      } catch (error) {
        console.error('상점 정보 조회 오류:', error);
      }

      console.log('🖨️ 수동 프린터 출력 시작...');
      
      const orderDataWithAddress = {
        ...order,
        storeAddress: storeAddress,
        formattedCreatedAt: formatTime(order.createdAt)
      };

      const response = await fetch('http://localhost:3001/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderData: orderDataWithAddress })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ 수동 프린터 출력 성공:', result.message, `(${result.method})`);
        showSuccess(`프린터 출력 완료! (${result.method})`);
      } else {
        throw new Error(`프린터 서버 오류: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ 프린터 출력 오류:', error);
      
      // 프린터 실패 시 브라우저 프린트로 fallback
      console.log('🔄 브라우저 프린트로 대체 실행...');
      
      let storeAddress = '주소 정보 없음';
      try {
        if (order.storeId) {
          const storeDoc = await getDoc(doc(db, 'stores', order.storeId));
          if (storeDoc.exists()) {
            storeAddress = storeDoc.data().address || '주소 정보 없음';
          }
        }
      } catch (error) {
        console.error('상점 정보 조회 오류:', error);
      }

      // 브라우저 프린트 fallback (기존 코드와 동일)
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>주문서 - ${order.orderNumber}</title>
            <style>
              @page { size: 80mm auto; margin: 0; orientation: portrait; }
              @media print { @page { size: portrait; margin: 0; } body { transform: rotate(0deg); transform-origin: top left; } }
              body { font-family: 'Courier New', monospace; font-size: 22px; font-weight: 900; line-height: 1.3; margin: 0; padding: 5mm; width: 70mm; color: #000000; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .center { text-align: center; } .left { text-align: left; } .right { text-align: right; } .bold { font-weight: bold; }
              .header { text-align: center; border-bottom: 1px dashed #333; padding-bottom: 5px; margin-bottom: 8px; }
              .store-name { font-size: 28px; font-weight: 900; margin-bottom: 3px; color: #000000; }
              .section { margin: 8px 0; border-bottom: 1px dashed #ccc; padding-bottom: 5px; }
              .section:last-child { border-bottom: none; }
              .row { display: flex; justify-content: space-between; margin: 2px 0; font-size: 20px; font-weight: 700; }
              .menu-item { margin: 1px 0; font-size: 20px; font-weight: 700; }
              .total-row { font-weight: 900; font-size: 24px; border-top: 2px solid #000; padding-top: 3px; margin-top: 5px; color: #000000; }
              .customer-info { font-size: 20px; font-weight: 700; margin: 2px 0; color: #000000; }
              .special-requests { font-size: 10px; border: 1px solid #ccc; padding: 3px; margin: 5px 0; word-wrap: break-word; }
              .footer { text-align: center; font-size: 10px; margin-top: 10px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="store-name">🍦 ${order.storeName || '요거트퍼플'}</div>
              <div>주문번호: ${order.orderNumber || order.id.slice(-6)}</div>
            </div>
            <div class="section">
              <div class="bold center">📞 고객 정보</div>
              <div class="customer-info">전화: ${order.phone}</div>
              ${order.tableNumber ? `<div class="customer-info">테이블: ${order.tableNumber}</div>` : ''}
            </div>
            <div class="section">
              <div class="bold center">🚚 배달 위치</div>
              <div class="customer-info">상점명: ${order.storeName || '정보없음'}</div>
              <div class="customer-info">주소: ${storeAddress}</div>
            </div>
            <div class="section">
              <div class="bold center">📋 주문 메뉴</div>
              ${order.items && order.items.length > 0 ? 
                order.items.map(item => 
                  `<div class="menu-item">
                    <div class="row"><span>${item.name}</span><span>x${item.quantity}</span></div>
                    <div class="row"><span>단가: ${item.price?.toLocaleString()}원</span><span>${(item.price * item.quantity)?.toLocaleString()}원</span></div>
                  </div>`
                ).join('') : '<div class="menu-item">메뉴 정보 없음</div>'
              }
              <div class="total-row">
                <div class="row"><span>총 금액</span><span>${order.amount?.toLocaleString() || '0'}원</span></div>
              </div>
            </div>
            <div class="section">
              <div class="bold center">⏰ 주문 정보</div>
              <div class="customer-info">주문시간: ${formatTime(order.createdAt)}</div>
              ${order.deliveryTime ? `<div class="customer-info">배달예정: ${order.deliveryTime}분 후</div>` : ''}
              ${order.status === 'paid' ? '<div class="customer-info">💳 결제완료</div>' : ''}
            </div>
            ${order.specialRequests ? `
            <div class="section">
              <div class="bold center">📝 요청사항</div>
              <div class="special-requests">${order.specialRequests}</div>
            </div>` : ''}
            <div class="footer">
              <div>━━━━━━━━━━━━━━━━━━━━</div>
              <div>맛있게 드세요! 🍦</div>
              <div>${new Date().toLocaleString('ko-KR')}</div>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.onload = function() {
        printWindow.print();
        printWindow.close();
      };
    }
  };

  // 로딩 상태
  if (loading) {
    return <div className="loading">주문 목록을 불러오는 중...</div>;
  }

  // 필터링된 주문들
  const filteredOrders = filterOrders(orders);
  const pendingOrders = filteredOrders.filter(order => order.status === 'pending');
  const paidOrders = filteredOrders.filter(order => order.status === 'paid');  
  const confirmedOrders = filteredOrders.filter(order => order.status === 'confirmed');
  const newOrders = [...paidOrders, ...pendingOrders];
 
 const startIndex = (currentPage - 1) * itemsPerPage;
 const endIndex = startIndex + itemsPerPage;
 const recentOrders = filteredOrders.slice(startIndex, endIndex);
 const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  return (
    <div className="order-management">
      {/* 헤더 */}
      <div className="management-header">
        <h1>📋 주문 관리</h1>
        <AutoPrintToggle 
          autoPrintEnabled={autoPrintEnabled}
          onToggle={setAutoPrintEnabled}
        />
        <OrderStats 
          newOrdersCount={newOrders.length}
          confirmedOrdersCount={confirmedOrders.length}
          totalOrdersCount={filteredOrders.length}
        />
      </div>

      {/* 검색/필터 */}
      <OrderFilters
  searchTerm={searchTerm}
  setSearchTerm={(value) => {          // 🆕 래핑
    setSearchTerm(value);
    setCurrentPage(1);
  }}
  statusFilter={statusFilter}
  setStatusFilter={(value) => {        // 🆕 래핑
    setStatusFilter(value);
    setCurrentPage(1);
  }}
  dateFilter={dateFilter}
  setDateFilter={(value) => {          // 🆕 래핑
    setDateFilter(value);
    setCurrentPage(1);
  }}
  storeFilter={storeFilter}
  setStoreFilter={(value) => {         // 🆕 래핑
    setStoreFilter(value);
    setCurrentPage(1);
  }}
  stores={uniqueStores}
  onClearFilters={clearFilters}
/>

      {/* 새로운 주문 */}
      {newOrders.length > 0 && (
        <div className="order-section">
          <h2>🔔 새로운 주문 ({newOrders.length}개)</h2>
          <div className="orders-grid">
            {newOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onPrint={handlePrintOrder}
                onConfirm={(order) => setSelectedOrder(order)}
                onCancel={(order) => {
                  setSelectedOrder(order);
                  setCancelReason('');
                }}
                onViewDetail={(order) => setViewOrder(order)}
                formatTime={formatTime}
                isUrgent={true}
              />
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
              <OrderCard
                key={order.id}
                order={order}
                onPrint={handlePrintOrder}
                onComplete={handleCompleteDelivery}
                onViewDetail={(order) => setViewOrder(order)}
                formatTime={formatTime}
                isUrgent={false}
              />
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
                  onClick={() => setViewOrder(order)}
                  className="btn-detail"
                  title="상세보기"
                  style={{ marginRight: '5px' }}
                >
                  🔍
                </button>
                <button 
                  onClick={async () => await handlePrintOrder(order)}
                  className="btn-print-small"
                  title="수동 프린트"
                >
                  🖨️
                </button>
              </span>
            </div>
          ))}
        </div>

         {/* 🆕 페이징 UI 추가 */}
  {filteredOrders.length > itemsPerPage && (
    <div className="pagination">
      <div className="pagination-info">
        총 {filteredOrders.length}개 중 {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)}개 표시
      </div>
      
      <button 
        className="pagination-btn"
        onClick={() => setCurrentPage(1)}
        disabled={currentPage === 1}
      >
        처음
      </button>
      
      <button 
        className="pagination-btn"
        onClick={() => setCurrentPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        이전
      </button>
      
      <div className="page-numbers">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const page = currentPage <= 3 ? i + 1 : 
                     currentPage >= totalPages - 2 ? totalPages - 4 + i : 
                     currentPage - 2 + i;
          
          return (
            <button
              key={page}
              className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          );
        })}
      </div>
      
      <button 
        className="pagination-btn"
        onClick={() => setCurrentPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        다음
      </button>
      
      <button 
        className="pagination-btn"
        onClick={() => setCurrentPage(totalPages)}
        disabled={currentPage === totalPages}
      >
        마지막
      </button>
    </div>
  )}
</div> 
    

      {/* 모달들 */}
      <OrderModal
        selectedOrder={selectedOrder}
        deliveryTime={deliveryTime}
        setDeliveryTime={setDeliveryTime}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        isProcessing={isProcessing}
        onConfirm={handleConfirmOrder}
        onCancel={handleCancelOrder}
        onClose={() => {
          setSelectedOrder(null);
          setDeliveryTime('');
          setCancelReason('');
        }}
      />

      <OrderDetailModal
        order={viewOrder}
        onClose={() => setViewOrder(null)}
        formatTime={formatTime}
      />
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default OrderManagement;