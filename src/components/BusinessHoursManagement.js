// src/components/BusinessHoursManagement.js
import React, { useState, useEffect } from 'react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './BusinessHoursManagement.css';

const BusinessHoursManagement = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 기본 영업시간 데이터
  const [businessData, setBusinessData] = useState({
    weeklyHours: {
      monday: { open: "09:00", close: "22:00", isClosed: false },
      tuesday: { open: "09:00", close: "22:00", isClosed: false },
      wednesday: { open: "09:00", close: "22:00", isClosed: false },
      thursday: { open: "09:00", close: "22:00", isClosed: false },
      friday: { open: "09:00", close: "22:00", isClosed: false },
      saturday: { open: "10:00", close: "23:00", isClosed: false },
      sunday: { open: "10:00", close: "23:00", isClosed: false }
    },
    regularClosedDays: [],
    specificClosedDates: [],
    isEmergencyClosed: false,
    emergencyCloseReason: "",
    contactPhone: "01081771258",
    updatedAt: new Date(),
    updatedBy: currentUser?.email || ""
  });

  // 요일 한글명
  const dayNames = {
    monday: '월요일',
    tuesday: '화요일', 
    wednesday: '수요일',
    thursday: '목요일',
    friday: '금요일',
    saturday: '토요일',
    sunday: '일요일'
  };

  // 컴포넌트 마운트시 데이터 로드
  useEffect(() => {
    loadBusinessHours();
  }, []);

  // Firebase에서 영업시간 데이터 로드
  const loadBusinessHours = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'business_hours', 'main');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // 기존 데이터가 있으면 로드
        const data = docSnap.data();
        setBusinessData({
          ...businessData,
          ...data,
          // 날짜 객체 변환
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
        console.log('영업시간 데이터 로드 완료:', data);
      } else {
        // 데이터가 없으면 기본값으로 문서 생성
        console.log('영업시간 데이터 없음 - 기본값으로 생성');
        await setDoc(docRef, businessData);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('영업시간 데이터 로드 오류:', error);
      setLoading(false);
      alert('데이터 로드에 실패했습니다.');
    }
  };

  // 영업시간 저장
  const saveBusinessHours = async () => {
    try {
      setSaving(true);
      
      const dataToSave = {
        ...businessData,
        updatedAt: new Date(),
        updatedBy: currentUser?.email || ""
      };

      const docRef = doc(db, 'business_hours', 'main');
      await updateDoc(docRef, dataToSave);
      
      console.log('영업시간 저장 완료');
      alert('✅ 영업시간이 저장되었습니다!');
      
      setSaving(false);
    } catch (error) {
      console.error('영업시간 저장 오류:', error);
      alert('저장에 실패했습니다.');
      setSaving(false);
    }
  };

  // 요일별 영업시간 변경
  const updateDayHours = (day, field, value) => {
    setBusinessData(prev => ({
      ...prev,
      weeklyHours: {
        ...prev.weeklyHours,
        [day]: {
          ...prev.weeklyHours[day],
          [field]: value
        }
      }
    }));
  };

  // 정기휴무 토글
  const toggleRegularClosedDay = (day) => {
    setBusinessData(prev => {
      const newRegularClosedDays = prev.regularClosedDays.includes(day)
        ? prev.regularClosedDays.filter(d => d !== day)
        : [...prev.regularClosedDays, day];
      
      return {
        ...prev,
        regularClosedDays: newRegularClosedDays
      };
    });
  };

  // 특정 휴무일 추가
  const addSpecificClosedDate = () => {
    const dateInput = document.getElementById('specificDate');
    const selectedDate = dateInput.value;
    
    if (!selectedDate) {
      alert('날짜를 선택해주세요.');
      return;
    }

    if (businessData.specificClosedDates.includes(selectedDate)) {
      alert('이미 추가된 휴무일입니다.');
      return;
    }

    setBusinessData(prev => ({
      ...prev,
      specificClosedDates: [...prev.specificClosedDates, selectedDate].sort()
    }));

    dateInput.value = '';
  };

  // 특정 휴무일 제거
  const removeSpecificClosedDate = (dateToRemove) => {
    setBusinessData(prev => ({
      ...prev,
      specificClosedDates: prev.specificClosedDates.filter(date => date !== dateToRemove)
    }));
  };

  // 긴급휴무 토글
  const toggleEmergencyClosed = () => {
    setBusinessData(prev => ({
      ...prev,
      isEmergencyClosed: !prev.isEmergencyClosed,
      emergencyCloseReason: !prev.isEmergencyClosed ? prev.emergencyCloseReason : ""
    }));
  };

  if (loading) {
    return (
      <div className="business-hours-loading">
        <div className="loading-spinner"></div>
        <p>영업시간 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="business-hours-container">
      <div className="business-hours-header">
        <h2>🕐 영업시간 관리</h2>
        <p>고객이 주문할 수 있는 영업시간을 설정합니다.</p>
      </div>

      {/* 긴급 휴무 설정 */}
      <div className="emergency-section">
        <div className="section-header">
          <h3>🚨 긴급 휴무</h3>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={businessData.isEmergencyClosed}
              onChange={toggleEmergencyClosed}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        
        {businessData.isEmergencyClosed && (
          <div className="emergency-reason">
            <label htmlFor="emergencyReason">휴무 사유:</label>
            <input
              id="emergencyReason"
              type="text"
              value={businessData.emergencyCloseReason}
              onChange={(e) => setBusinessData(prev => ({
                ...prev,
                emergencyCloseReason: e.target.value
              }))}
              placeholder="예: 재료 소진, 긴급상황 등"
            />
          </div>
        )}
      </div>

      {/* 요일별 영업시간 */}
      <div className="weekly-hours-section">
        <h3>📅 요일별 영업시간</h3>
        <div className="weekly-hours-grid">
          {Object.entries(dayNames).map(([dayKey, dayName]) => {
            const dayData = businessData.weeklyHours[dayKey];
            const isRegularClosed = businessData.regularClosedDays.includes(dayKey);
            
            return (
              <div key={dayKey} className="day-row">
                <div className="day-name">{dayName}</div>
                
                <div className="day-controls">
                  <label className="closed-checkbox">
                    <input
                      type="checkbox"
                      checked={isRegularClosed}
                      onChange={() => toggleRegularClosedDay(dayKey)}
                    />
                    정기휴무
                  </label>
                  
                  {!isRegularClosed && (
                    <>
                      <input
                        type="time"
                        value={dayData.open}
                        onChange={(e) => updateDayHours(dayKey, 'open', e.target.value)}
                      />
                      <span>~</span>
                      <input
                        type="time"
                        value={dayData.close}
                        onChange={(e) => updateDayHours(dayKey, 'close', e.target.value)}
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 특정 휴무일 */}
      <div className="specific-dates-section">
        <h3>📆 특정 휴무일</h3>
        <div className="date-input-row">
          <input
            id="specificDate"
            type="date"
            min={new Date().toISOString().split('T')[0]}
          />
          <button onClick={addSpecificClosedDate} className="add-date-btn">
            휴무일 추가
          </button>
        </div>
        
        {businessData.specificClosedDates.length > 0 && (
          <div className="closed-dates-list">
            {businessData.specificClosedDates.map(date => (
              <div key={date} className="closed-date-item">
                <span>{date}</span>
                <button 
                  onClick={() => removeSpecificClosedDate(date)}
                  className="remove-date-btn"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 연락처 정보 */}
      <div className="contact-section">
        <h3>📞 고객 연락처</h3>
        <div className="contact-input">
          <label htmlFor="contactPhone">영업시간 외 문의 전화:</label>
          <input
            id="contactPhone"
            type="tel"
            value={businessData.contactPhone}
            onChange={(e) => setBusinessData(prev => ({
              ...prev,
              contactPhone: e.target.value
            }))}
            placeholder="010-0000-0000"
          />
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="save-section">
        <button 
          onClick={saveBusinessHours}
          disabled={saving}
          className="save-btn"
        >
          {saving ? '저장 중...' : '💾 저장하기'}
        </button>
        
        {businessData.updatedAt && (
          <p className="last-updated">
            마지막 수정: {businessData.updatedAt.toLocaleString()} 
            ({businessData.updatedBy})
          </p>
        )}
      </div>
    </div>
  );
};

export default BusinessHoursManagement;