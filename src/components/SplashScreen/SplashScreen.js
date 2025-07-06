// src/components/SplashScreen/SplashScreen.js
import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onComplete, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [shake, setShake] = useState(false);

  // 사운드 효과 함수들
  const playSound = (frequency, duration, type = 'sine') => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
      console.log('오디오 재생 실패:', e);
    }
  };

  const playWhooshSound = () => {
    playSound(800, 0.2, 'sawtooth');
    setTimeout(() => playSound(400, 0.1, 'sine'), 50);
  };

  const playTransformSound = () => {
    playSound(220, 0.3, 'square');
    setTimeout(() => playSound(440, 0.3, 'sine'), 100);
    setTimeout(() => playSound(880, 0.4, 'triangle'), 200);
  };

  const playImpactSound = () => {
    playSound(150, 0.5, 'square');
    setTimeout(() => playSound(300, 0.3, 'sawtooth'), 100);
    setTimeout(() => playSound(600, 0.2, 'sine'), 200);
  };

  useEffect(() => {
    // 사운드 이벤트 타이밍
    const soundTimers = [
      setTimeout(() => playWhooshSound(), 300),  // 첫 번째 이동
      setTimeout(() => playWhooshSound(), 800),  // 두 번째 이동  
      setTimeout(() => playWhooshSound(), 1300), // 세 번째 이동
      setTimeout(() => playTransformSound(), 1800), // 변신 사운드
      setTimeout(() => {
        playImpactSound();
        setShake(true);
        setTimeout(() => setShake(false), 300);
      }, 2500), // 경장하지 임팩트
    ];

    // 애니메이션 완료 후 페이드아웃
    const timer = setTimeout(() => {
      setIsVisible(false);
      
      // 페이드아웃 애니메이션 완료 후 onComplete 호출
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 500); // 페이드아웃 시간 0.5초
      
    }, duration);

    return () => {
      clearTimeout(timer);
      soundTimers.forEach(clearTimeout);
    };
  }, [duration, onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`splash-screen ${!isVisible ? 'fade-out' : ''} ${shake ? 'shake' : ''}`}>
      {/* 파티클 배경 효과 */}
      <div className="particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      {/* 글로우 효과 */}
      <div className="glow-effect"></div>

      {/* 은은한 요거트퍼플 배경 로고 */}
      <div className="background-logo">YP</div>

      {/* 메인 콘텐츠 */}
      <div className="splash-content">
        {/* 홍길동 스타일 로고 */}
        <div className="logo-container">
          <div className="logo-icon">
            <div className="custom-logo">
              {/* 홍길동 스타일 스쿠터 */}
              <div className="delivery-scooter">🛵</div>
              
              {/* 스쿠터 잔상들 */}
              <div className="scooter-trail trail-1">💨</div>
              <div className="scooter-trail trail-2">💨</div>
              <div className="scooter-trail trail-3">💨</div>
              
              {/* 속도 효과들 */}
              <div className="speed-effect speed-1"></div>
              <div className="speed-effect speed-2"></div>
              <div className="speed-effect speed-3"></div>
              
              {/* 번개 효과들 */}
              <div className="lightning lightning-1"></div>
              <div className="lightning lightning-2"></div>
              <div className="lightning lightning-3"></div>
              
              {/* 최종 로고 */}
              <div className="final-logo">
                <div className="logo-symbol"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 텍스트 애니메이션 */}
        <div className="text-line line1">요거트퍼플</div>
        <div className="text-line line2">제휴상점</div>
        <div className="text-line line3">무료배달 서비스</div>
        <div className="text-line line4">경장하지? 😎</div>
      </div>

      {/* 로딩 인디케이터 */}
      <div className="loading-indicator">
        <div className="loading-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;