// src/components/Order/OrderForm.js
import React, { useState } from 'react';
import * as PortOne from "@portone/browser-sdk/v2"; // 포트원 V2 SDK
import './OrderForm.css';

const OrderForm = ({ cart, totalPrice, onSubmit, onBack }) => {
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

      // 포트원 결제창 호출
      const response = await PortOne.requestPayment(paymentConfig);
      
      console.log('포트원 응답:', response);

      // 결제 성공 확인
      if (response.code != null) {
        // 결제 실패
        console.error('❌ 결제 실패:', response);
        alert(`결제 실패: ${response.message || '알 수 없는 오류'}`);
        return;
      }

      // 결제 성공
      console.log('✅ 결제 성공:', response);
      
      // 전화번호 포맷팅
      const formattedPhone = formData.phone.replace(/-/g, '').replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
      
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

      console.log('주문 정보:', customerInfo);

      // 상위 컴포넌트의 주문 저장 함수 호출
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
                <span className="item-name">{item.name}</span>
                <span className="item-quantity">×{item.quantity}</span>
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
          <h3>📱 결제 정보</h3>
          <p className="form-description">간단한 정보만 입력하시면 결제가 진행됩니다!</p>
          
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
              <small className="form-hint">결제 및 주문 확인을 위해 필요합니다</small>
            </div>

            {/* 테이블 정보 (선택) */}
            <div className="form-group">
              <label htmlFor="tableNumber">테이블 위치 (선택)</label>
              <input
                type="text"
                id="tableNumber"
                name="tableNumber"
                value={formData.tableNumber}
                onChange={handleChange}
                placeholder="예: 3번 테이블, 창가쪽 2번 자리"
                maxLength={50}
              />
              <small className="form-hint">테이블 번호나 위치를 알려주시면 더 빠른 배달이 가능합니다</small>
            </div>

            {/* 요청사항 (선택) */}
            <div className="form-group">
              <label htmlFor="specialRequests">요청사항 (선택)</label>
              <textarea
                id="specialRequests"
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleChange}
                placeholder="특별한 요청사항이 있으시면 입력해주세요"
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
                ← 메뉴로 돌아가기
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

        {/* 결제 안내 메시지 */}
        <div className="payment-notice">
          <h4>💳 결제 안내</h4>
          <ul>
            <li>💡 <strong>안전한 결제:</strong> 포트원 보안 결제 시스템을 사용합니다</li>
            <li>📱 <strong>간편 결제:</strong> 카드 결제가 가능합니다</li>
            <li>📞 <strong>주문 확인:</strong> 결제 완료 후 SMS로 알림을 보내드립니다</li>
            <li>🚚 <strong>빠른 배달:</strong> 주문 확인 후 5-60분 내 배달 완료</li>
          </ul>
        </div>

        {/* 환경 정보 (개발용 - 나중에 제거) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="dev-info" style={{ 
            marginTop: '20px', 
            padding: '10px', 
            backgroundColor: '#f0f0f0', 
            borderRadius: '5px',
            fontSize: '12px' 
          }}>
            <h5>🔧 개발 정보</h5>
            <p>Store ID: {process.env.REACT_APP_PORTONE_STORE_ID}</p>
            <p>Channel Key: {process.env.REACT_APP_PORTONE_CHANNEL_KEY}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderForm;