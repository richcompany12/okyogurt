// PrivacyPolicy.js - 개인정보처리방침 페이지
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/LegalPages.css';

function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1 className="legal-title">개인정보처리방침</h1>
        
        <p className="legal-updated">최종 수정일: 2025년 04월 28일</p>
        
        <div className="legal-section">
          <p>
            요거트퍼플 동탄반송점(이하 '회사')은 이용자의 개인정보를 중요시하며, 
            「개인정보 보호법」등 관련 법령을 준수하기 위해 노력하고 있습니다. 
            회사는 개인정보처리방침을 통해 회사가 이용자로부터 수집하는 개인정보의 항목, 수집·이용 목적, 
            보유 및 이용기간, 제3자 제공에 관한 사항을 안내드립니다.
          </p>
        </div>
        
        <div className="legal-section">
          <h2>1. 수집하는 개인정보 항목</h2>
          <p>회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집하고 있습니다.</p>
          <h3>필수 수집 항목</h3>
          <ul>
            <li>전화번호: 주문 및 배달 확인, 알림 서비스 제공</li>
            <li>주문 정보: 테이블 번호, 메뉴 선택, 결제 정보</li>
          </ul>
        </div>
        
        <div className="legal-section">
          <h2>2. 개인정보의 수집 및 이용 목적</h2>
          <p>회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.</p>
          <ul>
            <li>서비스 제공: 주문 접수, 결제, 배달 등 기본적인 서비스 제공</li>
            <li>고객 관리: 서비스 이용에 따른 본인 확인, 불만 처리 등 민원 처리</li>
            <li>마케팅 및 광고 활용: 이벤트 및 프로모션 안내, 서비스 개선을 위한 통계 및 분석 자료 활용 (선택적 동의 시)</li>
          </ul>
        </div>
        
        <div className="legal-section">
          <h2>3. 개인정보의 보유 및 이용 기간</h2>
          <p>
            회사는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 
            단, 관련 법령에 의해 보존할 필요가 있는 경우 아래와 같이 관련 법령에서 정한 일정한 기간 동안 회원정보를 보관합니다.
          </p>
          <ul>
            <li>전자상거래 등에서의 소비자 보호에 관한 법률에 따른 보관
              <ul>
                <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
                <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
                <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
              </ul>
            </li>
            <li>통신비밀보호법에 따른 보관
              <ul>
                <li>접속 로그, IP 정보: 3개월</li>
              </ul>
            </li>
          </ul>
        </div>
        
        <div className="legal-section">
          <h2>4. 개인정보의 파기 절차 및 방법</h2>
          <p>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.</p>
          <ul>
            <li>파기절차: 이용자가 제공한 정보는 목적 달성 후 별도의 DB에 옮겨져 내부 방침 및 관련 법령에 따라 일정 기간 저장된 후 파기됩니다.</li>
            <li>파기방법: 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.</li>
          </ul>
        </div>
        
        <div className="legal-section">
          <h2>5. 개인정보의 제3자 제공</h2>
          <p>
            회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.
          </p>
          <ul>
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ul>
        </div>
        
        <div className="legal-section">
          <h2>6. 이용자 및 법정대리인의 권리와 그 행사방법</h2>
          <p>
            이용자 및 법정대리인은 개인정보 조회, 수정, 삭제, 처리정지 요구 등의 권리를 행사할 수 있습니다. 
            권리 행사는 회사에 대해 전화(031-5189-6586) 또는 이메일(kso121258@gmail.com)로 연락하여 요청하실 수 있습니다.
          </p>
        </div>
        
        <div className="legal-section">
          <h2>7. 개인정보 자동 수집 장치의 설치·운영 및 거부에 관한 사항</h2>
          <p>
            회사는 이용자의 정보를 수시로 저장하고 찾아내는 '쿠키(cookie)'를 사용합니다. 
            쿠키는 웹사이트가 이용자의 컴퓨터 브라우저에 전송하는 소량의 정보입니다.
          </p>
          <ul>
            <li>쿠키의 사용 목적: 이용자의 편의 제공 및 서비스 개선을 위한 통계 데이터 수집</li>
            <li>쿠키의 설치/운영 및 거부: 이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다. 웹 브라우저에서 옵션을 설정함으로써 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 모든 쿠키의 저장을 거부할 수 있습니다.</li>
          </ul>
        </div>
        
        <div className="legal-section">
          <h2>8. 개인정보의 안전성 확보 조치</h2>
          <p>회사는 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적, 관리적, 물리적 조치를 하고 있습니다.</p>
          <ul>
            <li>정기적인 자체 감사 실시</li>
            <li>개인정보 취급 직원의 최소화 및 교육</li>
            <li>내부관리계획의 수립 및 시행</li>
            <li>해킹 등에 대비한 기술적 대책</li>
            <li>개인정보의 암호화</li>
            <li>접속기록의 보관 및 위변조 방지</li>
            <li>문서보안을 위한 잠금장치 사용</li>
          </ul>
        </div>
        
        <div className="legal-section">
          <h2>9. 개인정보 보호책임자</h2>
          <p>
            회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 
            피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
          </p>
          <div className="info-table">
            <div className="info-row">
              <div className="info-label">개인정보 보호책임자</div>
              <div className="info-value">윤설아</div>
            </div>
            <div className="info-row">
              <div className="info-label">직위</div>
              <div className="info-value">대표</div>
            </div>
            <div className="info-row">
              <div className="info-label">연락처</div>
              <div className="info-value">031-5189-6586, kso121258@gmail.com</div>
            </div>
          </div>
        </div>
        
        <div className="legal-section">
          <h2>10. 개인정보 처리방침 변경</h2>
          <p>
            이 개인정보처리방침은 2025년 4월 28일부터 적용됩니다. 
            법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 
            공지사항을 통해 고지할 것입니다.
          </p>
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

export default PrivacyPolicy;