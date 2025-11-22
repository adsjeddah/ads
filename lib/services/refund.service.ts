import { 
  Timestamp,
  FieldValue
} from 'firebase-admin/firestore';
import { adminDb } from '../firebase-admin';
import { Refund } from '../../types/models';

export class RefundService {
  
  /**
   * إنشاء طلب استرداد
   */
  static async create(data: Omit<Refund, 'id' | 'created_at'>): Promise<string> {
    const refundData: any = {
      subscription_id: data.subscription_id,
      invoice_id: data.invoice_id || null,
      payment_id: data.payment_id || null,
      original_amount: data.original_amount,
      refund_amount: data.refund_amount,
      refund_reason: data.refund_reason,
      refund_method: data.refund_method,
      refund_date: Timestamp.fromDate(new Date(data.refund_date)),
      processed_by: data.processed_by,
      status: data.status || 'pending',
      bank_details: data.bank_details || null,
      notes: data.notes || null,
      created_at: FieldValue.serverTimestamp()
    };
    
    const docRef = await adminDb.collection('refunds').add(refundData);
    return docRef.id;
  }
  
  /**
   * تحديث حالة الاسترداد
   */
  static async updateStatus(
    id: string,
    status: Refund['status'],
    notes?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      notes: notes || null
    };
    
    if (status === 'completed') {
      updateData.completed_at = FieldValue.serverTimestamp();
    }
    
    await adminDb.collection('refunds').doc(id).update(updateData);
  }
  
  /**
   * جلب جميع الاستردادات
   */
  static async getAll(): Promise<Refund[]> {
    const snapshot = await adminDb.collection('refunds').get();
    
    const refunds = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Refund[];
    
    return refunds.sort((a, b) => {
      const dateA = (a.created_at as any)?.seconds || 0;
      const dateB = (b.created_at as any)?.seconds || 0;
      return dateB - dateA;
    });
  }
  
  /**
   * جلب استردادات اشتراك معين
   */
  static async getBySubscriptionId(subscriptionId: string): Promise<Refund[]> {
    const snapshot = await adminDb
      .collection('refunds')
      .where('subscription_id', '==', subscriptionId)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Refund[];
  }
  
  /**
   * جلب استرداد واحد
   */
  static async getById(id: string): Promise<Refund | null> {
    const doc = await adminDb.collection('refunds').doc(id).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return { id: doc.id, ...doc.data() } as Refund;
  }
  
  /**
   * جلب الاستردادات المعلقة
   */
  static async getPendingRefunds(): Promise<Refund[]> {
    const snapshot = await adminDb
      .collection('refunds')
      .where('status', '==', 'pending')
      .get();
    
    const refunds = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Refund[];
    
    return refunds.sort((a, b) => {
      const dateA = (a.created_at as any)?.seconds || 0;
      const dateB = (b.created_at as any)?.seconds || 0;
      return dateA - dateB; // الأقدم أولاً
    });
  }
  
  /**
   * إحصائيات الاستردادات
   */
  static async getRefundStats(): Promise<{
    total_refunds: number;
    total_refund_amount: number;
    by_status: Record<string, number>;
    by_method: Record<string, number>;
  }> {
    const snapshot = await adminDb.collection('refunds').get();
    
    const stats = {
      total_refunds: snapshot.size,
      total_refund_amount: 0,
      by_status: {} as Record<string, number>,
      by_method: {} as Record<string, number>
    };
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // المبلغ الكلي
      stats.total_refund_amount += data.refund_amount || 0;
      
      // حسب الحالة
      const status = data.status || 'unknown';
      stats.by_status[status] = (stats.by_status[status] || 0) + 1;
      
      // حسب الطريقة
      const method = data.refund_method || 'unknown';
      stats.by_method[method] = (stats.by_method[method] || 0) + 1;
    });
    
    return stats;
  }
}

