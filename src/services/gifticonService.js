// src/services/gifticonService.js
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

export class GifticonService {
  static COLLECTION_NAME = 'gifticons';
  static USAGE_COLLECTION_NAME = 'gifticon_usage';
  static STATUS_LOG_COLLECTION_NAME = 'gifticon_status_logs';

  // 기프티콘 생성
  static async createGifticon(gifticonData) {
    try {
      // 기프티콘 ID를 문서 ID로 사용
      const gifticonId = gifticonData.id;
      const docRef = doc(db, this.COLLECTION_NAME, gifticonId);
      
      await setDoc(docRef, {
        ...gifticonData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'active',
        isActive: true,
        isBlocked: false,
        blockReason: null,
        blockedAt: null,
        blockedBy: null,
        totalUsed: 0,
        usageCount: 0,
        remainingAmount: gifticonData.amount
      });

      console.log('✅ 기프티콘 생성 성공:', gifticonId);
      return gifticonId;
    } catch (error) {
      console.error('❌ 기프티콘 생성 오류:', error);
      throw error;
    }
  }

  // 기프티콘 조회 (ID로)
  static async getGifticon(gifticonId) {
    try {
      console.log('🔍 기프티콘 조회 시도:', gifticonId);
      
      const docRef = doc(db, this.COLLECTION_NAME, gifticonId);
      const docSnap = await getDoc(docRef);
      
      console.log('📄 문서 존재 여부:', docSnap.exists());
      
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        console.log('✅ 조회된 데이터:', data);
        return data;
      } else {
        console.log('❌ 기프티콘을 찾을 수 없습니다:', gifticonId);
        
        // 전체 기프티콘 목록 확인 (디버깅용)
        const allGifticons = await this.getGifticons({ limit: 10 });
        console.log('📋 최근 기프티콘 목록:', allGifticons.map(g => g.id));
        
        return null;
      }
    } catch (error) {
      console.error('기프티콘 조회 오류:', error);
      throw error;
    }
  }

  // 기프티콘 목록 조회
  static async getGifticons(filters = {}) {
    try {
      let q = collection(db, this.COLLECTION_NAME);
      
      // 필터링 적용
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      if (filters.createdBy) {
        q = query(q, where('createdBy', '==', filters.createdBy));
      }

      // 정렬 (최신순)
      q = query(q, orderBy('createdAt', 'desc'));

      // 제한
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      const gifticons = [];
      
      querySnapshot.forEach((doc) => {
        gifticons.push({ id: doc.id, ...doc.data() });
      });

      return gifticons;
    } catch (error) {
      console.error('기프티콘 목록 조회 오류:', error);
      throw error;
    }
  }

  // 기프티콘 사용 처리
  static async processGifticonUsage(gifticonId, usageData) {
    try {
      const gifticonRef = doc(db, this.COLLECTION_NAME, gifticonId);
      const gifticonSnap = await getDoc(gifticonRef);
      
      if (!gifticonSnap.exists()) {
        throw new Error('기프티콘을 찾을 수 없습니다.');
      }

      const gifticon = gifticonSnap.data();
      
      // 사용 가능 여부 확인
      if (gifticon.status !== 'active') {
        throw new Error('사용할 수 없는 기프티콘입니다.');
      }

      // 정지 상태 확인
      if (gifticon.isBlocked) {
        throw new Error(`사용이 정지된 기프티콘입니다.\n사유: ${gifticon.blockReason || '알 수 없음'}`);
      }

      if (gifticon.remainingAmount < usageData.usedAmount) {
        throw new Error('잔액이 부족합니다.');
      }

      // 만료일 확인
      if (gifticon.expiresAt && gifticon.expiresAt.toDate() < new Date()) {
        throw new Error('만료된 기프티콘입니다.');
      }

      // 새로운 잔액 계산
      const newRemainingAmount = gifticon.remainingAmount - usageData.usedAmount;
      const newTotalUsed = gifticon.totalUsed + usageData.usedAmount;
      const newUsageCount = gifticon.usageCount + 1;
      const newStatus = newRemainingAmount === 0 ? 'used' : 'active';

      // 기프티콘 업데이트
      await updateDoc(gifticonRef, {
        remainingAmount: newRemainingAmount,
        totalUsed: newTotalUsed,
        usageCount: newUsageCount,
        status: newStatus,
        isActive: newRemainingAmount > 0,
        updatedAt: Timestamp.now()
      });

      // 사용 내역 기록
      await addDoc(collection(db, this.USAGE_COLLECTION_NAME), {
        gifticonId: gifticonId,
        usedAmount: usageData.usedAmount,
        remainingAfter: newRemainingAmount,
        usedAt: Timestamp.now(),
        usedBy: usageData.usedBy,
        usedByEmail: usageData.usedByEmail,
        memo: usageData.memo || '',
        location: usageData.location || '매장',
        paymentMethod: usageData.paymentMethod || '현금+기프티콘'
      });

      console.log('✅ 기프티콘 사용 처리 완료:', gifticonId);
      return {
        success: true,
        remainingAmount: newRemainingAmount,
        usedAmount: usageData.usedAmount,
        isFullyUsed: newRemainingAmount === 0
      };

    } catch (error) {
      console.error('❌ 기프티콘 사용 처리 오류:', error);
      throw error;
    }
  }

  // 기프티콘 사용 정지 (NEW!)
  static async blockGifticon(gifticonId, blockData) {
    try {
      console.log('🚫 기프티콘 정지 시작:', gifticonId, blockData);
      
      const gifticonRef = doc(db, this.COLLECTION_NAME, gifticonId);
      const gifticonSnap = await getDoc(gifticonRef);
      
      if (!gifticonSnap.exists()) {
        throw new Error('기프티콘을 찾을 수 없습니다.');
      }

      const gifticon = gifticonSnap.data();
      
      if (gifticon.isBlocked) {
        throw new Error('이미 정지된 기프티콘입니다.');
      }

      // 기프티콘 정지 처리
      await updateDoc(gifticonRef, {
        isBlocked: true,
        blockReason: blockData.reason,
        blockedAt: Timestamp.now(),
        blockedBy: blockData.blockedBy,
        blockedByEmail: blockData.blockedByEmail,
        updatedAt: Timestamp.now()
      });

      // 상태 변경 로그 기록
      await addDoc(collection(db, this.STATUS_LOG_COLLECTION_NAME), {
        gifticonId: gifticonId,
        action: 'blocked',
        reason: blockData.reason,
        performedBy: blockData.blockedBy,
        performedByEmail: blockData.blockedByEmail,
        performedAt: Timestamp.now(),
        previousStatus: {
          isBlocked: false,
          status: gifticon.status
        },
        newStatus: {
          isBlocked: true,
          status: gifticon.status
        }
      });

      console.log('✅ 기프티콘 정지 완료:', gifticonId);
      return { success: true };

    } catch (error) {
      console.error('❌ 기프티콘 정지 오류:', error);
      throw error;
    }
  }

  // 기프티콘 사용 재개 (NEW!)
  static async unblockGifticon(gifticonId, unblockData) {
    try {
      console.log('✅ 기프티콘 재개 시작:', gifticonId, unblockData);
      
      const gifticonRef = doc(db, this.COLLECTION_NAME, gifticonId);
      const gifticonSnap = await getDoc(gifticonRef);
      
      if (!gifticonSnap.exists()) {
        throw new Error('기프티콘을 찾을 수 없습니다.');
      }

      const gifticon = gifticonSnap.data();
      
      if (!gifticon.isBlocked) {
        throw new Error('정지되지 않은 기프티콘입니다.');
      }

      // 기프티콘 재개 처리
      await updateDoc(gifticonRef, {
        isBlocked: false,
        blockReason: null,
        blockedAt: null,
        blockedBy: null,
        blockedByEmail: null,
        unblockReason: unblockData.reason,
        unblockedAt: Timestamp.now(),
        unblockedBy: unblockData.unblockedBy,
        unblockedByEmail: unblockData.unblockedByEmail,
        updatedAt: Timestamp.now()
      });

      // 상태 변경 로그 기록
      await addDoc(collection(db, this.STATUS_LOG_COLLECTION_NAME), {
        gifticonId: gifticonId,
        action: 'unblocked',
        reason: unblockData.reason,
        performedBy: unblockData.unblockedBy,
        performedByEmail: unblockData.unblockedByEmail,
        performedAt: Timestamp.now(),
        previousStatus: {
          isBlocked: true,
          status: gifticon.status,
          blockReason: gifticon.blockReason
        },
        newStatus: {
          isBlocked: false,
          status: gifticon.status
        }
      });

      console.log('✅ 기프티콘 재개 완료:', gifticonId);
      return { success: true };

    } catch (error) {
      console.error('❌ 기프티콘 재개 오류:', error);
      throw error;
    }
  }

  // 기프티콘 상태 로그 조회 (NEW!)
  static async getStatusLogs(gifticonId) {
    try {
      const q = query(
        collection(db, this.STATUS_LOG_COLLECTION_NAME),
        where('gifticonId', '==', gifticonId),
        orderBy('performedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const logs = [];
      
      querySnapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
      });

      return logs;
    } catch (error) {
      console.error('상태 로그 조회 오류:', error);
      throw error;
    }
  }

  // 기프티콘 충전 (NEW!)
  static async rechargeGifticon(gifticonId, rechargeData) {
    try {
      console.log('💰 기프티콘 충전 시작:', gifticonId, rechargeData);
      
      const gifticonRef = doc(db, this.COLLECTION_NAME, gifticonId);
      const gifticonSnap = await getDoc(gifticonRef);
      
      if (!gifticonSnap.exists()) {
        throw new Error('기프티콘을 찾을 수 없습니다.');
      }

      const gifticon = gifticonSnap.data();
      
      // 충전 가능 여부 확인
      if (gifticon.isBlocked) {
        throw new Error('정지된 기프티콘은 충전할 수 없습니다.');
      }

      if (rechargeData.rechargeAmount <= 0) {
        throw new Error('충전 금액은 0원보다 커야 합니다.');
      }

      // 만료일 확인 (만료된 기프티콘도 충전 가능하지만 경고)
      const isExpired = gifticon.expiresAt && gifticon.expiresAt.toDate() < new Date();

      // 새로운 금액 계산
      const newAmount = gifticon.amount + rechargeData.rechargeAmount;
      const newRemainingAmount = (gifticon.remainingAmount ?? gifticon.amount) + rechargeData.rechargeAmount;
      const newTotalRecharged = (gifticon.totalRecharged || 0) + rechargeData.rechargeAmount;
      const newRechargeCount = (gifticon.rechargeCount || 0) + 1;

      // 상태 업데이트 (만료된 기프티콘도 충전되면 다시 active로)
      const newStatus = isExpired ? 'active' : gifticon.status;
      const newIsActive = true;

      // 충전 내역 추가
      const rechargeHistory = gifticon.rechargeHistory || [];
      const newRechargeEntry = {
        rechargeAmount: rechargeData.rechargeAmount,
        rechargedAt: Timestamp.now(),
        rechargedBy: rechargeData.rechargedBy,
        rechargedByEmail: rechargeData.rechargedByEmail,
        memo: rechargeData.memo || '',
        paymentMethod: rechargeData.paymentMethod || '현금',
        previousAmount: gifticon.amount,
        newAmount: newAmount
      };
      rechargeHistory.push(newRechargeEntry);

      // 기프티콘 업데이트
      await updateDoc(gifticonRef, {
        amount: newAmount,
        remainingAmount: newRemainingAmount,
        totalRecharged: newTotalRecharged,
        rechargeCount: newRechargeCount,
        rechargeHistory: rechargeHistory,
        status: newStatus,
        isActive: newIsActive,
        updatedAt: Timestamp.now()
      });

      // 충전 로그 기록
      await addDoc(collection(db, this.STATUS_LOG_COLLECTION_NAME), {
        gifticonId: gifticonId,
        action: 'recharged',
        reason: `${rechargeData.rechargeAmount.toLocaleString()}원 충전`,
        performedBy: rechargeData.rechargedBy,
        performedByEmail: rechargeData.rechargedByEmail,
        performedAt: Timestamp.now(),
        previousStatus: {
          amount: gifticon.amount,
          remainingAmount: gifticon.remainingAmount || gifticon.amount,
          status: gifticon.status
        },
        newStatus: {
          amount: newAmount,
          remainingAmount: newRemainingAmount,
          status: newStatus
        },
        rechargeAmount: rechargeData.rechargeAmount,
        paymentMethod: rechargeData.paymentMethod
      });

      console.log('✅ 기프티콘 충전 완료:', gifticonId);
      return {
        success: true,
        newAmount: newAmount,
        newRemainingAmount: newRemainingAmount,
        rechargeAmount: rechargeData.rechargeAmount,
        totalRecharged: newTotalRecharged,
        wasExpired: isExpired
      };

    } catch (error) {
      console.error('❌ 기프티콘 충전 오류:', error);
      throw error;
    }
  }

  // 기프티콘 통계
  static async getStatistics() {
    try {
      const gifticons = await this.getGifticons();
      
      const stats = {
        totalCount: gifticons.length,
        totalAmount: 0,
        totalUsed: 0,
        activeCount: 0,
        usedCount: 0,
        expiredCount: 0,
        blockedCount: 0
      };

      const now = new Date();

      gifticons.forEach(gifticon => {
        stats.totalAmount += gifticon.amount;
        stats.totalUsed += gifticon.totalUsed || 0;

        // 정지된 기프티콘 카운트
        if (gifticon.isBlocked) {
          stats.blockedCount++;
        }

        if (gifticon.status === 'active') {
          stats.activeCount++;
        } else if (gifticon.status === 'used') {
          stats.usedCount++;
        }

        // 만료 확인
        if (gifticon.expiresAt && gifticon.expiresAt.toDate() < now) {
          stats.expiredCount++;
        }
      });

      return stats;
    } catch (error) {
      console.error('통계 조회 오류:', error);
      throw error;
    }
  }
}