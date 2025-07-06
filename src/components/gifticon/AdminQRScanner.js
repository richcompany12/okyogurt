// src/components/gifticon/AdminQRScanner.js - 리팩토링된 컨트롤러
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { GifticonService } from '../../services/gifticonService';
import QRScanModal from './modals/QRScanModal';
import UsageModal from './modals/UsageModal';
import UsageCompleteModal from './modals/UsageCompleteModal';

function AdminQRScanner({ onBack }) {
  const { currentUser } = useAuth();
  
  // 모달 상태 관리
  const [showQRScanModal, setShowQRScanModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  
  // 데이터 상태
  const [gifticon, setGifticon] = useState(null);
  const [usageResult, setUsageResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      
      // QR 스캔 모달 닫고 사용 모달 열기
      setShowQRScanModal(false);
      setShowUsageModal(true);
      
      console.log('✅ 기프티콘 조회 성공:', data);
    } catch (error) {
      console.error('❌ 기프티콘 조회 오류:', error);
      setError('기프티콘 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // QR 스캔 결과 처리
  const handleQRScanResult = (gifticonId) => {
    searchGifticon(gifticonId);
  };

  // 수동 검색 처리
  const handleManualSearch = (gifticonId) => {
    searchGifticon(gifticonId);
  };

  // 사용처리 성공
  const handleUsageSuccess = (result) => {
    setUsageResult(result);
    
    // 기프티콘 정보 업데이트
    const updatedGifticon = {
      ...gifticon,
      remainingAmount: result.remainingAmount,
      totalUsed: (gifticon.totalUsed || 0) + result.usedAmount,
      usageCount: (gifticon.usageCount || 0) + 1,
      status: result.isFullyUsed ? 'used' : 'active'
    };
    setGifticon(updatedGifticon);
    
    // 사용 모달 닫고 완료 모달 열기
    setShowUsageModal(false);
    setShowCompleteModal(true);
  };

  // 새로운 스캔
  const handleNewScan = () => {
    // 모든 상태 초기화
    setGifticon(null);
    setUsageResult(null);
    setError('');
    
    // 완료 모달 닫고 스캔 모달 열기
    setShowCompleteModal(false);
    setShowQRScanModal(true);
  };

  // 목록으로 돌아가기 (기프티콘 목록으로)
  const handleBackToList = () => {
    // 모든 모달 닫기
    setShowQRScanModal(false);
    setShowUsageModal(false);
    setShowCompleteModal(false);
    
    // 상태 초기화
    setGifticon(null);
    setUsageResult(null);
    setError('');
    
    // 부모 컴포넌트로 돌아가기 (기프티콘 목록)
    onBack();
  };

  // 어드민 대시보드로 돌아가기
  const handleBackToDashboard = () => {
    // 모든 모달 닫기
    setShowQRScanModal(false);
    setShowUsageModal(false);
    setShowCompleteModal(false);
    
    // 상태 초기화
    setGifticon(null);
    setUsageResult(null);
    setError('');
    
    // 부모 컴포넌트로 돌아가기 (어드민 대시보드)
    onBack();
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
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
          <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>🛡️ 관리자 QR 스캔/사용 처리</h2>
          <p style={{ margin: '0', color: '#666' }}>기프티콘을 스캔하거나 수동으로 입력하여 사용 처리합니다.</p>
        </div>
        <button
          onClick={handleBackToDashboard}
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
          ← 대시보드로 돌아가기
        </button>
      </div>

      {/* 메인 컨텐츠 */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>📱</div>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>
          QR 스캔으로 기프티콘 사용처리
        </h3>
        <p style={{ margin: '0 0 30px 0', color: '#666', fontSize: '16px' }}>
          카메라로 QR 코드를 스캔하거나 기프티콘 번호를 직접 입력하세요.
        </p>
        
        <button
          onClick={() => setShowQRScanModal(true)}
          style={{
            padding: '20px 40px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
          }}
        >
          📱 QR 스캔 시작
        </button>

        {/* 사용법 안내 */}
        <div style={{
          marginTop: '40px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '8px',
          textAlign: 'left'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>📋 사용법</h4>
          <div style={{ color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>1. QR 스캔:</strong> 고객의 기프티콘 QR 코드를 카메라로 스캔
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>2. 수동 입력:</strong> 기프티콘 번호를 직접 입력
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>3. 사용처리:</strong> 사용금액과 결제방법을 선택하여 처리
            </div>
            <div>
              <strong>4. 완료:</strong> 사용 완료 후 영수증 확인 및 다음 작업 진행
            </div>
          </div>
        </div>
      </div>

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

      {/* 로딩 오버레이 */}
      {loading && (
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
          zIndex: 999
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '15px' }}>⏳</div>
            <div style={{ fontSize: '18px', color: '#333' }}>처리 중...</div>
          </div>
        </div>
      )}

      {/* 모달들 */}
      <QRScanModal
        show={showQRScanModal}
        onClose={() => setShowQRScanModal(false)}
        onScanResult={handleQRScanResult}
        onManualSearch={handleManualSearch}
      />

      <UsageModal
        show={showUsageModal}
        gifticon={gifticon}
        currentUser={currentUser}
        onClose={() => setShowUsageModal(false)}
        onSuccess={handleUsageSuccess}
      />

      <UsageCompleteModal
        show={showCompleteModal}
        usageResult={usageResult}
        gifticon={gifticon}
        onNewScan={handleNewScan}
        onBackToList={handleBackToList}
        onClose={() => setShowCompleteModal(false)}
      />
    </div>
  );
}

export default AdminQRScanner;