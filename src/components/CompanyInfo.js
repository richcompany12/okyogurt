// CompanyInfo.js - 사업자 정보 페이지
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/LegalPages.css';

function CompanyInfo() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1 className="legal-title">사업자 정보</h1>
        
        <p className="legal-updated">최종 수정일: 2025년 05월 31일</p>
        
        <div className="legal-section">
          <h2>🏢 회사 정보</h2>
          <div className="info-table">
            <div className="info-row">
              <div className="info-label">상호명</div>
              <div className="info-value">요거트퍼플 동탄반송점</div>
            </div>
            <div className="info-row">
              <div className="info-label">대표자</div>
              <div className="info-value">윤설아</div>
            </div>
            <div className="info-row">
              <div className="info-label">사업자등록번호</div>
              <div className="info-value">761-02-02164</div>
            </div>
            <div className="info-row">
              <div className="info-label">주소</div>
              <div className="info-value">경기도 화성시 동탄반송길28 103호</div>
            </div>
            <div className="info-row">
              <div className="info-label">전화번호</div>
              <div className="info-value">010-8177-1258</div>
            </div>
            <div className="info-row">
              <div className="info-label">이메일</div>
              <div className="info-value">kso121258@gmail.com</div>
            </div>
          </div>
        </div>
        
        <div className="legal-section">
          <h2>🍦 서비스 소개</h2>
          <p>
            요거트퍼플 동탄반송점은 신선하고 건강한 요거트와 아이스크림을 제공하는 전문 매장입니다.
            QR코드를 활용한 간편 주문 시스템으로 고객님께 더욱 편리한 서비스를 제공하고 있습니다.
          </p>
          
          <h3>🕐 영업시간</h3>
          <ul>
            <li>평일: 오전 11:00 ~ 오후 11:59</li>
            <li>주말: 오전 11:00 ~ 오후 11:59</li>
            <li>공휴일: 영업시간 변동 가능 (앱 내 공지 확인)</li>
          </ul>
          
          <h3>🚚 배달 서비스</h3>
          <ul>
            <li>제휴 매장 내 테이블 배달 서비스 제공</li>
            <li>최소 주문 금액: 12,000원</li>
            <li>예상 배달 시간: 15~30분 (상황에 따라 변동)</li>
          </ul>
        </div>
        
        <div className="legal-section">
          <h2>💻 개발 및 운영</h2>
          <div className="info-table">
            <div className="info-row">
              <div className="info-label">개발사</div>
              <div className="info-value">리치컴퍼니</div>
            </div>
            <div className="info-row">
              <div className="info-label">기술 지원</div>
              <div className="info-value">kso121258@gmail.com</div>
            </div>
            <div className="info-row">
              <div className="info-label">서비스 시작일</div>
              <div className="info-value">2025년 5월</div>
            </div>
          </div>
        </div>
        
        <div className="legal-section">
          <h2>📞 고객센터</h2>
          <p>
            서비스 이용 중 문의사항이나 불편사항이 있으시면 언제든지 연락해 주세요.
          </p>
          <ul>
            <li>📞 전화: 010-8177-1258</li>
            <li>✉️ 이메일: kso121258@gmail.com</li>
            <li>🕐 운영시간: 영업시간 내 상시 대응</li>
          </ul>
        </div>
        
        <div className="legal-footer">
          <button 
  className="legal-back-btn"
  onClick={() => window.history.back()}
>
  이전 페이지로 돌아가기
</button>
        </div>
      </div>
    </div>
  );
}

export default CompanyInfo;