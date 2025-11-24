import { 
  Timestamp,
  FieldValue
} from 'firebase-admin/firestore';
import { adminDb } from '../firebase-admin';
import { Payment } from '../../types/models';

export class PaymentAdminService {
  // إنشاء دفعة جديدة
  static async create(data: Omit<Payment, 'id' | 'created_at'>): Promise<string> {
    const paymentData: any = {
      subscription_id: data.subscription_id,
      invoice_id: (data as any).invoice_id,
      amount: data.amount,
      payment_method: (data as any).payment_method || 'cash',
      payment_date: Timestamp.fromDate(new Date((data as any).payment_date)),
      notes: (data as any).notes || '',
      created_at: FieldValue.serverTimestamp()
    };
    
    const docRef = await adminDb.collection('payments').add(paymentData);
    
    // 🆕 تحديث الاشتراك تلقائياً بعد تسجيل الدفعة
    await this.updateSubscriptionAfterPayment(data.subscription_id, data.amount);
    
    return docRef.id;
  }

  /**
   * 🆕 تحديث الاشتراك تلقائياً بعد تسجيل الدفعة
   * - يحدث paid_amount و remaining_amount
   * - يفعّل الاشتراك إذا كان معلقاً (pending_payment)
   * - يحدث payment_status
   */
  private static async updateSubscriptionAfterPayment(
    subscriptionId: string,
    paymentAmount: number
  ): Promise<void> {
    const subRef = adminDb.collection('subscriptions').doc(subscriptionId);
    const subDoc = await subRef.get();
    
    if (!subDoc.exists) {
      console.error('Subscription not found:', subscriptionId);
      return;
    }
    
    const subscription = subDoc.data() as any;
    
    // حساب المبالغ الجديدة
    const currentPaid = subscription.paid_amount || 0;
    const newPaidAmount = currentPaid + paymentAmount;
    const totalAmount = subscription.total_amount || 0;
    const newRemainingAmount = Math.max(0, totalAmount - newPaidAmount);
    
    // تحديد حالة الدفع الجديدة
    let newPaymentStatus: 'paid' | 'partial' | 'pending' = 'pending';
    if (newPaidAmount >= totalAmount) {
      newPaymentStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newPaymentStatus = 'partial';
    }
    
    // 🎯 المنطق الأساسي: تفعيل الاشتراك بأول دفعة (حتى ريال واحد)
    let newStatus = subscription.status;
    if (subscription.status === 'pending_payment' && newPaidAmount >= 1) {
      newStatus = 'active';
    }
    
    // تحديث الاشتراك
    await subRef.update({
      paid_amount: newPaidAmount,
      remaining_amount: newRemainingAmount,
      payment_status: newPaymentStatus,
      status: newStatus,
      updated_at: FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Subscription ${subscriptionId} updated after payment:`, {
      paid_amount: newPaidAmount,
      remaining_amount: newRemainingAmount,
      payment_status: newPaymentStatus,
      status: newStatus
    });
  }

  // جلب جميع الدفعات
  static async getAll(): Promise<Payment[]> {
    const snapshot = await adminDb.collection('payments').get();
    
    // ترتيب النتائج في الذاكرة
    const payments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Payment[];
    
    return payments.sort((a, b) => {
      const dateA = (a.payment_date as any)?.seconds || 0;
      const dateB = (b.payment_date as any)?.seconds || 0;
      return dateB - dateA;
    });
  }

  // جلب دفعات اشتراك معين
  static async getBySubscriptionId(subscriptionId: string): Promise<Payment[]> {
    const snapshot = await adminDb
      .collection('payments')
      .where('subscription_id', '==', subscriptionId)
      .get();
    
    const payments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Payment[];
    
    return payments.sort((a, b) => {
      const dateA = (a.payment_date as any)?.seconds || 0;
      const dateB = (b.payment_date as any)?.seconds || 0;
      return dateB - dateA;
    });
  }

  // جلب دفعات فاتورة معينة
  static async getByInvoiceId(invoiceId: string): Promise<Payment[]> {
    const snapshot = await adminDb
      .collection('payments')
      .where('invoice_id', '==', invoiceId)
      .get();
    
    const payments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Payment[];
    
    return payments.sort((a, b) => {
      const dateA = (a.payment_date as any)?.seconds || 0;
      const dateB = (b.payment_date as any)?.seconds || 0;
      return dateB - dateA;
    });
  }

  // جلب دفعة واحدة
  static async getById(id: string): Promise<Payment | null> {
    const doc = await adminDb.collection('payments').doc(id).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return { id: doc.id, ...doc.data() } as Payment;
  }

  // تحديث دفعة
  static async update(id: string, data: Partial<Payment>): Promise<void> {
    const updateData: any = { ...data };
    
    // إزالة الحقول التي لا يجب تحديثها
    delete updateData.id;
    delete updateData.created_at;
    
    // تحويل التاريخ إذا كان موجوداً
    if (data.payment_date) {
      updateData.payment_date = Timestamp.fromDate(new Date(data.payment_date));
    }
    
    await adminDb.collection('payments').doc(id).update(updateData);
  }

  // حذف دفعة
  static async delete(id: string): Promise<void> {
    await adminDb.collection('payments').doc(id).delete();
  }

  // إحصائيات الدفعات
  static async getPaymentStats(): Promise<{
    total_payments: number;
    total_amount: number;
    payment_methods: Record<string, number>;
    monthly_revenue: Record<string, number>;
  }> {
    const snapshot = await adminDb.collection('payments').get();
    
    const payments = snapshot.docs.map(doc => doc.data());
    
    const stats = {
      total_payments: payments.length,
      total_amount: 0,
      payment_methods: {} as Record<string, number>,
      monthly_revenue: {} as Record<string, number>
    };
    
    payments.forEach((payment: any) => {
      // مجموع المبالغ
      stats.total_amount += payment.amount || 0;
      
      // إحصائيات طرق الدفع
      const method = payment.payment_method || 'cash';
      stats.payment_methods[method] = (stats.payment_methods[method] || 0) + 1;
      
      // الإيرادات الشهرية
      if (payment.payment_date && (payment.payment_date as any).seconds) {
        const date = new Date((payment.payment_date as any).seconds * 1000);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        stats.monthly_revenue[monthKey] = (stats.monthly_revenue[monthKey] || 0) + (payment.amount || 0);
      }
    });
    
    return stats;
  }
}

