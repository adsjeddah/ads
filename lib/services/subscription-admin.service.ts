import { 
  Timestamp,
  FieldValue
} from 'firebase-admin/firestore';
import { adminDb } from '../firebase-admin';
import { Subscription } from '../../types/models';

export class SubscriptionAdminService {
  // إنشاء اشتراك جديد
  static async create(data: Omit<Subscription, 'id' | 'created_at'>): Promise<string> {
    const subscriptionData = {
      ...data,
      start_date: Timestamp.fromDate(new Date(data.start_date)),
      end_date: Timestamp.fromDate(new Date(data.end_date)),
      created_at: FieldValue.serverTimestamp()
    };
    
    const docRef = await adminDb.collection('subscriptions').add(subscriptionData);
    return docRef.id;
  }

  // جلب جميع الاشتراكات
  static async getAll(): Promise<Subscription[]> {
    const snapshot = await adminDb.collection('subscriptions')
      .orderBy('created_at', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Subscription[];
  }

  // جلب اشتراكات معلن معين
  static async getByAdvertiserId(advertiserId: string): Promise<Subscription[]> {
    const snapshot = await adminDb.collection('subscriptions')
      .where('advertiser_id', '==', advertiserId)
      .orderBy('created_at', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Subscription[];
  }
}