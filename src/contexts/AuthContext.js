import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { 
  collection,
  query,
  where,
  getDocs,
  addDoc
} from 'firebase/firestore';

// src 폴더의 firebase.js에서 import
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userStoreId, setUserStoreId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🚀 AuthContext useEffect 시작");
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("🔍 Auth 상태 변경:", user?.email || "로그아웃");
      
      try {
        if (user) {
          console.log("📧 사용자 이메일:", user.email);
          
          const userQuery = query(
            collection(db, 'users'),
            where('email', '==', user.email)
          );
          
          const userSnapshot = await getDocs(userQuery);
          console.log("📄 쿼리 결과 개수:", userSnapshot.size);
          
          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            console.log("👤 선택된 사용자 데이터:", userData);
            
            setCurrentUser(user);
            setUserRole(userData.role);
            setUserStoreId(userData.storeId || null);
            console.log("✅ 사용자 설정 완료");
          } else {
            console.log("❌ 사용자 문서를 찾을 수 없음");
            setCurrentUser(null);
            setUserRole(null);
            setUserStoreId(null);
          }
        } else {
          console.log("🚪 로그아웃됨");
          setCurrentUser(null);
          setUserRole(null);
          setUserStoreId(null);
        }
      } catch (error) {
        console.error("🚨 AuthContext 에러:", error);
      } finally {
        console.log("⏰ Loading false 설정");
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // 로그인 함수
  const login = async (email, password) => {
    console.log("🔑 로그인 시도:", email);
    return signInWithEmailAndPassword(auth, email, password);
  };

  // 회원가입 함수
  const signup = async (email, password, role) => {
    try {
      console.log("🔥 회원가입 시작:", email, role);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log("✅ Firebase Auth 사용자 생성 완료:", user.uid);
      
      const userData = {
        email: email,
        role: role,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      if (role === 'store_owner') {
        userData.storeId = null;
      }
      
      const docRef = await addDoc(collection(db, 'users'), userData);
      console.log("✅ Firestore 사용자 문서 생성 완료:", docRef.id);
      
      return userCredential;
      
    } catch (error) {
      console.error("❌ 회원가입 오류:", error);
      throw error;
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    console.log("🚪 로그아웃 실행");
    return signOut(auth);
  };

  // 권한 계산
  const isAdmin = userRole === 'super_admin' || userRole === 'admin';
  const isShopOwner = userRole === 'store_owner';
  const isPartner = userRole === 'partner' || userRole === 'store_owner';
  const isSuperAdmin = userRole === 'super_admin';

  const value = {
    currentUser,
    userRole,
    userStoreId,
    isAdmin,
    isShopOwner,
    isPartner,
    isSuperAdmin,
    login,
    signup,
    logout
  };

  console.log("🎯 AuthProvider 렌더링 - loading:", loading, "currentUser:", !!currentUser);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;