import { 
  Timestamp,
  FieldValue
} from 'firebase-admin/firestore';
import { adminDb } from '../firebase-admin';
import { Subscription } from '../../types/models';

export class SubscriptionAdminService {
  // إنشاء اشتراك جديد
  static async create(data: Omit<Subscription, 'id' | 'created_at'>): Promise<string> {
    const subscriptionData: any = {
      advertiser_id: data.advertiser_id,
      plan_id: data.plan_id,
      start_date: Timestamp.fromDate(new Date(data.start_date)),
      end_date: Timestamp.fromDate(new Date(data.end_date)),
      base_price: data.base_price,
      discount_type: data.discount_type,
      discount_amount: data.discount_amount,
      total_amount: data.total_amount,
      paid_amount: data.paid_amount,
      remaining_amount: data.remaining_amount || (data.total_amount - data.paid_amount),
      status: data.status || 'active',
      payment_status: data.payment_status || 'partial',
      created_at: FieldValue.serverTimestamp()
    };
    
    // 🆕 إضافة حقول التغطية الجغرافية إذا كانت موجودة
    if (data.coverage_area) {
      subscriptionData.coverage_area = data.coverage_area;
    }
    if (data.city) {
      subscriptionData.city = data.city;
    }
    
    const docRef = await adminDb.collection('subscriptions').add(subscriptionData);
    
    return docRef.id;
  }

  // جلب جميع الاشتراكات
  static async getAll(): Promise<Subscription[]> {
    const snapshot = await adminDb.collection('subscriptions').get();
    
    // ترتيب النتائج في الذاكرة
    const subscriptions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Subscription[];
    
    return subscriptions.sort((a, b) => {
      const dateA = (a.created_at as any)?.seconds || 0;
      const dateB = (b.created_at as any)?.seconds || 0;
      return dateB - dateA;
    });
  }

  // جلب اشتراكات معلن معين
  static async getByAdvertiserId(advertiserId: string): Promise<Subscription[]> {
    // استعلام بسيط بدون orderBy لتجنب الحاجة لـ composite index
    const snapshot = await adminDb
      .collection('subscriptions')
      .where('advertiser_id', '==', advertiserId)
      .get();
    
    // ترتيب النتائج في الذاكرة بدلاً من Firestore
    const subscriptions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Subscription[];
    
    // ترتيب حسب created_at تنازلياً
    return subscriptions.sort((a, b) => {
      const dateA = (a.created_at as any)?.seconds || 0;
      const dateB = (b.created_at as any)?.seconds || 0;
      return dateB - dateA;
    });
  }

  // جلب الاشتراكات النشطة
  static async getActiveSubscriptions(): Promise<Subscription[]> {
    // استعلام بسيط بدون orderBy لتجنب الحاجة لـ composite index
    const snapshot = await adminDb
      .collection('subscriptions')
      .where('status', '==', 'active')
      .get();
    
    // ترتيب النتائج في الذاكرة
    const subscriptions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Subscription[];
    
    return subscriptions.sort((a, b) => {
      const dateA = (a.created_at as any)?.seconds || 0;
      const dateB = (b.created_at as any)?.seconds || 0;
      return dateB - dateA;
    });
  }

  // جلب اشتراك واحد
  static async getById(id: string): Promise<Subscription | null> {
    const doc = await adminDb.collection('subscriptions').doc(id).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return { id: doc.id, ...doc.data() } as Subscription;
  }

  // تحديث اشتراك
  static async update(id: string, data: Partial<Subscription>): Promise<void> {
    const updateData: any = { ...data };
    
    // إزالة الحقول التي لا يجب تحديثها
    delete updateData.id;
    delete updateData.created_at;
    
    // تحويل التواريخ إذا كانت موجودة
    if (data.start_date) {
      updateData.start_date = Timestamp.fromDate(new Date(data.start_date));
    }
    if (data.end_date) {
      updateData.end_date = Timestamp.fromDate(new Date(data.end_date));
    }
    
    await adminDb.collection('subscriptions').doc(id).update(updateData);
  }

  // حذف اشتراك
  static async delete(id: string): Promise<void> {
    await adminDb.collection('subscriptions').doc(id).delete();
  }
}
