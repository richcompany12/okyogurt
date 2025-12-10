// src/components/Order/OrderForm.js
import React, { useState } from 'react';
import * as PortOne from "@portone/browser-sdk/v2"; // 포트원 V2 SDK
import './OrderForm.css';

const OrderForm = ({ cart, totalPrice, storeId, onSubmit, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    tableNumber: '', // 테이블 정보 (선택)
    specialRequests: '' // 요청사항 (선택)
  });

  const [errors, setErrors] = useState({});

  // 입력값 변경 처리
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 에러 초기화
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // 폼 유효성 검사 (전화번호만 필수)
  const validateForm = () => {
    const newErrors = {};

    // 전화번호 검사 (필수)
    const phoneRegex = /^010-?\d{4}-?\d{4}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = '전화번호를 입력해주세요';
    } else if (!phoneRegex.test(formData.phone.replace(/-/g, ''))) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔥 포트원 결제 처리 함수
  const handlePayment = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // 결제 ID 생성
      const paymentId = `payment-${Date.now()}`;
      
      // 전화번호 포맷팅
      const formattedPhone = formData.phone.replace(/-/g, '').replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
      
      // 🆕 결제 시작 전에 로컬스토리지 저장 (모바일 리디렉션 대비)
      localStorage.setItem('cart', JSON.stringify(cart));
      localStorage.setItem('customerInfo', JSON.stringify({
        phone: formattedPhone,
        tableNumber: formData.tableNumber.trim() || null,
        specialRequests: formData.specialRequests.trim() || null
      }));
      localStorage.setItem('currentStoreId', storeId);
      
      console.log('=== 로컬스토리지 저장 완료 ===');
      console.log('cart:', cart);
      console.log('customerInfo:', {
        phone: formattedPhone,
        tableNumber: formData.tableNumber.trim() || null,
        specialRequests: formData.specialRequests.trim() || null
      });
      console.log('storeId:', storeId);
      
      console.log('=== 포트원 결제 시작 ===');
      console.log('결제 ID:', paymentId);
      console.log('결제 금액:', totalPrice);

      // 포트원 V2 결제 설정
      const paymentConfig = {
        storeId: process.env.REACT_APP_PORTONE_STORE_ID,
        channelKey: process.env.REACT_APP_PORTONE_CHANNEL_KEY,
        paymentId: paymentId,
        orderName: '요거트퍼플 아이스크림',
        totalAmount: totalPrice,
        currency: "CURRENCY_KRW",
        payMethod: "CARD",
        customer: {
          phoneNumber: formData.phone.replace(/-/g, '')
        },
        redirectUrl: `${window.location.origin}/payment-complete`
      };

      console.log('결제 설정:', paymentConfig);

      // 포트원 결제창 호출 (모바일에서는 여기서 리디렉션됨!)
      const response = await PortOne.requestPayment(paymentConfig);
      
      console.log('포트원 응답:', response);

      // 🔄 아래 코드는 PC에서만 실행됨 (모바일은 리디렉션으로 인해 실행 안됨)
      
      // 결제 성공 확인
      if (response.code != null) {
        // 결제 실패
        console.error('❌ 결제 실패:', response);
        alert(`결제 실패: ${response.message || '알 수 없는 오류'}`);
        return;
      }

      // 결제 성공 (PC에서만 실행)
      console.log('✅ 결제 성공 (PC):', response);
      
      // 주문 정보 생성
      const customerInfo = {
        phone: formattedPhone,
        tableNumber: formData.tableNumber.trim() || null,
        specialRequests: formData.specialRequests.trim() || null,
        // 결제 정보 추가
        paymentId: paymentId,
        paymentResponse: response,
        paymentStatus: 'completed'
      };

      console.log('주문 정보 (PC):', customerInfo);

      // 상위 컴포넌트의 주문 저장 함수 호출 (PC에서만 실행)
      await onSubmit(customerInfo);

    } catch (error) {
      console.error('❌ 결제 처리 중 오류:', error);
      alert(`결제 처리 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 폼 제출 처리 (결제 버튼 클릭)
  const handleSubmit = async (e) => {
    e.preventDefault();
    await handlePayment();
  };

  // 총 수량 계산
  const getTotalQuantity = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <div className="order-form">
      <div className="form-container">
        {/* 주문 요약 */}
        <div className="order-summary">
          <h3>📋 주문 요약</h3>
          
          <div className="summary-items">
            {cart.map(item => (
              <div key={item.id} className="summary-item">
                <div className="item-info">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">×{item.quantity}</span>
                </div>
                <span className="item-price">{(item.price * item.quantity).toLocaleString()}원</span>
              </div>
            ))}
          </div>
          
          <div className="summary-total">
            <div className="total-row">
              <span>총 {getTotalQuantity()}개 상품</span>
              <span className="total-amount">{totalPrice.toLocaleString()}원</span>
            </div>
          </div>
        </div>

        {/* 간소화된 주문 정보 입력 */}
        <div className="customer-form">
          <h3>📱 주문 정보</h3>
          <p className="form-description">간단한 정보만 입력하시면 주문이 완료됩니다!</p>
          
          <form onSubmit={handleSubmit}>
            {/* 전화번호 (필수) */}
            <div className="form-group">
              <label htmlFor="phone">
                전화번호 <span className="required">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="010-1234-5678"
                className={errors.phone ? 'error' : ''}
                maxLength={13}
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
              <small className="form-hint">주문 확인 및 배달 알림을 위해 필요합니다</small>
            </div>

            {/* 테이블 정보 (선택) */}
            <div className="form-group">
              <label htmlFor="tableNumber">테이블 위치 <span className="optional">(선택)</span></label>
              <input
                type="text"
                id="tableNumber"
                name="tableNumber"
                value={formData.tableNumber}
                onChange={handleChange}
                placeholder="예: 3번 테이블, 창가쪽 2번"
                maxLength={50}
              />
              <small className="form-hint">매장 내 위치를 알려주시면 더 빠른 서비스가 가능해요</small>
            </div>

            {/* 요청사항 (선택) */}
            <div className="form-group">
              <label htmlFor="specialRequests">요청사항 <span className="optional">(선택)</span></label>
              <textarea
                id="specialRequests"
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleChange}
                placeholder="특별한 요청사항이 있으시면 자유롭게 적어주세요"
                rows="3"
                maxLength={200}
              />
              <small className="form-hint">{formData.specialRequests.length}/200자</small>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-back"
                onClick={onBack}
                disabled={loading}
              >
                ← 메뉴 선택
              </button>
              
              <button 
                type="submit" 
                className="btn btn-submit payment-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    결제 진행 중...
                  </>
                ) : (
                  <>
                    💳 {totalPrice.toLocaleString()}원 결제하기
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 주문 및 배달 안내 */}
        <div className="order-notice">
          <h4>🚀 주문 및 배달 안내</h4>
          <div className="notice-grid">
            <div className="notice-item">
              <span className="notice-icon">💳</span>
              <div className="notice-content">
                <strong>안전한 결제</strong>
                <p>포트원 보안 결제 시스템</p>
              </div>
            </div>
            
            <div className="notice-item">
              <span className="notice-icon">📱</span>
              <div className="notice-content">
                <strong>주문 확인</strong>
                <p>결제 완료 후 SMS 알림</p>
              </div>
            </div>
            
            <div className="notice-item">
              <span className="notice-icon">⏰</span>
              <div className="notice-content">
                <strong>빠른 배달</strong>
                <p>평균 10-20분 내 배달</p>
              </div>
            </div>
            
            <div className="notice-item">
              <span className="notice-icon">📞</span>
              <div className="notice-content">
                <strong>배달 시간</strong>
                <p>정확한 소요시간은 매장에서 주문 확인 후 문자로 안내</p>
              </div>
            </div>
          </div>
        </div>

        {/* 환경 정보 (개발용 - 나중에 제거) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="dev-info">
            <h5>🔧 개발 정보</h5>
            <p>Store ID: {process.env.REACT_APP_PORTONE_STORE_ID}</p>
            <p>Channel Key: {process.env.REACT_APP_PORTONE_CHANNEL_KEY}</p>
            <p>현재 storeId: {storeId}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderForm;