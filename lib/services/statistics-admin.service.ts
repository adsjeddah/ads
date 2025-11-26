import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../firebase-admin';
import { getSaudiNow, startOfDay } from '../utils/date';
import { Statistics } from '../../types/models';

export class StatisticsAdminService {
  // Get dashboard statistics
  static async getDashboardStats() {
    try {
      // Get total advertisers
      const advertisersSnapshot = await adminDb.collection('advertisers').get();
      const totalAdvertisers = advertisersSnapshot.size;

      // Get active subscriptions (simplified - get all and filter in memory)
      const now = Timestamp.now();
      const subscriptionsSnapshot = await adminDb
        .collection('subscriptions')
        .where('status', '==', 'active')
        .get();
      
      const activeSubscriptions = subscriptionsSnapshot.docs.filter(doc => {
        const endDate = doc.data().end_date;
        return endDate && endDate.toMillis() > now.toMillis();
      }).length;

      // Get total revenue
      const paymentsSnapshot = await adminDb.collection('payments').get();
      const totalRevenue = paymentsSnapshot.docs.reduce(
        (sum, doc) => sum + (doc.data().amount || 0),
        0
      );

      // Get pending ad requests
      const pendingRequestsSnapshot = await adminDb
        .collection('ad_requests')
        .where('status', '==', 'pending')
        .get();
      const pendingRequests = pendingRequestsSnapshot.size;

      // Get pending refunds
      const pendingRefundsSnapshot = await adminDb
        .collection('refunds')
        .where('status', '==', 'pending')
        .get();
      const pendingRefunds = pendingRefundsSnapshot.size;

      return {
        totalAdvertisers: { count: totalAdvertisers },
        activeSubscriptions: { count: activeSubscriptions },
        totalRevenue: { total: totalRevenue },
        pendingRequests: { count: pendingRequests },
        pendingRefunds: { count: pendingRefunds }
      };
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
      throw error;
    }
  }

  // Get advertiser statistics by date range
  static async getAdvertiserStats(
    advertiserId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Statistics[]> {
    try {
      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);

      // استعلام بسيط جداً - فقط advertiser_id (لا يحتاج composite index)
      // ثم فلترة التواريخ في الذاكرة
      const snapshot = await adminDb
        .collection('statistics')
        .where('advertiser_id', '==', advertiserId)
        .get();

      // تحويل البيانات وفلترة حسب التاريخ في الذاكرة
      const statistics = snapshot.docs
        .map(doc => ({
          id: doc.id,
          advertiser_id: doc.data().advertiser_id,
          date: doc.data().date,
          views: doc.data().views || 0,
          clicks: doc.data().clicks || 0,
          calls: doc.data().calls || 0,
          call_details: doc.data().call_details || []
        }))
        .filter((stat: any) => {
          // فلترة حسب التاريخ
          const statDate = (stat.date as any)?.seconds || 0;
          const startSeconds = startTimestamp.seconds;
          const endSeconds = endTimestamp.seconds;
          return statDate >= startSeconds && statDate <= endSeconds;
        }) as Statistics[];

      // ترتيب النتائج في الذاكرة (الأحدث أولاً)
      return statistics.sort((a, b) => {
        const dateA = (a.date as any)?.seconds || 0;
        const dateB = (b.date as any)?.seconds || 0;
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error fetching advertiser statistics:', error);
      throw error;
    }
  }

  // Record a view (server-side) with optional tracking
  static async recordView(advertiserId: string, trackingData?: any) {
    const today = startOfDay(getSaudiNow());
    const todayTimestamp = Timestamp.fromDate(today);

    const statsRef = adminDb.collection('statistics');
    const snapshot = await statsRef
      .where('advertiser_id', '==', advertiserId)
      .where('date', '==', todayTimestamp)
      .get();

    // إعداد تفاصيل المشاهدة (اختياري - يمكن حفظه أو تجاهله لتقليل حجم البيانات)
    const viewDetail = trackingData ? {
      timestamp: Timestamp.now(),
      ...trackingData
    } : null;

    if (snapshot.empty) {
      const docData: any = {
        advertiser_id: advertiserId,
        date: todayTimestamp,
        views: 1,
        clicks: 0,
        calls: 0,
        click_details: [],
        call_details: []
      };
      
      // حفظ تفاصيل المشاهدات فقط إذا كانت مطلوبة (اختياري)
      if (viewDetail) {
        docData.view_details = [viewDetail];
      }
      
      await statsRef.add(docData);
    } else {
      const docRef = snapshot.docs[0].ref;
      const docData = snapshot.docs[0].data();
      
      const updateData: any = {
        views: FieldValue.increment(1)
      };

      // إضافة تفاصيل المشاهدة إلى المصفوفة (اختياري)
      if (viewDetail) {
        const existingViewDetails = docData.view_details || [];
        updateData.view_details = [
          ...existingViewDetails,
          viewDetail
        ];
      }

      await docRef.update(updateData);
    }
  }

  // Record a click (server-side) with advanced tracking
  static async recordClick(advertiserId: string, trackingData?: any) {
    const today = startOfDay(getSaudiNow());
    const todayTimestamp = Timestamp.fromDate(today);

    const statsRef = adminDb.collection('statistics');
    const snapshot = await statsRef
      .where('advertiser_id', '==', advertiserId)
      .where('date', '==', todayTimestamp)
      .get();

    // إعداد تفاصيل النقرة
    const clickDetail = trackingData ? {
      timestamp: Timestamp.now(),
      ...trackingData
    } : { timestamp: Timestamp.now() };

    if (snapshot.empty) {
      await statsRef.add({
        advertiser_id: advertiserId,
        date: todayTimestamp,
        views: 0,
        clicks: 1,
        calls: 0,
        click_details: [clickDetail],
        call_details: []
      });
    } else {
      const docRef = snapshot.docs[0].ref;
      const docData = snapshot.docs[0].data();
      
      const updateData: any = {
        clicks: FieldValue.increment(1)
      };

      // إضافة تفاصيل النقرة إلى المصفوفة
      const existingClickDetails = docData.click_details || [];
      updateData.click_details = [
        ...existingClickDetails,
        clickDetail
      ];

      await docRef.update(updateData);
    }
  }

  // Record a call (server-side) with advanced tracking
  static async recordCall(advertiserId: string, phone?: string, trackingData?: any) {
    const today = startOfDay(getSaudiNow());
    const todayTimestamp = Timestamp.fromDate(today);

    const statsRef = adminDb.collection('statistics');
    const snapshot = await statsRef
      .where('advertiser_id', '==', advertiserId)
      .where('date', '==', todayTimestamp)
      .get();

    // إعداد تفاصيل المكالمة
    const callDetail = {
      timestamp: Timestamp.now(),
      phone: phone || null,
      ...(trackingData || {})
    };

    if (snapshot.empty) {
      await statsRef.add({
        advertiser_id: advertiserId,
        date: todayTimestamp,
        views: 0,
        clicks: 0,
        calls: 1,
        click_details: [],
        call_details: [callDetail]
      });
    } else {
      const docRef = snapshot.docs[0].ref;
      const docData = snapshot.docs[0].data();
      
      const updateData: any = {
        calls: FieldValue.increment(1)
      };

      // إضافة تفاصيل المكالمة إلى المصفوفة
      const existingCallDetails = docData.call_details || [];
      updateData.call_details = [
        ...existingCallDetails,
        callDetail
      ];

      await docRef.update(updateData);
    }
  }
}

