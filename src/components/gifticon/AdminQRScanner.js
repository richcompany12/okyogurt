// src/components/AdminQRScanner.js
import React, { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { GifticonService } from '../../services/gifticonService';
import UsageModal from './modals/UsageModal';

function AdminQRScanner({ onBack }) {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedGifticon, setScannedGifticon] = useState(null);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(0);

  // QR 스캐너 초기화
  const initializeScanner = async () => {
    if (!videoRef.current) return;

    try {
      // 기존 스캐너 정리
      if (scannerRef.current) {
        scannerRef.current.destroy();
      }

      const scanner = new QrScanner(
        videoRef.current,
        (result) => handleScanResult(result.data),
        {
          onDecodeError: (error) => {
            // 스캔 에러는 무시 (계속 스캔 시도)
            console.log('스캔 시도 중...', error.message);
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment' // 후면 카메라 우선
        }
      );

      scannerRef.current = scanner;
      
      // 카메라 권한 확인
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        throw new Error('카메라를 찾을 수 없습니다.');
      }

      await scanner.start();
      setIsScanning(true);
      setError('');
      console.log('✅ QR 스캐너 시작됨');

    } catch (error) {
      console.error('❌ QR 스캐너 초기화 실패:', error);
      setError(`카메라 오류: ${error.message}`);
    }
  };

  // QR 스캔 결과 처리
  const handleScanResult = async (data) => {
    const now = Date.now();
    
    // 중복 스캔 방지 (2초 내 같은 결과 무시)
    if (now - lastScanTime < 2000) {
      return;
    }
    setLastScanTime(now);

    console.log('🔍 QR 스캔 결과:', data);
    
    try {
      setLoading(true);
      setError('');

      let gifticonId = null;

      // 1. URL 형태인지 확인
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

      // 기프티콘 정보 조회
      const gifticon = await GifticonService.getGifticon(gifticonId);
      
      if (!gifticon) {
        throw new Error('기프티콘을 찾을 수 없습니다.');
      }

      console.log('✅ 기프티콘 조회 성공:', gifticon);

      // 스캔 일시 정지
      if (scannerRef.current) {
        scannerRef.current.stop();
        setIsScanning(false);
      }

      // 사용처리 모달 열기
      setScannedGifticon(gifticon);
      setShowUsageModal(true);

    } catch (error) {
      console.error('❌ QR 스캔 처리 실패:', error);
      setError(error.message || 'QR 코드 처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 스캐너 시작/정지
  const toggleScanner = () => {
    if (isScanning) {
      stopScanner();
    } else {
      initializeScanner();
    }
  };

  // 스캐너 정지
  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      setIsScanning(false);
      console.log('⏹️ QR 스캐너 정지됨');
    }
  };

  // 사용처리 완료 후
  const handleUsageComplete = () => {
    setShowUsageModal(false);
    setScannedGifticon(null);
    
    // 스캔 재시작
    setTimeout(() => {
      initializeScanner();
    }, 1000);
  };

  // 사용처리 취소
  const handleUsageCancel = () => {
    setShowUsageModal(false);
    setScannedGifticon(null);
    
    // 스캔 재시작
    setTimeout(() => {
      initializeScanner();
    }, 500);
  };

  // 컴포넌트 마운트 시 스캐너 시작
  useEffect(() => {
    initializeScanner();

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (scannerRef.current) {
        scannerRef.current.destroy();
      }
    };
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* 헤더 */}
      <div style={{
        background: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
      }}>
        <button
          onClick={onBack}
          style={{
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 15px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← 뒤로가기
        </button>
        <h1 style={{ margin: '0', color: '#333', fontSize: '24px' }}>
          📱 QR 스캔 - 사용처리
        </h1>
      </div>

      {/* 메인 컨텐츠 */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        {/* 스캔 영역 */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📱</div>
            <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>QR 코드 스캔</h2>
            <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
              기프티콘 QR 코드를 카메라에 비춰주세요
            </p>
          </div>

          {/* 비디오 영역 */}
          <div style={{
            position: 'relative',
            maxWidth: '400px',
            margin: '0 auto 20px auto',
            borderRadius: '15px',
            overflow: 'hidden',
            background: '#000'
          }}>
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '300px',
                objectFit: 'cover'
              }}
            />
            
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
            {!isScanning && !loading && (
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

          {/* 에러 메시지 */}
          {error && (
            <div style={{
              background: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '20px',
              color: '#721c24',
              fontSize: '14px'
            }}>
              ❌ {error}
            </div>
          )}

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

          {/* 컨트롤 버튼 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px'
          }}>
            <button
              onClick={toggleScanner}
              disabled={loading}
              style={{
                padding: '15px 25px',
                background: isScanning ? '#dc3545' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                opacity: loading ? 0.6 : 1
              }}
            >
              {isScanning ? '⏸️ 스캔 정지' : '▶️ 스캔 시작'}
            </button>
            <button
              onClick={onBack}
              style={{
                padding: '15px 25px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              🏠 메인으로
            </button>
          </div>
        </div>

        {/* 사용 가이드 */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '20px',
          marginTop: '20px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '18px' }}>
            📋 사용 가이드
          </h3>
          <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '8px' }}>
              • 기프티콘 QR 코드를 카메라 중앙에 맞춰주세요
            </div>
            <div style={{ marginBottom: '8px' }}>
              • QR 코드가 인식되면 자동으로 사용처리 화면이 열립니다
            </div>
            <div style={{ marginBottom: '8px' }}>
              • 조명이 밝은 곳에서 스캔해주세요
            </div>
            <div>
              • 고객용 QR 코드와 기존 QR 코드 모두 지원됩니다
            </div>
          </div>
        </div>
      </div>

      {/* 사용처리 모달 */}
      {showUsageModal && scannedGifticon && (
        <UsageModal
          gifticon={scannedGifticon}
          onClose={handleUsageCancel}
          onSuccess={handleUsageComplete}
        />
      )}
    </div>
  );
}

export default AdminQRScanner;