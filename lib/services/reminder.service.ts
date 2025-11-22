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
        status: 'pending',
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
        status: 'pending',
        delivery_method: 'whatsapp',
        message: `تنبيه هام: فاتورتك رقم ${invoice.invoice_number} متأخرة منذ ${daysOverdue} يوم. المبلغ المستحق: ${invoice.amount} ريال. يرجى السداد في أقرب وقت.`
      });
      
      createdCount++;
    }
    
    return createdCount;
  }
  
  /**
   * إنشاء تذكيرات للاشتراكات القريبة من الانتهاء
   */
  static async createSubscriptionExpiringReminders(): Promise<number> {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    // جلب الاشتراكات النشطة القريبة من الانتهاء
    const subscriptionsSnapshot = await adminDb
      .collection('subscriptions')
      .where('status', '==', 'active')
      .where('end_date', '<=', Timestamp.fromDate(sevenDaysFromNow))
      .get();
    
    let createdCount = 0;
    
    for (const subDoc of subscriptionsSnapshot.docs) {
      const subscription = subDoc.data();
      
      // التحقق من عدم وجود تذكير سابق
      const existingReminder = await adminDb
        .collection('reminders')
        .where('subscription_id', '==', subDoc.id)
        .where('reminder_type', '==', 'subscription_expiring')
        .where('status', 'in', ['pending', 'sent'])
        .get();
      
      if (!existingReminder.empty) continue;
      
      // إنشاء التذكير
      await this.create({
        subscription_id: subDoc.id,
        advertiser_id: subscription.advertiser_id,
        reminder_type: 'subscription_expiring',
        scheduled_date: new Date(),
        status: 'pending',
        delivery_method: 'whatsapp',
        message: `تنبيه: سينتهي اشتراكك خلال 7 أيام. هل تود تجديد الاشتراك والاستمرار في الإعلان؟`
      });
      
      createdCount++;
    }
    
    return createdCount;
  }
  
  /**
   * جلب جميع التذكيرات لمعلن معين
   */
  static async getByAdvertiserId(advertiserId: string): Promise<Reminder[]> {
    const snapshot = await adminDb
      .collection('reminders')
      .where('advertiser_id', '==', advertiserId)
      .get();
    
    const reminders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Reminder[];
    
    return reminders.sort((a, b) => {
      const dateA = (a.created_at as any)?.seconds || 0;
      const dateB = (b.created_at as any)?.seconds || 0;
      return dateB - dateA;
    });
  }
}

