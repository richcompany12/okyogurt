// src/components/ClosedNotice.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ClosedNotice.css';

const ClosedNotice = ({ 
  reason = '영업시간이 아닙니다', 
  nextOpenTime = '내일 오전 9시', 
  contactPhone = '01081771258',
  storeName = '요거트퍼플'
}) => {
  const navigate = useNavigate();

  // 전화걸기 함수
  const handleCall = () => {
    window.location.href = `tel:${contactPhone}`;
  };

  // 홈으로 이동
  const goHome = () => {
    navigate('/');
  };

  // 새로고침 (영업시간 재확인)
  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <div className="closed-notice-container">
      <div className="closed-notice-content">
        
        {/* 아이콘 및 메인 메시지 */}
        <div className="closed-icon">
          <div className="clock-icon">🕐</div>
          <div className="closed-badge">CLOSED</div>
        </div>

        <div className="closed-main-message">
          <h1>현재 영업시간이 아닙니다</h1>
          <p className="store-name">{storeName}</p>
        </div>

        {/* 상세 정보 */}
        <div className="closed-details">
          <div className="detail-item">
            <div className="detail-icon">📋</div>
            <div className="detail-content">
              <h3>휴무 사유</h3>
              <p>{reason}</p>
            </div>
          </div>

          <div className="detail-item">
            <div className="detail-icon">⏰</div>
            <div className="detail-content">
              <h3>다음 영업 시간</h3>
              <p className="next-open-time">{nextOpenTime}</p>
            </div>
          </div>

          <div className="detail-item">
            <div className="detail-icon">📞</div>
            <div className="detail-content">
              <h3>긴급 문의</h3>
              <p>주문 관련 긴급 사항이 있으시면</p>
              <button className="call-button" onClick={handleCall}>
                {contactPhone} 📞
              </button>
            </div>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="notice-message">
          <div className="notice-box">
            <h4>💡 이용 안내</h4>
            <ul>
              <li>영업시간 내에만 주문이 가능합니다</li>
              <li>배달 서비스는 영업시간 1시간 전까지 접수됩니다</li>
              <li>긴급한 문의사항은 위 전화번호로 연락해주세요</li>
            </ul>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="action-buttons">
          <button className="refresh-button" onClick={refreshPage}>
            <span className="button-icon">🔄</span>
            새로고침
          </button>
          
          <button className="home-button" onClick={goHome}>
            <span className="button-icon">🏠</span>
            홈으로 이동
          </button>
        </div>

        {/* 푸터 정보 */}
        <div className="closed-footer">
          <p>평소 이용해주셔서 감사합니다 🙏</p>
          <p className="footer-brand">요거트퍼플 팀 일동</p>
        </div>

      </div>

      {/* 배경 애니메이션 */}
      <div className="background-animation">
        <div className="floating-shape shape-1">🍦</div>
        <div className="floating-shape shape-2">🌙</div>
        <div className="floating-shape shape-3">⭐</div>
        <div className="floating-shape shape-4">💫</div>
      </div>
    </div>
  );
};

export default ClosedNotice;