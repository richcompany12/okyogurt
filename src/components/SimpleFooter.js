// SimpleFooter.js
import React, { useState } from 'react';
import LegalModal from './LegalModal';
import '../styles/SimpleFooter.css';

function SimpleFooter() {
  const currentYear = new Date().getFullYear();
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  
  return (
    <>
      <div className="simple-footer">
        <p>
          © {currentYear} 요거트퍼플 | 개발 및 유지보수: 
          <a href="mailto:kso121258@gmail.com">리치컴퍼니</a>
          <button 
            className="legal-info-btn"
            onClick={() => setIsLegalModalOpen(true)}
            title="법적 정보"
          >
            ⓘ
          </button>
        </p>
      </div>
      
      {isLegalModalOpen && (
        <LegalModal onClose={() => setIsLegalModalOpen(false)} />
      )}
    </>
  );
}

export default SimpleFooter;