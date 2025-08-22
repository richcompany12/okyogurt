// src/components/OrderManagement/OrderFilters.js
import React from 'react';

function OrderFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  storeFilter,
  setStoreFilter,
  stores,
  onClearFilters
}) {
  // 오늘 날짜 계산
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="order-filters">
      <div className="filters-header">
        <h3>🔍 주문 검색 및 필터</h3>
        <button onClick={onClearFilters} className="btn-clear-filters">
          초기화
        </button>
      </div>
      
      <div className="filters-grid">
        {/* 검색어 입력 */}
        <div className="filter-group">
          <label>검색</label>
          <input
            type="text"
            placeholder="주문번호, 전화번호로 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* 상태 필터 */}
        <div className="filter-group">
          <label>상태</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">전체 상태</option>
            <option value="pending">대기중</option>
            <option value="paid">결제완료</option>
            <option value="confirmed">확인됨</option>
            <option value="completed">완료됨</option>
            <option value="cancelled">취소됨</option>
          </select>
        </div>

        {/* 상점 필터 */}
        <div className="filter-group">
          <label>상점</label>
          <select 
            value={storeFilter} 
            onChange={(e) => setStoreFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">전체 상점</option>
            {stores.map((store, index) => (
              <option key={index} value={store}>
                {store}
              </option>
            ))}
          </select>
        </div>

        {/* 날짜 필터 */}
        <div className="filter-group">
          <label>날짜</label>
          <select 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">전체 기간</option>
            <option value="today">오늘</option>
            <option value="yesterday">어제</option>
            <option value="week">최근 7일</option>
            <option value="month">최근 30일</option>
          </select>
        </div>
      </div>

      {/* 활성화된 필터 표시 */}
      <div className="active-filters">
        {searchTerm && (
          <span className="filter-tag">
            검색: "{searchTerm}"
            <button onClick={() => setSearchTerm('')}>✕</button>
          </span>
        )}
        {statusFilter && (
          <span className="filter-tag">
            상태: {statusFilter}
            <button onClick={() => setStatusFilter('')}>✕</button>
          </span>
        )}
        {storeFilter && (
          <span className="filter-tag">
            상점: {storeFilter}
            <button onClick={() => setStoreFilter('')}>✕</button>
          </span>
        )}
        {dateFilter && (
          <span className="filter-tag">
            날짜: {dateFilter === 'today' ? '오늘' : 
                   dateFilter === 'yesterday' ? '어제' :
                   dateFilter === 'week' ? '최근 7일' :
                   dateFilter === 'month' ? '최근 30일' : dateFilter}
            <button onClick={() => setDateFilter('')}>✕</button>
          </span>
        )}
      </div>
    </div>
  );
}

export default OrderFilters;