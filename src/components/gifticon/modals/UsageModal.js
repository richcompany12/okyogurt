// src/components/modals/UsageModal.js
import React, { useState } from 'react';
import { GifticonService } from '../../../services/gifticonService';
import { GifticonUtils } from '../../../utils/gifticonUtils';

function UsageModal({ 
  show, 
  gifticon, 
  currentUser, 
  onClose, 
  onSuccess 
}) {
  const [usageForm, setUsageForm] = useState({
    usedAmount: '',
    memo: '',
    paymentMethod: '현금+기프티콘'
  });
  const [processing, setProcessing] = useState(false);

  // 사용처리 실행
  const handleProcessUsage = async () => {
    if (!gifticon || !usageForm.usedAmount) {
      alert('사용 금액을 입력해주세요.');
      return;
    }

    const usedAmount = parseInt(usageForm.usedAmount);
    if (usedAmount <= 0) {
      alert('올바른 금액을 입력해주세요.');
      return;
    }

    if (usedAmount > gifticon.remainingAmount) {
      alert('잔액이 부족합니다.');
      return;
    }

    try {
      setProcessing(true);
      
      const usageData = {
        usedAmount: usedAmount,
        usedBy: currentUser.uid,
        usedByEmail: currentUser.email,
        memo: usageForm.memo,
        paymentMethod: usageForm.paymentMethod,
        location: '매장'
      };

      const result = await GifticonService.processGifticonUsage(
        gifticon.id, 
        usageData
      );

      alert(`✅ 사용처리가 완료되었습니다!\n사용금액: ${GifticonUtils.formatAmount(usedAmount)}\n잔액: ${GifticonUtils.formatAmount(result.remainingAmount)}`);
      
      onSuccess(result);
      
    } catch (error) {
      console.error('사용처리 오류:', error);
      alert('사용처리에 실패했습니다: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!show || !gifticon) return null;

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
        maxWidth: '500px',
        width: '100%'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>
          💳 기프티콘 사용처리
        </h3>
        
        {/* 기프티콘 정보 */}
        <div style={{
          background: '#f8f9fa',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div><strong>기프티콘:</strong> {gifticon.id}</div>
          <div><strong>구매자:</strong> {gifticon.purchaserName}</div>
          <div><strong>현재 잔액:</strong> {GifticonUtils.formatAmount(gifticon.remainingAmount ?? gifticon.amount)}</div>
        </div>

        {/* 사용 금액 입력 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            color: '#333'
          }}>
            💰 사용 금액 *
          </label>
          <input
            type="number"
            placeholder="사용할 금액을 입력하세요"
            value={usageForm.usedAmount}
            onChange={(e) => setUsageForm({...usageForm, usedAmount: e.target.value})}
            max={gifticon.remainingAmount ?? gifticon.amount}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            최대 사용 가능: {GifticonUtils.formatAmount(gifticon.remainingAmount ?? gifticon.amount)}
          </div>
        </div>

        {/* 결제 방법 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            color: '#333'
          }}>
            💳 결제 방법
          </label>
          <select
            value={usageForm.paymentMethod}
            onChange={(e) => setUsageForm({...usageForm, paymentMethod: e.target.value})}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          >
            <option value="현금+기프티콘">현금 + 기프티콘</option>
            <option value="카드+기프티콘">카드 + 기프티콘</option>
            <option value="기프티콘전액">기프티콘 전액</option>
          </select>
        </div>

        {/* 메모 */}
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
            placeholder="사용 관련 메모를 입력하세요"
            value={usageForm.memo}
            onChange={(e) => setUsageForm({...usageForm, memo: e.target.value})}
            rows={3}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box',
              resize: 'vertical'
            }}
          />
        </div>

        {/* 버튼들 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ❌ 취소
          </button>
          <button
            onClick={handleProcessUsage}
            disabled={processing || !usageForm.usedAmount}
            style={{
              padding: '12px',
              background: processing ? '#ccc' : '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: processing ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {processing ? '⏳ 처리중...' : '✅ 사용처리'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UsageModal;