// src/components/StatsDashboard.js
import React, { useState, useEffect } from 'react';
import {
    collection,
    getDocs,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import './StatsDashboard.css';

const StatsDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stores, setStores] = useState([]); // 상점 목록
    const [selectedStore, setSelectedStore] = useState('all'); // 선택된 상점
    const [stats, setStats] = useState({
        todayOrders: 0,
        todayRevenue: 0,
        totalOrders: 0,
        totalRevenue: 0,
        popularMenus: [],
        recentOrders: [],
        dailyStats: [] // 일자별 통계 추가
    });

    useEffect(() => {
        loadStores();
        loadStatistics();
    }, []);

    useEffect(() => {
        loadStatistics();
    }, [selectedStore]);

    // 상점 목록 로딩
    const loadStores = async () => {
        try {
            const storesQuery = query(collection(db, 'stores'), orderBy('name', 'asc'));
            const storesSnapshot = await getDocs(storesQuery);
            const storesList = storesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setStores(storesList);
            console.log('로드된 상점 수:', storesList.length);
        } catch (error) {
            console.error('상점 로딩 오류:', error);
        }
    };

    // 상점 선택 핸들러
    const handleStoreChange = (e) => {
        setSelectedStore(e.target.value);
    };

    // 통계 로딩 함수
    const loadStatistics = async () => {
        try {
            setLoading(true);
            console.log('=== 통계 로딩 시작 ===');
            console.log('선택된 상점:', selectedStore);

            // 모든 주문 데이터 가져오기 (상점 필터링 적용)
            let ordersQuery;
            if (selectedStore === 'all') {
                ordersQuery = query(
                    collection(db, 'orders'),
                    where('status', 'in', ['paid', 'confirmed', 'completed']),
                    orderBy('createdAt', 'desc')
                );
            } else {
                ordersQuery = query(
                    collection(db, 'orders'),
                    where('status', 'in', ['paid', 'confirmed', 'completed']),
                    where('storeId', '==', selectedStore),
                    orderBy('createdAt', 'desc')
                );
            }

            const ordersSnapshot = await getDocs(ordersQuery);
            const allOrders = ordersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log('로드된 주문 수:', allOrders.length);

            // 오늘 날짜 계산
            const today = new Date();
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

            console.log('오늘 범위:', todayStart, '~', todayEnd);

            // 오늘 주문 필터링
            const todayOrders = allOrders.filter(order => {
                let orderDate;
                if (order.createdAt?.toDate) {
                    orderDate = order.createdAt.toDate();
                } else if (order.createdAt?.seconds) {
                    orderDate = new Date(order.createdAt.seconds * 1000);
                } else if (order.timestamp) {
                    orderDate = new Date(order.timestamp);
                } else {
                    return false;
                }
                return orderDate >= todayStart && orderDate < todayEnd;
            });

            console.log('오늘 주문 수:', todayOrders.length);

            // 오늘 매출 계산
            const todayRevenue = todayOrders.reduce((sum, order) => {
                return sum + (order.amount || 0);
            }, 0);

            // 전체 매출 계산
            const totalRevenue = allOrders.reduce((sum, order) => {
                return sum + (order.amount || 0);
            }, 0);

            // 인기 메뉴 계산
            const menuCount = {};
            allOrders.forEach(order => {
                if (order.items && Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        const menuName = item.name || '알 수 없는 메뉴';
                        if (menuCount[menuName]) {
                            menuCount[menuName].count += item.quantity || 1;
                            menuCount[menuName].revenue += (item.price || 0) * (item.quantity || 1);
                        } else {
                            menuCount[menuName] = {
                                name: menuName,
                                count: item.quantity || 1,
                                revenue: (item.price || 0) * (item.quantity || 1),
                                price: item.price || 0
                            };
                        }
                    });
                }
            });

            // 인기 메뉴 TOP 5 정렬
            const popularMenus = Object.values(menuCount)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            console.log('인기 메뉴:', popularMenus);

            // 최근 주문 5개
            const recentOrders = allOrders.slice(0, 5).map(order => ({
                id: order.id,
                orderNumber: order.orderNumber,
                amount: order.amount,
                storeName: order.storeName,
                status: order.status,
                createdAt: order.createdAt,
                timestamp: order.timestamp
            }));

            // 일자별 통계 계산 (최근 7일)
            const dailyStats = calculateDailyStats(allOrders);

            // 상태 업데이트
            setStats({
                todayOrders: todayOrders.length,
                todayRevenue: todayRevenue,
                totalOrders: allOrders.length,
                totalRevenue: totalRevenue,
                popularMenus: popularMenus,
                recentOrders: recentOrders,
                dailyStats: dailyStats // 일자별 통계 추가
            });

            console.log('=== 통계 로딩 완료 ===');
            setLoading(false);

        } catch (error) {
            console.error('통계 로딩 오류:', error);
            setLoading(false);
        }
    };

    // 일자별 통계 계산 함수
    const calculateDailyStats = (orders) => {
        const dailyData = {};

        // 최근 7일 날짜 생성
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            dailyData[dateKey] = {
                date: dateKey,
                dateDisplay: date.toLocaleDateString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short'
                }),
                orders: 0,
                revenue: 0
            };
        }

        // 주문 데이터로 통계 채우기
        orders.forEach(order => {
            let orderDate;
            if (order.createdAt?.toDate) {
                orderDate = order.createdAt.toDate();
            } else if (order.createdAt?.seconds) {
                orderDate = new Date(order.createdAt.seconds * 1000);
            } else if (order.timestamp) {
                orderDate = new Date(order.timestamp);
            } else {
                return;
            }

            const dateKey = orderDate.toISOString().split('T')[0];
            if (dailyData[dateKey]) {
                dailyData[dateKey].orders += 1;
                dailyData[dateKey].revenue += (order.amount || 0);
            }
        });

        // 배열로 변환 및 날짜 순 정렬
        return Object.values(dailyData).sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    // 새로고침 함수
    const refreshStats = () => {
        loadStatistics();
    };

    // 날짜 포맷 함수
    const formatDate = (dateData) => {
        let date;
        if (dateData?.toDate) {
            date = dateData.toDate();
        } else if (dateData?.seconds) {
            date = new Date(dateData.seconds * 1000);
        } else if (dateData) {
            date = new Date(dateData);
        } else {
            return '날짜 없음';
        }

        return date.toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // 상태 한글 변환
    const getStatusText = (status) => {
        const statusMap = {
            'pending': '대기중',
            'paid': '결제완료',
            'confirmed': '주문확인',
            'completed': '배달완료',
            'cancelled': '취소됨'
        };
        return statusMap[status] || status;
    };

    if (loading) {
        return (
            <div className="stats-loading">
                <div className="loading-spinner"></div>
                <p>통계 데이터를 불러오는 중...</p>
            </div>
        );
    }

    return (
        <div className="stats-dashboard">
            <div className="stats-header">
                <h2>📊 매출 통계</h2>
                <div className="header-controls">
                    <select
                        value={selectedStore}
                        onChange={handleStoreChange}
                        className="store-selector"
                    >
                        <option value="all">전체 제휴상점</option>
                        {stores.map(store => (
                            <option key={store.id} value={store.id}>
                                {store.name}
                            </option>
                        ))}
                    </select>
                    <button onClick={refreshStats} className="refresh-btn">
                        🔄 새로고침
                    </button>
                </div>
            </div>

            {/* 주요 지표 카드들 */}
            <div className="stats-cards">
                <div className="stat-card today">
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                        <h3>오늘 주문</h3>
                        <div className="stat-number">{stats.todayOrders.toLocaleString()}건</div>
                        <div className="stat-revenue">{stats.todayRevenue.toLocaleString()}원</div>
                    </div>
                </div>

                <div className="stat-card total">
                    <div className="stat-icon">📈</div>
                    <div className="stat-content">
                        <h3>총 누적</h3>
                        <div className="stat-number">{stats.totalOrders.toLocaleString()}건</div>
                        <div className="stat-revenue">{stats.totalRevenue.toLocaleString()}원</div>
                    </div>
                </div>

                <div className="stat-card average">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <h3>평균 주문금액</h3>
                        <div className="stat-number">
                            {stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders).toLocaleString() : 0}원
                        </div>
                        <div className="stat-sub">주문당 평균</div>
                    </div>
                </div>
            </div>

            {/* 일자별 통계 */}
            <div className="stats-section">
                <h3>📅 일자별 주문 현황 ({selectedStore === 'all' ? '전체 상점' : stores.find(s => s.id === selectedStore)?.name || '선택된 상점'})</h3>
                <div className="daily-stats-table">
                    <div className="table-header">
                        <div className="col-date">날짜</div>
                        <div className="col-orders">주문건수</div>
                        <div className="col-revenue">매출</div>
                        <div className="col-average">평균주문금액</div>
                    </div>
                    {stats.dailyStats.length > 0 ? (
                        stats.dailyStats.map(day => (
                            <div key={day.date} className="table-row">
                                <div className="col-date">
                                    <span className="date-display">{day.dateDisplay}</span>
                                    <span className="date-full">{day.date}</span>
                                </div>
                                <div className="col-orders">
                                    <span className="orders-count">{day.orders}</span>건
                                </div>
                                <div className="col-revenue">
                                    <span className="revenue-amount">{day.revenue.toLocaleString()}</span>원
                                </div>
                                <div className="col-average">
                                    {day.orders > 0 ? Math.round(day.revenue / day.orders).toLocaleString() : 0}원
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-data">데이터가 없습니다.</div>
                    )}
                </div>
            </div>

            {/* 인기 메뉴 */}
            <div className="stats-section">
                <h3>🍦 인기 메뉴 TOP 5</h3>
                <div className="popular-menus">
                    {stats.popularMenus.length > 0 ? (
                        stats.popularMenus.map((menu, index) => (
                            <div key={menu.name} className="menu-item">
                                <div className="menu-rank">#{index + 1}</div>
                                <div className="menu-info">
                                    <div className="menu-name">{menu.name}</div>
                                    <div className="menu-stats">
                                        <span className="menu-count">{menu.count}개 주문</span>
                                        <span className="menu-revenue">{menu.revenue.toLocaleString()}원</span>
                                    </div>
                                </div>
                                <div className="menu-price">{menu.price.toLocaleString()}원</div>
                            </div>
                        ))
                    ) : (
                        <div className="no-data">아직 주문 데이터가 없습니다.</div>
                    )}
                </div>
            </div>

            {/* 최근 주문 */}
            <div className="stats-section">
                <h3>📋 최근 주문 내역</h3>
                <div className="recent-orders">
                    {stats.recentOrders.length > 0 ? (
                        stats.recentOrders.map(order => (
                            <div key={order.id} className="order-item">
                                <div className="order-info">
                                    <div className="order-number">{order.orderNumber}</div>
                                    <div className="order-store">{order.storeName}</div>
                                </div>
                                <div className="order-details">
                                    <div className="order-amount">{order.amount?.toLocaleString()}원</div>
                                    <div className="order-time">{formatDate(order.createdAt || order.timestamp)}</div>
                                </div>
                                <div className={`order-status ${order.status}`}>
                                    {getStatusText(order.status)}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-data">최근 주문이 없습니다.</div>
                    )}
                </div>
            </div>

            {/* 요약 정보 */}
            <div className="stats-summary">
                <div className="summary-item">
                    <span>💡 인사이트</span>
                    <p>
                        {stats.todayOrders > 0
                            ? `오늘 ${stats.todayOrders}건의 주문으로 ${stats.todayRevenue.toLocaleString()}원의 매출을 달성했습니다!`
                            : '오늘은 아직 주문이 없습니다. 홍보를 늘려보세요!'
                        }
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StatsDashboard;