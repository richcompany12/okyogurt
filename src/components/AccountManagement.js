// src/components/AccountManagement.js
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  where,
  getDocs
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './AccountManagement.css';

const AccountManagement = () => {
  const { currentUser, isAdmin } = useAuth();
  
  // 상태 관리
  const [stores, setStores] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'store_owner',
    storeId: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // 상점 목록 로드
  useEffect(() => {
    const storesQuery = query(collection(db, 'stores'), orderBy('name'));
    
    const unsubscribe = onSnapshot(storesQuery, (snapshot) => {
      const storesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStores(storesList);
    });

    return () => unsubscribe();
  }, []);

  // 계정 목록 로드
  useEffect(() => {
    const accountsQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(accountsQuery, (snapshot) => {
      const accountsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAccounts(accountsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 폼 데이터 변경
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 에러 제거
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // 이메일 중복 체크
  const checkEmailExists = async (email) => {
    const userQuery = query(
      collection(db, 'users'),
      where('email', '==', email)
    );
    const snapshot = await getDocs(userQuery);
    return !snapshot.empty;
  };

  // 폼 유효성 검사
  const validateForm = async () => {
    const errors = {};

    // 아이디(이메일) 검사
    if (!formData.email.trim()) {
      errors.email = '아이디를 입력해주세요.';
    } else if (formData.email.length < 3) {
      errors.email = '아이디는 3자 이상이어야 합니다.';
    } else if (await checkEmailExists(formData.email)) {
      errors.email = '이미 사용중인 아이디입니다.';
    }

    // 비밀번호 검사
    if (!formData.password) {
      errors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 6 || !/^\d+$/.test(formData.password)) {
      errors.password = '비밀번호는 숫자 6자리 이상이어야 합니다.';
    }

    // 이름 검사
    if (!formData.name.trim()) {
      errors.name = '이름을 입력해주세요.';
    }

    // 상점 선택 검사 (store_owner인 경우)
    if (formData.role === 'store_owner' && !formData.storeId) {
      errors.storeId = '연결할 상점을 선택해주세요.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 계정 생성
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    
    if (!await validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Firestore에 사용자 정보 저장
      const userData = {
        email: formData.email, // 실제 입력한 아이디 저장
        name: formData.name,
        role: formData.role,
        storeId: formData.role === 'store_owner' ? formData.storeId : null,
        isActive: true,
        createdAt: new Date(),
        createdBy: currentUser.email
      };

      await addDoc(collection(db, 'users'), userData);

      alert('계정이 성공적으로 생성되었습니다!');
      setShowCreateModal(false);
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'store_owner',
        storeId: ''
      });

    } catch (error) {
      console.error('계정 생성 오류:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        setFormErrors({ email: '이미 사용중인 아이디입니다.' });
      } else {
        alert('계정 생성 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 계정 활성화/비활성화
  const toggleAccountStatus = async (accountId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'users', accountId), {
        isActive: !currentStatus,
        updatedAt: new Date(),
        updatedBy: currentUser.email
      });
      
      alert(`계정이 ${!currentStatus ? '활성화' : '비활성화'}되었습니다.`);
    } catch (error) {
      console.error('계정 상태 변경 오류:', error);
      alert('계정 상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 역할 표시
  const getRoleDisplay = (role) => {
    const roleMap = {
      'super_admin': '메인 관리자',
      'admin': '관리자', 
      'store_owner': '제휴상점 사장'
    };
    return roleMap[role] || role;
  };

  // 날짜 포맷
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR') + ' ' + date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="account-management loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>계정 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="account-management">
      <div className="page-header">
        <h1>👤 계정 관리</h1>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            ➕ 새 계정 생성
          </button>
        </div>
      </div>

      {/* 계정 목록 */}
      <div className="section">
        <div className="section-header">
          <h2>📋 계정 목록</h2>
          <p className="section-desc">총 {accounts.length}개의 계정이 등록되어 있습니다.</p>
        </div>

        <div className="accounts-table">
          <table>
            <thead>
              <tr>
                <th>아이디</th>
                <th>이름</th>
                <th>역할</th>
                <th>연결된 상점</th>
                <th>상태</th>
                <th>생성일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(account => {
                const connectedStore = stores.find(store => store.id === account.storeId);
                return (
                  <tr key={account.id}>
                    <td>{account.email}</td>
                    <td>{account.name || '-'}</td>
                    <td>
                      <span className={`role-badge ${account.role}`}>
                        {getRoleDisplay(account.role)}
                      </span>
                    </td>
                    <td>{connectedStore?.name || '-'}</td>
                    <td>
                      <span className={`status-badge ${account.isActive ? 'active' : 'inactive'}`}>
                        {account.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td>{formatDate(account.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className={`btn btn-sm ${account.isActive ? 'btn-warning' : 'btn-success'}`}
                          onClick={() => toggleAccountStatus(account.id, account.isActive)}
                        >
                          {account.isActive ? '비활성화' : '활성화'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {accounts.length === 0 && (
            <div className="empty-state">
              <p>등록된 계정이 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* 계정 생성 모달 */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="create-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👤 새 계정 생성</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="create-form">
              <div className="form-group">
                <label>아이디 *</label>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="아이디 입력 (이메일 형식 아니어도 됨)"
                  className={formErrors.email ? 'error' : ''}
                />
                {formErrors.email && (
                  <span className="error-message">{formErrors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label>비밀번호 *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="숫자 6자리 이상"
                  className={formErrors.password ? 'error' : ''}
                />
                {formErrors.password && (
                  <span className="error-message">{formErrors.password}</span>
                )}
              </div>

              <div className="form-group">
                <label>이름 *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="실명 입력"
                  className={formErrors.name ? 'error' : ''}
                />
                {formErrors.name && (
                  <span className="error-message">{formErrors.name}</span>
                )}
              </div>

              <div className="form-group">
                <label>역할 *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                >
                  <option value="store_owner">제휴상점 사장</option>
                  <option value="admin">관리자</option>
                </select>
              </div>

              {formData.role === 'store_owner' && (
                <div className="form-group">
                  <label>연결할 상점 *</label>
                  <select
                    name="storeId"
                    value={formData.storeId}
                    onChange={handleInputChange}
                    className={formErrors.storeId ? 'error' : ''}
                  >
                    <option value="">상점을 선택하세요</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>
                        {store.name} - {store.address}
                      </option>
                    ))}
                  </select>
                  {formErrors.storeId && (
                    <span className="error-message">{formErrors.storeId}</span>
                  )}
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="button"
                  className="btn btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  취소
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? '생성 중...' : '계정 생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;