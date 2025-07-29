// src/components/PopupManagement.js
import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  orderBy, 
  query,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';

const PopupManagement = () => {
  const [popups, setPopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPopup, setEditingPopup] = useState(null);
  
  // 새 팝업 생성 폼 데이터
  const [newPopup, setNewPopup] = useState({
    title: '',
    imageFile: null,
    isActive: true,
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: ''
  });

  // 수정 폼 데이터
  const [editFormData, setEditFormData] = useState({
    title: '',
    imageFile: null,
    isActive: true,
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: ''
  });

  // 이미지 리사이징 함수
  const resizeImage = (file, maxWidth = 600, maxHeight = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // 원본 비율 계산
        let { width, height } = img;
        
        // 비율을 유지하면서 최대 크기에 맞추기
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        // Canvas 크기 설정
        canvas.width = width;
        canvas.height = height;
        
        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height);
        
        // Blob으로 변환
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Timestamp를 날짜/시간 형식으로 변환
  const timestampToDate = (timestamp) => {
    if (!timestamp) return '';
    return timestamp.toDate().toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const timestampToTime = (timestamp) => {
    if (!timestamp) return '';
    return timestamp.toDate().toTimeString().slice(0, 5); // HH:mm
  };

  // 날짜 문자열을 Timestamp로 변환 (시간은 00:00:00)
  const dateStringToTimestamp = (dateStr) => {
    if (!dateStr) return null;
    return Timestamp.fromDate(new Date(dateStr + 'T00:00:00'));
  };

  // 시간 문자열을 저장용 형태로 변환 (문자열 그대로 저장)
  const timeStringToStore = (timeStr) => {
    return timeStr || null;
  };

  // 팝업 목록 조회
  const fetchPopups = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'popups'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const popupList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setPopups(popupList);
    } catch (error) {
      console.error('팝업 목록 조회 실패:', error);
      alert('팝업 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 이미지 업로드
  const uploadImage = async (file) => {
    // 이미지 리사이징
    const resizedFile = await resizeImage(file);
    
    const timestamp = Date.now();
    const fileName = `popup_${timestamp}_resized.jpg`;
    const storageRef = ref(storage, `popups/${fileName}`);
    
    await uploadBytes(storageRef, resizedFile);
    const downloadURL = await getDownloadURL(storageRef);
    
    return { downloadURL, fileName };
  };

  // 새 팝업 생성
  const handleCreatePopup = async (e) => {
    e.preventDefault();
    
    if (!newPopup.title.trim()) {
      alert('팝업 제목을 입력해주세요.');
      return;
    }
    
    if (!newPopup.imageFile) {
      alert('팝업 이미지를 선택해주세요.');
      return;
    }

    try {
      setUploading(true);
      
      // 이미지 업로드
      const { downloadURL, fileName } = await uploadImage(newPopup.imageFile);
      
      // Firestore에 팝업 정보 저장
      const popupData = {
        title: newPopup.title.trim(),
        imageUrl: downloadURL,
        fileName: fileName,
        isActive: newPopup.isActive,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      // 시작일/종료일이 있으면 추가
      if (newPopup.startDate) {
        popupData.startDate = dateStringToTimestamp(newPopup.startDate);
      }
      if (newPopup.endDate) {
        popupData.endDate = dateStringToTimestamp(newPopup.endDate);
      }
      
      // 시간 범위 추가
      if (newPopup.startTime) {
        popupData.startTime = timeStringToStore(newPopup.startTime);
      }
      if (newPopup.endTime) {
        popupData.endTime = timeStringToStore(newPopup.endTime);
      }
      
      await addDoc(collection(db, 'popups'), popupData);
      
      alert('팝업이 성공적으로 생성되었습니다!');
      setShowCreateForm(false);
      setNewPopup({
        title: '',
        imageFile: null,
        isActive: true,
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: ''
      });
      
      // 목록 새로고침
      fetchPopups();
      
    } catch (error) {
      console.error('팝업 생성 실패:', error);
      alert('팝업 생성에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 팝업 수정 시작
  const startEdit = (popup) => {
    setEditingPopup(popup.id);
    setEditFormData({
      title: popup.title,
      imageFile: null,
      isActive: popup.isActive,
      startDate: timestampToDate(popup.startDate),
      endDate: timestampToDate(popup.endDate),
      startTime: popup.startTime || '',
      endTime: popup.endTime || ''
    });
  };

  // 팝업 수정 완료
  const handleEditPopup = async (e) => {
    e.preventDefault();
    
    if (!editFormData.title.trim()) {
      alert('팝업 제목을 입력해주세요.');
      return;
    }

    try {
      setUploading(true);
      
      const popupRef = doc(db, 'popups', editingPopup);
      const currentPopup = popups.find(p => p.id === editingPopup);
      
      const updateData = {
        title: editFormData.title.trim(),
        isActive: editFormData.isActive,
        updatedAt: Timestamp.now()
      };
      
      // 새 이미지가 있으면 업로드
      if (editFormData.imageFile) {
        // 기존 이미지 삭제
        if (currentPopup.fileName) {
          try {
            const oldImageRef = ref(storage, `popups/${currentPopup.fileName}`);
            await deleteObject(oldImageRef);
          } catch (error) {
            console.log('기존 이미지 삭제 실패 (계속 진행):', error);
          }
        }
        
        // 새 이미지 업로드
        const { downloadURL, fileName } = await uploadImage(editFormData.imageFile);
        updateData.imageUrl = downloadURL;
        updateData.fileName = fileName;
      }
      
      // 시작일/종료일 업데이트
      if (editFormData.startDate) {
        updateData.startDate = dateStringToTimestamp(editFormData.startDate);
      } else {
        updateData.startDate = null;
      }
      
      if (editFormData.endDate) {
        updateData.endDate = dateStringToTimestamp(editFormData.endDate);
      } else {
        updateData.endDate = null;
      }
      
      // 시간 범위 업데이트
      updateData.startTime = timeStringToStore(editFormData.startTime);
      updateData.endTime = timeStringToStore(editFormData.endTime);
      
      await updateDoc(popupRef, updateData);
      
      alert('팝업이 성공적으로 수정되었습니다!');
      setEditingPopup(null);
      setEditFormData({
        title: '',
        imageFile: null,
        isActive: true,
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: ''
      });
      
      // 목록 새로고침
      fetchPopups();
      
    } catch (error) {
      console.error('팝업 수정 실패:', error);
      alert('팝업 수정에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 팝업 수정 취소
  const cancelEdit = () => {
    setEditingPopup(null);
    setEditFormData({
      title: '',
      imageFile: null,
      isActive: true,
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: ''
    });
  };

  // 팝업 활성화/비활성화 토글
  const togglePopupStatus = async (popupId, currentStatus) => {
    try {
      const popupRef = doc(db, 'popups', popupId);
      await updateDoc(popupRef, {
        isActive: !currentStatus,
        updatedAt: Timestamp.now()
      });
      
      alert(`팝업이 ${!currentStatus ? '활성화' : '비활성화'}되었습니다.`);
      fetchPopups();
      
    } catch (error) {
      console.error('팝업 상태 변경 실패:', error);
      alert('팝업 상태 변경에 실패했습니다.');
    }
  };

  // 팝업 삭제
  const deletePopup = async (popup) => {
    if (!window.confirm(`"${popup.title}" 팝업을 정말 삭제하시겠습니까?`)) {
      return;
    }

    try {
      // Storage에서 이미지 삭제
      if (popup.fileName) {
        const imageRef = ref(storage, `popups/${popup.fileName}`);
        await deleteObject(imageRef);
      }
      
      // Firestore에서 문서 삭제
      await deleteDoc(doc(db, 'popups', popup.id));
      
      alert('팝업이 삭제되었습니다.');
      fetchPopups();
      
    } catch (error) {
      console.error('팝업 삭제 실패:', error);
      alert('팝업 삭제에 실패했습니다.');
    }
  };

  // 이미지 파일 선택 핸들러 (생성용)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 이미지 파일 체크
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }
      
      // 파일 크기 체크 (10MB 제한 - 리사이징 후에는 더 작아짐)
      if (file.size > 10 * 1024 * 1024) {
        alert('파일 크기는 10MB 이하여야 합니다.');
        return;
      }
      
      setNewPopup(prev => ({ ...prev, imageFile: file }));
    }
  };

  // 이미지 파일 선택 핸들러 (수정용)
  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 이미지 파일 체크
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }
      
      // 파일 크기 체크 (10MB 제한)
      if (file.size > 10 * 1024 * 1024) {
        alert('파일 크기는 10MB 이하여야 합니다.');
        return;
      }
      
      setEditFormData(prev => ({ ...prev, imageFile: file }));
    }
  };

  // 날짜 포맷팅 (시간 포함)
  const formatDateTime = (timestamp) => {
    if (!timestamp) return '-';
    return timestamp.toDate().toLocaleString('ko-KR');
  };

  // 날짜만 포맷팅
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    return timestamp.toDate().toLocaleDateString('ko-KR');
  };

  // 시간 포맷팅
  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    return timeStr;
  };

  useEffect(() => {
    fetchPopups();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px' 
      }}>
        <h2>📢 팝업 관리</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          + 새 팝업 만들기
        </button>
      </div>

      {/* 새 팝업 생성 폼 */}
      {showCreateForm && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          <h3>새 팝업 만들기</h3>
          <form onSubmit={handleCreatePopup}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                팝업 제목 *
              </label>
              <input
                type="text"
                value={newPopup.title}
                onChange={(e) => setNewPopup(prev => ({ ...prev, title: e.target.value }))}
                placeholder="예: 기프티콘 실물카드 출시!"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                팝업 이미지 * (자동 리사이징: 600x800px)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                required
              />
              {newPopup.imageFile && (
                <p style={{ margin: '5px 0', color: '#28a745' }}>
                  ✅ {newPopup.imageFile.name} (업로드 시 자동 최적화됩니다)
                </p>
              )}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={newPopup.isActive}
                  onChange={(e) => setNewPopup(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                <span>생성 즉시 활성화</span>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>시작날짜 (선택)</label>
                <input
                  type="date"
                  value={newPopup.startDate}
                  onChange={(e) => setNewPopup(prev => ({ ...prev, startDate: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>종료날짜 (선택)</label>
                <input
                  type="date"
                  value={newPopup.endDate}
                  onChange={(e) => setNewPopup(prev => ({ ...prev, endDate: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>시작시간 (선택)</label>
                <input
                  type="time"
                  value={newPopup.startTime}
                  onChange={(e) => setNewPopup(prev => ({ ...prev, startTime: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>종료시간 (선택)</label>
                <input
                  type="time"
                  value={newPopup.endTime}
                  onChange={(e) => setNewPopup(prev => ({ ...prev, endTime: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>

            <div style={{ fontSize: '14px', color: '#666', marginBottom: '15px', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
              💡 <strong>설정 예시:</strong><br/>
              • 날짜: 2025-07-01 ~ 2025-07-31<br/>
              • 시간: 11:00 ~ 16:00<br/>
              → 7월 한 달 동안 매일 오전 11시부터 오후 4시까지만 팝업 표시
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                disabled={uploading}
                style={{
                  backgroundColor: uploading ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: uploading ? 'not-allowed' : 'pointer'
                }}
              >
                {uploading ? '업로드 중...' : '팝업 생성'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 팝업 목록 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          로딩 중...
        </div>
      ) : popups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          생성된 팝업이 없습니다.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {popups.map(popup => (
            <div
              key={popup.id}
              style={{
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: popup.isActive ? '#ffffff' : '#f8f9fa'
              }}
            >
              {/* 수정 모드인 경우 */}
              {editingPopup === popup.id ? (
                <form onSubmit={handleEditPopup}>
                  <h3 style={{ marginBottom: '15px' }}>팝업 수정</h3>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      팝업 제목 *
                    </label>
                    <input
                      type="text"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      새 이미지 (선택 - 변경하지 않으려면 비워두세요)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageChange}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                    {editFormData.imageFile && (
                      <p style={{ margin: '5px 0', color: '#28a745' }}>
                        ✅ {editFormData.imageFile.name} (새 이미지로 교체됩니다)
                      </p>
                    )}
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={editFormData.isActive}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      />
                      <span>활성화</span>
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>시작날짜</label>
                      <input
                        type="date"
                        value={editFormData.startDate}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>종료날짜</label>
                      <input
                        type="date"
                        value={editFormData.endDate}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>시작시간</label>
                      <input
                        type="time"
                        value={editFormData.startTime}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, startTime: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>종료시간</label>
                      <input
                        type="time"
                        value={editFormData.endTime}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, endTime: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="submit"
                      disabled={uploading}
                      style={{
                        backgroundColor: uploading ? '#6c757d' : '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      {uploading ? '저장 중...' : '저장'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      style={{
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      취소
                    </button>
                  </div>
                </form>
              ) : (
                /* 일반 표시 모드 */
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                  {/* 팝업 이미지 미리보기 */}
                  <div style={{ flexShrink: 0 }}>
                    <img
                      src={popup.imageUrl}
                      alt={popup.title}
                      style={{
                        width: '120px',
                        height: '160px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #ddd'
                      }}
                    />
                  </div>

                  {/* 팝업 정보 */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 10px 0', color: popup.isActive ? '#000' : '#666' }}>
                      {popup.title}
                      <span style={{
                        marginLeft: '10px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: popup.isActive ? '#28a745' : '#6c757d',
                        color: 'white'
                      }}>
                        {popup.isActive ? '활성화' : '비활성화'}
                      </span>
                    </h3>
                    
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                      <p>생성일: {formatDate(popup.createdAt)}</p>
                      <p>수정일: {formatDate(popup.updatedAt)}</p>
                      {popup.startDate && <p>시작날짜: {formatDate(popup.startDate)}</p>}
                      {popup.endDate && <p>종료날짜: {formatDate(popup.endDate)}</p>}
                      {popup.startTime && <p>시작시간: {formatTime(popup.startTime)}</p>}
                      {popup.endTime && <p>종료시간: {formatTime(popup.endTime)}</p>}
                      {(popup.startDate && popup.endDate && popup.startTime && popup.endTime) && (
                        <p style={{ color: '#007bff', fontWeight: 'bold' }}>
                          📅 {formatDate(popup.startDate)} ~ {formatDate(popup.endDate)} 기간 중 매일 {formatTime(popup.startTime)} ~ {formatTime(popup.endTime)}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => startEdit(popup)}
                        style={{
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        수정
                      </button>
                      
                      <button
                        onClick={() => togglePopupStatus(popup.id, popup.isActive)}
                        style={{
                          backgroundColor: popup.isActive ? '#ffc107' : '#28a745',
                          color: popup.isActive ? '#000' : '#fff',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {popup.isActive ? '비활성화' : '활성화'}
                      </button>
                      
                      <button
                        onClick={() => deletePopup(popup)}
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PopupManagement;