// src/components/modals/BlockModal.js
import React, { useState } from 'react';
import { GifticonService } from '../../../services/gifticonService';
import { GifticonUtils } from '../../../utils/gifticonUtils';

function BlockModal({ 
  show, 
  gifticon, 
  currentUser, 
  type, // 'block' or 'unblock'
  onClose, 
  onSuccess 
}) {
  const [blockForm, setBlockForm] = useState({
    reason: '',
    customReason: ''
  });
  
  const [unblockForm, setUnblockForm] = useState({
    reason: ''
  });
  
  const [processing, setProcessing] = useState(false);

  // 기프티콘 정지 처리
  const handleProcessBlock = async () => {
    if (!gifticon) return;

    const reason = blockForm.reason === 'custom' ? blockForm.customReason : blockForm.reason;
    
    if (!reason.trim()) {
      alert('정지 사유를 입력해주세요.');
      return;
    }

    try {
      setProcessing(true);
      
      const blockData = {
        reason: reason,
        blockedBy: currentUser.uid,
        blockedByEmail: currentUser.email
      };

      await GifticonService.blockGifticon(gifticon.id, blockData);

      alert(`✅ 기프티콘이 정지되었습니다.\n사유: ${reason}`);
      
      onSuccess();
      
    } catch (error) {
      console.error('정지 처리 오류:', error);
      alert('정지 처리에 실패했습니다: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  // 기프티콘 재개 처리
  const handleProcessUnblock = async () => {
    if (!gifticon || !unblockForm.reason.trim()) {
      alert('재개 사유를 입력해주세요.');
      return;
    }

    try {
      setProcessing(true);
      
      const unblockData = {
        reason: unblockForm.reason,
        unblockedBy: currentUser.uid,
        unblockedByEmail: currentUser.email
      };

      await GifticonService.unblockGifticon(gifticon.id, unblockData);

      alert(`✅ 기프티콘 사용이 재개되었습니다.\n사유: ${unblockForm.reason}`);
      
      onSuccess();
      
    } catch (error) {
      console.error('재개 처리 오류:', error);
      alert('재개 처리에 실패했습니다: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!show || !gifticon) return null;

  // 사용정지 모달
  if (type === 'block') {
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
            🚫 기프티콘 사용정지
          </h3>
          
          {/* 기프티콘 정보 */}
          <div style={{
            background: '#fff3cd',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #ffeaa7'
          }}>
            <div><strong>기프티콘:</strong> {gifticon.id}</div>
            <div><strong>구매자:</strong> {gifticon.purchaserName}</div>
            <div><strong>현재 잔액:</strong> {GifticonUtils.formatAmount(gifticon.remainingAmount || gifticon.amount)}</div>
          </div>

          {/* 정지 사유 선택 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              🚫 정지 사유 *
            </label>
            <select
              value={blockForm.reason}
              onChange={(e) => setBlockForm({...blockForm, reason: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            >
              <option value="">정지 사유를 선택하세요</option>
              <option value="분실신고">분실신고</option>
              <option value="도난신고">도난신고</option>
              <option value="사기의심">사기의심</option>
              <option value="시스템오류">시스템오류</option>
              <option value="고객요청">고객요청</option>
              <option value="custom">직접입력</option>
            </select>
          </div>

          {/* 직접입력 */}
          {blockForm.reason === 'custom' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                📝 상세 사유
              </label>
              <textarea
                placeholder="정지 사유를 상세히 입력하세요"
                value={blockForm.customReason}
                onChange={(e) => setBlockForm({...blockForm, customReason: e.target.value})}
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
          )}

          {/* 경고 메시지 */}
          <div style={{
            background: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
            color: '#721c24'
          }}>
            ⚠️ <strong>주의:</strong> 기프티콘을 정지하면 고객이 사용할 수 없게 됩니다. 신중하게 결정해주세요.
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
              onClick={handleProcessBlock}
              disabled={processing || !blockForm.reason || (blockForm.reason === 'custom' && !blockForm.customReason.trim())}
              style={{
                padding: '12px',
                background: processing ? '#ccc' : '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: processing ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              {processing ? '⏳ 처리중...' : '🚫 정지하기'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 사용재개 모달
  if (type === 'unblock') {
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
            ✅ 기프티콘 사용재개
          </h3>
          
          {/* 기프티콘 정보 */}
          <div style={{
            background: '#d1ecf1',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #bee5eb'
          }}>
            <div><strong>기프티콘:</strong> {gifticon.id}</div>
            <div><strong>구매자:</strong> {gifticon.purchaserName}</div>
            <div><strong>현재 상태:</strong> 사용정지</div>
            <div><strong>정지 사유:</strong> {gifticon.blockReason}</div>
            <div><strong>정지일:</strong> {gifticon.blockedAt ? GifticonUtils.formatDate(gifticon.blockedAt) : '알 수 없음'}</div>
          </div>

          {/* 재개 사유 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              ✅ 재개 사유 *
            </label>
            <textarea
              placeholder="사용 재개 사유를 입력하세요 (예: 기프티콘을 찾았음, 오인신고 확인됨 등)"
              value={unblockForm.reason}
              onChange={(e) => setUnblockForm({...unblockForm, reason: e.target.value})}
              rows={4}
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

          {/* 안내 메시지 */}
          <div style={{
            background: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
            color: '#155724'
          }}>
            ✅ <strong>알림:</strong> 재개 후 고객이 즉시 기프티콘을 사용할 수 있게 됩니다.
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
              onClick={handleProcessUnblock}
              disabled={processing || !unblockForm.reason.trim()}
              style={{
                padding: '12px',
                background: processing ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: processing ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              {processing ? '⏳ 처리중...' : '✅ 재개하기'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default BlockModal;