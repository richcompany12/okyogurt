// src/components/common/Toast.js
import React, { useState, useEffect } from 'react';
import './Toast.css';

function Toast({ message, type = 'info', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 마운트 시 나타나기
    setIsVisible(true);
    
    // 자동 사라지기
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // 애니메이션 완료 후 제거
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className={`toast toast-${type} ${isVisible ? 'toast-show' : 'toast-hide'}`}>
      <span className="toast-icon">{getIcon()}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={() => setIsVisible(false)}>
        ✕
      </button>
    </div>
  );
}

// 토스트 컨테이너
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

export { Toast, ToastContainer };