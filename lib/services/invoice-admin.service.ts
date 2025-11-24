import { 
  Timestamp,
  FieldValue
} from 'firebase-admin/firestore';
import { adminDb } from '../firebase-admin';
import { Invoice } from '../../types/models';
import { AuditService } from './audit.service';

export class InvoiceAdminService {
  // إنشاء فاتورة جديدة
  static async create(
    data: Omit<Invoice, 'id' | 'created_at'>,
    userId: string = 'system',
    ipAddress?: string
  ): Promise<string> {
    const invoiceData: any = {
      subscription_id: data.subscription_id,
      invoice_number: data.invoice_number,
      
      // دعم VAT
      subtotal: data.subtotal || data.amount,
      vat_percentage: data.vat_percentage || 15,
      vat_amount: data.vat_amount || 0,
      amount: data.amount,
      
      status: data.status || 'unpaid',
      issued_date: data.issued_date ? Timestamp.fromDate(new Date(data.issued_date)) : FieldValue.serverTimestamp(),
      due_date: data.due_date ? Timestamp.fromDate(new Date(data.due_date)) : FieldValue.serverTimestamp(),
      
      // الحقول الجديدة
      sent_to_customer: false,
      payment_link: data.payment_link || null,
      payment_gateway_id: data.payment_gateway_id || null,
      
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp()
    };
    
    // إضافة paid_date إذا كان موجوداً
    if (data.paid_date) {
      invoiceData.paid_date = Timestamp.fromDate(new Date(data.paid_date));
    }
    if (data.sent_date) {
      invoiceData.sent_date = Timestamp.fromDate(new Date(data.sent_date));
    }
    
    const docRef = await adminDb.collection('invoices').add(invoiceData);
    
    // تسجيل في سجل التدقيق
    try {
      await AuditService.logInvoiceAction({
        invoice_id: docRef.id,
        action: 'created',
        performed_by: userId,
        ip_address: ipAddress,
        notes: `Invoice created with amount ${data.amount} SAR (incl. VAT ${data.vat_amount || 0} SAR)`
      });
    } catch (auditError) {
      console.error('Failed to log audit:', auditError);
      // لا نفشل العملية الأساسية إذا فشل التدقيق
    }
    
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
  static async update(
    id: string, 
    data: Partial<Invoice>,
    userId: string = 'system',
    ipAddress?: string
  ): Promise<void> {
    
    // 1. جلب الفاتورة القديمة للمقارنة
    const oldInvoice = await this.getById(id);
    if (!oldInvoice) {
      throw new Error('Invoice not found');
    }
    
    // 2. إعداد البيانات للتحديث
    const updateData: any = { ...data };
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
    if (data.sent_date) {
      updateData.sent_date = Timestamp.fromDate(new Date(data.sent_date));
    }
    
    updateData.updated_at = FieldValue.serverTimestamp();
    
    // 3. تحديث الفاتورة
    await adminDb.collection('invoices').doc(id).update(updateData);
    
    // 4. تسجيل في سجل التدقيق
    try {
      const changes = AuditService.compareObjects(oldInvoice, data);
      
      if (Object.keys(changes).length > 0) {
        await AuditService.logInvoiceAction({
          invoice_id: id,
          action: 'updated',
          changed_fields: changes,
          performed_by: userId,
          ip_address: ipAddress,
          notes: `Updated ${Object.keys(changes).length} field(s)`
        });
      }
    } catch (auditError) {
      console.error('Failed to log audit:', auditError);
    }
  }

  // 🆕 حذف فاتورة + إيقاف الاشتراك والإعلان
  static async delete(id: string): Promise<void> {
    try {
      // 1️⃣ جلب معلومات الفاتورة قبل الحذف
      const invoiceDoc = await adminDb.collection('invoices').doc(id).get();
      
      if (!invoiceDoc.exists) {
        throw new Error('Invoice not found');
      }
      
      const invoiceData = invoiceDoc.data();
      const subscriptionId = invoiceData?.subscription_id;
      
      // 2️⃣ إيقاف الاشتراك المرتبط (إذا وُجد)
      if (subscriptionId) {
        const subscriptionRef = adminDb.collection('subscriptions').doc(subscriptionId);
        const subscriptionDoc = await subscriptionRef.get();
        
        if (subscriptionDoc.exists) {
          // تحديث حالة الاشتراك إلى cancelled
          await subscriptionRef.update({
            status: 'cancelled',
            cancelled_at: FieldValue.serverTimestamp(),
            cancellation_reason: 'تم حذف الفاتورة من قبل الإدارة',
            updated_at: FieldValue.serverTimestamp()
          });
          
          console.log(`✅ Subscription ${subscriptionId} cancelled due to invoice deletion`);
        }
      }
      
      // 3️⃣ حذف الفاتورة
      await adminDb.collection('invoices').doc(id).delete();
      
      console.log(`✅ Invoice ${id} deleted successfully`);
      
      // 4️⃣ تسجيل العملية في Audit Log
      try {
        await adminDb.collection('audit_logs').add({
          entity_type: 'invoice',
          entity_id: id,
          action: 'delete_with_cancellation',
          details: {
            invoice_id: id,
            subscription_id: subscriptionId,
            invoice_number: invoiceData?.invoice_number,
            amount: invoiceData?.amount,
            reason: 'حذف الفاتورة وإيقاف الاشتراك المرتبط'
          },
          performed_at: FieldValue.serverTimestamp(),
          ip_address: 'admin'
        });
      } catch (auditError) {
        console.error('Failed to log audit for invoice deletion:', auditError);
        // لا نوقف العملية إذا فشل التسجيل
      }
      
    } catch (error) {
      console.error('Error in invoice delete with subscription cancellation:', error);
      throw error;
    }
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

