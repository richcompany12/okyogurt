// src/components/StoreManagement/MenuManagement.js
import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import './MenuManagement.css';

const MenuManagement = () => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 새 메뉴/수정 폼 데이터
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    image: '',
    isAvailable: true
  });

  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Firebase에서 메뉴 데이터 실시간 로드
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'menus'), 
      (snapshot) => {
        const menuList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMenus(menuList);
        setLoading(false);
      },
      (error) => {
        console.error('메뉴 데이터 로드 오류:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 이미지 파일 선택 핸들러
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 파일 크기는 5MB 이하로 해주세요.');
      return;
    }

    setImageFile(file);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // 이미지 업로드 함수
  const uploadImage = async (file) => {
    try {
      // 고유한 파일명 생성
      const timestamp = Date.now();
      const fileName = `menus/${timestamp}_${file.name}`;
      const imageRef = ref(storage, fileName);

      // 파일 업로드
      await uploadBytes(imageRef, file);
      
      // 다운로드 URL 가져오기
      const downloadURL = await getDownloadURL(imageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      throw error;
    }
  };

  // 폼 데이터 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // 에러 초기화
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '메뉴명을 입력해주세요';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = '올바른 가격을 입력해주세요';
    }

    if (!formData.description.trim()) {
      newErrors.description = '메뉴 설명을 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 메뉴 추가
  const handleAddMenu = async () => {
    if (!validateForm()) return;

    setUploading(true);

    try {
      let imageUrl = '';
      
      // 이미지가 선택되었으면 업로드
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const menuData = {
        name: formData.name.trim(),
        price: parseInt(formData.price),
        description: formData.description.trim(),
        image: imageUrl,
        isAvailable: formData.isAvailable,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'menus'), menuData);
      
      // 폼 초기화
      resetForm();
      setShowAddForm(false);
      
      alert('메뉴가 성공적으로 추가되었습니다!');
    } catch (error) {
      console.error('메뉴 추가 오류:', error);
      alert('메뉴 추가 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 메뉴 수정
  const handleEditMenu = async () => {
    if (!validateForm()) return;

    setUploading(true);

    try {
      let imageUrl = formData.image; // 기존 이미지 URL 유지
      
      // 새 이미지가 선택되었으면 업로드
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const menuData = {
        name: formData.name.trim(),
        price: parseInt(formData.price),
        description: formData.description.trim(),
        image: imageUrl,
        isAvailable: formData.isAvailable,
        updatedAt: new Date()
      };

      await updateDoc(doc(db, 'menus', editingMenu.id), menuData);
      
      resetForm();
      setEditingMenu(null);
      
      alert('메뉴가 성공적으로 수정되었습니다!');
    } catch (error) {
      console.error('메뉴 수정 오류:', error);
      alert('메뉴 수정 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 메뉴 삭제
  const handleDeleteMenu = async (menuId, menuName) => {
    if (!window.confirm(`'${menuName}' 메뉴를 삭제하시겠습니까?`)) return;

    try {
      await deleteDoc(doc(db, 'menus', menuId));
      alert('메뉴가 성공적으로 삭제되었습니다!');
    } catch (error) {
      console.error('메뉴 삭제 오류:', error);
      alert('메뉴 삭제 중 오류가 발생했습니다.');
    }
  };

  // 수정 모드 시작
  const startEdit = (menu) => {
    setEditingMenu(menu);
    setFormData({
      name: menu.name,
      price: menu.price.toString(),
      description: menu.description,
      image: menu.image || '',
      isAvailable: menu.isAvailable
    });
    setImageFile(null);
    setImagePreview(menu.image || null);
    setShowAddForm(false);
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      description: '',
      image: '',
      isAvailable: true
    });
    setImageFile(null);
    setImagePreview(null);
    setErrors({});
  };

  // 수정/추가 취소
  const cancelForm = () => {
    setShowAddForm(false);
    setEditingMenu(null);
    resetForm();
  };

  // 메뉴 필터링
  const filteredMenus = menus.filter(menu => {
    const matchesSearch = menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         menu.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="menu-management loading">
        <div className="loading-spinner"></div>
        <p>메뉴 데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="menu-management">
      {/* 헤더 */}
      <div className="management-header">
        <h2>🍦 메뉴 관리</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
          disabled={editingMenu}
        >
          + 새 메뉴 추가
        </button>
      </div>

      {/* 검색 */}
      <div className="management-filters">
        <div className="search-section">
          <input
            type="text"
            placeholder="메뉴 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* 메뉴 추가/수정 폼 */}
      {(showAddForm || editingMenu) && (
        <div className="menu-form-container">
          <div className="menu-form">
            <h3>{editingMenu ? '메뉴 수정' : '새 메뉴 추가'}</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label>메뉴명 *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="메뉴명을 입력하세요"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label>가격 *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="가격을 입력하세요"
                  min="0"
                  className={errors.price ? 'error' : ''}
                />
                {errors.price && <span className="error-message">{errors.price}</span>}
              </div>

              <div className="form-group">
                <label>이미지</label>
                <div className="image-upload-section">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="image-input"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="image-upload-label">
                    {imagePreview ? '이미지 변경' : '이미지 선택'}
                  </label>
                  
                  {imagePreview && (
                    <div className="image-preview">
                      <img src={imagePreview} alt="미리보기" />
                      <button 
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(editingMenu?.image || null);
                        }}
                        className="remove-image-btn"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  
                  <small className="image-help">
                    권장 크기: 300x200px, 최대 5MB
                  </small>
                </div>
              </div>
            </div>

            <div className="form-group full-width">
              <label>메뉴 설명 *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="메뉴에 대한 설명을 입력하세요"
                rows="3"
                className={errors.description ? 'error' : ''}
              />
              {errors.description && <span className="error-message">{errors.description}</span>}
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleInputChange}
                />
                <span>판매 가능</span>
              </label>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={cancelForm}
              >
                취소
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={editingMenu ? handleEditMenu : handleAddMenu}
                disabled={uploading}
              >
                {uploading ? '업로드 중...' : editingMenu ? '수정 완료' : '메뉴 추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 메뉴 목록 */}
      <div className="menu-list-container">
        <div className="menu-stats">
          <span>총 {filteredMenus.length}개 메뉴</span>
          {searchTerm && <span> · "{searchTerm}" 검색 결과</span>}
        </div>

        <div className="menu-grid">
          {filteredMenus.map(menu => (
            <div key={menu.id} className={`menu-card ${!menu.isAvailable ? 'unavailable' : ''}`}>
              <div className="menu-image">
                {menu.image ? (
                  <img src={menu.image} alt={menu.name} />
                ) : (
                  <div className="placeholder-image">🍦</div>
                )}
                {!menu.isAvailable && (
                  <div className="unavailable-badge">품절</div>
                )}
              </div>
              
              <div className="menu-info">
                <h4>{menu.name}</h4>
                <p className="menu-description">{menu.description}</p>
                <p className="menu-price">{menu.price.toLocaleString()}원</p>
              </div>
              
              <div className="menu-actions">
                <button 
                  className="btn btn-edit"
                  onClick={() => startEdit(menu)}
                  disabled={showAddForm}
                >
                  수정
                </button>
                <button 
                  className="btn btn-delete"
                  onClick={() => handleDeleteMenu(menu.id, menu.name)}
                  disabled={showAddForm || editingMenu}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredMenus.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>메뉴가 없습니다</h3>
            <p>새로운 메뉴를 추가해보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuManagement;