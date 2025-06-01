// src/components/Order/Cart.js
import React, { useState } from 'react';
import './Cart.css';

const Cart = ({ 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  onProceed, 
  totalPrice 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [imageErrors, setImageErrors] = useState({}); // 이미지 에러 추적

  // 총 수량 계산
  const getTotalQuantity = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  // 수량 변경 핸들러
  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }
    onUpdateQuantity(itemId, newQuantity);
  };

  // 아이템 제거 핸들러
  const handleRemoveItem = (itemId) => {
    const item = items.find(item => item.id === itemId);
    if (window.confirm(`${item.name}을(를) 장바구니에서 제거하시겠습니까?`)) {
      onRemoveItem(itemId);
    }
  };

  // 이미지 에러 핸들러
  const handleImageError = (itemId) => {
    setImageErrors(prev => ({
      ...prev,
      [itemId]: true
    }));
  };

  // 장바구니가 비어있는 경우
  if (items.length === 0) {
    return (
      <div className="cart empty">
        <div className="cart-header">
          <h3>🛒 장바구니</h3>
        </div>
        <div className="cart-empty">
          <div className="empty-icon">🛒</div>
          <p>장바구니가 비어있습니다</p>
          <small>원하는 메뉴를 선택해주세요</small>
        </div>
      </div>
    );
  }

  return (
    <div className="cart">
      {/* 장바구니 헤더 */}
      <div className="cart-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>🛒 장바구니</h3>
        <div className="cart-summary">
          <span className="item-count">{getTotalQuantity()}개</span>
          <button className="expand-btn">
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* 장바구니 아이템들 */}
      {isExpanded && (
        <div className="cart-content">
          <div className="cart-items">
            {items.map(item => (
              <div key={item.id} className="cart-item">
                <div className="item-image">
                  {imageErrors[item.id] ? (
                    // 이미지 로드 실패 시 이모지 표시
                    <div style={{
                      width: '60px',
                      height: '60px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      borderRadius: '8px'
                    }}>
                      🍦
                    </div>
                  ) : (
                    <img 
                      src={item.image || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" fill="%23f0f0f0"/></svg>'} 
                      alt={item.name}
                      onError={() => handleImageError(item.id)}
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                  )}
                </div>
                
                <div className="item-info">
                  <h4 className="item-name">{item.name}</h4>
                  <p className="item-price">{item.price.toLocaleString()}원</p>
                </div>
                
                <div className="item-controls">
                  <div className="quantity-controls">
                    <button 
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button 
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  
                  <button 
                    className="remove-btn"
                    onClick={() => handleRemoveItem(item.id)}
                    title="제거"
                  >
                    🗑️
                  </button>
                </div>
                
                <div className="item-total">
                  {(item.price * item.quantity).toLocaleString()}원
                </div>
              </div>
            ))}
          </div>

          {/* 장바구니 하단 */}
          <div className="cart-footer">
            <div className="total-section">
              <div className="total-row">
                <span>총 {getTotalQuantity()}개 상품</span>
                <span className="total-price">{totalPrice.toLocaleString()}원</span>
              </div>
            </div>
            
            <button 
              className="proceed-btn"
              onClick={onProceed}
            >
              주문하기
            </button>
          </div>
        </div>
      )}

      {/* 축소된 상태에서의 하단 고정 버튼 */}
      {!isExpanded && (
        <div className="cart-collapsed-footer">
          <div className="collapsed-total">
            <span>{getTotalQuantity()}개 · {totalPrice.toLocaleString()}원</span>
          </div>
          <button 
            className="proceed-btn-collapsed"
            onClick={onProceed}
          >
            주문하기
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;