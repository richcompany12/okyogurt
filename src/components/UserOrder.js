// UserOrder.js - 전략적 랜딩페이지
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import SimpleFooter from './SimpleFooter';
import '../styles/UserOrder.css';

function UserOrder() {
  const navigate = useNavigate();
  const [selectedStore, setSelectedStore] = useState('');
  const [partnerStores, setPartnerStores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Firebase에서 매장 데이터 가져오기
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const storesQuery = query(
          collection(db, 'stores'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(storesQuery);
        
        const stores = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || '매장명 없음',
          address: doc.data().address || '주소 정보 없음',
          phone: doc.data().phone || '전화번호 없음',
          status: '운영중',
          description: `${doc.data().name || '매장'}에서 QR 주문 시스템을 이용하세요`
        }));
        
        setPartnerStores(stores);
      } catch (error) {
        console.error('매장 데이터 가져오기 실패:', error);
        // 에러 시 기본 데이터 표시
        setPartnerStores([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  // 시범 운영점 데이터 (고정)
  const demoStore = {
    id: 'ntNHEyN6dubXeLwAAssS',
    name: '요거트퍼플 동탄반송점',
    address: '경기도 화성시 동탄지성로 321',
    status: '시범 운영점',
    description: '저희가 직접 운영하는 시범 매장으로 시스템을 체험해보세요',
    phone: '031-5189-6586'
  };

  const handleStoreSelect = (storeId) => {
    if (storeId === 'ntNHEyN6dubXeLwAAssS') {
      navigate(`/order/${storeId}`);
    } else {
      // 실제 매장 ID들은 모두 주문 페이지로 이동
      navigate(`/order/${storeId}`);
    }
  };

  return (
    <div className="user-order-page">
      {/* 헤더 섹션 */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="logo-area">
            <div className="qr-icon">📱</div>
            <h1 className="brand-title">QR 주문 시스템</h1>
            <p className="brand-subtitle">혁신적인 무인 주문 플랫폼</p>
          </div>
          
          <div className="hero-features">
            <div className="feature-item">
              <div className="feature-icon">⚡</div>
              <h3>빠른 주문</h3>
              <p>QR코드 스캔으로 즉시 주문</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🚚</div>
              <h3>테이블 배달</h3>
              <p>매장 내 정확한 위치로 배달</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">💳</div>
              <h3>간편 결제</h3>
              <p>다양한 결제 수단 지원</p>
            </div>
          </div>
        </div>
      </div>

      {/* 시스템 소개 섹션 */}
      <div className="system-intro">
        <div className="intro-container">
          <h2 className="section-title">🚀 혁신적인 주문 경험</h2>
          <div className="intro-grid">
            <div className="intro-card">
              <div className="step-number">1</div>
              <h4>QR코드 스캔</h4>
              <p>테이블의 QR코드를 스캔하면<br/>즉시 메뉴 페이지가 열립니다</p>
            </div>
            <div className="intro-card">
              <div className="step-number">2</div>
              <h4>메뉴 선택</h4>
              <p>직관적인 인터페이스로<br/>원하는 메뉴를 선택하세요</p>
            </div>
            <div className="intro-card">
              <div className="step-number">3</div>
              <h4>간편 결제</h4>
              <p>다양한 결제 수단으로<br/>빠르고 안전하게 결제</p>
            </div>
            <div className="intro-card">
              <div className="step-number">4</div>
              <h4>테이블 배달</h4>
              <p>주문하신 위치로<br/>신선한 제품을 배달해드립니다</p>
            </div>
          </div>
        </div>
      </div>

      {/* 제휴 매장 섹션 */}
      <div className="partner-stores">
        <div className="stores-container">
          <h2 className="section-title">🏪 매장 선택</h2>
          <p className="section-subtitle">원하시는 매장을 선택하여 주문을 시작하세요</p>
          
          <div className="stores-grid">
            {/* 시범 운영점 카드 (고정) */}
            <div 
              className="store-card demo-store active"
              onClick={() => handleStoreSelect(demoStore.id)}
            >
              <div className="store-header">
                <h3 className="store-name">{demoStore.name}</h3>
                <span className="store-status demo">
                  {demoStore.status}
                </span>
              </div>
              
              <div className="store-info">
                <p className="store-description">{demoStore.description}</p>
                <div className="store-details">
                  <p className="store-address">📍 {demoStore.address}</p>
                  <p className="store-phone">📞 {demoStore.phone}</p>
                </div>
              </div>
              
              <div className="store-action">
                <button className="order-btn demo">
                  시스템 체험하기 →
                </button>
              </div>
            </div>

            {/* 현재 제휴 매장들 카드 */}
            <div className="partner-stores-card">
              <div className="store-header">
                <h3 className="store-name">현재 제휴 가맹점</h3>
                <span className="store-status partner">
                  {partnerStores.length}개 운영중
                </span>
              </div>
              
              <div className="store-info">
                <p className="store-description">
                  이미 이렇게 많은 매장들이 저희 QR 주문 시스템을 사용하고 있습니다
                </p>
                
                {loading ? (
                  <div className="loading-stores">
                    <div className="loading-spinner">⏳</div>
                    <p>매장 정보를 불러오는 중...</p>
                  </div>
                ) : (
                  <div className="stores-list">
                    {partnerStores.length > 0 ? (
                      partnerStores.map((store, index) => (
                        <div 
                          key={store.id}
                          className="store-item"
                          onClick={() => handleStoreSelect(store.id)}
                        >
                          <div className="store-item-info">
                            <h4 className="store-item-name">{store.name}</h4>
                            <p className="store-item-address">📍 {store.address}</p>
                          </div>
                          <button className="store-item-btn">
                            주문하기
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="no-stores">
                        <p>🚀 곧 더 많은 매장들이 합류할 예정입니다!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 기술력 어필 섹션 */}
      <div className="tech-showcase">
        <div className="tech-container">
          <h2 className="section-title">💡 혁신 기술</h2>
          <div className="tech-grid">
            <div className="tech-item">
              <div className="tech-icon">🔒</div>
              <h4>보안 결제</h4>
              <p>포트원 기반 안전한 결제 시스템</p>
            </div>
            <div className="tech-item">
              <div className="tech-icon">☁️</div>
              <h4>클라우드 기반</h4>
              <p>실시간 주문 관리 및 동기화</p>
            </div>
            <div className="tech-item">
              <div className="tech-icon">📊</div>
              <h4>데이터 분석</h4>
              <p>매출 분석 및 고객 관리 시스템</p>
            </div>
            <div className="tech-item">
              <div className="tech-icon">🎯</div>
              <h4>맞춤형 UI</h4>
              <p>매장별 브랜딩 및 메뉴 커스터마이징</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA 섹션 */}
      <div className="cta-section">
        <div className="cta-container">
          <h2>🤝 파트너십 문의</h2>
          <p>혁신적인 QR 주문 시스템을 귀하의 매장에 도입해보세요</p>
          <div className="cta-buttons">
            <a href="mailto:kso121258@gmail.com" className="contact-btn primary">
              제휴 문의하기
            </a>
            <a href="tel:031-5189-6586" className="contact-btn secondary">
              전화 상담
            </a>
          </div>
        </div>
      </div>

      <SimpleFooter />
    </div>
  );
}

export default UserOrder;