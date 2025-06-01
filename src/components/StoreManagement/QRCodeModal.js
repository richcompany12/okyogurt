// src/components/StoreManagement/QRCodeModal.js
import React from 'react';
import QRCode from 'react-qr-code';
import './QRCodeModal.css';

const QRCodeModal = ({ store, onClose }) => {
  if (!store) return null;

  // QR코드 URL 생성
  const generateQRCodeURL = (storeId) => {
    const baseURL = window.location.origin;
    return `${baseURL}/order/${storeId}`;
  };

  // QR코드 다운로드
  const downloadQRCode = () => {
    const svg = document.getElementById(`qr-${store.id}`);
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${store.name}_QR코드.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  // 인쇄하기
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="qr-modal" onClick={e => e.stopPropagation()}>
        <div className="qr-header">
          <h3>{store.name} QR코드</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="qr-content">
          <div className="qr-code-container">
            <QRCode 
              id={`qr-${store.id}`}
              value={generateQRCodeURL(store.id)}
              size={300}
              level="H"
              className="qr-code"
            />
          </div>
          
          <div className="store-info">
            <h4>{store.name}</h4>
            <p>{store.address}</p>
            <p>{store.phone}</p>
          </div>
          
          <div className="qr-url">
            <p>스캔하여 주문하세요!</p>
            <small>{generateQRCodeURL(store.id)}</small>
          </div>
          
          <div className="qr-actions">
            <button 
              className="btn btn-download"
              onClick={downloadQRCode}
            >
              📥 다운로드
            </button>
            <button 
              className="btn btn-print"
              onClick={handlePrint}
            >
              🖨️ 인쇄하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;