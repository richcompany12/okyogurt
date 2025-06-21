// src/components/CustomerGifticonCheck.js
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { GifticonService } from '../services/gifticonService';
import { GifticonUtils } from '../utils/gifticonUtils';

function CustomerGifticonCheck() {
  const { gifticonId } = useParams();
  const [searchParams] = useSearchParams();
  const [gifticon, setGifticon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 매장 전화번호
  const STORE_PHONE = '01081771258';

  // 기프티콘 조회
  const loadGifticon = async () => {
    try {
      setLoading(true);
      setError('');

      if (!gifticonId) {
        throw new Error('기프티콘 ID가 없습니다.');
      }

      const data = await GifticonService.getGifticon(gifticonId);
      
      if (!data) {
        throw new Error('기프티콘을 찾을 수 없습니다.');
      }

      setGifticon(data);
      console.log('✅ 고객용 기프티콘 조회 완료:', data);

    } catch (error) {
      console.error('❌ 기프티콘 조회 실패:', error);
      setError(error.message || '기프티콘을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGifticon();
  }, [gifticonId]);

  // 확인 버튼 클릭
  const handleConfirm = () => {
    // 현재 창이 팝업이면 닫기, 아니면 이전 페이지로
    if (window.opener) {
      window.close();
    } else {
      window.history.back();
    }
  };

  // 전화 걸기
  const handleCall = () => {
    window.location.href = `tel:${STORE_PHONE}`;
  };

  // 로딩 화면
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <h3 style={{ color: '#333', margin: '0' }}>기프티콘 정보를 확인하는 중...</h3>
        </div>
      </div>
    );
  }

  // 오류 화면
  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'Arial, sans-serif',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          maxWidth: '500px',
          width: '100%'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
          <h2 style={{ color: '#e74c3c', margin: '0 0 20px 0' }}>오류 발생</h2>
          <p style={{ color: '#666', marginBottom: '30px', lineHeight: '1.6' }}>
            {error}
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px'
          }}>
            <button
              onClick={handleConfirm}
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
              ✅ 확인
            </button>
            <button
              onClick={handleCall}
              style={{
                padding: '15px 25px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              📞 매장 문의
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 기프티콘 정보 화면
  const statusInfo = GifticonUtils.getStatusText(
    gifticon.status, 
    gifticon.remainingAmount, 
    gifticon.expiresAt
  );

  // 만료 여부 확인
  const isExpired = gifticon.expiresAt && gifticon.expiresAt.toDate() < new Date();
  const isBlocked = gifticon.isBlocked;

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        paddingTop: '40px'
      }}>
        {/* 헤더 */}
        <div style={{
          background: 'white',
          borderRadius: '20px 20px 0 0',
          padding: '30px',
          textAlign: 'center',
          boxShadow: '0 5px 20px rgba(0,0,0,0.2)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎁</div>
          <h1 style={{ 
            margin: '0 0 10px 0', 
            color: '#333',
            fontSize: '24px'
          }}>
            요거트퍼플 기프티콘
          </h1>
          <p style={{ 
            margin: '0', 
            color: '#666',
            fontSize: '14px'
          }}>
            기프티콘 잔액 및 사용내역 조회
          </p>
        </div>

        {/* 상태 알림 */}
        {(isBlocked || isExpired) && (
          <div style={{
            background: isBlocked ? '#f8d7da' : '#fff3cd',
            border: `1px solid ${isBlocked ? '#f5c6cb' : '#ffeaa7'}`,
            padding: '20px',
            color: isBlocked ? '#721c24' : '#856404',
            fontSize: '16px',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            {isBlocked ? (
              <>🚫 이 기프티콘은 현재 사용이 정지된 상태입니다.<br/>사유: {gifticon.blockReason}</>
            ) : (
              <>⚠️ 이 기프티콘은 만료되었습니다.</>
            )}
          </div>
        )}

        {/* 기프티콘 정보 */}
        <div style={{
          background: 'white',
          padding: '30px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            marginBottom: '25px'
          }}>
            <span style={{ fontSize: '32px' }}>
              {isBlocked ? '🚫' : statusInfo.emoji}
            </span>
            <div>
              <div style={{
                background: isBlocked ? '#e74c3c' : statusInfo.color,
                color: 'white',
                padding: '6px 15px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold',
                display: 'inline-block'
              }}>
                {isBlocked ? '사용정지' : statusInfo.text}
              </div>
            </div>
          </div>

          {/* 기프티콘 번호 */}
          <div style={{
            background: '#f8f9fa',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '5px' }}>
              기프티콘 번호
            </div>
            <div style={{ 
              fontFamily: 'monospace', 
              fontSize: '16px', 
              fontWeight: 'bold',
              color: '#333',
              letterSpacing: '1px'
            }}>
              {gifticon.id}
            </div>
          </div>

          {/* 금액 정보 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
            marginBottom: '25px'
          }}>
            <div style={{
              background: '#e8f5e8',
              padding: '20px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                💰 원금액
              </div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: '#27ae60'
              }}>
                {GifticonUtils.formatAmount(gifticon.amount)}
              </div>
            </div>

            <div style={{
              background: '#e3f2fd',
              padding: '20px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                💎 현재 잔액
              </div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: '#2196f3'
              }}>
                {GifticonUtils.formatAmount(gifticon.remainingAmount || gifticon.amount)}
              </div>
            </div>
          </div>

          {/* 추가 정보 */}
          <div style={{
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '25px'
          }}>
            <div style={{ 
              display: 'grid', 
              gap: '12px',
              fontSize: '14px',
              color: '#666'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>👤 구매자</span>
                <strong style={{ color: '#333' }}>{gifticon.purchaserName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>📅 구매일</span>
                <strong style={{ color: '#333' }}>{GifticonUtils.formatDate(gifticon.createdAt)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>⏰ 만료일</span>
                <strong style={{ color: isExpired ? '#e74c3c' : '#333' }}>
                  {GifticonUtils.formatDate(gifticon.expiresAt)}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>💳 사용 횟수</span>
                <strong style={{ color: '#333' }}>{gifticon.usageCount || 0}회</strong>
              </div>
              {gifticon.totalRecharged > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>🔄 총 충전액</span>
                  <strong style={{ color: '#17a2b8' }}>
                    {GifticonUtils.formatAmount(gifticon.totalRecharged)} ({gifticon.rechargeCount}회)
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* 사용률 진행바 */}
          <div style={{ marginBottom: '25px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '14px', color: '#666' }}>📊 사용률</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                {((gifticon.totalUsed || 0) / gifticon.amount * 100).toFixed(1)}%
              </span>
            </div>
            <div style={{
              background: '#e9ecef',
              borderRadius: '10px',
              height: '12px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${((gifticon.totalUsed || 0) / gifticon.amount * 100)}%`,
                height: '100%',
                background: isBlocked ? '#e74c3c' : '#27ae60',
                transition: 'width 0.3s ease',
                borderRadius: '10px'
              }}></div>
            </div>
          </div>

          {/* 안내 메시지 */}
          <div style={{
            background: '#e8f5e8',
            border: '1px solid #c3e6cb',
            borderRadius: '10px',
            padding: '15px',
            fontSize: '14px',
            color: '#155724',
            marginBottom: '25px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>💡 사용 안내</div>
            <div>매장 방문 시 직원에게 QR 코드를 보여주시면 사용하실 수 있습니다.</div>
            {isBlocked && (
              <div style={{ marginTop: '8px', color: '#e74c3c' }}>
                ⚠️ 현재 사용이 정지된 상태입니다. 매장에 문의해주세요.
              </div>
            )}
          </div>
        </div>

        {/* 버튼들 */}
        <div style={{
          background: 'white',
          borderRadius: '0 0 20px 20px',
          padding: '30px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.2)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px'
          }}>
            <button
              onClick={handleConfirm}
              style={{
                padding: '18px 25px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'background 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.background = '#5a6268'}
              onMouseOut={(e) => e.target.style.background = '#6c757d'}
            >
              ✅ 확인
            </button>
            <button
              onClick={handleCall}
              style={{
                padding: '18px 25px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'background 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.background = '#218838'}
              onMouseOut={(e) => e.target.style.background = '#28a745'}
            >
              📞 매장 전화
            </button>
          </div>
          <div style={{
            textAlign: 'center',
            marginTop: '15px',
            fontSize: '12px',
            color: '#666'
          }}>
            매장 전화번호: {STORE_PHONE}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerGifticonCheck;