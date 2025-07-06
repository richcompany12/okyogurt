// src/components/modals/RechargeModal.js
import React, { useState } from 'react';
import { GifticonService } from '../../../services/gifticonService';
import { GifticonUtils } from '../../../utils/gifticonUtils';

function RechargeModal({ 
  show, 
  gifticon, 
  currentUser, 
  onClose, 
  onSuccess 
}) {
  const [rechargeForm, setRechargeForm] = useState({
    rechargeAmount: '',
    memo: '',
    paymentMethod: '현금'
  });
  const [processing, setProcessing] = useState(false);

  // 충전 처리 실행
  const handleProcessRecharge = async () => {
    if (!gifticon || !rechargeForm.rechargeAmount) {
      alert('충전 금액을 입력해주세요.');
      return;
    }

    const rechargeAmount = parseInt(rechargeForm.rechargeAmount);
    if (rechargeAmount <= 0) {
      alert('올바른 금액을 입력해주세요.');
      return;
    }

    if (rechargeAmount > 1000000) {
      alert('한 번에 충전할 수 있는 최대 금액은 100만원입니다.');
      return;
    }

    try {
      setProcessing(true);
      
      const rechargeData = {
        rechargeAmount: rechargeAmount,
        rechargedBy: currentUser.uid,
        rechargedByEmail: currentUser.email,
        memo: rechargeForm.memo,
        paymentMethod: rechargeForm.paymentMethod
      };

      const result = await GifticonService.rechargeGifticon(
        gifticon.id, 
        rechargeData
      );

      let message = `✅ 충전이 완료되었습니다!\n충전금액: ${GifticonUtils.formatAmount(rechargeAmount)}\n새 잔액: ${GifticonUtils.formatAmount(result.newRemainingAmount)}`;
      
      if (result.wasExpired) {
        message += '\n\n🔄 만료된 기프티콘이 다시 활성화되었습니다!';
      }

      alert(message);
      
      onSuccess(result);
      
    } catch (error) {
      console.error('충전 처리 오류:', error);
      alert('충전 처리에 실패했습니다: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  // 금액 버튼 클릭
  const handleAmountButtonClick = (amount) => {
    setRechargeForm({...rechargeForm, rechargeAmount: amount.toString()});
  };

  if (!show || !gifticon) return null;

  // 만료 여부 확인
  const isExpired = gifticon.expiresAt && gifticon.expiresAt.toDate() < new Date();

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
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>
          💰 기프티콘 충전
        </h3>
        
        {/* 기프티콘 정보 */}
        <div style={{
          background: '#e8f5e8',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #c3e6cb'
        }}>
          <div><strong>기프티콘:</strong> {gifticon.id}</div>
          <div><strong>구매자:</strong> {gifticon.purchaserName}</div>
          <div><strong>현재 금액:</strong> {GifticonUtils.formatAmount(gifticon.amount)}</div>
          <div><strong>현재 잔액:</strong> {GifticonUtils.formatAmount(gifticon.remainingAmount ?? gifticon.amount)}</div>
          {gifticon.totalRecharged > 0 && (
            <div><strong>총 충전액:</strong> {GifticonUtils.formatAmount(gifticon.totalRecharged)} ({gifticon.rechargeCount}회)</div>
          )}
        </div>

        {/* 만료 경고 */}
        {isExpired && (
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
            color: '#856404'
          }}>
            ⚠️ <strong>주의:</strong> 만료된 기프티콘입니다. 충전하면 다시 사용 가능해집니다.
          </div>
        )}

        {/* 빠른 금액 선택 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            color: '#333'
          }}>
            💳 빠른 금액 선택
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px'
          }}>
            {[10000, 30000, 50000, 100000, 200000, 300000].map(amount => (
              <button
                key={amount}
                onClick={() => handleAmountButtonClick(amount)}
                style={{
                  padding: '10px',
                  background: rechargeForm.rechargeAmount === amount.toString() ? '#27ae60' : '#f8f9fa',
                  color: rechargeForm.rechargeAmount === amount.toString() ? 'white' : '#333',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {GifticonUtils.formatAmount(amount)}
              </button>
            ))}
          </div>
        </div>

        {/* 충전 금액 입력 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            color: '#333'
          }}>
            💰 충전 금액 *
          </label>
          <input
            type="number"
            placeholder="충전할 금액을 입력하세요"
            value={rechargeForm.rechargeAmount}
            onChange={(e) => setRechargeForm({...rechargeForm, rechargeAmount: e.target.value})}
            max={1000000}
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
            최대 충전 가능: 1,000,000원
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
            value={rechargeForm.paymentMethod}
            onChange={(e) => setRechargeForm({...rechargeForm, paymentMethod: e.target.value})}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          >
            <option value="현금">현금</option>
            <option value="카드">카드</option>
            <option value="계좌이체">계좌이체</option>
            <option value="기타">기타</option>
          </select>
        </div>

        {/* 메모 */}
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
            placeholder="충전 관련 메모를 입력하세요"
            value={rechargeForm.memo}
            onChange={(e) => setRechargeForm({...rechargeForm, memo: e.target.value})}
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

        {/* 충전 후 예상 금액 */}
        {rechargeForm.rechargeAmount && parseInt(rechargeForm.rechargeAmount) > 0 && (
          <div style={{
            background: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
            color: '#155724'
          }}>
            <h4 style={{ margin: '0 0 10px 0' }}>💎 충전 후 예상 금액</h4>
            <div><strong>현재 잔액:</strong> {GifticonUtils.formatAmount(gifticon.remainingAmount ?? gifticon.amount)}</div>
            <div><strong>충전 금액:</strong> +{GifticonUtils.formatAmount(parseInt(rechargeForm.rechargeAmount))}</div>
            <div style={{ borderTop: '1px solid #c3e6cb', paddingTop: '10px', marginTop: '10px' }}>
              <strong>충전 후 잔액:</strong> {GifticonUtils.formatAmount((gifticon.remainingAmount ?? gifticon.amount) + parseInt(rechargeForm.rechargeAmount))}
            </div>
          </div>
        )}

        {/* 충전 내역 */}
        {gifticon.rechargeHistory && gifticon.rechargeHistory.length > 0 && (
          <div style={{
            background: '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>📜 최근 충전 내역</h4>
            <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
              {gifticon.rechargeHistory.slice(-3).reverse().map((recharge, index) => (
                <div
                  key={index}
                  style={{
                    padding: '8px',
                    borderBottom: '1px solid #dee2e6',
                    fontSize: '14px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: 'bold', color: '#27ae60' }}>
                      +{GifticonUtils.formatAmount(recharge.rechargeAmount)}
                    </span>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {recharge.rechargedAt?.toDate()?.toLocaleString('ko-KR') || '날짜 없음'}
                    </span>
                  </div>
                  <div style={{ color: '#666', fontSize: '12px' }}>
                    결제: {recharge.paymentMethod}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
            onClick={handleProcessRecharge}
            disabled={processing || !rechargeForm.rechargeAmount || parseInt(rechargeForm.rechargeAmount) <= 0}
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
            {processing ? '⏳ 처리중...' : '💰 충전하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RechargeModal;