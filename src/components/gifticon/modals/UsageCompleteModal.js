// src/components/gifticon/modals/UsageCompleteModal.js
import React from 'react';
import { GifticonUtils } from '../../../utils/gifticonUtils';

function UsageCompleteModal({ 
  show, 
  usageResult,
  gifticon,
  onNewScan,
  onBackToList,
  onClose 
}) {
  if (!show || !usageResult) return null;

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
            ✅ 사용처리 완료
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

        {/* 사용 완료 메시지 */}
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

        {/* 기프티콘 상세 정보 */}
        {gifticon && (
          <div style={{
            background: '#f8f9fa',
            borderRadius: '12px',
            padding: '25px',
            marginBottom: '30px'
          }}>
            <h4 style={{ margin: '0 0 20px 0', color: '#333' }}>📋 기프티콘 정보</h4>
            <div style={{ display: 'grid', gap: '10px', color: '#666' }}>
              <div><strong>번호:</strong> {gifticon.id}</div>
              <div><strong>구매자:</strong> {gifticon.purchaserName}</div>
              <div><strong>전화번호:</strong> {gifticon.purchaserPhone}</div>
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

        {/* 사용 내역 */}
        {usageResult.usageHistory && usageResult.usageHistory.length > 0 && (
          <div style={{
            background: '#f8f9fa',
            borderRadius: '12px',
            padding: '25px',
            marginBottom: '30px'
          }}>
            <h4 style={{ margin: '0 0 20px 0', color: '#333' }}>📊 최근 사용 내역</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {usageResult.usageHistory.slice(0, 5).map((usage, index) => (
                <div key={index} style={{
                  padding: '10px',
                  borderBottom: '1px solid #e9ecef',
                  fontSize: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span><strong>{GifticonUtils.formatAmount(usage.usedAmount)}</strong></span>
                    <span style={{ color: '#666' }}>
                      {usage.usedAt?.toDate ? usage.usedAt.toDate().toLocaleDateString() : '날짜 정보 없음'}
                    </span>
                  </div>
                  {usage.memo && (
                    <div style={{ color: '#666', fontSize: '12px' }}>
                      📝 {usage.memo}
                    </div>
                  )}
                  <div style={{ color: '#666', fontSize: '12px' }}>
                    💳 {usage.paymentMethod} | 📍 {usage.location}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 액션 버튼들 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px'
        }}>
          <button
            onClick={onNewScan}
            style={{
              padding: '15px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            📱 새로운 스캔
          </button>
          <button
            onClick={onBackToList}
            style={{
              padding: '15px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            📋 목록으로 돌아가기
          </button>
        </div>

        {/* 추가 정보 */}
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#e9ecef',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#666',
          textAlign: 'center'
        }}>
          💡 <strong>팁:</strong> 기프티콘 사용 내역은 자동으로 저장되며, 
          언제든지 기프티콘 목록에서 확인할 수 있습니다.
        </div>
      </div>
    </div>
  );
}

export default UsageCompleteModal;