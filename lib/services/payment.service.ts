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
import { Payment } from '../../types/models';
import { SubscriptionService } from './subscription.service';

export class PaymentService {
  // جلب جميع المدفوعات
  static async getAll() {
    const paymentsRef = collection(db, COLLECTIONS.PAYMENTS);
    const q = query(paymentsRef, orderBy('created_at', 'desc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Payment));
  }

  // جلب مدفوعات اشتراك معين
  static async getBySubscriptionId(subscriptionId: string) {
    const q = query(
      collection(db, COLLECTIONS.PAYMENTS),
      where('subscription_id', '==', subscriptionId),
      orderBy('payment_date', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Payment));
  }

  // جلب دفعة واحدة
  static async getById(id: string) {
    const docRef = doc(db, COLLECTIONS.PAYMENTS, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Payment;
    }
    return null;
  }

  // إنشاء دفعة جديدة
  static async create(data: Omit<Payment, 'id' | 'created_at'>) {
    const paymentData = {
      ...data,
      payment_date: Timestamp.fromDate(new Date(data.payment_date)),
      created_at: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.PAYMENTS), paymentData);
    
    // تحديث المبلغ المدفوع في الاشتراك
    await this.updateSubscriptionPaidAmount(data.subscription_id);
    
    return docRef.id;
  }

  // تحديث دفعة
  static async update(id: string, data: Partial<Payment>) {
    const docRef = doc(db, COLLECTIONS.PAYMENTS, id);
    
    const updateData: any = { ...data };
    
    if (data.payment_date) {
      updateData.payment_date = Timestamp.fromDate(new Date(data.payment_date));
    }
    
    await updateDoc(docRef, updateData);
    
    // تحديث المبلغ المدفوع في الاشتراك
    if (data.subscription_id) {
      await this.updateSubscriptionPaidAmount(data.subscription_id);
    }
  }

  // حذف دفعة
  static async delete(id: string) {
    const payment = await this.getById(id);
    if (!payment) return;
    
    await deleteDoc(doc(db, COLLECTIONS.PAYMENTS, id));
    
    // تحديث المبلغ المدفوع في الاشتراك
    await this.updateSubscriptionPaidAmount(payment.subscription_id);
  }

  // تحديث المبلغ المدفوع في الاشتراك
  private static async updateSubscriptionPaidAmount(subscriptionId: string) {
    const payments = await this.getBySubscriptionId(subscriptionId);
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    const subscription = await SubscriptionService.getById(subscriptionId);
    if (!subscription) return;
    
    const remainingAmount = subscription.total_amount - totalPaid;
    const paymentStatus = remainingAmount <= 0 ? 'paid' : (totalPaid > 0 ? 'partial' : 'pending');
    
    await SubscriptionService.update(subscriptionId, {
      paid_amount: totalPaid,
      remaining_amount: remainingAmount,
      payment_status: paymentStatus
    });
  }

  // جلب إحصائيات المدفوعات
  static async getPaymentStatistics(startDate?: Date, endDate?: Date) {
    let q = query(collection(db, COLLECTIONS.PAYMENTS), orderBy('payment_date', 'desc'));
    
    if (startDate && endDate) {
      q = query(
        collection(db, COLLECTIONS.PAYMENTS),
        where('payment_date', '>=', Timestamp.fromDate(startDate)),
        where('payment_date', '<=', Timestamp.fromDate(endDate)),
        orderBy('payment_date', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    const payments = snapshot.docs.map(doc => doc.data() as Payment);
    
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const paymentCount = payments.length;
    
    return {
      totalAmount,
      paymentCount,
      averagePayment: paymentCount > 0 ? totalAmount / paymentCount : 0
    };
  }
}