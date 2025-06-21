// src/components/GifticonStats.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GifticonService } from '../services/gifticonService';
import { GifticonUtils } from '../utils/gifticonUtils';

function GifticonStats({ onBack }) {
  const { currentUser } = useAuth();
  
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    used: 0,
    expired: 0,
    totalAmount: 0,
    usedAmount: 0,
    remainingAmount: 0,
    todayCreated: 0,
    todayUsed: 0,
    usageRate: 0
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('week'); // week, month, year, all
  const [refreshing, setRefreshing] = useState(false);

  // 통계 데이터 로드
  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');

      // 모든 기프티콘 데이터 가져오기
      const allGifticons = await GifticonService.getGifticons({});
      
      // 오늘 날짜
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // 기본 통계 계산
      const totalStats = {
        total: allGifticons.length,
        active: 0,
        used: 0,
        expired: 0,
        totalAmount: 0,
        usedAmount: 0,
        remainingAmount: 0,
        todayCreated: 0,
        todayUsed: 0,
        usageRate: 0
      };

      // 최근 활동 기록
      const activities = [];

      allGifticons.forEach(gifticon => {
        // 기본 카운트
        if (gifticon.status === 'active') {
          totalStats.active++;
        } else if (gifticon.status === 'used') {
          totalStats.used++;
        } else if (gifticon.status === 'expired') {
          totalStats.expired++;
        }

        // 금액 계산
        totalStats.totalAmount += gifticon.amount || 0;
        totalStats.usedAmount += gifticon.totalUsed || 0;
        totalStats.remainingAmount += gifticon.remainingAmount || gifticon.amount || 0;

        // 오늘 생성된 기프티콘
        if (gifticon.createdAt && gifticon.createdAt.toDate() >= todayStart) {
          totalStats.todayCreated++;
          activities.push({
            type: 'created',
            gifticon: gifticon,
            timestamp: gifticon.createdAt.toDate(),
            description: `새 기프티콘 생성: ${gifticon.id}`
          });
        }

        // 사용 내역이 있는 경우
        if (gifticon.usageHistory && gifticon.usageHistory.length > 0) {
          gifticon.usageHistory.forEach(usage => {
            if (usage.usedAt && usage.usedAt.toDate() >= todayStart) {
              totalStats.todayUsed++;
              activities.push({
                type: 'used',
                gifticon: gifticon,
                usage: usage,
                timestamp: usage.usedAt.toDate(),
                description: `${gifticon.id} 사용: ${GifticonUtils.formatAmount(usage.usedAmount)}`
              });
            }
          });
        }
      });

      // 사용률 계산
      if (totalStats.totalAmount > 0) {
        totalStats.usageRate = (totalStats.usedAmount / totalStats.totalAmount * 100);
      }

      setStats(totalStats);

      // 최근 활동을 시간순으로 정렬 (최신순)
      activities.sort((a, b) => b.timestamp - a.timestamp);
      setRecentActivity(activities.slice(0, 20)); // 최신 20개만

      console.log('✅ 통계 로드 완료:', totalStats);
      
    } catch (error) {
      console.error('❌ 통계 로드 오류:', error);
      setError('통계 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 새로고침
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadStats();
  }, [dateRange]);

  // 로딩 화면
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
        <h3>통계 데이터를 불러오는 중...</h3>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
          <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>📊 기프티콘 통계</h2>
          <p style={{ margin: '0', color: '#666' }}>
            실시간 기프티콘 현황 및 사용 통계
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: '12px 20px',
              background: refreshing ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {refreshing ? '🔄 새로고침 중...' : '🔄 새로고침'}
          </button>
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

      {/* 주요 지표 카드들 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* 총 기프티콘 수 */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '25px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '2px solid #667eea20'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: 0, color: '#333' }}>📋 총 기프티콘</h3>
            <span style={{ fontSize: '32px' }}>🎁</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#667eea' }}>
            {stats.total.toLocaleString()}개
          </div>
          <div style={{ color: '#666', marginTop: '10px' }}>
            오늘 생성: <strong>{stats.todayCreated}개</strong>
          </div>
        </div>

        {/* 총 발행 금액 */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '25px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '2px solid #27ae6020'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: 0, color: '#333' }}>💰 총 발행 금액</h3>
            <span style={{ fontSize: '32px' }}>💎</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#27ae60' }}>
            {GifticonUtils.formatAmount(stats.totalAmount)}
          </div>
          <div style={{ color: '#666', marginTop: '10px' }}>
            평균: <strong>{GifticonUtils.formatAmount(stats.total > 0 ? stats.totalAmount / stats.total : 0)}</strong>
          </div>
        </div>

        {/* 사용된 금액 */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '25px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '2px solid #f39c1220'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: 0, color: '#333' }}>💳 사용된 금액</h3>
            <span style={{ fontSize: '32px' }}>📊</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#f39c12' }}>
            {GifticonUtils.formatAmount(stats.usedAmount)}
          </div>
          <div style={{ color: '#666', marginTop: '10px' }}>
            사용률: <strong>{stats.usageRate.toFixed(1)}%</strong>
          </div>
        </div>

        {/* 남은 금액 */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '25px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '2px solid #3498db20'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: 0, color: '#333' }}>💎 남은 금액</h3>
            <span style={{ fontSize: '32px' }}>💵</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#3498db' }}>
            {GifticonUtils.formatAmount(stats.remainingAmount)}
          </div>
          <div style={{ color: '#666', marginTop: '10px' }}>
            오늘 사용: <strong>{stats.todayUsed}회</strong>
          </div>
        </div>
      </div>

      {/* 상태별 통계 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* 상태 분포 */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '25px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>📈 상태별 분포</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span>✅ 사용가능</span>
              <span><strong>{stats.active}개</strong></span>
            </div>
            <div style={{
              background: '#e9ecef',
              borderRadius: '10px',
              height: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${stats.total > 0 ? (stats.active / stats.total * 100) : 0}%`,
                height: '100%',
                background: '#27ae60',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span>✔️ 사용완료</span>
              <span><strong>{stats.used}개</strong></span>
            </div>
            <div style={{
              background: '#e9ecef',
              borderRadius: '10px',
              height: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${stats.total > 0 ? (stats.used / stats.total * 100) : 0}%`,
                height: '100%',
                background: '#f39c12',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>

          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span>❌ 만료됨</span>
              <span><strong>{stats.expired}개</strong></span>
            </div>
            <div style={{
              background: '#e9ecef',
              borderRadius: '10px',
              height: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${stats.total > 0 ? (stats.expired / stats.total * 100) : 0}%`,
                height: '100%',
                background: '#e74c3c',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>
        </div>

        {/* 사용률 차트 */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '25px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>📊 전체 사용률</h3>
          
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
              position: 'relative',
              display: 'inline-block',
              width: '150px',
              height: '150px'
            }}>
              {/* 원형 차트 배경 */}
              <div style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                background: `conic-gradient(
                  #27ae60 0deg ${stats.usageRate * 3.6}deg,
                  #e9ecef ${stats.usageRate * 3.6}deg 360deg
                )`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#27ae60'
                  }}>
                    {stats.usageRate.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    사용률
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', color: '#666' }}>
            <div>사용된 금액: <strong>{GifticonUtils.formatAmount(stats.usedAmount)}</strong></div>
            <div>전체 금액: <strong>{GifticonUtils.formatAmount(stats.totalAmount)}</strong></div>
          </div>
        </div>
      </div>

      {/* 최근 활동 */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '25px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>⚡ 최근 활동</h3>
        
        {recentActivity.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#666'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📭</div>
            <p>최근 활동이 없습니다.</p>
          </div>
        ) : (
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '15px',
                  borderBottom: '1px solid #e9ecef',
                  ':last-child': { borderBottom: 'none' }
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: activity.type === 'created' ? '#667eea' : '#27ae60',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '15px',
                  fontSize: '18px'
                }}>
                  {activity.type === 'created' ? '🎁' : '💳'}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>
                    {activity.description}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>
                    {activity.timestamp.toLocaleString('ko-KR')}
                  </div>
                </div>
                
                {activity.usage && (
                  <div style={{
                    textAlign: 'right',
                    color: '#27ae60',
                    fontWeight: 'bold'
                  }}>
                    -{GifticonUtils.formatAmount(activity.usage.usedAmount)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default GifticonStats;