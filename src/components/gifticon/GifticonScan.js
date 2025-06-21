// src/components/GifticonScan.js
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { GifticonService } from '../../services/gifticonService';
import { GifticonUtils } from '../../utils/gifticonUtils';

function GifticonScan({ onBack }) {
  const { currentUser } = useAuth();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [mode, setMode] = useState('manual'); // 'manual' | 'camera'
  const [manualId, setManualId] = useState('');
  const [gifticon, setGifticon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [usageForm, setUsageForm] = useState({
    usedAmount: '',
    memo: '',
    location: '매장',
    paymentMethod: '현금+기프티콘'
  });
  const [processingUsage, setProcessingUsage] = useState(false);
  const [usageResult, setUsageResult] = useState(null);

  // 카메라 시작
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // 후면 카메라 우선
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setError('');
      }
    } catch (error) {
      console.error('카메라 시작 오류:', error);
      setError('카메라에 접근할 수 없습니다. 브라우저 권한을 확인해주세요.');
    }
  };

  // 카메라 중지
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  // QR 코드 스캔 (간단한 예시 - 실제로는 라이브러리 필요)
  const scanQRCode = () => {
    // 실제 구현에서는 qr-scanner 라이브러리 등을 사용
    // 여기서는 시뮬레이션용 코드
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (canvas && video) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      // 실제로는 여기서 QR 코드를 디코딩
      setError('QR 스캔 기능은 개발 중입니다. 수동 입력을 사용해주세요.');
    }
  };

  // 기프티콘 조회
  const searchGifticon = async (gifticonId) => {
    try {
      setLoading(true);
      setError('');
      setGifticon(null);
      
      const data = await GifticonService.getGifticon(gifticonId);
      
      if (!data) {
        setError('기프티콘을 찾을 수 없습니다. 번호를 확인해주세요.');
        return;
      }
      
      setGifticon(data);
      setUsageForm(prev => ({
        ...prev,
        usedAmount: data.remainingAmount?.toString() || data.amount?.toString() || ''
      }));
      
      console.log('✅ 기프티콘 조회 성공:', data);
    } catch (error) {
      console.error('❌ 기프티콘 조회 오류:', error);
      setError('기프티콘 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 수동 검색
  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!manualId.trim()) {
      setError('기프티콘 번호를 입력해주세요.');
      return;
    }
    searchGifticon(manualId.trim());
  };

  // 사용 처리
  const handleUseGifticon = async (e) => {
    e.preventDefault();
    
    if (!gifticon) {
      setError('기프티콘을 먼저 조회해주세요.');
      return;
    }
    
    const usedAmount = parseInt(usageForm.usedAmount);
    
    if (!usedAmount || usedAmount <= 0) {
      setError('올바른 사용 금액을 입력해주세요.');
      return;
    }
    
    if (usedAmount > (gifticon.remainingAmount || gifticon.amount)) {
      setError('사용 금액이 잔액보다 큽니다.');
      return;
    }
    
    try {
      setProcessingUsage(true);
      setError('');
      
      const usageData = {
        usedAmount: usedAmount,
        usedBy: currentUser.uid,
        usedByEmail: currentUser.email,
        memo: usageForm.memo.trim(),
        location: usageForm.location,
        paymentMethod: usageForm.paymentMethod
      };
      
      const result = await GifticonService.processGifticonUsage(gifticon.id, usageData);
      
      setUsageResult(result);
      
      // 기프티콘 정보 업데이트
      const updatedGifticon = {
        ...gifticon,
        remainingAmount: result.remainingAmount,
        totalUsed: (gifticon.totalUsed || 0) + usedAmount,
        usageCount: (gifticon.usageCount || 0) + 1,
        status: result.isFullyUsed ? 'used' : 'active'
      };
      setGifticon(updatedGifticon);
      
      console.log('✅ 기프티콘 사용 처리 완료:', result);
      
    } catch (error) {
      console.error('❌ 기프티콘 사용 처리 오류:', error);
      setError(error.message || '사용 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingUsage(false);
    }
  };

  // 새로운 스캔
  const handleNewScan = () => {
    setGifticon(null);
    setUsageResult(null);
    setManualId('');
    setError('');
    setUsageForm({
      usedAmount: '',
      memo: '',
      location: '매장',
      paymentMethod: '현금+기프티콘'
    });
  };

  // 컴포넌트 언마운트 시 카메라 정리
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // 사용 완료 화면
  if (usageResult) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          background: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '12px',
          padding: '30px',
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
          <h2 style={{ color: '#155724', marginBottom: '15px' }}>
            기프티콘 사용 완료!
          </h2>
          <div style={{ color: '#155724', fontSize: '18px' }}>
            <div><strong>사용 금액:</strong> {GifticonUtils.formatAmount(usageResult.usedAmount)}</div>
            <div><strong>남은 잔액:</strong> {GifticonUtils.formatAmount(usageResult.remainingAmount)}</div>
            {usageResult.isFullyUsed && (
              <div style={{ marginTop: '10px', fontWeight: 'bold' }}>
                🎯 기프티콘이 완전히 사용되었습니다!
              </div>
            )}
          </div>
        </div>

        {gifticon && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>📋 기프티콘 정보</h3>
            <div style={{ display: 'grid', gap: '10px', color: '#666' }}>
              <div><strong>번호:</strong> {gifticon.id}</div>
              <div><strong>구매자:</strong> {gifticon.purchaserName}</div>
              <div><strong>원래 금액:</strong> {GifticonUtils.formatAmount(gifticon.amount)}</div>
              <div><strong>총 사용 금액:</strong> {GifticonUtils.formatAmount(gifticon.totalUsed || 0)}</div>
              <div><strong>사용 횟수:</strong> {gifticon.usageCount || 0}회</div>
              <div><strong>현재 상태:</strong> 
                <span style={{
                  marginLeft: '10px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: usageResult.isFullyUsed ? '#e74c3c' : '#27ae60',
                  color: 'white',
                  fontSize: '12px'
                }}>
                  {usageResult.isFullyUsed ? '사용완료' : '사용가능'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px'
        }}>
          <button
            onClick={handleNewScan}
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
            📱 새로운 스캔
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
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>📱 QR 스캔/사용 처리</h2>
          <p style={{ margin: '0', color: '#666' }}>기프티콘을 스캔하거나 수동으로 입력하여 사용 처리합니다.</p>
        </div>
        <button
          onClick={onBack}
          style={{
            padding: '12px 20px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ← 돌아가기
        </button>
      </div>

      {/* 스캔 모드 선택 */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '25px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => {
              setMode('manual');
              stopCamera();
            }}
            style={{
              padding: '15px',
              background: mode === 'manual' ? '#667eea' : '#f8f9fa',
              color: mode === 'manual' ? 'white' : '#333',
              border: '2px solid',
              borderColor: mode === 'manual' ? '#667eea' : '#e9ecef',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ⌨️ 수동 입력
          </button>
          <button
            onClick={() => {
              setMode('camera');
              if (!cameraActive) startCamera();
            }}
            style={{
              padding: '15px',
              background: mode === 'camera' ? '#667eea' : '#f8f9fa',
              color: mode === 'camera' ? 'white' : '#333',
              border: '2px solid',
              borderColor: mode === 'camera' ? '#667eea' : '#e9ecef',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            📷 카메라 스캔
          </button>
        </div>

        {/* 수동 입력 모드 */}
        {mode === 'manual' && (
          <form onSubmit={handleManualSearch}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                🎁 기프티콘 번호
              </label>
              <input
                type="text"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="GIFT-20250619-XXXXX"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace'
                }}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              {loading ? '검색 중...' : '🔍 기프티콘 검색'}
            </button>
          </form>
        )}

        {/* 카메라 스캔 모드 */}
        {mode === 'camera' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              position: 'relative',
              display: 'inline-block',
              marginBottom: '20px'
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  height: '300px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  background: '#f8f9fa'
                }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              
              {cameraActive && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  border: '2px solid #667eea',
                  width: '200px',
                  height: '200px',
                  borderRadius: '8px'
                }}></div>
              )}
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px'
            }}>
              <button
                onClick={scanQRCode}
                disabled={!cameraActive}
                style={{
                  padding: '12px',
                  background: cameraActive ? '#27ae60' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: cameraActive ? 'pointer' : 'not-allowed',
                  fontSize: '16px'
                }}
              >
                📸 스캔하기
              </button>
              <button
                onClick={cameraActive ? stopCamera : startCamera}
                style={{
                  padding: '12px',
                  background: cameraActive ? '#e74c3c' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                {cameraActive ? '📷 카메라 끄기' : '📷 카메라 켜기'}
              </button>
            </div>
            
            <p style={{ color: '#666', fontSize: '14px', marginTop: '15px' }}>
              📱 QR 코드를 화면 중앙의 박스 안에 맞춰주세요
            </p>
          </div>
        )}
      </div>

      {/* 오류 메시지 */}
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

      {/* 기프티콘 정보 및 사용 처리 */}
      {gifticon && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '25px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>🎁 기프티콘 정보</h3>
          
          {/* 기프티콘 기본 정보 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px',
            padding: '20px',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div>
              <div><strong>번호:</strong> {gifticon.id}</div>
              <div><strong>구매자:</strong> {gifticon.purchaserName}</div>
              <div><strong>전화번호:</strong> {gifticon.purchaserPhone}</div>
            </div>
            <div>
              <div><strong>원래 금액:</strong> {GifticonUtils.formatAmount(gifticon.amount)}</div>
              <div><strong>현재 잔액:</strong> {GifticonUtils.formatAmount(gifticon.remainingAmount || gifticon.amount)}</div>
              <div><strong>사용 횟수:</strong> {gifticon.usageCount || 0}회</div>
            </div>
          </div>

          {/* 상태 확인 */}
          {gifticon.status !== 'active' || (gifticon.remainingAmount || gifticon.amount) <= 0 ? (
            <div style={{
              background: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              color: '#721c24'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>⚠️</div>
              <h4>이 기프티콘은 사용할 수 없습니다</h4>
              <p>
                {gifticon.expiresAt && gifticon.expiresAt.toDate() < new Date() 
                  ? '만료된 기프티콘입니다.' 
                  : '이미 모든 금액이 사용되었습니다.'}
              </p>
            </div>
          ) : (
            /* 사용 처리 폼 */
            <form onSubmit={handleUseGifticon}>
              <h4 style={{ margin: '0 0 20px 0', color: '#333' }}>💳 사용 처리</h4>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 'bold',
                    color: '#333'
                  }}>
                    💰 사용 금액 (원) *
                  </label>
                  <input
                    type="number"
                    value={usageForm.usedAmount}
                    onChange={(e) => setUsageForm(prev => ({
                      ...prev,
                      usedAmount: e.target.value
                    }))}
                    min="1"
                    max={gifticon.remainingAmount || gifticon.amount}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 'bold',
                    color: '#333'
                  }}>
                    📍 사용 장소
                  </label>
                  <select
                    value={usageForm.location}
                    onChange={(e) => setUsageForm(prev => ({
                      ...prev,
                      location: e.target.value
                    }))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="매장">매장</option>
                    <option value="온라인">온라인</option>
                    <option value="배달">배달</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 'bold',
                    color: '#333'
                  }}>
                    💳 결제 방식
                  </label>
                  <select
                    value={usageForm.paymentMethod}
                    onChange={(e) => setUsageForm(prev => ({
                      ...prev,
                      paymentMethod: e.target.value
                    }))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="현금+기프티콘">현금+기프티콘</option>
                    <option value="카드+기프티콘">카드+기프티콘</option>
                    <option value="기프티콘만">기프티콘만</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  📝 메모 (선택사항)
                </label>
                <textarea
                  value={usageForm.memo}
                  onChange={(e) => setUsageForm(prev => ({
                    ...prev,
                    memo: e.target.value
                  }))}
                  placeholder="추가 메모나 특이사항을 입력하세요."
                  rows="3"
                  maxLength="200"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={processingUsage}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: processingUsage ? '#ccc' : '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: processingUsage ? 'not-allowed' : 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              >
                {processingUsage ? '처리 중...' : '💳 사용 처리하기'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default GifticonScan;