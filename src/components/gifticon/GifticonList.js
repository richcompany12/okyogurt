// src/components/GifticonList.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { GifticonService } from '../../services/gifticonService';
import { GifticonUtils } from '../../utils/gifticonUtils';
import { QRUtils } from '../../utils/qrUtils';
import UsageModal from './modals/UsageModal';
import BlockModal from './modals/BlockModal';
import RechargeModal from './modals/RechargeModal';

function GifticonList({ onBack }) {
  const { currentUser } = useAuth();
  
  const [gifticons, setGifticons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGifticon, setSelectedGifticon] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // 모달 상태 관리
  const [showQRModal, setShowQRModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // 기프티콘 목록 로드
  const loadGifticons = async () => {
    try {
      setLoading(true);
      setError('');
      
      const filters = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      
      const data = await GifticonService.getGifticons(filters);
      setGifticons(data);
      
      console.log('✅ 기프티콘 목록 로드 완료:', data.length, '개');
    } catch (error) {
      console.error('❌ 기프티콘 목록 로드 실패:', error);
      setError('기프티콘 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGifticons();
  }, [statusFilter]);

  // 검색 필터링
  const filteredGifticons = gifticons.filter(gifticon => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      gifticon.id.toLowerCase().includes(term) ||
      gifticon.purchaserName.toLowerCase().includes(term) ||
      gifticon.purchaserPhone.includes(term)
    );
  });

  // QR 코드 보기
  const handleShowQR = async (gifticon) => {
    try {
      const qrData = GifticonUtils.generateCustomerURL(gifticon.id);
      console.log('🔍 생성된 QR 데이터:', qrData);
      const qrCodeDataURL = await QRUtils.generateQRCode(qrData);
      setQrCodeUrl(qrCodeDataURL);
      setSelectedGifticon(gifticon);
      setShowQRModal(true);
    } catch (error) {
      console.error('QR 코드 생성 오류:', error);
      alert('QR 코드 생성에 실패했습니다.');
    }
  };

  // 사용처리 모달 열기
  const handleShowUsage = (gifticon) => {
    if (gifticon.isBlocked) {
      alert('정지된 기프티콘은 사용할 수 없습니다.');
      return;
    }
    setSelectedGifticon(gifticon);
    setShowUsageModal(true);
  };

  // 상세보기 모달 열기
  const handleShowDetail = (gifticon) => {
    setSelectedGifticon(gifticon);
    setShowDetailModal(true);
  };

  // 정지 모달 열기
  const handleShowBlock = (gifticon) => {
    setSelectedGifticon(gifticon);
    setShowBlockModal(true);
  };

  // 재개 모달 열기
  const handleShowUnblock = (gifticon) => {
    setSelectedGifticon(gifticon);
    setShowUnblockModal(true);
  };

  // 충전 모달 열기 (NEW!)
  const handleShowRecharge = (gifticon) => {
    if (gifticon.isBlocked) {
      alert('정지된 기프티콘은 충전할 수 없습니다.');
      return;
    }
    setSelectedGifticon(gifticon);
    setShowRechargeModal(true);
  };

  // 모달 성공 콜백
  const handleModalSuccess = async () => {
    await loadGifticons();
    closeAllModals();
  };

  // 모든 모달 닫기
  const closeAllModals = () => {
    setShowQRModal(false);
    setShowUsageModal(false);
    setShowDetailModal(false);
    setShowBlockModal(false);
    setShowUnblockModal(false);
    setShowRechargeModal(false);
    setSelectedGifticon(null);
    setQrCodeUrl('');
  };

  // QR 코드 다운로드
  const handleDownloadQR = () => {
    if (qrCodeUrl && selectedGifticon) {
      const link = QRUtils.createDownloadLink(
        qrCodeUrl, 
        `gifticon-${selectedGifticon.id}.png`
      );
      link.click();
    }
  };

  // QR 코드 프린트
  const handlePrintQR = () => {
    if (qrCodeUrl && selectedGifticon) {
      QRUtils.printQRCode(qrCodeUrl, {
        id: selectedGifticon.id,
        amount: selectedGifticon.amount,
        purchaserName: selectedGifticon.purchaserName,
        expiresAt: selectedGifticon.expiresAt?.toDate()
      });
    }
  };

  // 로딩 화면
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
        <h3>기프티콘 목록을 불러오는 중...</h3>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
          <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>📋 기프티콘 목록</h2>
          <p style={{ margin: '0', color: '#666' }}>
            총 {filteredGifticons.length}개의 기프티콘
          </p>
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

      {/* 검색 및 필터 */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              🔍 검색
            </label>
            <input
              type="text"
              placeholder="기프티콘 번호, 구매자명, 전화번호 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              📊 상태 필터
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="all">전체</option>
              <option value="active">사용가능</option>
              <option value="used">사용완료</option>
              <option value="expired">만료됨</option>
            </select>
          </div>

          <button
            onClick={loadGifticons}
            style={{
              padding: '10px 20px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 새로고침
          </button>
        </div>
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

      {/* 기프티콘 목록 */}
      {filteredGifticons.length === 0 ? (
        <div style={{
          background: 'white',
          padding: '50px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📭</div>
          <h3 style={{ color: '#666' }}>조건에 맞는 기프티콘이 없습니다</h3>
          <p style={{ color: '#999' }}>다른 검색어나 필터를 시도해보세요.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {filteredGifticons.map(gifticon => {
            const statusInfo = GifticonUtils.getStatusText(
              gifticon.status, 
              gifticon.remainingAmount, 
              gifticon.expiresAt
            );
            
            return (
              <div
                key={gifticon.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '25px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  border: `2px solid ${gifticon.isBlocked ? '#e74c3c' : statusInfo.color}20`,
                  opacity: gifticon.isBlocked ? 0.7 : 1
                }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '20px',
                  alignItems: 'start'
                }}>
                  {/* 기본 정보 */}
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '15px',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{ fontSize: '24px' }}>
                        {gifticon.isBlocked ? '🚫' : statusInfo.emoji}
                      </span>
                      <span style={{
                        background: gifticon.isBlocked ? '#e74c3c' : statusInfo.color,
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {gifticon.isBlocked ? '사용정지' : statusInfo.text}
                      </span>
                      {gifticon.isBlocked && (
                        <span style={{
                          background: '#fff3cd',
                          color: '#856404',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          border: '1px solid #ffeaa7'
                        }}>
                          🔒 정지됨
                        </span>
                      )}
                    </div>
                    
                    <h3 style={{
                      margin: '0 0 10px 0',
                      color: '#333',
                      fontFamily: 'monospace'
                    }}>
                      {gifticon.id}
                    </h3>
                    
                    <div style={{ color: '#666', lineHeight: '1.6' }}>
                      <div><strong>💰 원금액:</strong> {GifticonUtils.formatAmount(gifticon.amount)}</div>
                      <div><strong>💎 잔액:</strong> {GifticonUtils.formatAmount(gifticon.remainingAmount || gifticon.amount)}</div>
                      {gifticon.totalRecharged > 0 && (
                        <div><strong>🔄 총 충전액:</strong> {GifticonUtils.formatAmount(gifticon.totalRecharged)} ({gifticon.rechargeCount}회)</div>
                      )}
                      <div><strong>👤 구매자:</strong> {gifticon.purchaserName}</div>
                      <div><strong>📱 전화번호:</strong> {gifticon.purchaserPhone}</div>
                      <div><strong>📅 생성일:</strong> {GifticonUtils.formatDate(gifticon.createdAt)}</div>
                      <div><strong>⏰ 만료일:</strong> {GifticonUtils.formatDate(gifticon.expiresAt)}</div>
                      {gifticon.isBlocked && (
                        <div style={{ marginTop: '10px', padding: '10px', background: '#fff3cd', borderRadius: '6px' }}>
                          <div style={{ color: '#856404', fontSize: '14px' }}>
                            <strong>🚫 정지 사유:</strong> {gifticon.blockReason}
                          </div>
                          <div style={{ color: '#856404', fontSize: '12px', marginTop: '5px' }}>
                            정지일: {gifticon.blockedAt ? GifticonUtils.formatDate(gifticon.blockedAt) : '알 수 없음'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 사용 통계 */}
                  <div>
                    <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>📊 사용 현황</h4>
                    <div style={{ color: '#666', lineHeight: '1.6' }}>
                      <div><strong>사용 횟수:</strong> {gifticon.usageCount || 0}회</div>
                      <div><strong>총 사용 금액:</strong> {GifticonUtils.formatAmount(gifticon.totalUsed || 0)}</div>
                      <div><strong>사용률:</strong> {((gifticon.totalUsed || 0) / gifticon.amount * 100).toFixed(1)}%</div>
                    </div>
                    
                    {/* 진행바 */}
                    <div style={{
                      marginTop: '15px',
                      background: '#f8f9fa',
                      borderRadius: '10px',
                      height: '10px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${((gifticon.totalUsed || 0) / gifticon.amount * 100)}%`,
                        height: '100%',
                        background: gifticon.isBlocked ? '#e74c3c' : statusInfo.color,
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </div>

                  {/* 액션 버튼들 */}
                  <div>
                    <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>⚡ 액션</h4>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      <button
                        onClick={() => handleShowQR(gifticon)}
                        style={{
                          padding: '10px',
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        📱 QR 코드 보기
                      </button>
                      
                      {gifticon.remainingAmount > 0 && !gifticon.isBlocked && (
                        <button
                          onClick={() => handleShowUsage(gifticon)}
                          style={{
                            padding: '10px',
                            background: '#27ae60',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          💳 사용 처리
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleShowDetail(gifticon)}
                        style={{
                          padding: '10px',
                          background: '#f39c12',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        📝 상세보기
                      </button>

                      {/* 충전 버튼 (NEW!) */}
                      {!gifticon.isBlocked && (
                        <button
                          onClick={() => handleShowRecharge(gifticon)}
                          style={{
                            padding: '10px',
                            background: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          💰 충전하기
                        </button>
                      )}

                      {!gifticon.isBlocked ? (
                        <button
                          onClick={() => handleShowBlock(gifticon)}
                          style={{
                            padding: '10px',
                            background: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          🚫 사용정지
                        </button>
                      ) : (
                        <button
                          onClick={() => handleShowUnblock(gifticon)}
                          style={{
                            padding: '10px',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          ✅ 사용재개
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 메모 */}
                {gifticon.notes && (
                  <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    borderLeft: '4px solid #667eea'
                  }}>
                    <strong>📝 메모:</strong> {gifticon.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* QR 코드 모달 */}
      {showQRModal && selectedGifticon && (
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
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>
              📱 {selectedGifticon.id} QR 코드
            </h3>
            
            {selectedGifticon.isBlocked && (
              <div style={{
                background: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '20px',
                color: '#721c24'
              }}>
                ⚠️ 이 기프티콘은 현재 사용이 정지된 상태입니다.
              </div>
            )}
            
            {qrCodeUrl && (
              <div style={{ marginBottom: '20px' }}>
                <img 
                  src={qrCodeUrl} 
                  alt="QR 코드" 
                  style={{
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    padding: '10px',
                    background: 'white',
                    opacity: selectedGifticon.isBlocked ? 0.5 : 1
                  }}
                />
              </div>
            )}
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <button
                onClick={handleDownloadQR}
                style={{
                  padding: '10px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                💾 다운로드
              </button>
              <button
                onClick={handlePrintQR}
                style={{
                  padding: '10px',
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🖨️ 프린트
              </button>
              <button
                onClick={closeAllModals}
                style={{
                  padding: '10px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ❌ 닫기
              </button>
            </div>
            
            <div style={{
              textAlign: 'left',
              color: '#666',
              fontSize: '14px',
              background: '#f8f9fa',
              padding: '15px',
              borderRadius: '8px'
            }}>
              <div><strong>금액:</strong> {GifticonUtils.formatAmount(selectedGifticon.amount)}</div>
              <div><strong>잔액:</strong> {GifticonUtils.formatAmount(selectedGifticon.remainingAmount || selectedGifticon.amount)}</div>
              <div><strong>구매자:</strong> {selectedGifticon.purchaserName}</div>
              {selectedGifticon.isBlocked && (
                <div style={{ marginTop: '10px', color: '#e74c3c' }}>
                  <strong>상태:</strong> 사용정지 ({selectedGifticon.blockReason})
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 모달 컴포넌트들 */}
      <UsageModal
        show={showUsageModal}
        gifticon={selectedGifticon}
        currentUser={currentUser}
        onClose={closeAllModals}
        onSuccess={handleModalSuccess}
      />

      <BlockModal
        show={showBlockModal}
        gifticon={selectedGifticon}
        currentUser={currentUser}
        type="block"
        onClose={closeAllModals}
        onSuccess={handleModalSuccess}
      />

      <BlockModal
        show={showUnblockModal}
        gifticon={selectedGifticon}
        currentUser={currentUser}
        type="unblock"
        onClose={closeAllModals}
        onSuccess={handleModalSuccess}
      />

      {/* 충전 모달 (NEW!) */}
      <RechargeModal
        show={showRechargeModal}
        gifticon={selectedGifticon}
        currentUser={currentUser}
        onClose={closeAllModals}
        onSuccess={handleModalSuccess}
      />

      {/* 임시 상세보기 모달 */}
      {showDetailModal && (
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
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>
              📝 기프티콘 상세정보
            </h3>
            
            <div style={{ padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🚧</div>
              <p style={{ color: '#666' }}>상세보기 기능은 다음 업데이트에서 제공됩니다.</p>
            </div>

            <button
              onClick={closeAllModals}
              style={{
                padding: '12px 30px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ❌ 닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GifticonList;