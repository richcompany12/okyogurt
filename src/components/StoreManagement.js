// src/components/StoreManagement.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

// 분리된 컴포넌트들 import
import StoreList from './StoreManagement/StoreList';
import StoreForm from './StoreManagement/StoreForm';
import QRCodeModal from './StoreManagement/QRCodeModal';
import './StoreManagement.css';

const StoreManagement = () => {
  const { currentUser, isAdmin } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 모달 상태 관리
  const [showForm, setShowForm] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [showQRCode, setShowQRCode] = useState(null);

  // 상점 목록 불러오기
  const fetchStores = async () => {
    try {
      setLoading(true);
      const storesSnapshot = await getDocs(collection(db, 'stores'));
      const storesList = storesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // 최신 순으로 정렬
      storesList.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      
      setStores(storesList);
    } catch (error) {
      console.error('상점 목록 조회 오류:', error);
      alert('상점 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // 새 상점 등록
  const handleAddStore = () => {
    setSelectedStore(null);
    setShowForm(true);
  };

  // 상점 수정
  const handleEditStore = (store) => {
    setSelectedStore(store);
    setShowForm(true);
  };

  // 상점 삭제
  const handleDeleteStore = async (storeId) => {
    const store = stores.find(s => s.id === storeId);
    if (!store) return;

    const confirmMessage = `정말로 "${store.name}" 상점을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await deleteDoc(doc(db, 'stores', storeId));
        alert('상점이 삭제되었습니다.');
        fetchStores(); // 목록 새로고침
      } catch (error) {
        console.error('상점 삭제 오류:', error);
        alert('삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  // QR코드 표시
  const handleShowQRCode = (store) => {
    setShowQRCode(store);
  };

  // 폼 성공 후 처리
  const handleFormSuccess = () => {
    fetchStores(); // 목록 새로고침
  };

  // 폼 닫기
  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedStore(null);
  };

  // QR코드 모달 닫기
  const handleCloseQRCode = () => {
    setShowQRCode(null);
  };

  return (
    <div className="store-management">
      {/* 헤더 */}
      <div className="management-header">
        <div className="header-content">
          <h2>🏪 상점 관리</h2>
          <p>등록된 상점을 관리하고 QR코드를 생성할 수 있습니다.</p>
        </div>
        
        {isAdmin && (
          <button 
            className="btn btn-primary btn-add"
            onClick={handleAddStore}
          >
            <span className="btn-icon">+</span>
            새 상점 등록
          </button>
        )}
      </div>

      {/* 상점 목록 */}
      <StoreList
        stores={stores}
        loading={loading}
        isAdmin={isAdmin}
        onQRCode={handleShowQRCode}
        onEdit={handleEditStore}
        onDelete={handleDeleteStore}
      />

      {/* 상점 등록/수정 폼 */}
      {showForm && (
        <StoreForm
          store={selectedStore}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* QR코드 모달 */}
      <QRCodeModal 
        store={showQRCode} 
        onClose={handleCloseQRCode} 
      />
    </div>
  );
};

export default StoreManagement;