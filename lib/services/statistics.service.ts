import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';
import { Statistics } from '../../types/models';
import { AdvertiserService } from './advertiser.service'; // Assuming this exists
import { SubscriptionService } from './subscription.service'; // Assuming this exists

export class StatisticsService {
  // تسجيل مشاهدة لإعلان
  static async recordView(advertiserId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

    const statsRef = collection(db, COLLECTIONS.STATISTICS);
    const q = query(
      statsRef,
      where('advertiser_id', '==', advertiserId),
      where('date', '==', Timestamp.fromDate(today))
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // إنشاء سجل جديد لهذا اليوم
      await addDoc(statsRef, {
        advertiser_id: advertiserId,
        date: Timestamp.fromDate(today),
        views: 1,
        clicks: 0,
        calls: 0
      });
    } else {
      // تحديث السجل الحالي
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, {
        views: increment(1)
      });
    }
  }

  // تسجيل نقرة على إعلان
  static async recordClick(advertiserId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateStr = today.toISOString().split('T')[0];

    const statsRef = collection(db, COLLECTIONS.STATISTICS);
    const q = query(
      statsRef,
      where('advertiser_id', '==', advertiserId),
      where('date', '==', Timestamp.fromDate(today))
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      await addDoc(statsRef, {
        advertiser_id: advertiserId,
        date: Timestamp.fromDate(today),
        views: 0, // Or 1 if a click implies a view
        clicks: 1,
        calls: 0
      });
    } else {
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, {
        clicks: increment(1)
      });
    }
  }

  // تسجيل مكالمة على إعلان
  static async recordCall(advertiserId: string, phone?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const statsRef = collection(db, COLLECTIONS.STATISTICS);
    const q = query(
      statsRef,
      where('advertiser_id', '==', advertiserId),
      where('date', '==', Timestamp.fromDate(today))
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // إنشاء سجل جديد لهذا اليوم
      await addDoc(statsRef, {
        advertiser_id: advertiserId,
        date: Timestamp.fromDate(today),
        views: 0,
        clicks: 0,
        calls: 1,
        call_details: phone ? [{ phone, timestamp: Timestamp.now() }] : []
      });
    } else {
      // تحديث السجل الحالي
      const docRef = snapshot.docs[0].ref;
      const docData = snapshot.docs[0].data();
      
      // تحديث عدد المكالمات
      const updateData: any = {
        calls: increment(1)
      };

      // إضافة تفاصيل المكالمة إلى المصفوفة
      if (phone) {
        const existingCallDetails = docData.call_details || [];
        updateData.call_details = [
          ...existingCallDetails,
          { phone, timestamp: Timestamp.now() }
        ];
      }

      await updateDoc(docRef, updateData);
    }
  }

  // جلب إحصائيات معلن معين لفترة محددة
  static async getAdvertiserStats(advertiserId: string, startDate: Date, endDate: Date) {
    const q = query(
      collection(db, COLLECTIONS.STATISTICS),
      where('advertiser_id', '==', advertiserId),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Statistics));
  }

  // جلب إحصائيات عامة للوحة التحكم
  static async getDashboardStatistics() {
    const advertisers = await AdvertiserService.getAll(); // You'll need to implement this
    const activeSubscriptions = await SubscriptionService.getActiveSubscriptions(); // You'll need to implement this
    
    // Example: Total revenue (this would be more complex, sum of paid amounts from subscriptions or payments)
    // For simplicity, let's assume total revenue is sum of active subscription total_amount
    const totalRevenue = activeSubscriptions.reduce((sum, sub) => sum + sub.total_amount, 0);

    // Example: Pending ad requests
    // const adRequests = await AdRequestService.getAll('pending'); // You'll need AdRequestService

    return {
      totalAdvertisers: advertisers.length,
      activeSubscriptions: activeSubscriptions.length,
      totalRevenue: totalRevenue,
      // pendingRequests: adRequests.length,
    };
  }
}