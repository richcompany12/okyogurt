// src/pages/PointsManagement.js
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './PointsManagement.css';

const PointsManagement = () => {
  const { currentUser, userRole, userStoreId, isAdmin, isSuperAdmin } = useAuth();
  
  // 상태 관리
  const [stores, setStores] = useState([]);
  const [storeBalances, setStoreBalances] = useState([]);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [filteredStoreId, setFilteredStoreId] = useState(null);
  const [filteredStoreName, setFilteredStoreName] = useState('');
  const [adjustmentData, setAdjustmentData] = useState({
    storeId: '',
    storeName: '',
    type: 'add', // add, subtract
    amount: '',
    reason: ''
  });

  // 상점 목록 로드
  useEffect(() => {
    const storesQuery = query(collection(db, 'stores'), orderBy('name'));
    
    const unsubscribe = onSnapshot(storesQuery, (snapshot) => {
      const storesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // 권한에 따른 필터링
      if (userRole === 'store_owner' && userStoreId) {
        setStores(storesList.filter(store => store.id === userStoreId));
      } else {
        setStores(storesList);
      }
    });

    return () => unsubscribe();
  }, [userRole, userStoreId]);

  // 상점 포인트 잔액 로드
  useEffect(() => {
    const balancesQuery = query(
      collection(db, 'store_point_balance'),
      orderBy('storeName')
    );
    
    const unsubscribe = onSnapshot(balancesQuery, (snapshot) => {
      const balancesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // 권한에 따른 필터링
      if (userRole === 'store_owner' && userStoreId) {
        setStoreBalances(balancesList.filter(balance => balance.storeId === userStoreId));
      } else {
        setStoreBalances(balancesList);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userRole, userStoreId]);

  // 포인트 내역 로드
  useEffect(() => {
    let historyQuery;
    
    if (userRole === 'store_owner' && userStoreId) {
      // 제휴상점은 본인 상점만
      historyQuery = query(
        collection(db, 'store_points'),
        where('storeId', '==', userStoreId),
        orderBy('createdAt', 'desc')
      );
    } else {
      // 관리자는 전체
      historyQuery = query(
        collection(db, 'store_points'),
        orderBy('createdAt', 'desc')
      );
    }
    
    const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
      const historyList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPointsHistory(historyList);
    });

    return () => unsubscribe();
  }, [userRole, userStoreId]);

  // 포인트 조정 모달 열기
  const openAdjustModal = (store, type) => {
    setAdjustmentData({
      storeId: store.id,
      storeName: store.name,
      type: type,
      amount: '',
      reason: ''
    });
    setShowAdjustModal(true);
  };

  // 포인트 조정 처리
  const handlePointAdjustment = async (e) => {
    e.preventDefault();
    
    const amount = parseInt(adjustmentData.amount);
    if (!amount || amount <= 0) {
      alert('올바른 포인트 수량을 입력해주세요.');
      return;
    }

    if (!adjustmentData.reason.trim()) {
      alert('조정 사유를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);

      // 1. 포인트 조정 내역 저장
      const adjustmentRecord = {
        storeId: adjustmentData.storeId,
        storeName: adjustmentData.storeName,
        pointsEarned: adjustmentData.type === 'add' ? amount : -amount,
        orderAmount: 0, // 수동 조정이므로 0
        pointRate: 0, // 수동 조정이므로 0
        type: adjustmentData.type === 'add' ? 'manual_add' : 'manual_subtract',
        reason: adjustmentData.reason,
        adjustedBy: currentUser.email,
        createdAt: new Date(),
        orderId: null,
        orderNumber: `MANUAL_${Date.now()}`,
        customerPhone: null
      };

      await addDoc(collection(db, 'store_points'), adjustmentRecord);

      // 2. 상점 포인트 잔액 업데이트
      const balanceRef = doc(db, 'store_point_balance', adjustmentData.storeId);
      const balanceDoc = await getDoc(balanceRef);

      if (balanceDoc.exists()) {
        const currentData = balanceDoc.data();
        const newTotalPoints = adjustmentData.type === 'add' 
          ? (currentData.totalPoints || 0) + amount
          : (currentData.totalPoints || 0) - amount;

        if (newTotalPoints < 0) {
          alert('포인트 잔액이 부족합니다.');
          setLoading(false);
          return;
        }

        await updateDoc(balanceRef, {
          totalPoints: newTotalPoints,
          totalEarned: adjustmentData.type === 'add' 
            ? (currentData.totalEarned || 0) + amount 
            : currentData.totalEarned,
          totalUsed: adjustmentData.type === 'subtract' 
            ? (currentData.totalUsed || 0) + amount 
            : currentData.totalUsed,
          updatedAt: new Date()
        });
      } else {
        if (adjustmentData.type === 'subtract') {
          alert('해당 상점의 포인트 잔액 정보가 없습니다.');
          setLoading(false);
          return;
        }

        await setDoc(balanceRef, {
          storeId: adjustmentData.storeId,
          storeName: adjustmentData.storeName,
          totalPoints: amount,
          totalEarned: amount,
          totalUsed: 0,
          updatedAt: new Date()
        });
      }

      alert(`포인트가 성공적으로 ${adjustmentData.type === 'add' ? '추가' : '차감'}되었습니다.`);
      setShowAdjustModal(false);
      setAdjustmentData({
        storeId: '',
        storeName: '',
        type: 'add',
        amount: '',
        reason: ''
      });

    } catch (error) {
      console.error('포인트 조정 오류:', error);
      alert('포인트 조정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

const handleStoreFilter = (storeId, storeName) => {
  if (filteredStoreId === storeId) {
    // 이미 선택된 상점을 다시 클릭하면 필터 해제
    setFilteredStoreId(null);
    setFilteredStoreName('');
  } else {
    setFilteredStoreId(storeId);
    setFilteredStoreName(storeName);
  }
};

  // 날짜 포맷
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR') + ' ' + date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 포인트 타입별 표시
  const getPointTypeDisplay = (type, pointsEarned) => {
    switch (type) {
      case 'earned':
        return <span className="type-earned">자동적립 (+{pointsEarned?.toLocaleString()}P)</span>;
      case 'manual_add':
        return <span className="type-manual-add">수동추가 (+{pointsEarned?.toLocaleString()}P)</span>;
      case 'manual_subtract':
        return <span className="type-manual-subtract">수동차감 ({pointsEarned?.toLocaleString()}P)</span>;
      default:
        return <span className="type-unknown">알 수 없음</span>;
    }
  };

  if (loading) {
    return (
      <div className="points-management loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>포인트 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="points-management">
      <div className="page-header">
        <h1>💎 포인트 관리</h1>
        <p>제휴상점 포인트 현황 및 관리</p>
      </div>

      {/* 포인트 잔액 현황 */}
      <div className="section">
        <div className="section-header">
          <h2>💰 상점별 포인트 잔액</h2>
          {isAdmin && (
            <div className="section-actions">
              <span className="help-text">💡 상점을 클릭하여 포인트를 조정하세요</span>
            </div>
          )}
        </div>

        <div className="balance-grid">
          {stores.map(store => {
            const balance = storeBalances.find(b => b.storeId === store.id);
            return (
              <div key={store.id} className="balance-card">
                <div className="store-info">
                  <h3>{store.name}</h3>
                  <p className="store-address">{store.address}</p>
                  <p className="store-rate">적립률: {store.pointRate || 5}%</p>
                </div>
                
                <div className="balance-info">
                  <div className="current-balance">
                    <span className="label">현재 잔액</span>
                    <span className="amount">{(balance?.totalPoints || 0).toLocaleString()}P</span>
                  </div>
                  
                  <div 
                    className="balance-details" 
                    onClick={() => handleStoreFilter(store.id, store.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="detail">
                      <span>총 적립</span>
                      <span>{(balance?.totalEarned || 0).toLocaleString()}P</span>
                    </div>
                    <div className="detail">
                      <span>총 사용</span>
                      <span>{(balance?.totalUsed || 0).toLocaleString()}P</span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="balance-actions">
                    <button 
                      className="btn btn-add"
                      onClick={() => openAdjustModal(store, 'add')}
                    >
                      ➕ 추가
                    </button>
                    <button 
                      className="btn btn-subtract"
                      onClick={() => openAdjustModal(store, 'subtract')}
                      disabled={!balance || balance.totalPoints <= 0}
                    >
                      ➖ 차감
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {stores.length === 0 && (
          <div className="empty-state">
            <p>등록된 상점이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 포인트 내역 */}
      <div className="section">
        <div className="section-header">
  <h2>📋 포인트 내역</h2>
  {filteredStoreName && (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
      <span style={{ color: '#666' }}>🔍 {filteredStoreName} 내역만 표시 중</span>
      <button 
        onClick={() => {setFilteredStoreId(null); setFilteredStoreName('');}}
        style={{ 
          background: '#f0f0f0', 
          border: 'none', 
          borderRadius: '4px', 
          padding: '4px 8px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        전체 보기
      </button>
    </div>
  )}
</div>

        <div className="history-table">
          <table>
            <thead>
              <tr>
                <th>날짜</th>
                <th>상점명</th>
                <th>구분</th>
                <th>주문번호</th>
                <th>주문금액</th>
                <th>사유</th>
                {isAdmin && <th>처리자</th>}
              </tr>
            </thead>
            <tbody>
              {pointsHistory
                .filter(record => filteredStoreId ? record.storeId === filteredStoreId : true)
                .slice(0, 50)
                .map(record => (
                <tr key={record.id}>
                  <td>{formatDate(record.createdAt)}</td>
                  <td>{record.storeName}</td>
                  <td>{getPointTypeDisplay(record.type, record.pointsEarned)}</td>
                  <td>{record.orderNumber || '-'}</td>
                  <td>
                    {record.orderAmount > 0 
                      ? `${record.orderAmount.toLocaleString()}원` 
                      : '-'
                    }
                  </td>
                  <td>{record.reason || '-'}</td>
                  {isAdmin && (
                    <td>{record.adjustedBy || '자동'}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {pointsHistory.length === 0 && (
            <div className="empty-state">
              <p>포인트 내역이 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* 포인트 조정 모달 */}
      {showAdjustModal && (
        <div className="modal-overlay" onClick={() => setShowAdjustModal(false)}>
          <div className="adjust-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                💎 포인트 {adjustmentData.type === 'add' ? '추가' : '차감'}
              </h3>
              <button 
                className="close-btn"
                onClick={() => setShowAdjustModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePointAdjustment} className="adjust-form">
              <div className="form-group">
                <label>대상 상점</label>
                <input 
                  type="text" 
                  value={adjustmentData.storeName} 
                  disabled 
                />
              </div>

              <div className="form-group">
                <label>
                  {adjustmentData.type === 'add' ? '추가할' : '차감할'} 포인트
                </label>
                <input
                  type="number"
                  value={adjustmentData.amount}
                  onChange={(e) => setAdjustmentData(prev => ({
                    ...prev,
                    amount: e.target.value
                  }))}
                  placeholder="포인트 수량 입력"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>조정 사유</label>
                <textarea
                  value={adjustmentData.reason}
                  onChange={(e) => setAdjustmentData(prev => ({
                    ...prev,
                    reason: e.target.value
                  }))}
                  placeholder="포인트 조정 사유를 입력하세요"
                  rows="3"
                  required
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button"
                  className="btn btn-cancel"
                  onClick={() => setShowAdjustModal(false)}
                >
                  취소
                </button>
                <button 
                  type="submit"
                  className={`btn ${adjustmentData.type === 'add' ? 'btn-add' : 'btn-subtract'}`}
                  disabled={loading}
                >
                  {loading ? '처리 중...' : (adjustmentData.type === 'add' ? '포인트 추가' : '포인트 차감')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointsManagement;