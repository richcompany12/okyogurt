// src/utils/gifticonUtils.js

export class GifticonUtils {
  // 기프티콘 ID 생성 (GIFT-YYYYMMDD-XXXXX 형식)
  static generateGifticonId() {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    
    // 5자리 랜덤 영숫자
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomStr = '';
    for (let i = 0; i < 5; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return `GIFT-${dateStr}-${randomStr}`;
  }

  // 보안 해시 생성 (간단한 폴백 방식 사용)
  static async generateSecurityHash(gifticonId, amount, createdAt) {
    try {
      // Web Crypto API 시도
      if (window.crypto && window.crypto.subtle) {
        const data = `${gifticonId}-${amount}-${createdAt}`;
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
      }
    } catch (error) {
      console.warn('Web Crypto API 사용 불가:', error);
    }
    
    // 폴백: 간단한 해시 생성
    const data = `${gifticonId}-${amount}-${createdAt}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit 정수로 변환
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  // 만료일 계산 (생성일로부터 1년)
  static calculateExpiryDate(createdAt = new Date()) {
    const expiryDate = new Date(createdAt);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    return expiryDate;
  }

  // 금액 포맷팅
  static formatAmount(amount) {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  }

  // 날짜 포맷팅
  static formatDate(date) {
    if (!date) return '';
    
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 기프티콘 상태 텍스트
  static getStatusText(status, remainingAmount = 0, expiresAt = null) {
    if (expiresAt && expiresAt.toDate() < new Date()) {
      return { text: '만료됨', color: '#95a5a6', emoji: '⏰' };
    }

    switch (status) {
      case 'active':
        return remainingAmount > 0 
          ? { text: '사용가능', color: '#27ae60', emoji: '✅' }
          : { text: '사용완료', color: '#e74c3c', emoji: '🏁' };
      case 'used':
        return { text: '사용완료', color: '#e74c3c', emoji: '🏁' };
      case 'cancelled':
        return { text: '취소됨', color: '#e67e22', emoji: '❌' };
      case 'expired':
        return { text: '만료됨', color: '#95a5a6', emoji: '⏰' };
      default:
        return { text: '알 수 없음', color: '#bdc3c7', emoji: '❓' };
    }
  }

  // 전화번호 포맷팅
  static formatPhoneNumber(phone) {
    if (!phone) return '';
    
    // 숫자만 추출
    const numbers = phone.replace(/\D/g, '');
    
    // 010-1234-5678 형식으로 변환
    if (numbers.length === 11 && numbers.startsWith('010')) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    }
    
    return phone; // 변환 실패시 원본 반환
  }

  // 전화번호 유효성 검사
  static validatePhoneNumber(phone) {
    if (!phone) return false;
    
    const numbers = phone.replace(/\D/g, '');
    return numbers.length === 11 && numbers.startsWith('010');
  }

  // 금액 유효성 검사
  static validateAmount(amount) {
    const num = parseInt(amount);
    return !isNaN(num) && num > 0 && num <= 1000000; // 최대 100만원
  }

  // QR 코드용 데이터 생성
static generateQRData(gifticonId) {
  const baseURL = window.location.origin;
  return `${baseURL}/check/${gifticonId}`;
}

  // 고객용 조회 URL 생성
static generateCustomerURL(gifticonId) {
  const baseURL = window.location.origin;
  return `${baseURL}/check/${gifticonId}`;
}

  // QR 코드 데이터 파싱
  static parseQRData(qrData) {
    try {
      const data = JSON.parse(qrData);
      
      if (data.type !== 'gifticon' || !data.id) {
        throw new Error('올바르지 않은 기프티콘 QR 코드입니다.');
      }
      
      return data;
    } catch (error) {
      console.error('QR 데이터 파싱 오류:', error);
      throw new Error('QR 코드를 읽을 수 없습니다.');
    }
  }
}