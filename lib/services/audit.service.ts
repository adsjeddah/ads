import { 
  Timestamp,
  FieldValue
} from 'firebase-admin/firestore';
import { adminDb } from '../firebase-admin';
import { InvoiceAudit } from '../../types/models';

export class AuditService {
  
  /**
   * تسجيل عملية في سجل التدقيق
   */
  static async logInvoiceAction(data: {
    invoice_id: string;
    action: InvoiceAudit['action'];
    changed_fields?: Record<string, { old: any; new: any }>;
    performed_by: string;
    ip_address?: string;
    user_agent?: string;
    notes?: string;
  }): Promise<string> {
    
    const auditData: any = {
      invoice_id: data.invoice_id,
      action: data.action,
      changed_fields: data.changed_fields || null,
      performed_by: data.performed_by,
      performed_at: FieldValue.serverTimestamp(),
      ip_address: data.ip_address || null,
      user_agent: data.user_agent || null,
      notes: data.notes || null,
      created_at: FieldValue.serverTimestamp()
    };
    
    const docRef = await adminDb.collection('invoice_audits').add(auditData);
    
    return docRef.id;
  }
  
  /**
   * جلب سجل التدقيق لفاتورة معينة
   */
  static async getInvoiceAuditLog(invoiceId: string): Promise<InvoiceAudit[]> {
    const snapshot = await adminDb
      .collection('invoice_audits')
      .where('invoice_id', '==', invoiceId)
      .get();
    
    const audits = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as InvoiceAudit[];
    
    // ترتيب حسب التاريخ تنازلياً
    return audits.sort((a, b) => {
      const dateA = (a.performed_at as any)?.seconds || 0;
      const dateB = (b.performed_at as any)?.seconds || 0;
      return dateB - dateA;
    });
  }
  
  /**
   * مقارنة كائنين وإرجاع التغييرات
   */
  static compareObjects(oldObj: any, newObj: any): Record<string, { old: any; new: any }> {
    const changes: Record<string, { old: any; new: any }> = {};
    
    // التحقق من الحقول الجديدة أو المعدلة
    for (const key in newObj) {
      if (newObj[key] !== oldObj[key] && key !== 'updated_at') {
        changes[key] = {
          old: oldObj[key],
          new: newObj[key]
        };
      }
    }
    
    return changes;
  }
  
  /**
   * جلب آخر التعديلات (عام)
   */
  static async getRecentAudits(limit: number = 50): Promise<InvoiceAudit[]> {
    const snapshot = await adminDb
      .collection('invoice_audits')
      .orderBy('performed_at', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as InvoiceAudit[];
  }
  
  /**
   * جلب إحصائيات التدقيق
   */
  static async getAuditStats(): Promise<{
    total_audits: number;
    by_action: Record<string, number>;
    by_user: Record<string, number>;
  }> {
    const snapshot = await adminDb.collection('invoice_audits').get();
    
    const stats = {
      total_audits: snapshot.size,
      by_action: {} as Record<string, number>,
      by_user: {} as Record<string, number>
    };
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // حسب نوع العملية
      const action = data.action || 'unknown';
      stats.by_action[action] = (stats.by_action[action] || 0) + 1;
      
      // حسب المستخدم
      const user = data.performed_by || 'unknown';
      stats.by_user[user] = (stats.by_user[user] || 0) + 1;
    });
    
    return stats;
  }
}

