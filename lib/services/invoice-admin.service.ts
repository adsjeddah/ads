import { 
  Timestamp,
  FieldValue
} from 'firebase-admin/firestore';
import { adminDb } from '../firebase-admin';
import { Invoice } from '../../types/models';

export class InvoiceAdminService {
  // إنشاء فاتورة جديدة
  static async create(data: Omit<Invoice, 'id' | 'created_at'>): Promise<string> {
    const invoiceData: any = {
      subscription_id: data.subscription_id,
      invoice_number: data.invoice_number,
      amount: data.amount,
      status: data.status || 'unpaid',
      issued_date: data.issued_date ? Timestamp.fromDate(new Date(data.issued_date)) : FieldValue.serverTimestamp(),
      due_date: data.due_date ? Timestamp.fromDate(new Date(data.due_date)) : FieldValue.serverTimestamp(),
      created_at: FieldValue.serverTimestamp()
    };
    
    // إضافة paid_date إذا كان موجوداً
    if (data.paid_date) {
      invoiceData.paid_date = Timestamp.fromDate(new Date(data.paid_date));
    }
    
    const docRef = await adminDb.collection('invoices').add(invoiceData);
    
    return docRef.id;
  }

  // جلب جميع الفواتير
  static async getAll(): Promise<Invoice[]> {
    const snapshot = await adminDb.collection('invoices').get();
    
    // ترتيب النتائج في الذاكرة
    const invoices = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Invoice[];
    
    return invoices.sort((a, b) => {
      const dateA = (a.issued_date as any)?.seconds || 0;
      const dateB = (b.issued_date as any)?.seconds || 0;
      return dateB - dateA;
    });
  }

  // جلب فواتير اشتراك معين
  static async getBySubscriptionId(subscriptionId: string): Promise<Invoice[]> {
    const snapshot = await adminDb
      .collection('invoices')
      .where('subscription_id', '==', subscriptionId)
      .get();
    
    const invoices = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Invoice[];
    
    return invoices.sort((a, b) => {
      const dateA = (a.issued_date as any)?.seconds || 0;
      const dateB = (b.issued_date as any)?.seconds || 0;
      return dateB - dateA;
    });
  }

  // جلب فاتورة واحدة
  static async getById(id: string): Promise<Invoice | null> {
    const doc = await adminDb.collection('invoices').doc(id).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return { id: doc.id, ...doc.data() } as Invoice;
  }

  // تحديث فاتورة
  static async update(id: string, data: Partial<Invoice>): Promise<void> {
    const updateData: any = { ...data };
    
    // إزالة الحقول التي لا يجب تحديثها
    delete updateData.id;
    delete updateData.created_at;
    
    // تحويل التواريخ إذا كانت موجودة
    if (data.issued_date) {
      updateData.issued_date = Timestamp.fromDate(new Date(data.issued_date));
    }
    if (data.due_date) {
      updateData.due_date = Timestamp.fromDate(new Date(data.due_date));
    }
    if (data.paid_date) {
      updateData.paid_date = Timestamp.fromDate(new Date(data.paid_date));
    }
    
    await adminDb.collection('invoices').doc(id).update(updateData);
  }

  // حذف فاتورة
  static async delete(id: string): Promise<void> {
    await adminDb.collection('invoices').doc(id).delete();
  }

  // تحديث حالة الدفع
  static async updatePaymentStatus(id: string, status: 'paid' | 'unpaid' | 'pending', paidDate?: Date): Promise<void> {
    const updateData: any = { status };
    
    if (status === 'paid' && paidDate) {
      updateData.paid_date = Timestamp.fromDate(paidDate);
    }
    
    await adminDb.collection('invoices').doc(id).update(updateData);
  }

  // جلب الفواتير غير المدفوعة
  static async getUnpaidInvoices(): Promise<Invoice[]> {
    const snapshot = await adminDb
      .collection('invoices')
      .where('status', '==', 'unpaid')
      .get();
    
    const invoices = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Invoice[];
    
    return invoices.sort((a, b) => {
      const dateA = (a.due_date as any)?.seconds || 0;
      const dateB = (b.due_date as any)?.seconds || 0;
      return dateA - dateB; // تصاعدياً (الأقرب للاستحقاق أولاً)
    });
  }

  // جلب الفواتير المتأخرة
  static async getOverdueInvoices(): Promise<Invoice[]> {
    const now = Timestamp.now();
    const snapshot = await adminDb
      .collection('invoices')
      .where('status', '==', 'unpaid')
      .get();
    
    const overdueInvoices = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter((invoice: any) => {
        const dueDate = invoice.due_date as any;
        return dueDate && dueDate.seconds < now.seconds;
      }) as Invoice[];
    
    return overdueInvoices.sort((a, b) => {
      const dateA = (a.due_date as any)?.seconds || 0;
      const dateB = (b.due_date as any)?.seconds || 0;
      return dateA - dateB;
    });
  }
}

