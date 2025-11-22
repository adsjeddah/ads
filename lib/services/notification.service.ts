import { adminDb } from '../firebase-admin';
import { Notification, Reminder } from '../../types/models';
import { AdvertiserAdminService } from './advertiser-admin.service';
import { ReminderService } from './reminder.service';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

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
      
      // تسجيل الإشعار
      await this.logNotification({
        type: `reminder_${reminder.delivery_method}`,
        invoice_id: reminder.invoice_id,
        advertiser_id: advertiser.id!,
        recipient: advertiser.whatsapp || advertiser.phone,
        message: reminder.message,
        status: 'sent'
      });
      
      // تحديث الحالة
      await ReminderService.updateStatus(reminder.id!, 'sent');
      
      return true;
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      
      // تسجيل الفشل
      await this.logNotification({
        type: `reminder_${reminder.delivery_method}`,
        invoice_id: reminder.invoice_id,
        advertiser_id: reminder.advertiser_id,
        recipient: '',
        message: reminder.message,
        status: 'failed',
        error: error.message
      });
      
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
    // throw new Error('WhatsApp integration not implemented yet');
  }
  
  /**
   * إرسال عبر Email (يحتاج تكامل)
   */
  private static async sendEmail(email: string, message: string): Promise<void> {
    // TODO: تكامل مع SendGrid أو NodeMailer
    console.log(`[Email] To: ${email}, Message: ${message}`);
    
    if (process.env.NODE_ENV === 'development') {
      return;
    }
  }
  
  /**
   * إرسال عبر SMS (يحتاج تكامل)
   */
  private static async sendSMS(phone: string, message: string): Promise<void> {
    // TODO: تكامل مع SMS Gateway
    console.log(`[SMS] To: ${phone}, Message: ${message}`);
    
    if (process.env.NODE_ENV === 'development') {
      return;
    }
  }
  
  /**
   * تسجيل إشعار
   */
  static async logNotification(data: {
    type: string;
    invoice_id?: string;
    advertiser_id: string;
    recipient: string;
    message: string;
    status: 'sent' | 'failed' | 'pending';
    error?: string;
  }): Promise<string> {
    const notificationData: any = {
      type: data.type,
      invoice_id: data.invoice_id || null,
      advertiser_id: data.advertiser_id,
      recipient: data.recipient,
      message: data.message,
      status: data.status,
      sent_at: data.status === 'sent' ? FieldValue.serverTimestamp() : null,
      error: data.error || null,
      created_at: FieldValue.serverTimestamp()
    };
    
    const docRef = await adminDb.collection('notifications').add(notificationData);
    return docRef.id;
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
      
      // تأخير بسيط بين الرسائل
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return {
      total: reminders.length,
      sent,
      failed
    };
  }
  
  /**
   * جلب إحصائيات الإشعارات
   */
  static async getNotificationStats(): Promise<{
    total: number;
    sent: number;
    failed: number;
    by_type: Record<string, number>;
  }> {
    const snapshot = await adminDb.collection('notifications').get();
    
    const stats = {
      total: snapshot.size,
      sent: 0,
      failed: 0,
      by_type: {} as Record<string, number>
    };
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      if (data.status === 'sent') stats.sent++;
      if (data.status === 'failed') stats.failed++;
      
      const type = data.type || 'unknown';
      stats.by_type[type] = (stats.by_type[type] || 0) + 1;
    });
    
    return stats;
  }
}

