# 🚀 دليل التطبيق السريع: تحسينات نظام الفواتير
## أكواد جاهزة للتطبيق الفوري

---

## 📋 جدول المحتويات

1. [Setup: إعداد البنية الأساسية](#setup)
2. [Code 1: Audit Trail System](#audit-trail)
3. [Code 2: VAT Support](#vat-support)
4. [Code 3: Automated Reminders](#reminders)
5. [Code 4: Pagination](#pagination)
6. [Code 5: Refunds System](#refunds)
7. [Testing Examples](#testing)

---

## 🔧 Setup: إعداد البنية الأساسية {#setup}

### خطوة 1: تحديث types/models.ts

```typescript
// إضافة في types/models.ts

// Audit Trail للفواتير
export interface InvoiceAudit {
  id?: string;
  invoice_id: string;
  action: 'created' | 'updated' | 'deleted' | 'paid' | 'cancelled' | 'sent';
  changed_fields?: Record<string, { old: any; new: any }>;
  performed_by: string;  // admin user ID
  performed_at: Date;
  ip_address?: string;
  user_agent?: string;
  notes?: string;
  created_at: Date;
}

// تحديث Invoice لدعم الضرائب
export interface Invoice {
  id?: string;
  subscription_id: string;
  invoice_number: string;
  
  // الحقول الجديدة للضرائب
  subtotal: number;              // المبلغ قبل الضريبة
  vat_percentage: number;        // نسبة الضريبة (15)
  vat_amount: number;            // مبلغ الضريبة
  amount: number;                // الإجمالي (subtotal + vat_amount)
  
  status: 'paid' | 'unpaid' | 'cancelled';
  issued_date: Date;
  due_date?: Date;
  paid_date?: Date;
  
  // الحقول الجديدة
  payment_link?: string;         // رابط الدفع الإلكتروني
  payment_gateway_id?: string;   // معرف من بوابة الدفع
  sent_to_customer?: boolean;    // هل تم إرسالها للعميل
  sent_date?: Date;              // تاريخ الإرسال
  
  created_at: Date;
  updated_at?: Date;
}

// Reminder للتذكيرات
export interface Reminder {
  id?: string;
  invoice_id?: string;
  subscription_id?: string;
  advertiser_id: string;
  reminder_type: 'due_soon' | 'overdue' | 'subscription_expiring' | 'custom';
  scheduled_date: Date;
  sent_date?: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  delivery_method: 'whatsapp' | 'email' | 'sms';
  message: string;
  error_message?: string;
  created_at: Date;
}

// Refund للاستردادات
export interface Refund {
  id?: string;
  subscription_id: string;
  invoice_id?: string;
  payment_id?: string;
  original_amount: number;
  refund_amount: number;
  refund_reason: string;
  refund_method: 'cash' | 'bank_transfer' | 'card' | 'online';
  refund_date: Date;
  processed_by: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  bank_details?: string;
  notes?: string;
  created_at: Date;
  completed_at?: Date;
}
```

---

## 🔍 Code 1: Audit Trail System {#audit-trail}

### lib/services/audit.service.ts (ملف جديد)

```typescript
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
      if (newObj[key] !== oldObj[key]) {
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
}
```

### تحديث lib/services/invoice-admin.service.ts

```typescript
// إضافة في بداية الملف
import { AuditService } from './audit.service';

// تعديل دالة update لتشمل التدقيق
static async update(
  id: string, 
  data: Partial<Invoice>,
  userId: string,  // إضافة معرف المستخدم
  ipAddress?: string
): Promise<void> {
  
  // 1. جلب الفاتورة القديمة
  const oldInvoice = await this.getById(id);
  if (!oldInvoice) {
    throw new Error('Invoice not found');
  }
  
  // 2. إعداد البيانات للتحديث
  const updateData: any = { ...data };
  delete updateData.id;
  delete updateData.created_at;
  
  if (data.issued_date) {
    updateData.issued_date = Timestamp.fromDate(new Date(data.issued_date));
  }
  if (data.due_date) {
    updateData.due_date = Timestamp.fromDate(new Date(data.due_date));
  }
  if (data.paid_date) {
    updateData.paid_date = Timestamp.fromDate(new Date(data.paid_date));
  }
  
  updateData.updated_at = FieldValue.serverTimestamp();
  
  // 3. تحديث الفاتورة
  await adminDb.collection('invoices').doc(id).update(updateData);
  
  // 4. تسجيل في سجل التدقيق
  const changes = AuditService.compareObjects(oldInvoice, data);
  
  await AuditService.logInvoiceAction({
    invoice_id: id,
    action: 'updated',
    changed_fields: changes,
    performed_by: userId,
    ip_address: ipAddress,
    notes: `Updated ${Object.keys(changes).length} field(s)`
  });
}

// تعديل دالة create
static async create(
  data: Omit<Invoice, 'id' | 'created_at'>,
  userId: string,
  ipAddress?: string
): Promise<string> {
  
  const invoiceData: any = {
    subscription_id: data.subscription_id,
    invoice_number: data.invoice_number,
    subtotal: data.subtotal || data.amount,
    vat_percentage: data.vat_percentage || 15,
    vat_amount: data.vat_amount || 0,
    amount: data.amount,
    status: data.status || 'unpaid',
    issued_date: data.issued_date ? Timestamp.fromDate(new Date(data.issued_date)) : FieldValue.serverTimestamp(),
    due_date: data.due_date ? Timestamp.fromDate(new Date(data.due_date)) : FieldValue.serverTimestamp(),
    sent_to_customer: false,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp()
  };
  
  if (data.paid_date) {
    invoiceData.paid_date = Timestamp.fromDate(new Date(data.paid_date));
  }
  
  const docRef = await adminDb.collection('invoices').add(invoiceData);
  
  // تسجيل في سجل التدقيق
  await AuditService.logInvoiceAction({
    invoice_id: docRef.id,
    action: 'created',
    performed_by: userId,
    ip_address: ipAddress,
    notes: `Invoice created with amount ${data.amount} SAR`
  });
  
  return docRef.id;
}

// إضافة دالة حذف مع تدقيق
static async delete(id: string, userId: string, reason?: string): Promise<void> {
  
  // تسجيل قبل الحذف
  await AuditService.logInvoiceAction({
    invoice_id: id,
    action: 'deleted',
    performed_by: userId,
    notes: reason || 'Invoice deleted'
  });
  
  await adminDb.collection('invoices').doc(id).delete();
}
```

### API Endpoint: جلب سجل التدقيق

```typescript
// pages/api/invoices/[id]/audit.ts (ملف جديد)
import type { NextApiRequest, NextApiResponse } from 'next';
import { AuditService } from '../../../../lib/services/audit.service';
import { verifyAdminToken } from '../../../../lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid invoice ID' });
  }

  // التحقق من المصادقة
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await verifyAdminToken(token);
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (req.method === 'GET') {
    try {
      const auditLog = await AuditService.getInvoiceAuditLog(id);
      res.status(200).json(auditLog);
    } catch (error: any) {
      console.error(`Error fetching audit log for invoice ${id}:`, error);
      res.status(500).json({ error: `Failed to fetch audit log: ${error.message}` });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
```

---

## 💰 Code 2: VAT Support {#vat-support}

### تحديث lib/services/financial.service.ts

```typescript
// إضافة دالة جديدة لحساب الضريبة
static calculateWithVAT(
  subtotal: number,
  vatPercentage: number = 15,
  includeVAT: boolean = true
): {
  subtotal: number;
  vat_percentage: number;
  vat_amount: number;
  total: number;
} {
  
  if (subtotal < 0) {
    throw new Error('Subtotal cannot be negative');
  }
  
  if (vatPercentage < 0 || vatPercentage > 100) {
    throw new Error('VAT percentage must be between 0 and 100');
  }
  
  let calculatedSubtotal = subtotal;
  let vatAmount = 0;
  let total = subtotal;
  
  if (includeVAT) {
    // حساب الضريبة وإضافتها
    vatAmount = Math.round(subtotal * (vatPercentage / 100) * 100) / 100;
    total = subtotal + vatAmount;
  } else {
    // السعر شامل الضريبة، نحتاج لاستخراج قيمة الضريبة
    calculatedSubtotal = Math.round((subtotal / (1 + vatPercentage / 100)) * 100) / 100;
    vatAmount = subtotal - calculatedSubtotal;
    total = subtotal;
  }
  
  return {
    subtotal: Math.round(calculatedSubtotal * 100) / 100,
    vat_percentage: vatPercentage,
    vat_amount: Math.round(vatAmount * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}

// تحديث createSubscriptionWithInvoice لتشمل الضريبة
static async createSubscriptionWithInvoice(data: {
  advertiser_id: string;
  plan_id: string;
  start_date: Date;
  discount_type?: 'amount' | 'percentage';
  discount_amount?: number;
  initial_payment?: number;
  payment_method?: string;
  notes?: string;
  include_vat?: boolean;  // جديد
  vat_percentage?: number;  // جديد
}): Promise<{
  subscription_id: string;
  invoice_id: string;
  payment_id?: string;
}> {
  
  // ... الكود الموجود ...
  
  // بعد حساب الخصومات
  const discount = this.calculateDiscount(
    plan.price,
    data.discount_type || 'amount',
    data.discount_amount || 0
  );
  
  // حساب الضريبة
  const includeVAT = data.include_vat !== false; // افتراضياً true
  const vatPercentage = data.vat_percentage || 15;
  
  const priceWithVAT = this.calculateWithVAT(
    discount.total_amount,
    vatPercentage,
    includeVAT
  );
  
  // استخدام السعر شامل الضريبة
  const initialPayment = data.initial_payment || 0;
  const paidAmount = initialPayment;
  const remainingAmount = priceWithVAT.total - paidAmount;
  
  // ... باقي الكود مع استخدام priceWithVAT.total بدلاً من discount.total_amount ...
  
  // عند إنشاء الفاتورة
  const invoiceData: Omit<Invoice, 'id' | 'created_at'> = {
    subscription_id: subscriptionId,
    invoice_number: invoiceNumber,
    subtotal: priceWithVAT.subtotal,
    vat_percentage: priceWithVAT.vat_percentage,
    vat_amount: priceWithVAT.vat_amount,
    amount: priceWithVAT.total,
    status: paymentStatus === 'paid' ? 'paid' : 'unpaid',
    issued_date: startDate,
    due_date: endDate,
    paid_date: paymentStatus === 'paid' ? new Date() : undefined
  };
  
  const invoiceId = await InvoiceAdminService.create(invoiceData, 'system', undefined);
  
  // ... باقي الكود ...
}
```

### API Endpoint: حساب السعر مع الضريبة

```typescript
// pages/api/financial/calculate-with-vat.ts (ملف جديد)
import type { NextApiRequest, NextApiResponse } from 'next';
import { FinancialService } from '../../../lib/services/financial.service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { subtotal, vat_percentage, include_vat } = req.body;

    if (typeof subtotal !== 'number' || subtotal < 0) {
      return res.status(400).json({ error: 'Valid subtotal is required' });
    }

    const result = FinancialService.calculateWithVAT(
      subtotal,
      vat_percentage || 15,
      include_vat !== false
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error calculating VAT:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}
```

---

## ⏰ Code 3: Automated Reminders {#reminders}

### lib/services/reminder.service.ts (ملف جديد)

```typescript
import { 
  Timestamp,
  FieldValue
} from 'firebase-admin/firestore';
import { adminDb } from '../firebase-admin';
import { Reminder } from '../../types/models';

export class ReminderService {
  
  /**
   * إنشاء تذكير جديد
   */
  static async create(data: Omit<Reminder, 'id' | 'created_at'>): Promise<string> {
    const reminderData: any = {
      invoice_id: data.invoice_id || null,
      subscription_id: data.subscription_id || null,
      advertiser_id: data.advertiser_id,
      reminder_type: data.reminder_type,
      scheduled_date: Timestamp.fromDate(new Date(data.scheduled_date)),
      status: 'pending',
      delivery_method: data.delivery_method,
      message: data.message,
      created_at: FieldValue.serverTimestamp()
    };
    
    const docRef = await adminDb.collection('reminders').add(reminderData);
    return docRef.id;
  }
  
  /**
   * جلب التذكيرات المعلقة للإرسال
   */
  static async getPendingReminders(): Promise<Reminder[]> {
    const now = Timestamp.now();
    
    const snapshot = await adminDb
      .collection('reminders')
      .where('status', '==', 'pending')
      .where('scheduled_date', '<=', now)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Reminder[];
  }
  
  /**
   * تحديث حالة التذكير
   */
  static async updateStatus(
    id: string,
    status: Reminder['status'],
    errorMessage?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      sent_date: status === 'sent' ? FieldValue.serverTimestamp() : null,
      error_message: errorMessage || null
    };
    
    await adminDb.collection('reminders').doc(id).update(updateData);
  }
  
  /**
   * إنشاء تذكيرات تلقائية للفواتير المستحقة قريباً
   */
  static async createDueSoonReminders(): Promise<number> {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    // جلب الفواتير المستحقة خلال 3 أيام
    const invoicesSnapshot = await adminDb
      .collection('invoices')
      .where('status', '==', 'unpaid')
      .where('due_date', '<=', Timestamp.fromDate(threeDaysFromNow))
      .get();
    
    let createdCount = 0;
    
    for (const invoiceDoc of invoicesSnapshot.docs) {
      const invoice = invoiceDoc.data();
      
      // التحقق من عدم وجود تذكير سابق
      const existingReminder = await adminDb
        .collection('reminders')
        .where('invoice_id', '==', invoiceDoc.id)
        .where('reminder_type', '==', 'due_soon')
        .where('status', 'in', ['pending', 'sent'])
        .get();
      
      if (!existingReminder.empty) continue;
      
      // جلب بيانات الاشتراك والمعلن
      const subscription = await adminDb
        .collection('subscriptions')
        .doc(invoice.subscription_id)
        .get();
      
      if (!subscription.exists) continue;
      
      const subscriptionData = subscription.data()!;
      
      // إنشاء التذكير
      await this.create({
        invoice_id: invoiceDoc.id,
        subscription_id: invoice.subscription_id,
        advertiser_id: subscriptionData.advertiser_id,
        reminder_type: 'due_soon',
        scheduled_date: new Date(),
        delivery_method: 'whatsapp',
        message: `تذكير: فاتورتك رقم ${invoice.invoice_number} مستحقة خلال 3 أيام. المبلغ: ${invoice.amount} ريال.`
      });
      
      createdCount++;
    }
    
    return createdCount;
  }
  
  /**
   * إنشاء تذكيرات للفواتير المتأخرة
   */
  static async createOverdueReminders(): Promise<number> {
    const today = new Date();
    
    // جلب الفواتير المتأخرة
    const invoicesSnapshot = await adminDb
      .collection('invoices')
      .where('status', '==', 'unpaid')
      .where('due_date', '<', Timestamp.fromDate(today))
      .get();
    
    let createdCount = 0;
    
    for (const invoiceDoc of invoicesSnapshot.docs) {
      const invoice = invoiceDoc.data();
      
      // التحقق من عدم وجود تذكير اليوم
      const todayStart = new Date(today.setHours(0, 0, 0, 0));
      const existingReminder = await adminDb
        .collection('reminders')
        .where('invoice_id', '==', invoiceDoc.id)
        .where('reminder_type', '==', 'overdue')
        .where('created_at', '>=', Timestamp.fromDate(todayStart))
        .get();
      
      if (!existingReminder.empty) continue;
      
      // جلب بيانات الاشتراك
      const subscription = await adminDb
        .collection('subscriptions')
        .doc(invoice.subscription_id)
        .get();
      
      if (!subscription.exists) continue;
      
      const subscriptionData = subscription.data()!;
      
      // حساب عدد الأيام المتأخرة
      const daysOverdue = Math.floor(
        (today.getTime() - invoice.due_date.toDate().getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // إنشاء التذكير
      await this.create({
        invoice_id: invoiceDoc.id,
        subscription_id: invoice.subscription_id,
        advertiser_id: subscriptionData.advertiser_id,
        reminder_type: 'overdue',
        scheduled_date: new Date(),
        delivery_method: 'whatsapp',
        message: `تنبيه هام: فاتورتك رقم ${invoice.invoice_number} متأخرة منذ ${daysOverdue} يوم. المبلغ المستحق: ${invoice.amount} ريال. يرجى السداد في أقرب وقت.`
      });
      
      createdCount++;
    }
    
    return createdCount;
  }
}
```

### lib/services/notification.service.ts (ملف جديد)

```typescript
import { adminDb } from '../firebase-admin';
import { Reminder } from '../../types/models';
import { AdvertiserAdminService } from './advertiser-admin.service';
import { ReminderService } from './reminder.service';

export class NotificationService {
  
  /**
   * إرسال تذكير (Placeholder - يحتاج تكامل مع WhatsApp API)
   */
  static async sendReminder(reminder: Reminder): Promise<boolean> {
    try {
      // جلب بيانات المعلن
      const advertiser = await AdvertiserAdminService.getById(reminder.advertiser_id);
      if (!advertiser) {
        throw new Error('Advertiser not found');
      }
      
      // إرسال حسب الطريقة
      switch (reminder.delivery_method) {
        case 'whatsapp':
          await this.sendWhatsApp(advertiser.whatsapp || advertiser.phone, reminder.message);
          break;
        case 'email':
          await this.sendEmail(advertiser.email!, reminder.message);
          break;
        case 'sms':
          await this.sendSMS(advertiser.phone, reminder.message);
          break;
      }
      
      // تحديث الحالة
      await ReminderService.updateStatus(reminder.id!, 'sent');
      
      return true;
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      
      // تحديث الحالة كفشل
      await ReminderService.updateStatus(reminder.id!, 'failed', error.message);
      
      return false;
    }
  }
  
  /**
   * إرسال عبر WhatsApp (يحتاج تكامل)
   */
  private static async sendWhatsApp(phone: string, message: string): Promise<void> {
    // TODO: تكامل مع WhatsApp Business API أو Twilio
    // مثال:
    // await twilioClient.messages.create({
    //   body: message,
    //   from: 'whatsapp:+14155238886',
    //   to: `whatsapp:${phone}`
    // });
    
    console.log(`[WhatsApp] To: ${phone}, Message: ${message}`);
    
    // في بيئة التطوير، نسجل فقط
    if (process.env.NODE_ENV === 'development') {
      return;
    }
    
    // في الإنتاج، يجب إضافة الكود الفعلي هنا
  }
  
  /**
   * إرسال عبر Email (يحتاج تكامل)
   */
  private static async sendEmail(email: string, message: string): Promise<void> {
    // TODO: تكامل مع SendGrid أو NodeMailer
    console.log(`[Email] To: ${email}, Message: ${message}`);
  }
  
  /**
   * إرسال عبر SMS (يحتاج تكامل)
   */
  private static async sendSMS(phone: string, message: string): Promise<void> {
    // TODO: تكامل مع SMS Gateway
    console.log(`[SMS] To: ${phone}, Message: ${message}`);
  }
  
  /**
   * معالجة جميع التذكيرات المعلقة
   */
  static async processPendingReminders(): Promise<{
    total: number;
    sent: number;
    failed: number;
  }> {
    const reminders = await ReminderService.getPendingReminders();
    
    let sent = 0;
    let failed = 0;
    
    for (const reminder of reminders) {
      const success = await this.sendReminder(reminder);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    }
    
    return {
      total: reminders.length,
      sent,
      failed
    };
  }
}
```

### Cron Job: معالجة التذكيرات

```typescript
// pages/api/cron/process-reminders.ts (ملف جديد)
import type { NextApiRequest, NextApiResponse } from 'next';
import { ReminderService } from '../../../lib/services/reminder.service';
import { NotificationService } from '../../../lib/services/notification.service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // التحقق من Cron Secret
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // 1. إنشاء تذكيرات جديدة للفواتير المستحقة قريباً
    const dueSoonCount = await ReminderService.createDueSoonReminders();
    
    // 2. إنشاء تذكيرات للفواتير المتأخرة
    const overdueCount = await ReminderService.createOverdueReminders();
    
    // 3. معالجة جميع التذكيرات المعلقة
    const processResult = await NotificationService.processPendingReminders();
    
    res.status(200).json({
      success: true,
      message: 'Reminders processed successfully',
      data: {
        created: {
          due_soon: dueSoonCount,
          overdue: overdueCount
        },
        processed: processResult
      }
    });
  } catch (error: any) {
    console.error('Error processing reminders:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
```

**جدولة Cron Job في Vercel:**

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/process-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

---

## 📄 Code 4: Pagination {#pagination}

### تحديث lib/services/invoice-admin.service.ts

```typescript
// إضافة الواجهات
interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: 'issued_date' | 'due_date' | 'amount' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  status?: 'paid' | 'unpaid' | 'cancelled';
  advertiserId?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// إضافة دالة getAllPaginated
static async getAllPaginated(
  params: PaginationParams
): Promise<PaginatedResponse<Invoice>> {
  
  const {
    page = 1,
    limit = 20,
    sortBy = 'issued_date',
    sortOrder = 'desc',
    status,
    advertiserId
  } = params;
  
  // حساب offset
  const offset = (page - 1) * limit;
  
  // بناء الاستعلام
  let query = adminDb.collection('invoices');
  
  // الفلاتر
  if (status) {
    query = query.where('status', '==', status) as any;
  }
  
  if (advertiserId) {
    // نحتاج للبحث عن الاشتراكات أولاً
    const subscriptionsSnapshot = await adminDb
      .collection('subscriptions')
      .where('advertiser_id', '==', advertiserId)
      .get();
    
    const subscriptionIds = subscriptionsSnapshot.docs.map(doc => doc.id);
    
    if (subscriptionIds.length === 0) {
      return {
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      };
    }
    
    // Firestore لا يدعم 'in' مع أكثر من 10 عناصر
    // لذا نقسمها لمجموعات
    const chunks = [];
    for (let i = 0; i < subscriptionIds.length; i += 10) {
      chunks.push(subscriptionIds.slice(i, i + 10));
    }
    
    let allInvoices: Invoice[] = [];
    
    for (const chunk of chunks) {
      const chunkSnapshot = await adminDb
        .collection('invoices')
        .where('subscription_id', 'in', chunk)
        .get();
      
      allInvoices = allInvoices.concat(
        chunkSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Invoice[]
      );
    }
    
    // الترتيب والصفحات في الذاكرة
    allInvoices.sort((a, b) => {
      const aVal = (a[sortBy] as any)?.seconds || 0;
      const bVal = (b[sortBy] as any)?.seconds || 0;
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
    
    const paginatedData = allInvoices.slice(offset, offset + limit);
    
    return {
      data: paginatedData,
      pagination: {
        total: allInvoices.length,
        page,
        limit,
        totalPages: Math.ceil(allInvoices.length / limit),
        hasNext: page < Math.ceil(allInvoices.length / limit),
        hasPrev: page > 1
      }
    };
  }
  
  // بدون فلتر المعلن - استعلام عادي
  
  // 1. حساب العدد الكلي
  const countQuery = status ? query.where('status', '==', status) : query;
  const totalSnapshot = await countQuery.count().get();
  const total = totalSnapshot.data().count;
  
  // 2. جلب الصفحة الحالية
  const dataSnapshot = await query
    .orderBy(sortBy, sortOrder)
    .limit(limit)
    .offset(offset)
    .get();
  
  const data = dataSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Invoice[];
  
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
}
```

### API Endpoint مع Pagination

```typescript
// تحديث pages/api/invoices/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { InvoiceAdminService } from '../../../lib/services/invoice-admin.service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const {
        page = '1',
        limit = '20',
        sortBy = 'issued_date',
        sortOrder = 'desc',
        status,
        advertiserId
      } = req.query;
      
      // استخدام Pagination
      const result = await InvoiceAdminService.getAllPaginated({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
        status: status as any,
        advertiserId: advertiserId as string
      });
      
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({ error: 'Failed to fetch invoices: ' + error.message });
    }
  } else if (req.method === 'POST') {
    // ... الكود الموجود للإنشاء
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
```

### Component: Pagination في الواجهة

```tsx
// components/Pagination.tsx (ملف جديد)
import React from 'react';
import { motion } from 'framer-motion';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange
}: PaginationProps) {
  
  const pages = [];
  const maxPagesToShow = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      {/* Previous */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        <FaChevronRight />
      </motion.button>
      
      {/* First page */}
      {startPage > 1 && (
        <>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPageChange(1)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            1
          </motion.button>
          {startPage > 2 && <span className="px-2">...</span>}
        </>
      )}
      
      {/* Page numbers */}
      {pages.map(page => (
        <motion.button
          key={page}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 rounded-lg border transition-colors ${
            page === currentPage
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white border-gray-300 hover:bg-gray-50'
          }`}
        >
          {page}
        </motion.button>
      ))}
      
      {/* Last page */}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2">...</span>}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPageChange(totalPages)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {totalPages}
          </motion.button>
        </>
      )}
      
      {/* Next */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        <FaChevronLeft />
      </motion.button>
    </div>
  );
}
```

### استخدام Pagination في صفحة الفواتير

```tsx
// تحديث pages/admin/invoices.tsx
import Pagination from '../../components/Pagination';

export default function InvoicesManagement() {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  const fetchInvoices = async (page: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await axios.get(`${apiUrl}/invoices`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          limit: 20,
          status: filterStatus !== 'all' ? filterStatus : undefined
        }
      });
      
      setInvoices(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setCurrentPage(response.data.pagination.page);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchInvoices(currentPage);
  }, [currentPage, filterStatus]);
  
  return (
    <div>
      {/* ... الجدول ... */}
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
}
```

---

## 💸 Code 5: Refunds System {#refunds}

### lib/services/refund.service.ts (ملف جديد)

```typescript
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
}
```

### تحديث lib/services/financial.service.ts

```typescript
import { RefundService } from './refund.service';

// تحديث دالة cancelSubscription لتشمل إنشاء سجل استرداد
static async cancelSubscription(
  subscriptionId: string,
  reason?: string,
  userId?: string
): Promise<{
  refund_amount: number;
  refund_id: string;
  message: string;
}> {
  const subscription = await SubscriptionAdminService.getById(subscriptionId);
  if (!subscription) {
    throw new Error('Subscription not found');
  }

  if (subscription.status === 'cancelled') {
    throw new Error('Subscription is already cancelled');
  }

  // حساب مبلغ الاسترداد
  const now = new Date();
  const startDate = new Date(subscription.start_date);
  const endDate = new Date(subscription.end_date);
  
  const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const usedDays = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const remainingDays = Math.max(0, totalDays - usedDays);
  
  const dailyRate = subscription.total_amount / totalDays;
  const refundAmount = Math.round(dailyRate * remainingDays * 100) / 100;

  // تحديث حالة الاشتراك
  await SubscriptionAdminService.update(subscriptionId, {
    status: 'cancelled'
  });

  // إلغاء الفواتير غير المدفوعة
  const invoices = await InvoiceAdminService.getBySubscriptionId(subscriptionId);
  for (const invoice of invoices) {
    if (invoice.status === 'unpaid' && invoice.id) {
      await InvoiceAdminService.update(invoice.id, {
        status: 'cancelled'
      }, userId || 'system', undefined);
    }
  }
  
  // إنشاء سجل الاسترداد
  const refundId = await RefundService.create({
    subscription_id: subscriptionId,
    original_amount: subscription.paid_amount,
    refund_amount: refundAmount,
    refund_reason: reason || 'Subscription cancellation',
    refund_method: 'bank_transfer',
    refund_date: new Date(),
    processed_by: userId || 'system',
    status: 'pending',
    notes: `Refund for ${Math.round(remainingDays)} remaining days`
  });

  return {
    refund_amount: refundAmount,
    refund_id: refundId,
    message: `Subscription cancelled. Refund of ${refundAmount} SAR for ${Math.round(remainingDays)} remaining days.`
  };
}

// دالة جديدة لمعالجة الاسترداد
static async processRefund(data: {
  refund_id: string;
  approved: boolean;
  notes?: string;
  userId: string;
}): Promise<void> {
  const refund = await RefundService.getById(data.refund_id);
  if (!refund) {
    throw new Error('Refund not found');
  }
  
  if (refund.status !== 'pending') {
    throw new Error(`Refund is already ${refund.status}`);
  }
  
  if (data.approved) {
    // الموافقة على الاسترداد
    await RefundService.updateStatus(
      data.refund_id,
      'approved',
      data.notes
    );
    
    // يمكن إضافة منطق إضافي هنا مثل:
    // - إرسال إشعار للمعلن
    // - تحديث المالية
  } else {
    // رفض الاسترداد
    await RefundService.updateStatus(
      data.refund_id,
      'rejected',
      data.notes
    );
  }
}
```

### API Endpoints للاستردادات

```typescript
// pages/api/refunds/index.ts (ملف جديد)
import type { NextApiRequest, NextApiResponse } from 'next';
import { RefundService } from '../../../lib/services/refund.service';
import { verifyAdminToken } from '../../../lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // التحقق من المصادقة
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await verifyAdminToken(token);
    
    if (req.method === 'GET') {
      const { subscriptionId } = req.query;
      
      let refunds;
      if (subscriptionId) {
        refunds = await RefundService.getBySubscriptionId(subscriptionId as string);
      } else {
        refunds = await RefundService.getAll();
      }
      
      res.status(200).json(refunds);
    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    console.error('Error handling refunds:', error);
    res.status(500).json({ error: error.message });
  }
}
```

```typescript
// pages/api/refunds/[id]/process.ts (ملف جديد)
import type { NextApiRequest, NextApiResponse } from 'next';
import { FinancialService } from '../../../../lib/services/financial.service';
import { verifyAdminToken } from '../../../../lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid refund ID' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await verifyAdminToken(token);
    
    if (req.method === 'POST') {
      const { approved, notes } = req.body;
      
      await FinancialService.processRefund({
        refund_id: id,
        approved,
        notes,
        userId: user.uid
      });
      
      res.status(200).json({
        success: true,
        message: `Refund ${approved ? 'approved' : 'rejected'} successfully`
      });
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: error.message });
  }
}
```

---

## 🧪 Testing Examples {#testing}

### اختبارات الوحدة (Unit Tests)

```typescript
// __tests__/services/financial.service.test.ts

import { FinancialService } from '../../lib/services/financial.service';

describe('FinancialService', () => {
  
  describe('calculateDiscount', () => {
    test('حساب خصم نسبة مئوية', () => {
      const result = FinancialService.calculateDiscount(1000, 'percentage', 15);
      
      expect(result.base_price).toBe(1000);
      expect(result.discount_value).toBe(150);
      expect(result.total_amount).toBe(850);
    });
    
    test('حساب خصم مبلغ ثابت', () => {
      const result = FinancialService.calculateDiscount(1000, 'amount', 200);
      
      expect(result.base_price).toBe(1000);
      expect(result.discount_value).toBe(200);
      expect(result.total_amount).toBe(800);
    });
    
    test('رفض خصم أكبر من 100%', () => {
      expect(() => {
        FinancialService.calculateDiscount(1000, 'percentage', 150);
      }).toThrow('Discount percentage cannot exceed 100%');
    });
    
    test('رفض خصم يتجاوز السعر الأساسي', () => {
      expect(() => {
        FinancialService.calculateDiscount(1000, 'amount', 1500);
      }).toThrow('Discount amount cannot exceed base price');
    });
  });
  
  describe('calculateWithVAT', () => {
    test('حساب الضريبة 15%', () => {
      const result = FinancialService.calculateWithVAT(1000, 15, true);
      
      expect(result.subtotal).toBe(1000);
      expect(result.vat_percentage).toBe(15);
      expect(result.vat_amount).toBe(150);
      expect(result.total).toBe(1150);
    });
    
    test('استخراج الضريبة من السعر الشامل', () => {
      const result = FinancialService.calculateWithVAT(1150, 15, false);
      
      expect(result.subtotal).toBe(1000);
      expect(result.vat_amount).toBe(150);
      expect(result.total).toBe(1150);
    });
  });
});
```

---

## 📝 خلاصة التطبيق

### ترتيب الخطوات:

```
1️⃣ تحديث types/models.ts
   - إضافة InvoiceAudit, Reminder, Refund
   - تحديث Invoice لدعم VAT

2️⃣ إنشاء Services الجديدة
   - audit.service.ts
   - reminder.service.ts
   - notification.service.ts
   - refund.service.ts

3️⃣ تحديث Services الموجودة
   - invoice-admin.service.ts (إضافة Audit)
   - financial.service.ts (إضافة VAT و Refunds)

4️⃣ إنشاء API Endpoints
   - /api/invoices/[id]/audit
   - /api/cron/process-reminders
   - /api/refunds/*

5️⃣ تحديث الواجهات
   - إضافة Pagination component
   - تحديث صفحة الفواتير

6️⃣ الاختبار
   - كتابة Unit Tests
   - اختبار Integration
   - اختبار الأداء
```

### الميزات المُضافة:

- ✅ **Audit Trail**: تتبع كامل لجميع التعديلات
- ✅ **VAT Support**: دعم ضريبة القيمة المضافة
- ✅ **Automated Reminders**: تذكيرات تلقائية للفواتير
- ✅ **Pagination**: صفحات للفواتير لتحسين الأداء
- ✅ **Refunds System**: نظام متكامل للاستردادات

---

**جميع الأكواد جاهزة للنسخ والتطبيق مباشرة! 🚀**

