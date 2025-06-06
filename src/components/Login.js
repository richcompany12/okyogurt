// src/components/Login.js
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      console.log('🔑 로그인 시도:', email);
      
      await login(email, password);
      console.log('✅ 로그인 성공');
    } catch (error) {
      console.error('❌ 로그인 오류:', error);
      
      // Firestore 전용 오류 처리
      if (error.message === '등록되지 않은 사용자입니다.') {
        setError('등록되지 않은 이메일입니다.');
      } else if (error.message === '비밀번호가 올바르지 않습니다.') {
        setError('비밀번호가 올바르지 않습니다.');
      } else {
        setError('로그인 중 오류가 발생했습니다: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  // 인라인 스타일로 임시 해결
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif'
    },
    loginBox: {
      background: 'white',
      padding: '40px',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      width: '100%',
      maxWidth: '400px'
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px'
    },
    title: {
      fontSize: '28px',
      margin: '0 0 10px 0',
      color: '#333'
    },
    subtitle: {
      fontSize: '16px',
      margin: '0',
      color: '#666'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#333'
    },
    input: {
      padding: '12px',
      border: '2px solid #e9ecef',
      borderRadius: '8px',
      fontSize: '14px',
      transition: 'border-color 0.2s'
    },
    button: {
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      color: 'white',
      border: 'none',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.7 : 1
    },
    error: {
      background: '#ffebee',
      color: '#c62828',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '14px',
      border: '1px solid #ffcdd2'
    },
    testAccount: {
      marginTop: '30px',
      padding: '15px',
      background: '#f8f9fa',
      borderRadius: '8px',
      fontSize: '12px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <div style={styles.header}>
          <h1 style={styles.title}>🍦 요거트퍼플</h1>
          <h2 style={styles.subtitle}>관리자 로그인</h2>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kth2798@gmail.com"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상 입력"
              style={styles.input}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={styles.button}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 개발자 정보 */}
        <div style={styles.testAccount}>
          <h4 style={{margin: '0 0 10px 0'}}>🧪 개발 및 유지보수 </h4>
          <div>
            <strong>관리자:</strong><br/>
            kso121258@gmail.com / 리치컴퍼니
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;