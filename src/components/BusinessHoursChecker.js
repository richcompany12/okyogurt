// src/components/BusinessHoursChecker.js
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// 영업시간 체크 커스텀 훅
export const useBusinessHours = () => {
  const [businessStatus, setBusinessStatus] = useState({
    isOpen: true,          // 영업 중 여부
    isLoading: true,       // 로딩 상태
    reason: '',            // 닫힌 이유
    nextOpenTime: null,    // 다음 영업 시간
    contactPhone: ''       // 연락처
  });

  useEffect(() => {
    checkBusinessHours();
    
    // 🕛 자동 리셋 체크 - 1분마다 실행
    const interval = setInterval(checkMidnightReset, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // 🕛 자정 자동 리셋 체크 함수
  const checkMidnightReset = async () => {
    try {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes(); // 분 단위로 변환
      
      // 자정(00:00) 체크 - 정확히 00:00 또는 00:01 사이
      if (currentTime <= 1) {
        console.log('🕛 자정 체크 시작...');
        
        const docRef = doc(db, 'business_hours', 'main');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const today = new Date().toISOString().split('T')[0];
          
          // 긴급휴무 상태이고 날짜가 바뀌었으면 리셋
          if (data.isEmergencyClosed && data.lastEmergencyDate && data.lastEmergencyDate !== today) {
            console.log('🌅 새로운 날! 긴급휴무 자동 리셋 실행:', data.lastEmergencyDate, '->', today);
            
            await updateDoc(docRef, {
              isEmergencyClosed: false,
              emergencyCloseReason: "",
              lastEmergencyDate: null,
              autoResetAt: new Date(),
              updatedAt: new Date(),
              updatedBy: "system_auto_reset"
            });
            
            console.log('✅ 긴급휴무 자동 리셋 완료');
            
            // 상태 업데이트하여 즉시 반영
            checkBusinessHours();
          }
        }
      }
    } catch (error) {
      console.error('❌ 자동 리셋 체크 오류:', error);
    }
  };

  const checkBusinessHours = async () => {
    try {
      // Firebase에서 영업시간 데이터 가져오기
      const docRef = doc(db, 'business_hours', 'main');
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // 영업시간 데이터가 없으면 기본적으로 열림
        setBusinessStatus({
          isOpen: true,
          isLoading: false,
          reason: '',
          nextOpenTime: null,
          contactPhone: '01081771258'
        });
        return;
      }

      const data = docSnap.data();
      const now = new Date();
      
      // 🌅 앱 시작 시 날짜 체크 및 자동 리셋
      const today = new Date().toISOString().split('T')[0];
      if (data.isEmergencyClosed && data.lastEmergencyDate && data.lastEmergencyDate !== today) {
        console.log('🌅 앱 시작 시 날짜 변경 감지! 긴급휴무 자동 리셋:', data.lastEmergencyDate, '->', today);
        
        await updateDoc(docRef, {
          isEmergencyClosed: false,
          emergencyCloseReason: "",
          lastEmergencyDate: null,
          autoResetAt: new Date(),
          updatedAt: new Date(),
          updatedBy: "system_auto_reset"
        });
        
        // 리셋된 데이터로 다시 체크
        const updatedDocSnap = await getDoc(docRef);
        const updatedData = updatedDocSnap.data();
        data.isEmergencyClosed = false;
        data.emergencyCloseReason = "";
        
        console.log('✅ 앱 시작 시 자동 리셋 완료');
      }
      
      // 현재 시간 정보
      const currentDay = getCurrentDayKey(now);
      const currentTime = getCurrentTimeString(now);
      const currentDateString = getCurrentDateString(now);

      console.log('=== 영업시간 체크 ===');
      console.log('현재 요일:', currentDay);
      console.log('현재 시간:', currentTime);
      console.log('현재 날짜:', currentDateString);

      // 1. 긴급 휴무 체크
      if (data.isEmergencyClosed) {
        setBusinessStatus({
          isOpen: false,
          isLoading: false,
          reason: `긴급 휴무: ${data.emergencyCloseReason || '긴급상황으로 인한 휴무'}`,
          nextOpenTime: '영업 재개시까지',
          contactPhone: data.contactPhone || '01081771258'
        });
        return;
      }

      // 2. 특정 휴무일 체크
      if (data.specificClosedDates && data.specificClosedDates.includes(currentDateString)) {
        const nextOpenTime = getNextOpenTime(data, now);
        setBusinessStatus({
          isOpen: false,
          isLoading: false,
          reason: '특별 휴무일',
          nextOpenTime: nextOpenTime,
          contactPhone: data.contactPhone || '01081771258'
        });
        return;
      }

      // 3. 정기 휴무일 체크
      if (data.regularClosedDays && data.regularClosedDays.includes(currentDay)) {
        const nextOpenTime = getNextOpenTime(data, now);
        setBusinessStatus({
          isOpen: false,
          isLoading: false,
          reason: '정기 휴무일',
          nextOpenTime: nextOpenTime,
          contactPhone: data.contactPhone || '01081771258'
        });
        return;
      }

      // 4. 영업시간 체크
      const todayHours = data.weeklyHours?.[currentDay];
      if (!todayHours) {
        // 요일 정보가 없으면 기본적으로 열림
        setBusinessStatus({
          isOpen: true,
          isLoading: false,
          reason: '',
          nextOpenTime: null,
          contactPhone: data.contactPhone || '01081771258'
        });
        return;
      }

      // 영업시간 내인지 체크
      const isWithinHours = isTimeWithinBusinessHours(currentTime, todayHours.open, todayHours.close);
      
      if (isWithinHours) {
        // 영업 중
        setBusinessStatus({
          isOpen: true,
          isLoading: false,
          reason: '',
          nextOpenTime: null,
          contactPhone: data.contactPhone || '01081771258'
        });
      } else {
        // 영업시간 외
        const nextOpenTime = getNextOpenTime(data, now);
        setBusinessStatus({
          isOpen: false,
          isLoading: false,
          reason: `영업시간: ${todayHours.open} ~ ${todayHours.close}`,
          nextOpenTime: nextOpenTime,
          contactPhone: data.contactPhone || '01081771258'
        });
      }

    } catch (error) {
      console.error('영업시간 체크 오류:', error);
      // 오류시 기본적으로 열림 처리
      setBusinessStatus({
        isOpen: true,
        isLoading: false,
        reason: '',
        nextOpenTime: null,
        contactPhone: '01081771258'
      });
    }
  };

  return businessStatus;
};

// 현재 요일 키 반환 (monday, tuesday, ...)
const getCurrentDayKey = (date) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

// 현재 시간 문자열 반환 (HH:MM)
const getCurrentTimeString = (date) => {
  return date.toTimeString().slice(0, 5);
};

// 현재 날짜 문자열 반환 (YYYY-MM-DD)
const getCurrentDateString = (date) => {
  return date.toISOString().split('T')[0];
};

// 시간이 영업시간 내인지 체크
const isTimeWithinBusinessHours = (currentTime, openTime, closeTime) => {
  // 24시간 형식으로 비교
  const current = timeToMinutes(currentTime);
  const open = timeToMinutes(openTime);
  const close = timeToMinutes(closeTime);

  // 자정을 넘나드는 경우 처리 (예: 22:00 - 02:00)
  if (close < open) {
    return current >= open || current <= close;
  } else {
    return current >= open && current <= close;
  }
};

// 시간을 분으로 변환 (비교용)
const timeToMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// 다음 영업시간 계산
const getNextOpenTime = (businessData, currentDate) => {
  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDayIndex = currentDate.getDay();
  
  // 최대 7일까지 다음 영업일 찾기
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7;
    const nextDayKey = dayKeys[nextDayIndex];
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + i);
    const nextDateString = getCurrentDateString(nextDate);
    
    // 정기 휴무일 체크
    if (businessData.regularClosedDays && businessData.regularClosedDays.includes(nextDayKey)) {
      continue;
    }
    
    // 특정 휴무일 체크
    if (businessData.specificClosedDates && businessData.specificClosedDates.includes(nextDateString)) {
      continue;
    }
    
    // 영업시간 있는지 체크
    const dayHours = businessData.weeklyHours?.[nextDayKey];
    if (dayHours && dayHours.open) {
      const dayName = getDayName(nextDayKey);
      if (i === 1) {
        return `내일(${dayName}) ${dayHours.open}`;
      } else {
        return `${nextDate.getMonth() + 1}/${nextDate.getDate()}(${dayName}) ${dayHours.open}`;
      }
    }
  }
  
  return '영업일 확인 필요';
};

// 요일 한글명 반환
const getDayName = (dayKey) => {
  const dayNames = {
    monday: '월',
    tuesday: '화',
    wednesday: '수',
    thursday: '목',
    friday: '금',
    saturday: '토',
    sunday: '일'
  };
  return dayNames[dayKey] || '';
};

// 영업시간 체크 함수 (컴포넌트에서 직접 사용 가능)
export const checkBusinessStatus = async () => {
  try {
    const docRef = doc(db, 'business_hours', 'main');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { isOpen: true, reason: '', contactPhone: '01081771258' };
    }

    const data = docSnap.data();
    const now = new Date();
    
    // 🌅 날짜 체크 및 자동 리셋 (단발성 체크용)
    const today = new Date().toISOString().split('T')[0];
    if (data.isEmergencyClosed && data.lastEmergencyDate && data.lastEmergencyDate !== today) {
      console.log('🌅 단발성 체크 시 날짜 변경 감지! 긴급휴무 자동 리셋');
      
      await updateDoc(docRef, {
        isEmergencyClosed: false,
        emergencyCloseReason: "",
        lastEmergencyDate: null,
        autoResetAt: new Date(),
        updatedAt: new Date(),
        updatedBy: "system_auto_reset"
      });
      
      // 리셋 후 데이터 업데이트
      data.isEmergencyClosed = false;
      data.emergencyCloseReason = "";
    }
    
    const currentDay = getCurrentDayKey(now);
    const currentTime = getCurrentTimeString(now);
    const currentDateString = getCurrentDateString(now);

    // 긴급 휴무
    if (data.isEmergencyClosed) {
      return {
        isOpen: false,
        reason: `긴급 휴무: ${data.emergencyCloseReason || '긴급상황'}`,
        contactPhone: data.contactPhone || '01081771258'
      };
    }

    // 특정/정기 휴무일
    if ((data.specificClosedDates && data.specificClosedDates.includes(currentDateString)) ||
        (data.regularClosedDays && data.regularClosedDays.includes(currentDay))) {
      return {
        isOpen: false,
        reason: '휴무일',
        contactPhone: data.contactPhone || '01081771258'
      };
    }

    // 영업시간 체크
    const todayHours = data.weeklyHours?.[currentDay];
    if (todayHours) {
      const isWithinHours = isTimeWithinBusinessHours(currentTime, todayHours.open, todayHours.close);
      return {
        isOpen: isWithinHours,
        reason: isWithinHours ? '' : `영업시간: ${todayHours.open} ~ ${todayHours.close}`,
        contactPhone: data.contactPhone || '01081771258'
      };
    }

    return { isOpen: true, reason: '', contactPhone: data.contactPhone || '01081771258' };

  } catch (error) {
    console.error('영업시간 체크 오류:', error);
    return { isOpen: true, reason: '', contactPhone: '01081771258' };
  }
};