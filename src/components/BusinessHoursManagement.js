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
  const [showCalendar, setShowCalendar] = useState(false);
  
  // 기본 영업시간 데이터 - 긴급휴무 기본값을 false로 명시적 설정
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
    isEmergencyClosed: false, // 명시적으로 false 설정
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

  // 자동 리셋 기능이 포함된 데이터 로드
  useEffect(() => {
    loadBusinessHours();
  }, []);

  // 🕛 실시간 자동 리셋 체크 (매분마다)
  useEffect(() => {
    const checkMidnightReset = async () => {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes(); // 분 단위로 변환
      
      // 자정(00:00) 체크 - 정확히 00:00 또는 00:01 사이
      if (currentTime <= 1 && businessData.isEmergencyClosed) {
        console.log('🕛 자정 도달! 긴급휴무 자동 리셋 실행');
        
        try {
          const dataToSave = {
            ...businessData,
            isEmergencyClosed: false,
            emergencyCloseReason: "",
            lastEmergencyDate: null,
            updatedAt: new Date(),
            autoResetAt: new Date(),
            updatedBy: "system_auto_reset"
          };

          const docRef = doc(db, 'business_hours', 'main');
          await updateDoc(docRef, dataToSave);
          
          setBusinessData(prev => ({
            ...prev,
            isEmergencyClosed: false,
            emergencyCloseReason: "",
            lastEmergencyDate: null,
            autoResetAt: new Date()
          }));
          
          // 사용자에게 알림 (선택적)
          if (window.confirm('🌅 새로운 하루가 시작되었습니다!\n긴급휴무가 자동으로 해제되었습니다.')) {
            console.log('👍 사용자가 자동 리셋을 확인했습니다');
          }
        } catch (error) {
          console.error('❌ 자동 리셋 저장 오류:', error);
        }
      }
    };

    // 1분마다 체크
    const interval = setInterval(checkMidnightReset, 60000);
    
    // 컴포넌트 언마운트 시 정리
    return () => clearInterval(interval);
  }, [businessData.isEmergencyClosed]);

  // Firebase에서 영업시간 데이터 로드
  const loadBusinessHours = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'business_hours', 'main');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // 기존 데이터가 있으면 로드
        const data = docSnap.data();
        console.log('🔍 로드된 데이터:', data);
        
        // 🕛 자동 리셋 로직: 날짜가 바뀌었는지 확인
        const lastUpdateDate = data.lastEmergencyDate;
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        let shouldResetEmergency = false;
        if (data.isEmergencyClosed && lastUpdateDate && lastUpdateDate !== today) {
          shouldResetEmergency = true;
          console.log('🌅 새로운 날! 긴급휴무 자동 리셋:', lastUpdateDate, '->', today);
        }
        
        setBusinessData({
          ...businessData,
          ...data,
          // 날짜가 바뀌었으면 긴급휴무 자동 리셋
          isEmergencyClosed: shouldResetEmergency ? false : (data.isEmergencyClosed === true),
          emergencyCloseReason: shouldResetEmergency ? "" : data.emergencyCloseReason,
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastEmergencyDate: shouldResetEmergency ? null : data.lastEmergencyDate
        });
        
        // 자동 리셋이 발생했으면 저장
        if (shouldResetEmergency) {
          const resetData = {
            ...data,
            isEmergencyClosed: false,
            emergencyCloseReason: "",
            lastEmergencyDate: null,
            updatedAt: new Date(),
            autoResetAt: new Date(),
            updatedBy: "system_auto_reset"
          };
          await updateDoc(docRef, resetData);
          console.log('✅ 긴급휴무 자동 리셋 완료 및 저장');
        }
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
        updatedBy: currentUser?.email || "",
        // 긴급휴무 설정 시 날짜 기록
        lastEmergencyDate: businessData.isEmergencyClosed 
          ? new Date().toISOString().split('T')[0] 
          : businessData.lastEmergencyDate
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

  // 개선된 긴급휴무 토글 (날짜 추적 포함)
  const toggleEmergencyClosed = () => {
    const newStatus = !businessData.isEmergencyClosed;
    const today = new Date().toISOString().split('T')[0];
    
    console.log('🔄 긴급휴무 토글:', businessData.isEmergencyClosed, '->', newStatus);
    
    setBusinessData(prev => ({
      ...prev,
      isEmergencyClosed: newStatus,
      emergencyCloseReason: newStatus ? prev.emergencyCloseReason : "",
      // 긴급휴무 설정 시 오늘 날짜 기록 (자동 리셋용)
      lastEmergencyDate: newStatus ? today : null
    }));
  };

  // 캘린더 뷰용 휴무일 데이터 생성 (날짜 계산 오류 수정)
  const getCalendarData = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // 이번 달 캘린더 데이터
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const calendarDays = [];
    for (let day = 1; day <= daysInMonth; day++) {
      // 🔧 날짜 계산 수정: 로컬 시간대 기준으로 정확한 날짜 생성
      const date = new Date(currentYear, currentMonth, day);
      
      // 🔧 날짜 문자열 생성 시 시간대 오류 방지
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const dayStr = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${dayStr}`;
      
      const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
      
      const isSpecificClosed = businessData.specificClosedDates.includes(dateString);
      const isRegularClosed = businessData.regularClosedDays.includes(dayKey);
      const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
      
      console.log(`날짜 체크: ${day}일 -> ${dateString}, 특별휴무: ${isSpecificClosed}`);
      
      calendarDays.push({
        day,
        dateString,
        dayKey,
        isSpecificClosed,
        isRegularClosed,
        isToday,
        isClosed: isSpecificClosed || isRegularClosed
      });
    }
    
    return { calendarDays, currentMonth, currentYear };
  };

  if (loading) {
    return (
      <div className="business-hours-loading">
        <div className="loading-spinner"></div>
        <p>영업시간 정보를 불러오는 중...</p>
      </div>
    );
  }

  const { calendarDays, currentMonth, currentYear } = getCalendarData();

  return (
    <div className="business-hours-container">
      <div className="business-hours-header">
        <h2>🕐 영업시간 관리</h2>
        <p>고객이 주문할 수 있는 영업시간을 설정합니다.</p>
      </div>

      {/* 개선된 긴급 휴무 섹션 */}
      <div className="emergency-section">
        <div className="section-header">
          <h3>🚨 긴급 휴무</h3>
          
          {/* 개선된 토글 UI */}
          <div className="improved-toggle-container">
            <span className={`toggle-label ${!businessData.isEmergencyClosed ? 'active' : ''}`}>
              ✅ 정상영업
            </span>
            
            <label className="improved-toggle-switch">
              <input
                type="checkbox"
                checked={businessData.isEmergencyClosed}
                onChange={toggleEmergencyClosed}
              />
              <span className={`improved-toggle-slider ${businessData.isEmergencyClosed ? 'emergency' : 'normal'}`}></span>
            </label>
            
            <span className={`toggle-label ${businessData.isEmergencyClosed ? 'active' : ''}`}>
              ❌ 긴급휴무
            </span>
          </div>
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
            <div className="auto-reset-notice">
              <p>⏰ <strong>자동 리셋 안내:</strong> 오늘 밤 12시(00:00)가 되면 긴급휴무가 자동으로 해제되어 정상 영업시간으로 돌아갑니다.</p>
            </div>
          </div>
        )}
      </div>

      {/* 캘린더 뷰 토글 버튼 */}
      <div className="calendar-toggle-section">
        <button 
          className="calendar-toggle-btn"
          onClick={() => setShowCalendar(!showCalendar)}
        >
          📅 {showCalendar ? '캘린더 숨기기' : '휴무일 캘린더 보기'}
        </button>
      </div>

      {/* 캘린더 뷰 */}
      {showCalendar && (
        <div className="calendar-section">
          <h3>📅 {currentYear}년 {currentMonth + 1}월 휴무일 캘린더</h3>
          
          <div className="calendar-grid">
            <div className="calendar-header">
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                <div key={day} className="calendar-day-header">{day}</div>
              ))}
            </div>
            
            <div className="calendar-body">
              {/* 빈 칸들 (첫째 주 시작 전) */}
              {Array.from({ length: new Date(currentYear, currentMonth, 1).getDay() }, (_, i) => (
                <div key={`empty-${i}`} className="calendar-day empty"></div>
              ))}
              
              {/* 실제 날짜들 */}
              {calendarDays.map(({ day, isClosed, isToday, isSpecificClosed, isRegularClosed }) => (
                <div
                  key={day}
                  className={`calendar-day ${
                    isToday ? 'today' : 
                    isClosed ? (isSpecificClosed ? 'specific-closed' : 'regular-closed') : 'open'
                  }`}
                >
                  <div className="day-number">{day}</div>
                  {isClosed && (
                    <div className="day-status">
                      {isSpecificClosed ? '특별휴무' : '정기휴무'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="calendar-legend">
            <div className="legend-item">
              <div className="legend-color open"></div>
              <span>영업일</span>
            </div>
            <div className="legend-item">
              <div className="legend-color regular-closed"></div>
              <span>정기휴무</span>
            </div>
            <div className="legend-item">
              <div className="legend-color specific-closed"></div>
              <span>특별휴무</span>
            </div>
          </div>
        </div>
      )}

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