// src/components/OrderManagement/AutoPrintToggle.js
import React from 'react';

function AutoPrintToggle({ autoPrintEnabled, onToggle }) {
  return (
    <div className="auto-print-control">
      <div className="toggle-wrapper">
        <label className="toggle-label">
          <span className="toggle-text">
            🖨️ 자동 프린트: {autoPrintEnabled ? 'ON' : 'OFF'}
          </span>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={autoPrintEnabled}
              onChange={(e) => {
                onToggle(e.target.checked);
                console.log('자동 프린트 설정:', e.target.checked ? 'ON' : 'OFF');
              }}
            />
            <span className="toggle-slider"></span>
          </div>
        </label>
      </div>
      <div className="toggle-description">
        {autoPrintEnabled ? 
          '새 주문이 들어오면 자동으로 프린트됩니다' : 
          '수동으로 프린트 버튼을 눌러주세요'
        }
      </div>
    </div>
  );
}

export default AutoPrintToggle;