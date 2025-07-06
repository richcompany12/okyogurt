// src/components/gifticon/modals/QRScanModal.js
import React, { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

function QRScanModal({ 
  show, 
  onClose, 
  onScanResult,
  onManualSearch 
}) {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  
  const [mode, setMode] = useState('manual'); // 'manual' | 'camera'
  const [manualId, setManualId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [deviceId, setDeviceId] = useState(null);

  // QR 스캐너 초기화
  const initializeScanner = async () => {
    if (!videoRef.current) return;

    try {
      setError('');
      setLoading(true);

      // 기존 스캐너 정리
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }

      // ZXing 라이브러리 초기화
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      // 비디오 디바이스 목록 가져오기
      const videoInputDevices = await codeReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error('카메라를 찾을 수 없습니다.');
      }

      // 후면 카메라 우선 선택
      const rearCamera = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('환경')
      );
      
      const selectedDeviceId = rearCamera ? rearCamera.deviceId : videoInputDevices[0].deviceId;
      setDeviceId(selectedDeviceId);

      // 카메라 스트림 시작
      await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            handleQRScanResult(result.text);
          }
          
          if (error && error.name !== 'NotFoundException') {
            console.error('QR 스캔 오류:', error);
          }
        }
      );

      setIsScanning(true);
      setCameraActive(true);
      setLoading(false);
      console.log('✅ QR 스캐너 시작됨');

    } catch (error) {
      console.error('❌ QR 스캐너 초기화 실패:', error);
      setError(`카메라 오류: ${error.message}`);
      setLoading(false);
      setCameraActive(false);
    }
  };

  // QR 스캔 결과 처리
  const handleQRScanResult = async (data) => {
    const now = Date.now();
    
    // 중복 스캔 방지 (2초 내 같은 결과 무시)
    if (now - lastScanTime < 2000) {
      return;
    }
    setLastScanTime(now);

    console.log('🔍 QR 스캔 결과:', data);
    
    try {
      let gifticonId = null;

      // 1. URL 형태인지 확인 (고객용 URL)
      if (data.includes('/check/')) {
        const match = data.match(/\/check\/([^/?#]+)/);
        if (match) {
          gifticonId = match[1];
          console.log('📱 고객용 URL에서 ID 추출:', gifticonId);
        }
      }
      // 2. JSON 형태인지 확인 (기존 QR 코드)
      else if (data.startsWith('{')) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'gifticon' && parsed.id) {
            gifticonId = parsed.id;
            console.log('📋 JSON에서 ID 추출:', gifticonId);
          }
        } catch (e) {
          console.log('JSON 파싱 실패, 다른 형태 확인');
        }
      }
      // 3. 직접 기프티콘 ID인지 확인
      else if (data.match(/^GIFT-\d{8}-[A-Z0-9]{5}$/)) {
        gifticonId = data;
        console.log('🎯 직접 ID 인식:', gifticonId);
      }

      if (!gifticonId) {
        throw new Error('올바른 기프티콘 QR 코드가 아닙니다.');
      }

      // 스캐너 정지
      stopScanner();

      // 부모에게 스캔 결과 전달
      onScanResult(gifticonId);

    } catch (error) {
      console.error('❌ QR 스캔 처리 실패:', error);
      setError(error.message || 'QR 코드 처리에 실패했습니다.');
    }
  };

  // 카메라 시작
  const startCamera = async () => {
    await initializeScanner();
  };

  // 카메라 중지
  const stopCamera = () => {
    stopScanner();
  };

  // 스캐너 정지
  const stopScanner = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      setIsScanning(false);
      setCameraActive(false);
      console.log('⏹️ QR 스캐너 정지됨');
    }
  };

  // 카메라 전환
  const switchCamera = async () => {
    if (!codeReaderRef.current) return;

    try {
      const videoInputDevices = await codeReaderRef.current.listVideoInputDevices();
      
      if (videoInputDevices.length > 1) {
        const currentIndex = videoInputDevices.findIndex(device => device.deviceId === deviceId);
        const nextIndex = (currentIndex + 1) % videoInputDevices.length;
        const nextDeviceId = videoInputDevices[nextIndex].deviceId;
        
        stopScanner();
        setDeviceId(nextDeviceId);
        
        setTimeout(() => {
          initializeScanner();
        }, 500);
      }
    } catch (err) {
      console.error('카메라 전환 오류:', err);
      setError('카메라를 전환할 수 없습니다.');
    }
  };

  // 수동 검색
  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!manualId.trim()) {
      setError('기프티콘 번호를 입력해주세요.');
      return;
    }
    onManualSearch(manualId.trim());
  };

  // 컴포넌트 언마운트 시 카메라 정리
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // 모달 닫힐 때 카메라 정리
  useEffect(() => {
    if (!show) {
      stopScanner();
      setError('');
      setManualId('');
    }
  }, [show]);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: 0, color: '#333' }}>
            📱 QR 스캔
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#999'
            }}
          >
            ✕
          </button>
        </div>

        {/* 스캔 모드 선택 */}
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
              
              {/* 스캔 가이드 오버레이 */}
              {isScanning && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '200px',
                  height: '200px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  pointerEvents: 'none'
                }}>
                  {/* 코너 가이드 */}
                  <div style={{
                    position: 'absolute',
                    top: '-3px',
                    left: '-3px',
                    width: '30px',
                    height: '30px',
                    border: '3px solid #00ff88',
                    borderRight: 'none',
                    borderBottom: 'none'
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    width: '30px',
                    height: '30px',
                    border: '3px solid #00ff88',
                    borderLeft: 'none',
                    borderBottom: 'none'
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: '-3px',
                    left: '-3px',
                    width: '30px',
                    height: '30px',
                    border: '3px solid #00ff88',
                    borderRight: 'none',
                    borderTop: 'none'
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: '-3px',
                    right: '-3px',
                    width: '30px',
                    height: '30px',
                    border: '3px solid #00ff88',
                    borderLeft: 'none',
                    borderTop: 'none'
                  }} />
                </div>
              )}
              
              {/* 로딩 오버레이 */}
              {loading && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '18px'
                }}>
                  <div>
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
                    처리 중...
                  </div>
                </div>
              )}

              {/* 스캔 상태 표시 */}
              {!isScanning && !loading && cameraActive === false && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '16px'
                }}>
                  카메라 정지됨
                </div>
              )}
            </div>
            
            {/* 스캔 상태 */}
            <div style={{
              background: isScanning ? '#d4edda' : '#fff3cd',
              border: `1px solid ${isScanning ? '#c3e6cb' : '#ffeaa7'}`,
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '20px',
              color: isScanning ? '#155724' : '#856404',
              fontSize: '14px'
            }}>
              {isScanning ? (
                <>✅ 스캔 대기 중... QR 코드를 카메라에 비춰주세요</>
              ) : (
                <>⏸️ 카메라가 정지되었습니다</>
              )}
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '10px'
            }}>
              <button
                onClick={cameraActive ? stopCamera : startCamera}
                disabled={loading}
                style={{
                  padding: '12px',
                  background: loading ? '#ccc' : (cameraActive ? '#e74c3c' : '#667eea'),
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {cameraActive ? '📷 카메라 끄기' : '📷 카메라 켜기'}
              </button>
              
              {cameraActive && (
                <button
                  onClick={switchCamera}
                  disabled={loading}
                  style={{
                    padding: '12px',
                    background: loading ? '#ccc' : '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  🔄 카메라 전환
                </button>
              )}
            </div>
            
            <p style={{ color: '#666', fontSize: '14px', marginTop: '15px' }}>
              📱 QR 코드를 화면 중앙의 박스 안에 맞춰주세요. 자동으로 인식됩니다.
            </p>
          </div>
        )}

        {/* 오류 메시지 */}
        {error && (
          <div style={{
            background: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '8px',
            padding: '15px',
            marginTop: '20px',
            color: '#721c24'
          }}>
            ❌ {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default QRScanModal;