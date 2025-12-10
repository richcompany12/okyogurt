// src/components/NotificationManager.js
import { useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

function NotificationManager() {
  const audioRef = useRef(null);
  const isInitialLoadRef = useRef(true);

// 🎵 오디오 초기화 및 정책 우회 함수
  const initAudioContext = () => {
    if (audioRef.current) return; // 이미 초기화됨

    audioRef.current = new Audio('/sounds/psy.mp3');
    audioRef.current.volume = 0.8;
    audioRef.current.preload = 'auto';

    // 💡 브라우저 정책 우회를 위한 재생 시도
    // 이 코드는 사용자 상호작용(클릭 등) 이후에 호출되어야 합니다.
    audioRef.current.play()
      .then(() => {
        console.log('🎵 알림 사운드 초기화 및 자동 재생 권한 획득 성공');
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      })
      .catch((error) => {
        console.warn('⚠️ 알림 사운드 자동 재생 권한 획득 실패:', error.name, error.message);
        // 실패하더라도 나중에 playSound가 호출될 때 다시 시도합니다.
      });
  };

  // 컴포넌트 마운트 시 오디오 컨텍스트 초기화 함수를 window에 노출
  useEffect(() => {
    window.initOrderNotification = initAudioContext;
    
    // 🔔 알림 권한 미리 요청
    if (!("Notification" in window)) {
      console.warn("이 브라우저는 데스크톱 알림을 지원하지 않습니다.");
    } else if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    console.log('✅ 알림 관리자 초기화 완료');
    // 기존의 useEffect는 이 코드로 대체되었습니다.
  }, []);

// 🔔 알림 표시 함수
  const showNotification = (title, body, playSound = false) => {
    console.log('🔔 알림 표시 시작:', title);
    
    // 브라우저 알림 표시
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'order-notification',
        requireInteraction: true,
        silent: !playSound // 사운드 제어
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => {
        notification.close();
      }, 10000);
    }

    // 🎵 사운드 재생
    if (playSound) {
      // 💡 추가: 사운드 재생 시 초기화 함수 호출을 시도하여 오디오 컨텍스트를 활성화
      // 이 함수는 클릭 이벤트 컨텍스트를 상속하여 자동 재생 제한을 해제하려고 시도합니다.
      window.initOrderNotification?.(); 
      
      if (audioRef.current) {
        console.log('🎵 알림 사운드 재생 시도...');
        
        audioRef.current.currentTime = 0;
        audioRef.current.play()
          .then(() => {
            console.log('✅ 알림 사운드 재생 성공');
          })
          .catch(error => {
            console.warn('❌ 사운드 재생 실패:', error);
          });
      }
    }
  };

  // 🔄 실시간 주문 모니터링
  useEffect(() => {
    // 🎯 토글 상태 체크
    const isNotificationEnabled = localStorage.getItem('adminNotificationEnabled') === 'true';
    
    if (!isNotificationEnabled) {
      console.log('🔕 알림이 비활성화되어 있습니다.');
      return; // 토글이 OFF면 리스너 등록하지 않음
    }

    console.log('🔄 실시간 주문 모니터링 시작...');

    // orders 컬렉션 참조 생성
    const ordersCollection = collection(db, 'orders');
    const q = query(ordersCollection, orderBy('timestamp', 'desc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('📡 Firestore 변화 감지됨!');
      
      // docChanges()를 사용해서 정확한 변화 감지
      snapshot.docChanges().forEach((change) => {
        console.log('📝 문서 변화 타입:', change.type);
        
        if (change.type === 'added') {
          const newOrder = {
            id: change.doc.id,
            ...change.doc.data()
          };
          
          console.log('🆕 새 주문 감지!', newOrder.id);
          console.log('📋 주문 상세:', newOrder);
          
          // 초기 로드가 아닐 때만 알림
          if (!isInitialLoadRef.current) {
            console.log('🔔 알림 표시 시작...');
            
            // 새 주문 알림
            showNotification(
              `🛒 새 주문이 접수되었습니다!`,
              `주문번호: ${newOrder.orderNumber || newOrder.id.slice(-6)}\n상품: ${newOrder.items?.[0]?.name || '상품 정보 없음'}\n금액: ${newOrder.items?.[0]?.price?.toLocaleString() || '0'}원`,
              true // 사운드 재생
            );
          } else {
            console.log('📊 초기 로드 중이므로 알림 건너뜀');
          }
        }
      });

      // 초기 로드 완료 표시
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
        console.log(`📊 초기 주문 수: ${snapshot.size}개`);
        console.log('✅ 이제부터 새 주문 감지 시작!');
      }
    }, (error) => {
      console.error('❌ 실시간 주문 모니터링 오류:', error);
    });

    // 정리 함수
    return () => {
      console.log('🛑 주문 모니터링 리스너 해제');
      unsubscribe();
    };
  }, []); // 빈 의존성 배열로 컴포넌트 마운트 시에만 실행

  // 🎯 테스트 함수를 전역에 노출
  useEffect(() => {
    window.testNotification = () => {
      console.log('🧪 테스트 알림 실행');
      showNotification(
        '🧪 테스트 알림',
        '알림 시스템이 정상적으로 작동하고 있습니다!',
        true
      );
    };

    return () => {
      delete window.testNotification;
    };
  }, []);

  // 🎯 알림 권한 요청
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('알림 권한 상태:', permission);
      });
    }
  }, []);

  return null; // UI 없음, 백그라운드에서만 작동
}

export default NotificationManager;