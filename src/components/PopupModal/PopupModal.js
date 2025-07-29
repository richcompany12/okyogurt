// src/components/PopupModal/PopupModal.js
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import './PopupModal.css';

const PopupModal = ({ onClose }) => {
  const [popup, setPopup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dontShowToday, setDontShowToday] = useState(false);

  // 활성화된 팝업 조회 (시간 체크 포함)
  const fetchActivePopup = async () => {
    try {
      setLoading(true);
      
      const q = query(
        collection(db, 'popups'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const popupDoc = querySnapshot.docs[0];
        const popupData = { id: popupDoc.id, ...popupDoc.data() };
        
        // 현재 날짜와 시간으로 범위 체크
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // 오늘 날짜 (시간 제외)
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0'); // HH:mm 형식
        
        let showPopup = true;
        
        // 날짜 범위 체크
        if (popupData.startDate && popupData.startDate.toDate() > today) {
          console.log('팝업 시작 날짜 전:', popupData.startDate.toDate(), '>', today);
          showPopup = false;
        }
        
        if (popupData.endDate) {
          const endDate = new Date(popupData.endDate.toDate().getFullYear(), popupData.endDate.toDate().getMonth(), popupData.endDate.toDate().getDate());
          if (endDate < today) {
            console.log('팝업 종료 날짜 후:', endDate, '<', today);
            showPopup = false;
          }
        }
        
        // 시간 범위 체크 (날짜가 유효한 경우에만)
        if (showPopup && popupData.startTime && popupData.endTime) {
          if (currentTime < popupData.startTime || currentTime > popupData.endTime) {
            console.log('팝업 시간 범위 밖:', currentTime, 'not in', popupData.startTime, '~', popupData.endTime);
            showPopup = false;
          }
        }
        
        if (showPopup) {
          // localStorage에서 오늘 하루 보지 않기 체크
          const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
          const dismissKey = `popup_dismissed_${today}_${popupData.id}`;
          
          if (!localStorage.getItem(dismissKey)) {
            console.log('팝업 표시:', popupData.title);
            setPopup(popupData);
          } else {
            console.log('오늘 하루 보지 않기로 설정된 팝업');
            onClose && onClose();
          }
        } else {
          console.log('날짜/시간 범위에 맞지 않는 팝업');
          onClose && onClose();
        }
      } else {
        console.log('활성화된 팝업이 없음');
        onClose && onClose();
      }
    } catch (error) {
      console.error('팝업 조회 실패:', error);
      onClose && onClose();
    } finally {
      setLoading(false);
    }
  };

  // 팝업 닫기 처리
  const handleClose = () => {
    if (dontShowToday && popup) {
      // 오늘 하루 보지 않기 설정
      const today = new Date().toISOString().split('T')[0];
      const dismissKey = `popup_dismissed_${today}_${popup.id}`;
      localStorage.setItem(dismissKey, 'true');
      console.log('오늘 하루 보지 않기 설정:', dismissKey);
    }
    
    onClose && onClose();
  };

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [dontShowToday, popup]);

  // 배경 클릭으로 닫기
  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // 컴포넌트 마운트 시 팝업 조회
  useEffect(() => {
    fetchActivePopup();
  }, []);

  // 로딩 중이거나 팝업이 없으면 렌더링 안 함
  if (loading || !popup) {
    return null;
  }

  return (
    <div className="popup-modal-overlay" onClick={handleBackgroundClick}>
      <div className="popup-modal-container">
        {/* 닫기 버튼 */}
        <button 
          className="popup-close-button"
          onClick={handleClose}
          aria-label="팝업 닫기"
        >
          ✕
        </button>

        {/* 팝업 이미지 */}
        <div className="popup-image-container">
          <img
            src={popup.imageUrl}
            alt={popup.title}
            className="popup-image"
            onError={(e) => {
              console.error('팝업 이미지 로딩 실패:', popup.imageUrl);
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* 팝업 제목 (이미지 아래) */}
        {popup.title && (
          <div className="popup-title">
            {popup.title}
          </div>
        )}

        {/* 하단 버튼들 */}
        <div className="popup-footer">
          {/* 오늘 하루 보지 않기 체크박스 */}
          <label className="dont-show-today">
            <input
              type="checkbox"
              checked={dontShowToday}
              onChange={(e) => setDontShowToday(e.target.checked)}
            />
            <span className="checkbox-text">오늘 하루 보지 않기</span>
          </label>

          {/* 닫기 버튼 */}
          <button 
            className="popup-action-button"
            onClick={handleClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default PopupModal;