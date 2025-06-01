// TermsPage.js - 이용약관 페이지
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/LegalPages.css';

function TermsPage() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1 className="legal-title">이용약관</h1>
        
        <p className="legal-updated">최종 수정일: 2025년 04월 28일</p>
        
        <div className="legal-section">
          <h2>제1조 (목적)</h2>
          <p>
            이 약관은 요거트퍼플 동탄반송점(이하 "회사"라 함)이 제공하는 서비스의 이용과 관련하여 
            회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>
        </div>
        
        <div className="legal-section">
          <h2>제2조 (정의)</h2>
          <ol>
            <li>
              "서비스"란 회사가 제공하는 아이스크림 및 요거트 판매, QR코드를 통한 주문 시스템, 배달 서비스 등을 의미합니다.
            </li>
            <li>
              "이용자"란 회사가 제공하는 서비스를 이용하는 고객을 말합니다.
            </li>
            <li>
              "QR코드"란 이용자가 제휴 매장에서 서비스를 이용하기 위해 스캔하는 코드를 의미합니다.
            </li>
            <li>
              "제휴 매장"이란 회사와 계약을 맺고 QR코드를 통한 주문 서비스를 제공하는 장소를 의미합니다.
            </li>
          </ol>
        </div>
        
        <div className="legal-section">
          <h2>제3조 (약관의 효력 및 변경)</h2>
          <ol>
            <li>
              이 약관은 서비스를 이용하고자 하는 모든 이용자에게 적용됩니다.
            </li>
            <li>
              회사는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항에 게시하거나 
              기타 방법으로 이용자에게 공지함으로써 효력이 발생합니다.
            </li>
            <li>
              이용자는 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단할 수 있으며, 
              계속적인 서비스 이용은 변경된 약관에 동의한 것으로 간주됩니다.
            </li>
          </ol>
        </div>
        
        <div className="legal-section">
          <h2>제4조 (서비스의 이용)</h2>
          <ol>
            <li>
            서비스 이용은 회사의 영업시간인 오전 11시부터 오후 11시 59분까지 이용 가능합니다. 
            단, 공휴일 및 명절 기간에는 영업시간이 변경될 수 있으며, 이는 앱 내 공지를 통해 안내됩니다.
            </li>
            <li>
              회사는 천재지변, 시스템 점검, 서비스 개발, 법령 변경, 기타 불가항력적인 사유로 인해 
              서비스 제공을 일시적으로 중단할 수 있습니다.
            </li>
            <li>
              이용자는 QR코드를 스캔하여 메뉴를 선택하고 주문할 수 있으며, 
              결제 완료 후에는 주문 내역이 회사에 전송됩니다.
            </li>
          </ol>
        </div>
        
        <div className="legal-section">
          <h2>제5조 (주문 및 결제)</h2>
          <ol>
            <li>
              이용자는 서비스에서 제공하는 방법에 따라 메뉴를 선택하고 주문할 수 있습니다.
            </li>
            <li>
              결제는 서비스에서 제공하는 결제 수단을 통해 진행되며, 
              결제가 완료된 후에는 주문이 접수됩니다.
            </li>
            <li>
              주문 정보의 오류로 인한 문제는 이용자 본인에게 책임이 있으며, 
              주문 내역에 대한 확인은 주문 완료 페이지 또는 전화를 통해 가능합니다.
            </li>
          </ol>
        </div>
        
        <div className="legal-section">
          <h2>제6조 (배달 서비스)</h2>
          <ol>
            <li>
              배달 서비스는 지정된 제휴 매장에 한해 제공됩니다.
            </li>
            <li>
              배달 시간은 주문 상황 및 기상 조건에 따라 지연될 수 있습니다.
            </li>
            <li>
              정확한 배달을 위해 이용자는 정확한 테이블 번호 또는 위치 정보를 제공해야 합니다.
            </li>
          </ol>
        </div>
        
        <div className="legal-section">
          <h2>제7조 (취소 및 환불)</h2>
          <ol>
            <li>
              주문 취소는 제조 시작 전에만 가능하며, 제조가 시작된 후에는 취소가 제한될 수 있습니다.
            </li>
            <li>
              환불 정책에 관한 자세한 사항은 별도의 '환불 및 교환 정책'에 따릅니다.
            </li>
          </ol>
        </div>
        
        <div className="legal-section">
          <h2>제8조 (개인정보 보호)</h2>
          <p>
            회사는 이용자의 개인정보를 보호하기 위해 최선을 다하며, 
            개인정보의 수집, 이용, 보관, 파기 등에 관한 사항은 별도의 '개인정보처리방침'에 따릅니다.
          </p>
        </div>
        
        <div className="legal-section">
          <h2>제9조 (책임의 제한)</h2>
          <ol>
            <li>
              회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력적인 사유로 인한 
              서비스 중단에 대해 책임을 지지 않습니다.
            </li>
            <li>
              회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.
            </li>
            <li>
              회사는 이용자가 서비스를 통해 얻은 정보 또는 자료 등으로 인해 발생한 손해에 대해 
              책임을 지지 않습니다.
            </li>
          </ol>
        </div>
        
        <div className="legal-section">
          <h2>제10조 (분쟁해결)</h2>
          <p>
            서비스 이용과 관련하여 발생한 분쟁은 당사자 간의 합의에 의해 원만히 해결함을 원칙으로 합니다. 
            합의가 이루어지지 않을 경우, 관련 법령 및 상관습에 따릅니다.
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

export default TermsPage;