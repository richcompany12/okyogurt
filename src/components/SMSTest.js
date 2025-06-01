// src/components/SMSTest.js
import React, { useState } from 'react';
import './SMSTest.css';

function SMSTest() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const sendTestSMS = async () => {
    if (!phone || !message) {
      alert('전화번호와 메시지를 입력해주세요.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Firebase Functions URL (배포 후 실제 URL로 변경 필요)
      const functionsUrl = 'https://asia-northeast3-your-project.cloudfunctions.net/sendTestSMS';
      
      const response = await fetch(functionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phone,
          message: message
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult({ success: true, message: 'SMS 발송 완료!' });
      } else {
        setResult({ success: false, message: data.error });
      }

    } catch (error) {
      console.error('SMS 발송 오류:', error);
      setResult({ success: false, message: '네트워크 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const templateMessages = [
    {
      name: '새 주문 알림 (관리자용)',
      text: `[요거트퍼플] 새 주문 접수
주문번호: #ABC123
금액: 3,000원
전화번호: 010-1234-5678
테이블: 3번 테이블

주문 확인: https://your-domain.com/admin`
    },
    {
      name: '주문 확인 (고객용)',
      text: `[요거트퍼플] 주문이 확인되었습니다!

주문번호: #ABC123
금액: 3,000원
배달예정: 약 15분 후

맛있는 아이스크림을 준비해드리겠습니다! 🍦`
    },
    {
      name: '주문 취소 (고객용)',
      text: `[요거트퍼플] 주문이 취소되었습니다.

주문번호: #ABC123
취소사유: 재료 부족

문의사항이 있으시면 연락주세요.
죄송합니다.`
    }
  ];

  return (
    <div className="sms-test">
      <div className="sms-header">
        <h1>💬 SMS 테스트</h1>
        <p>CoolSMS 연동 상태를 확인하고 테스트 메시지를 발송할 수 있습니다.</p>
      </div>

      <div className="sms-content">
        <div className="sms-form">
          <h3>📱 테스트 발송</h3>
          
          <div className="input-group">
            <label>받는 사람 전화번호</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-1234-5678"
            />
          </div>

          <div className="input-group">
            <label>메시지 내용</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="테스트 메시지를 입력하세요"
              rows="5"
            />
          </div>

          <button 
            onClick={sendTestSMS}
            disabled={loading || !phone || !message}
            className="send-button"
          >
            {loading ? '발송 중...' : 'SMS 발송'}
          </button>

          {result && (
            <div className={`result ${result.success ? 'success' : 'error'}`}>
              <strong>{result.success ? '✅ 성공' : '❌ 실패'}</strong>
              <p>{result.message}</p>
            </div>
          )}
        </div>

        <div className="message-templates">
          <h3>📄 메시지 템플릿</h3>
          <p>실제 발송되는 메시지 형태를 확인할 수 있습니다.</p>
          
          {templateMessages.map((template, index) => (
            <div key={index} className="template-card">
              <h4>{template.name}</h4>
              <div className="template-content">
                {template.text}
              </div>
              <button 
                onClick={() => setMessage(template.text)}
                className="use-template-button"
              >
                이 템플릿 사용
              </button>
            </div>
          ))}
        </div>

        <div className="sms-info">
          <h3>⚙️ 설정 정보</h3>
          <div className="info-item">
            <strong>CoolSMS 연동:</strong> 
            <span className="status pending">설정 필요</span>
          </div>
          <div className="info-item">
            <strong>Functions 배포:</strong> 
            <span className="status pending">배포 필요</span>
          </div>
          
          <div className="setup-guide">
            <h4>📋 설정 가이드</h4>
            <ol>
              <li>CoolSMS API 키 설정</li>
              <li>Firebase Functions 환경변수 설정</li>
              <li>Functions 배포</li>
              <li>발신번호 등록 확인</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SMSTest;