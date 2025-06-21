// src/components/GifticonCreate.js
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { GifticonService } from '../../services/gifticonService';
import { GifticonUtils } from '../../utils/gifticonUtils';
import { QRUtils } from '../../utils/qrUtils';
import { Timestamp } from 'firebase/firestore';

function GifticonCreate({ onBack, onSuccess }) {
  const { currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    amount: '',
    purchaserName: '',
    purchaserPhone: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdGifticon, setCreatedGifticon] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 실시간 유효성 검사
    setError('');
  };

  const validateForm = () => {
    if (!formData.amount || !GifticonUtils.validateAmount(formData.amount)) {
      setError('올바른 금액을 입력해주세요. (1원 ~ 1,000,000원)');
      return false;
    }
    
    if (!formData.purchaserName.trim()) {
      setError('구매자 이름을 입력해주세요.');
      return false;
    }
    
    if (!formData.purchaserPhone || !GifticonUtils.validatePhoneNumber(formData.purchaserPhone)) {
      setError('올바른 전화번호를 입력해주세요. (010-XXXX-XXXX)');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // 1. 기프티콘 ID 생성
      const gifticonId = GifticonUtils.generateGifticonId();
      const createdAt = new Date();
      const expiresAt = GifticonUtils.calculateExpiryDate(createdAt);
      
      // 2. 보안 해시 생성 (에러 처리 추가)
      let securityHash;
      try {
        securityHash = await GifticonUtils.generateSecurityHash(
          gifticonId, 
          parseInt(formData.amount), 
          createdAt.toISOString()
        );
      } catch (hashError) {
        console.warn('해시 생성 실패, 기본값 사용:', hashError);
        securityHash = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // 3. 기프티콘 데이터 준비
      const gifticonData = {
        id: gifticonId,
        amount: parseInt(formData.amount),
        purchaserName: formData.purchaserName.trim(),
        purchaserPhone: GifticonUtils.formatPhoneNumber(formData.purchaserPhone),
        notes: formData.notes.trim(),
        createdBy: currentUser.uid,
        createdByEmail: currentUser.email,
        expiresAt: Timestamp.fromDate(expiresAt),
        securityHash: securityHash
      };
      
      // 4. Firestore에 저장
      const docId = await GifticonService.createGifticon(gifticonData);
      
      // 5. QR 코드 생성 (에러 처리 추가)
      let qrCodeDataURL;
      try {
        const qrData = GifticonUtils.generateQRData(gifticonId);
        qrCodeDataURL = await QRUtils.generateQRCode(qrData);
      } catch (qrError) {
        console.warn('QR 코드 생성 실패:', qrError);
        qrCodeDataURL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNjY2Ij5RUiDrr7nst5gg7JetPaC9!</text></svg>';
      }
      
      // 6. 성공 처리
      const finalGifticon = {
        ...gifticonData,
        docId: docId,
        createdAt: Timestamp.fromDate(createdAt)
      };
      
      setCreatedGifticon(finalGifticon);
      setQrCodeUrl(qrCodeDataURL);
      setSuccess(true);
      
      console.log('✅ 기프티콘 생성 완료:', gifticonId);
      
      if (onSuccess) {
        onSuccess(finalGifticon);
      }
      
    } catch (error) {
      console.error('❌ 기프티콘 생성 실패:', error);
      setError('기프티콘 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (qrCodeUrl && createdGifticon) {
      const link = QRUtils.createDownloadLink(
        qrCodeUrl, 
        `gifticon-${createdGifticon.id}.png`
      );
      link.click();
    }
  };

  const handlePrintQR = () => {
    if (qrCodeUrl && createdGifticon) {
      QRUtils.printQRCode(qrCodeUrl, {
        id: createdGifticon.id,
        amount: createdGifticon.amount,
        purchaserName: createdGifticon.purchaserName,
        expiresAt: createdGifticon.expiresAt.toDate()
      });
    }
  };

  const handleCreateAnother = () => {
    setFormData({
      amount: '',
      purchaserName: '',
      purchaserPhone: '',
      notes: ''
    });
    setSuccess(false);
    setCreatedGifticon(null);
    setQrCodeUrl('');
    setError('');
  };

  // 성공 화면
  if (success && createdGifticon) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          background: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#155724', marginBottom: '10px' }}>🎉 기프티콘 생성 완료!</h2>
          <p style={{ color: '#155724', margin: '0' }}>
            기프티콘 번호: <strong>{createdGifticon.id}</strong>
          </p>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '30px' }}>
            <img 
              src={qrCodeUrl} 
              alt="기프티콘 QR 코드" 
              style={{ 
                border: '2px solid #ddd',
                borderRadius: '8px',
                padding: '10px',
                background: 'white'
              }}
            />
          </div>

          <div style={{ marginBottom: '30px', textAlign: 'left' }}>
            <h3 style={{ marginBottom: '15px' }}>📋 기프티콘 정보</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div><strong>금액:</strong> {GifticonUtils.formatAmount(createdGifticon.amount)}</div>
              <div><strong>구매자:</strong> {createdGifticon.purchaserName}</div>
              <div><strong>전화번호:</strong> {createdGifticon.purchaserPhone}</div>
              <div><strong>유효기간:</strong> {GifticonUtils.formatDate(createdGifticon.expiresAt)}</div>
              {createdGifticon.notes && (
                <div><strong>메모:</strong> {createdGifticon.notes}</div>
              )}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
          }}>
            <button
              onClick={handleDownloadQR}
              style={{
                padding: '12px',
                background: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              💾 QR 다운로드
            </button>
            <button
              onClick={handlePrintQR}
              style={{
                padding: '12px',
                background: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🖨️ 프린트
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px'
          }}>
            <button
              onClick={handleCreateAnother}
              style={{
                padding: '15px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              🎁 새 기프티콘 생성
            </button>
            <button
              onClick={onBack}
              style={{
                padding: '15px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              📋 목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 생성 폼
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>🎁 기프티콘 생성</h2>
          <p style={{ margin: '0', color: '#666' }}>새로운 기프티콘을 생성합니다.</p>
        </div>

        {error && (
          <div style={{
            background: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
            color: '#721c24'
          }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              💰 금액 (원) *
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="예: 30000"
              min="1"
              max="1000000"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              required
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              1원 ~ 1,000,000원까지 입력 가능합니다.
            </small>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              👤 구매자 이름 *
            </label>
            <input
              type="text"
              name="purchaserName"
              value={formData.purchaserName}
              onChange={handleInputChange}
              placeholder="예: 홍길동"
              maxLength="20"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              📱 전화번호 *
            </label>
            <input
              type="tel"
              name="purchaserPhone"
              value={formData.purchaserPhone}
              onChange={handleInputChange}
              placeholder="예: 010-1234-5678"
              pattern="[0-9]{3}-[0-9]{4}-[0-9]{4}"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              required
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              010-0000-0000 형식으로 입력해주세요.
            </small>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              📝 메모 (선택사항)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="기프티콘에 대한 추가 정보나 메모를 입력하세요."
              rows="3"
              maxLength="200"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              최대 200자까지 입력 가능합니다.
            </small>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px'
          }}>
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              style={{
                padding: '15px',
                background: loading ? '#ccc' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              ← 돌아가기
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '15px',
                background: loading ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              {loading ? '생성 중...' : '🎁 기프티콘 생성'}
            </button>
          </div>
        </form>

        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>📌 안내사항</h4>
          <ul style={{ margin: '0', paddingLeft: '20px', color: '#6c757d', fontSize: '14px' }}>
            <li>생성된 기프티콘은 생성일로부터 1년간 유효합니다.</li>
            <li>QR 코드를 통해 매장에서 사용할 수 있습니다.</li>
            <li>부분 사용이 가능하며, 잔액은 계속 유지됩니다.</li>
            <li>분실 시 전화번호로 조회가 가능합니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default GifticonCreate;