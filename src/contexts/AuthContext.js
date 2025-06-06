import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection,
  query,
  where,
  getDocs,
  addDoc
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

// src 폴더의 firebase.js에서 import
import { db, auth } from '../firebase';

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
    
    // Firebase Auth 상태 변화 감지
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("🔥 Firebase Auth 상태 변화:", user?.email);
      
      if (user) {
        try {
          // Firestore에서 사용자 추가 정보 조회
          const userQuery = query(
            collection(db, 'users'),
            where('email', '==', user.email)
          );
          
          const userSnapshot = await getDocs(userQuery);
          
          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            console.log("👤 사용자 데이터 로드:", userData);
            
            setCurrentUser({ 
              email: user.email, 
              uid: user.uid 
            });
            setUserRole(userData.role);
            setUserStoreId(userData.storeId || null);
          } else {
            console.log("⚠️ Firestore에 사용자 정보 없음");
            setCurrentUser(null);
            setUserRole(null);
            setUserStoreId(null);
          }
        } catch (error) {
          console.error("❌ 사용자 정보 로드 오류:", error);
          setCurrentUser(null);
          setUserRole(null);
          setUserStoreId(null);
        }
      } else {
        // 로그아웃 시 즉시 상태 초기화 (Firestore 쿼리 없음)
        console.log("🚪 사용자 로그아웃 - 상태 초기화");
        setCurrentUser(null);
        setUserRole(null);
        setUserStoreId(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 로그인 함수 (Firebase Auth + Firestore)
  const login = async (email, password) => {
    try {
      console.log("🔑 로그인 시도:", email);
      
      // Firebase Auth 로그인
      const authResult = await signInWithEmailAndPassword(auth, email, password);
      console.log("✅ Firebase Auth 로그인 성공");
      
      // Firestore에서 사용자 정보 조회
      const userQuery = query(
        collection(db, 'users'),
        where('email', '==', email)
      );
      
      const userSnapshot = await getDocs(userQuery);
      
      if (userSnapshot.empty) {
        throw new Error('등록되지 않은 사용자입니다.');
      }
      
      const userData = userSnapshot.docs[0].data();
      console.log("👤 사용자 데이터:", userData);
      
      // 사용자 정보 설정 (onAuthStateChanged에서 자동으로 처리됨)
      console.log("✅ 로그인 성공:", userData.role);
      
      return { user: { email: userData.email } };
      
    } catch (error) {
      console.error("❌ 로그인 오류:", error);
      
      // Firebase Auth 에러 처리
      if (error.code === 'auth/user-not-found') {
        throw new Error('등록되지 않은 사용자입니다.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('비밀번호가 올바르지 않습니다.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('올바르지 않은 이메일 형식입니다.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('너무 많은 로그인 시도입니다. 잠시 후 다시 시도해주세요.');
      }
      
      throw error;
    }
  };

  // 회원가입 함수 (Firebase Auth + Firestore)
  const signup = async (email, password, role) => {
    try {
      console.log("🔥 회원가입 시작:", email, role);
      
      // 1. Firestore에서 이미 존재하는 사용자인지 확인
      const existingUserQuery = query(
        collection(db, 'users'),
        where('email', '==', email)
      );
      
      const existingUserSnapshot = await getDocs(existingUserQuery);
      
      if (!existingUserSnapshot.empty) {
        throw new Error('이미 존재하는 사용자입니다.');
      }
      
      // 2. Firebase Auth 계정 생성
      const authResult = await createUserWithEmailAndPassword(auth, email, password);
      console.log("✅ Firebase Auth 계정 생성 완료:", authResult.user.uid);
      
      // 3. Firestore에 사용자 추가 정보 저장
      const userData = {
        email: email,
        role: role,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };
      
      if (role === 'store_owner') {
        userData.storeId = null;
      }
      
      const docRef = await addDoc(collection(db, 'users'), userData);
      console.log("✅ Firestore 사용자 문서 생성 완료:", docRef.id);
      
      return { user: { email: email, uid: authResult.user.uid } };
      
    } catch (error) {
      console.error("❌ 회원가입 오류:", error);
      
      // Firebase Auth 에러 처리
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('이미 사용중인 이메일입니다.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('비밀번호가 너무 약합니다.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('올바르지 않은 이메일 형식입니다.');
      }
      
      throw error;
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    try {
      console.log("🚪 로그아웃 실행");
      
      await signOut(auth);
      
      // 상태는 onAuthStateChanged에서 자동으로 초기화됨
      console.log("✅ 로그아웃 완료");
      
    } catch (error) {
      console.error("❌ 로그아웃 오류:", error);
      throw error;
    }
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

  console.log("🎯 AuthProvider 렌더링 - loading:", loading, "currentUser:", !!currentUser, "role:", userRole);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;