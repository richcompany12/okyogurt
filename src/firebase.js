import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

// 올바른 프로젝트 설정 (okyogurt-8923e)
const firebaseConfig = {
  apiKey: "AIzaSyCRQ8wTlyL-iFSRk_8E52T7_j0o4WTjDpQ",
  authDomain: "okyogurt-8923e.firebaseapp.com",
  projectId: "okyogurt-8923e",
  storageBucket: "okyogurt-8923e.firebasestorage.app",
  messagingSenderId: "677585995800",
  appId: "1:677585995800:web:44102e3843922a6f271b6d",
  measurementId: "G-00LFSY8TH6"
};


const app = initializeApp(firebaseConfig);

// 프로젝트 ID 콘솔 출력으로 확인
console.log("🔥 연결된 Firebase 프로젝트:", app.options.projectId);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();