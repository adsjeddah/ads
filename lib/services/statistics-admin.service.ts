import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../firebase-admin';
import { getSaudiNow, startOfDay, endOfDay } from '../utils/date';
import { Statistics } from '../../types/models';

// Saudi Arabia is UTC+3
const SAUDI_OFFSET_HOURS = 3;

/**
 * الحصول على مفتاح التاريخ السعودي (YYYY-MM-DD)
 * هذا يضمن تطابق السجلات بغض النظر عن الـ milliseconds
 */
function getSaudiDateKey(date: Date = new Date()): string {
  // تحويل إلى توقيت السعودية
  const saudiTime = new Date(date.getTime() + (SAUDI_OFFSET_HOURS * 60 * 60 * 1000));
  const year = saudiTime.getUTCFullYear();
  const month = String(saudiTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(saudiTime.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
    const now = new Date();
    const dateKey = getSaudiDateKey(now);
    const today = startOfDay(getSaudiNow());
    const todayTimestamp = Timestamp.fromDate(today);

    const statsRef = adminDb.collection('statistics');
    
    // البحث باستخدام date_key للدقة
    let snapshot = await statsRef
      .where('advertiser_id', '==', advertiserId)
      .where('date_key', '==', dateKey)
      .limit(1)
      .get();

    // إذا لم يُوجد سجل بـ date_key، جرب البحث بالتاريخ القديم
    if (snapshot.empty) {
      snapshot = await statsRef
        .where('advertiser_id', '==', advertiserId)
        .where('date', '==', todayTimestamp)
        .limit(1)
        .get();
    }

    // إعداد تفاصيل المشاهدة
    const viewDetail = trackingData ? {
      timestamp: Timestamp.now(),
      ...trackingData
    } : null;

    if (snapshot.empty) {
      const docData: any = {
        advertiser_id: advertiserId,
        date: todayTimestamp,
        date_key: dateKey,
        views: 1,
        clicks: 0,
        calls: 0,
        click_details: [],
        call_details: [],
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      };
      
      if (viewDetail) {
        docData.view_details = [viewDetail];
      }
      
      await statsRef.add(docData);
    } else {
      const docRef = snapshot.docs[0].ref;
      const docData = snapshot.docs[0].data();
      
      const updateData: any = {
        views: FieldValue.increment(1),
        date_key: dateKey,
        updated_at: Timestamp.now()
      };

      if (viewDetail) {
        const existingViewDetails = docData.view_details || [];
        updateData.view_details = [...existingViewDetails, viewDetail];
      }

      await docRef.update(updateData);
    }
  }

  // Record a click (server-side) with advanced tracking
  static async recordClick(advertiserId: string, trackingData?: any) {
    const now = new Date();
    const dateKey = getSaudiDateKey(now);
    const today = startOfDay(getSaudiNow());
    const todayTimestamp = Timestamp.fromDate(today);

    const statsRef = adminDb.collection('statistics');
    
    // البحث باستخدام date_key للدقة
    let snapshot = await statsRef
      .where('advertiser_id', '==', advertiserId)
      .where('date_key', '==', dateKey)
      .limit(1)
      .get();

    // إذا لم يُوجد سجل بـ date_key، جرب البحث بالتاريخ القديم
    if (snapshot.empty) {
      snapshot = await statsRef
        .where('advertiser_id', '==', advertiserId)
        .where('date', '==', todayTimestamp)
        .limit(1)
        .get();
    }

    // إعداد تفاصيل النقرة
    const clickDetail = trackingData ? {
      timestamp: Timestamp.now(),
      ...trackingData
    } : { timestamp: Timestamp.now() };

    if (snapshot.empty) {
      await statsRef.add({
        advertiser_id: advertiserId,
        date: todayTimestamp,
        date_key: dateKey,
        views: 0,
        clicks: 1,
        calls: 0,
        click_details: [clickDetail],
        call_details: [],
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });
    } else {
      const docRef = snapshot.docs[0].ref;
      const docData = snapshot.docs[0].data();
      
      const existingClickDetails = docData.click_details || [];
      
      await docRef.update({
        clicks: FieldValue.increment(1),
        click_details: [...existingClickDetails, clickDetail],
        date_key: dateKey,
        updated_at: Timestamp.now()
      });
    }
  }

  // Record a call (server-side) with advanced tracking
  static async recordCall(advertiserId: string, phone?: string, trackingData?: any) {
    const now = new Date();
    const dateKey = getSaudiDateKey(now);
    const today = startOfDay(getSaudiNow());
    const todayTimestamp = Timestamp.fromDate(today);

    console.log(`📞 Recording call for advertiser: ${advertiserId}, dateKey: ${dateKey}`);

    const statsRef = adminDb.collection('statistics');
    
    // البحث باستخدام date_key للدقة، أو بنطاق زمني كبديل
    let snapshot = await statsRef
      .where('advertiser_id', '==', advertiserId)
      .where('date_key', '==', dateKey)
      .limit(1)
      .get();

    // إذا لم يُوجد سجل بـ date_key، جرب البحث بالتاريخ القديم (للتوافق)
    if (snapshot.empty) {
      snapshot = await statsRef
        .where('advertiser_id', '==', advertiserId)
        .where('date', '==', todayTimestamp)
        .limit(1)
        .get();
    }

    // إعداد تفاصيل المكالمة مع معلومات إضافية للتتبع
    const callDetail = {
      timestamp: Timestamp.now(),
      phone: phone || null,
      recorded_at: now.toISOString(),
      ...(trackingData || {})
    };

    if (snapshot.empty) {
      // إنشاء سجل جديد
      const newDocRef = await statsRef.add({
        advertiser_id: advertiserId,
        date: todayTimestamp,
        date_key: dateKey, // مفتاح إضافي للبحث الموثوق
        views: 0,
        clicks: 0,
        calls: 1,
        click_details: [],
        call_details: [callDetail],
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });
      console.log(`✅ New call record created: ${newDocRef.id} for ${advertiserId}`);
    } else {
      // تحديث السجل الموجود
      const docRef = snapshot.docs[0].ref;
      const docData = snapshot.docs[0].data();
      
      const existingCallDetails = docData.call_details || [];
      
      await docRef.update({
        calls: FieldValue.increment(1),
        call_details: [...existingCallDetails, callDetail],
        date_key: dateKey, // تحديث للتأكد من وجوده
        updated_at: Timestamp.now()
      });
      
      console.log(`✅ Call record updated: ${docRef.id} for ${advertiserId}, total calls: ${existingCallDetails.length + 1}`);
    }
  }

  // البحث عن سجل اليوم بطريقة موثوقة
  private static async findTodayRecord(advertiserId: string) {
    const dateKey = getSaudiDateKey();
    const today = startOfDay(getSaudiNow());
    const todayTimestamp = Timestamp.fromDate(today);

    const statsRef = adminDb.collection('statistics');
    
    // البحث باستخدام date_key أولاً
    let snapshot = await statsRef
      .where('advertiser_id', '==', advertiserId)
      .where('date_key', '==', dateKey)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      return snapshot.docs[0];
    }

    // البحث بالتاريخ كبديل
    snapshot = await statsRef
      .where('advertiser_id', '==', advertiserId)
      .where('date', '==', todayTimestamp)
      .limit(1)
      .get();

    return snapshot.empty ? null : snapshot.docs[0];
  }
}

