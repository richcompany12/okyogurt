// LegalModal.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/LegalModal.css';

function LegalModal({ onClose }) {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="legal-modal-backdrop" onClick={handleBackdropClick}>
      <div className="legal-modal">
        <div className="legal-modal-header">
          <h3>📋 법적 정보</h3>
          <button className="legal-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="legal-modal-content">
          <div className="legal-links">
            <Link 
              to="/terms" 
              className="legal-link"
              onClick={onClose}
            >
              📄 이용약관
            </Link>
            
            <Link 
              to="/privacy" 
              className="legal-link"
              onClick={onClose}
            >
              🔒 개인정보처리방침
            </Link>
            
            <Link 
              to="/refund" 
              className="legal-link"
              onClick={onClose}
            >
              💳 환불 및 교환 정책
            </Link>
            
            <Link 
              to="/company" 
              className="legal-link"
              onClick={onClose}
            >
              🏢 사업자 정보
            </Link>
          </div>
          
          <div className="company-info">
            <h4>🍦 요거트퍼플 동탄반송점</h4>
            <p>📞 031-5189-6586</p>
            <p>✉️ kso121258@gmail.com</p>
            <p>🏪 경기도 화성시 동탄지성로 321</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LegalModal;