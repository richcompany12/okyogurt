// src/components/Order/MenuList.js
import React, { useState } from 'react';
import './MenuList.css';

const MenuList = ({ menus, onAddToCart }) => {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [searchTerm, setSearchTerm] = useState('');
  const [imageErrors, setImageErrors] = useState({}); // 이미지 에러 추적

  // 카테고리 목록 생성
  const categories = ['전체', ...new Set(menus.map(menu => menu.category))];

  // 메뉴 필터링
  const filteredMenus = menus.filter(menu => {
    const matchesCategory = selectedCategory === '전체' || menu.category === selectedCategory;
    const matchesSearch = menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         menu.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && menu.isAvailable;
  });

  // 장바구니 추가 핸들러
  const handleAddToCart = (menu) => {
    onAddToCart(menu, 1);
    
    // 추가 효과 (선택사항)
    const button = document.querySelector(`[data-menu-id="${menu.id}"] .add-btn`);
    if (button) {
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = 'scale(1)';
      }, 150);
    }
  };

  // 이미지 에러 핸들러
  const handleImageError = (menuId) => {
    setImageErrors(prev => ({
      ...prev,
      [menuId]: true
    }));
  };

  return (
    <div className="menu-list">
      {/* 메뉴 헤더 */}
      <div className="menu-header">
        <h2>🍦 메뉴</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder="메뉴 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div className="category-tabs">
        {categories.map(category => (
          <button
            key={category}
            className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* 메뉴 그리드 */}
      <div className="menu-grid">
        {filteredMenus.length > 0 ? (
          filteredMenus.map(menu => (
            <div 
              key={menu.id} 
              className="menu-item"
              data-menu-id={menu.id}
            >
              <div className="menu-image">
                {imageErrors[menu.id] ? (
                  // 이미지 로드 실패 시 이모지 표시
                  <div style={{
                    width: '100%',
                    height: '150px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px',
                    borderRadius: '8px'
                  }}>
                    🍦
                  </div>
                ) : (
                  <img 
                    src={menu.image || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="%23f0f0f0"/></svg>'} 
                    alt={menu.name}
                    onError={() => handleImageError(menu.id)}
                    style={{
                      width: '100%',
                      height: '150px',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                )}
                {!menu.isAvailable && (
                  <div className="sold-out-overlay">
                    <span>품절</span>
                  </div>
                )}
              </div>
              
              <div className="menu-info">
                <h3 className="menu-name">{menu.name}</h3>
                <p className="menu-description">{menu.description}</p>
                <div className="menu-footer">
                  <span className="menu-price">
                    {menu.price.toLocaleString()}원
                  </span>
                  <button 
                    className="add-btn"
                    onClick={() => handleAddToCart(menu)}
                    disabled={!menu.isAvailable}
                  >
                    {menu.isAvailable ? '+' : '품절'}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-menu">
            <div className="empty-icon">🔍</div>
            <p>검색 결과가 없습니다</p>
            <small>다른 검색어를 시도해보세요</small>
          </div>
        )}
      </div>

      {/* 메뉴 통계 */}
      <div className="menu-stats">
        <small>
          총 {filteredMenus.length}개 메뉴 
          {searchTerm && ` · "${searchTerm}" 검색 결과`}
          {selectedCategory !== '전체' && ` · ${selectedCategory} 카테고리`}
        </small>
      </div>
    </div>
  );
};

export default MenuList;