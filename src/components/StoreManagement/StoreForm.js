// src/components/StoreManagement/StoreForm.js
import React, { useState, useEffect } from 'react';
import { addDoc, updateDoc, doc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import './StoreForm.css';

const StoreForm = ({ 
  store, 
  onClose, 
  onSuccess 
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    description: '',
    isActive: true,
    pointRate: 5, // ✅ 기존 적립률
    // 💡 추가: 상점별 노출 탭 설정 (기본값 모두 노출)
    visible_tabs: {
      YOGURT: true,
      BUNGEO: true,
      COFFEE: true,
    }
  });

  // 수정 모드인 경우 기존 데이터 로드
  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || '',
        address: store.address || '',
        phone: store.phone || '',
        description: store.description || '',
        isActive: store.isActive !== undefined ? store.isActive : true,
        pointRate: store.pointRate || 5,
        // 💡 추가: 기존 탭 설정값 로드 (없으면 기본값 사용)
        visible_tabs: store.visible_tabs || { YOGURT: true, BUNGEO: true, COFFEE: true },
      });
    }
  }, [store]);

  // 입력값 변경 처리
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // 💡 추가: 탭 노출 체크박스 처리
    if (name === 'YOGURT' || name === 'BUNGEO' || name === 'COFFEE') {
      setFormData(prev => ({
        ...prev,
        visible_tabs: {
          ...prev.visible_tabs,
          [name]: checked
        }
      }));
      return;
    }
    
    // 포인트 적립률 처리
    if (name === 'pointRate') {
      const rate = parseFloat(value);
      // 0~20% 범위로 제한
      if (rate >= 0 && rate <= 20) {
        setFormData(prev => ({
          ...prev,
          [name]: rate
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // 폼 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (store) {
        // 수정 모드
        await updateDoc(doc(db, 'stores', store.id), {
          ...formData,
          updatedAt: new Date(),
          updatedBy: currentUser.email
        });
        alert('상점 정보가 수정되었습니다.');
      } else {
        // 등록 모드
        await addDoc(collection(db, 'stores'), {
          ...formData,
          createdAt: new Date(),
          createdBy: currentUser.email
        });
        alert('새 상점이 등록되었습니다.');
      }
      
      onSuccess?.(); // 성공 콜백 호출
      onClose(); // 폼 닫기
    } catch (error) {
      console.error('상점 저장 오류:', error);
      alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 폼 리셋
  const handleReset = () => {
    if (store) {
      setFormData({
        name: store.name || '',
        address: store.address || '',
        phone: store.phone || '',
        description: store.description || '',
        isActive: store.isActive !== undefined ? store.isActive : true,
        pointRate: store.pointRate || 5
      });
    } else {
      setFormData({
        name: '',
        address: '',
        phone: '',
        description: '',
        isActive: true,
        pointRate: 5
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="store-form-modal" onClick={e => e.stopPropagation()}>
        <div className="form-header">
          <h3>{store ? '상점 정보 수정' : '새 상점 등록'}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="store-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">
                상점명 <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="상점명을 입력하세요"
                required
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                전화번호 <span className="required">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="010-1234-5678"
                required
                pattern="[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}"
              />
              <small className="form-hint">형식: 010-1234-5678</small>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">
              주소 <span className="required">*</span>
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="상점 주소를 입력하세요"
              required
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">상점 설명</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="상점에 대한 간단한 설명을 입력하세요 (선택사항)"
              rows="4"
              maxLength={500}
            />
            <small className="form-hint">
              {formData.description.length}/500자
            </small>
          </div>

          {/* ✅ 추가: 포인트 적립률 설정 */}
          <div className="form-group">
            <label htmlFor="pointRate">
              포인트 적립률 <span className="required">*</span>
            </label>
            <div className="point-rate-input">
              <input
                type="number"
                id="pointRate"
                name="pointRate"
                value={formData.pointRate}
                onChange={handleChange}
                min="0"
                max="20"
                step="0.1"
                required
              />
              <span className="point-unit">%</span>
            </div>
            <small className="form-hint">
              📊 {formData.pointRate}% 적립률 → 1만원 결제 시 {(10000 * formData.pointRate / 100).toLocaleString()}포인트 적립
              <br />
              💡 적극적인 매장: 8-10%, 일반 매장: 5%, 소극적인 매장: 2-3%
            </small>
          </div>

{/* 💡 추가: 탭 노출 설정 체크박스 그룹 */}
          <div className="form-group tab-visibility-group">
            <label>메뉴 탭 노출 설정</label>
            <div className="tab-checkboxes">
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="YOGURT"
                  checked={formData.visible_tabs.YOGURT}
                  onChange={handleChange}
                  disabled // 요거트는 필수이므로 비활성화
                />
                <span className="checkbox-custom"></span>
                요거트 아이스크림
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="BUNGEO"
                  checked={formData.visible_tabs.BUNGEO}
                  onChange={handleChange}
                />
                <span className="checkbox-custom"></span>
                붕어빵
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="COFFEE"
                  checked={formData.visible_tabs.COFFEE}
                  onChange={handleChange}
                />
                <span className="checkbox-custom"></span>
                커피 및 음료
              </label>
            </div>
            <small className="form-hint">
              체크된 탭만 해당 상점의 QR코드를 통한 주문 화면에 노출됩니다.
              요거트 아이스크림은 기본 노출되며 비활성화할 수 없습니다.
            </small>
          </div>
          
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
              />
              <span className="checkbox-custom"></span>
              상점 운영 중
            </label>
            <small className="form-hint">
              체크 해제 시 상점이 임시 중지 상태가 됩니다
            </small>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={loading}
            >
              초기화
            </button>
            <button 
              type="button" 
              className="btn btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              취소
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  {store ? '수정 중...' : '등록 중...'}
                </>
              ) : (
                store ? '수정하기' : '등록하기'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StoreForm;