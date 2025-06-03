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
  Timestamp 
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';
import { Subscription } from '../../types/models';

export class SubscriptionService {
  // جلب جميع الاشتراكات
  static async getAll() {
    const subscriptionsRef = collection(db, COLLECTIONS.SUBSCRIPTIONS);
    const q = query(subscriptionsRef, orderBy('created_at', 'desc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Subscription));
  }

  // جلب اشتراكات معلن معين
  static async getByAdvertiserId(advertiserId: string) {
    const q = query(
      collection(db, COLLECTIONS.SUBSCRIPTIONS),
      where('advertiser_id', '==', advertiserId),
      orderBy('created_at', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Subscription));
  }

  // جلب الاشتراكات النشطة
  static async getActiveSubscriptions() {
    const q = query(
      collection(db, COLLECTIONS.SUBSCRIPTIONS),
      where('status', '==', 'active'),
      orderBy('end_date', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Subscription));
  }

  // جلب اشتراك واحد
  static async getById(id: string) {
    const docRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Subscription;
    }
    return null;
  }

  // إنشاء اشتراك جديد
  static async create(data: Omit<Subscription, 'id' | 'created_at'>) {
    const subscriptionData = {
      ...data,
      start_date: Timestamp.fromDate(new Date(data.start_date)),
      end_date: Timestamp.fromDate(new Date(data.end_date)),
      created_at: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.SUBSCRIPTIONS), subscriptionData);
    return docRef.id;
  }

  // تحديث اشتراك
  static async update(id: string, data: Partial<Subscription>) {
    const docRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, id);
    
    const updateData: any = { ...data };
    
    if (data.start_date) {
      updateData.start_date = Timestamp.fromDate(new Date(data.start_date));
    }
    if (data.end_date) {
      updateData.end_date = Timestamp.fromDate(new Date(data.end_date));
    }
    
    await updateDoc(docRef, updateData);
  }

  // حذف اشتراك
  static async delete(id: string) {
    await deleteDoc(doc(db, COLLECTIONS.SUBSCRIPTIONS, id));
  }

  // حساب المبلغ المتبقي
  static calculateRemainingAmount(totalAmount: number, paidAmount: number): number {
    return totalAmount - paidAmount;
  }

  // حساب المبلغ الإجمالي بعد الخصم
  static calculateTotalAmount(basePrice: number, discountType: string, discountAmount: number): number {
    if (discountType === 'percentage') {
      return basePrice - (basePrice * discountAmount / 100);
    } else {
      return basePrice - discountAmount;
    }
  }

  // التحقق من انتهاء الاشتراك
  static async checkExpiredSubscriptions() {
    const now = new Date();
    const q = query(
      collection(db, COLLECTIONS.SUBSCRIPTIONS),
      where('status', '==', 'active'),
      where('end_date', '<=', Timestamp.fromDate(now))
    );
    
    const snapshot = await getDocs(q);
    
    // تحديث الاشتراكات المنتهية
    for (const doc of snapshot.docs) {
      await updateDoc(doc.ref, { status: 'expired' });
    }
  }
}