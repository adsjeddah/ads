/**
 * Subscription Status Management Service
 * خدمة إدارة حالات الاشتراك (إيقاف مؤقت، إيقاف كامل، إعادة تشغيل)
 * 
 * يضمن:
 * - حساب دقيق للأيام
 * - تحديث التواريخ بالتوقيت السعودي
 * - تسجيل كامل للعمليات
 * - ربط مع النظام المالي
 */

import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../firebase-admin';
import { Subscription, SubscriptionStatusHistory } from '../../types/models';
import { getSaudiNow, daysBetween, addDays, toSaudiTime, firestoreTimestampToDate } from '../utils/date';
import { SubscriptionAdminService } from './subscription-admin.service';
import { FinancialService } from './financial.service';

export class SubscriptionStatusService {
  
  /**
   * تحديث حالة المعلن بناءً على حالة الاشتراك
   * هذه الدالة تضمن أن حالة المعلن تعكس حالة اشتراكه
   */
  private static async updateAdvertiserStatus(
    advertiser_id: string, 
    newStatus: 'active' | 'inactive'
  ): Promise<void> {
    try {
      // أولاً: التحقق من وجود اشتراكات أخرى نشطة لهذا المعلن
      if (newStatus === 'inactive') {
        const allSubscriptions = await adminDb
          .collection('subscriptions')
          .where('advertiser_id', '==', advertiser_id)
          .get();
        
        // إذا كان هناك اشتراك نشط آخر، لا نغير حالة المعلن
        const hasActiveSubscription = allSubscriptions.docs.some(doc => {
          const sub = doc.data();
          return sub.status === 'active';
        });
        
        if (hasActiveSubscription) {
          console.log(`⚠️ المعلن ${advertiser_id} لديه اشتراك نشط آخر، لن يتم تغيير حالته`);
        } else {
          // تحديث حالة المعلن إلى غير نشط
          await adminDb.collection('advertisers').doc(advertiser_id).update({
            status: newStatus,
            updated_at: FieldValue.serverTimestamp()
          });
          console.log(`✅ تم تحديث حالة المعلن ${advertiser_id} إلى: ${newStatus}`);
        }
      } else {
        // تحديث حالة المعلن إلى نشط
        await adminDb.collection('advertisers').doc(advertiser_id).update({
          status: newStatus,
          updated_at: FieldValue.serverTimestamp()
        });
        console.log(`✅ تم تحديث حالة المعلن ${advertiser_id} إلى: ${newStatus}`);
      }
      
      // 🆕 تحديث coverage_type بناءً على الاشتراكات النشطة
      try {
        const coverageUpdate = await FinancialService.updateAdvertiserCoverageFromSubscriptions(advertiser_id);
        console.log(`📊 تم تحديث coverage_type للمعلن ${advertiser_id}: ${coverageUpdate.new_coverage_type}`);
      } catch (coverageError) {
        console.error(`⚠️ خطأ في تحديث coverage_type للمعلن ${advertiser_id}:`, coverageError);
      }
      
    } catch (error) {
      console.error(`❌ خطأ في تحديث حالة المعلن ${advertiser_id}:`, error);
      // لا نرمي خطأ هنا لأننا لا نريد أن يفشل التغيير الرئيسي
    }
  }
  
  /**
   * 1. إيقاف مؤقت (Pause)
   * - الإعلان يتوقف مؤقتاً
   * - الأيام لا تُحتسب أثناء التوقف
   * - عند إعادة التشغيل: يستكمل من حيث توقف
   */
  static async pauseSubscription(data: {
    subscription_id: string;
    reason?: string;
    paused_by: string;
    ip_address?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data?: {
      paused_at: Date;
      days_remaining: number;
      will_end_at: Date; // متى سينتهي (حالياً معلق)
    };
  }> {
    try {
      const subscription = await SubscriptionAdminService.getById(data.subscription_id);
      
      if (!subscription) {
        return { success: false, message: 'الاشتراك غير موجود' };
      }
      
      // التحقق من أن الاشتراك نشط
      if (subscription.status !== 'active') {
        return { 
          success: false, 
          message: `لا يمكن إيقاف اشتراك بحالة: ${subscription.status}. يجب أن يكون نشطاً.` 
        };
      }
      
      const now = getSaudiNow();
      const currentEndDate = firestoreTimestampToDate(subscription.end_date) || now;
      
      // حساب الأيام المتبقية
      const daysRemaining = daysBetween(now, currentEndDate);
      
      if (daysRemaining <= 0) {
        return { 
          success: false, 
          message: 'الاشتراك منتهي بالفعل' 
        };
      }
      
      // حساب الأيام النشطة حتى الآن
      const startDate = firestoreTimestampToDate(subscription.start_date) || now;
      const activeDaysSoFar = daysBetween(startDate, now);
      
      // تحديث الاشتراك
      const updateData: any = {
        status: 'paused',
        paused_at: Timestamp.fromDate(now),
        current_pause_days: 0, // سيتم تحديثه عند إعادة التشغيل
        remaining_active_days: daysRemaining,
        active_days: activeDaysSoFar,
        updated_at: FieldValue.serverTimestamp()
      };
      
      // إذا كانت أول مرة يتم إيقافه، نحفظ التواريخ الأصلية
      if (!subscription.original_start_date) {
        updateData.original_start_date = subscription.start_date;
        updateData.original_end_date = subscription.end_date;
        updateData.planned_days = subscription.planned_days || daysBetween(subscription.start_date, subscription.end_date);
      }
      
      await adminDb.collection('subscriptions').doc(data.subscription_id).update(updateData);
      
      // تسجيل في التاريخ
      await this.recordStatusChange({
        subscription_id: data.subscription_id,
        advertiser_id: subscription.advertiser_id,
        from_status: 'active',
        to_status: 'paused',
        action_type: 'pause',
        changed_at: now,
        days_before_change: daysRemaining,
        days_after_change: daysRemaining, // نفس الأيام لأنها معلقة فقط
        changed_by: data.paused_by,
        changed_by_type: 'admin',
        reason: data.reason || 'إيقاف مؤقت بواسطة الإدارة',
        ip_address: data.ip_address,
        financial_impact: {
          amount_paid: subscription.paid_amount,
          amount_remaining: subscription.remaining_amount,
        }
      });
      
      // ✅ تحديث حالة المعلن إلى غير نشط
      await this.updateAdvertiserStatus(subscription.advertiser_id, 'inactive');
      
      return {
        success: true,
        message: 'تم إيقاف الاشتراك مؤقتاً بنجاح',
        data: {
          paused_at: now,
          days_remaining: daysRemaining,
          will_end_at: currentEndDate
        }
      };
      
    } catch (error: any) {
      console.error('Error pausing subscription:', error);
      return {
        success: false,
        message: `خطأ في إيقاف الاشتراك: ${error.message}`
      };
    }
  }
  
  /**
   * 2. إعادة تشغيل بعد إيقاف مؤقت (Resume)
   * - استكمال من حيث توقف
   * - تمديد تاريخ النهاية بعدد أيام التوقف
   * - الأيام المتبقية تبقى كما هي
   */
  static async resumeSubscription(data: {
    subscription_id: string;
    resumed_by: string;
    notes?: string;
    ip_address?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data?: {
      resumed_at: Date;
      pause_duration_days: number;
      new_end_date: Date;
      days_remaining: number;
    };
  }> {
    try {
      const subscription = await SubscriptionAdminService.getById(data.subscription_id);
      
      if (!subscription) {
        return { success: false, message: 'الاشتراك غير موجود' };
      }
      
      // التحقق من أن الاشتراك متوقف مؤقتاً
      if (subscription.status !== 'paused') {
        return { 
          success: false, 
          message: `لا يمكن إعادة تشغيل اشتراك بحالة: ${subscription.status}. يجب أن يكون متوقفاً مؤقتاً.` 
        };
      }
      
      if (!subscription.paused_at) {
        return { 
          success: false, 
          message: 'تاريخ الإيقاف غير موجود' 
        };
      }
      
      const now = getSaudiNow();
      const pausedAt = firestoreTimestampToDate(subscription.paused_at);
      
      if (!pausedAt) {
        return { 
          success: false, 
          message: 'تاريخ الإيقاف غير صالح' 
        };
      }
      
      // حساب مدة التوقف (بالأيام)
      const pauseDurationDays = daysBetween(pausedAt, now);
      
      // حساب تاريخ النهاية الجديد (نضيف أيام التوقف)
      const oldEndDate = firestoreTimestampToDate(subscription.end_date) || now;
      const newEndDate = addDays(oldEndDate, pauseDurationDays);
      
      // حساب إجمالي أيام التوقف
      const totalPausedDays = (subscription.total_paused_days || 0) + pauseDurationDays;
      
      // الأيام المتبقية (نفسها لم تتغير)
      const daysRemaining = subscription.remaining_active_days || 0;
      
      // تحديث الاشتراك
      const updateData: any = {
        status: 'active',
        resumed_at: Timestamp.fromDate(now),
        end_date: Timestamp.fromDate(newEndDate),
        adjusted_end_date: Timestamp.fromDate(newEndDate),
        total_paused_days: totalPausedDays,
        current_pause_days: pauseDurationDays,
        updated_at: FieldValue.serverTimestamp()
      };
      
      await adminDb.collection('subscriptions').doc(data.subscription_id).update(updateData);
      
      // تسجيل في التاريخ
      await this.recordStatusChange({
        subscription_id: data.subscription_id,
        advertiser_id: subscription.advertiser_id,
        from_status: 'paused',
        to_status: 'active',
        action_type: 'resume',
        changed_at: now,
        effective_from: now,
        days_before_change: daysRemaining,
        days_after_change: daysRemaining,
        pause_duration_days: pauseDurationDays,
        changed_by: data.resumed_by,
        changed_by_type: 'admin',
        reason: 'إعادة تشغيل بعد إيقاف مؤقت',
        notes: data.notes,
        ip_address: data.ip_address,
        financial_impact: {
          amount_paid: subscription.paid_amount,
          amount_remaining: subscription.remaining_amount,
        }
      });
      
      // ✅ تحديث حالة المعلن إلى نشط
      await this.updateAdvertiserStatus(subscription.advertiser_id, 'active');
      
      return {
        success: true,
        message: `تم إعادة تشغيل الاشتراك بنجاح. تم تمديد تاريخ النهاية بـ ${pauseDurationDays} يوم.`,
        data: {
          resumed_at: now,
          pause_duration_days: pauseDurationDays,
          new_end_date: newEndDate,
          days_remaining: daysRemaining
        }
      };
      
    } catch (error: any) {
      console.error('Error resuming subscription:', error);
      return {
        success: false,
        message: `خطأ في إعادة تشغيل الاشتراك: ${error.message}`
      };
    }
  }
  
  /**
   * 3. إيقاف كامل (Stop)
   * - إيقاف نهائي للاشتراك الحالي
   * - عند إعادة التشغيل: يبدأ من جديد بنفس الباقة
   */
  static async stopSubscription(data: {
    subscription_id: string;
    reason: string;
    stopped_by: string;
    ip_address?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data?: {
      stopped_at: Date;
      days_used: number;
      days_wasted: number;
    };
  }> {
    try {
      const subscription = await SubscriptionAdminService.getById(data.subscription_id);
      
      if (!subscription) {
        return { success: false, message: 'الاشتراك غير موجود' };
      }
      
      // يمكن إيقاف اشتراك نشط أو متوقف مؤقتاً أو في انتظار الدفع
      if (!['active', 'paused', 'pending_payment'].includes(subscription.status)) {
        return { 
          success: false, 
          message: `لا يمكن إيقاف اشتراك بحالة: ${subscription.status}` 
        };
      }
      
      const now = getSaudiNow();
      const startDate = firestoreTimestampToDate(subscription.start_date) || now;
      const currentEndDate = firestoreTimestampToDate(subscription.end_date) || now;
      
      // حساب الأيام المستخدمة والمهدرة
      let daysUsed = 0;
      let daysWasted = 0;
      
      if (subscription.status === 'active') {
        daysUsed = daysBetween(startDate, now);
        daysWasted = Math.max(0, daysBetween(now, currentEndDate));
      } else if (subscription.status === 'paused') {
        // إذا كان متوقفاً مؤقتاً
        daysUsed = subscription.active_days || 0;
        daysWasted = subscription.remaining_active_days || 0;
      } else if (subscription.status === 'pending_payment') {
        // إذا كان في انتظار الدفع
        daysUsed = 0;
        daysWasted = daysBetween(startDate, currentEndDate);
      }
      
      // تحديث الاشتراك
      const updateData: any = {
        status: 'stopped',
        stopped_at: Timestamp.fromDate(now),
        stop_reason: data.reason,
        actual_end_date: Timestamp.fromDate(now),
        active_days: daysUsed,
        updated_at: FieldValue.serverTimestamp()
      };
      
      await adminDb.collection('subscriptions').doc(data.subscription_id).update(updateData);
      
      // تسجيل في التاريخ
      await this.recordStatusChange({
        subscription_id: data.subscription_id,
        advertiser_id: subscription.advertiser_id,
        from_status: subscription.status,
        to_status: 'stopped',
        action_type: 'stop',
        changed_at: now,
        days_before_change: daysWasted,
        days_after_change: 0,
        changed_by: data.stopped_by,
        changed_by_type: 'admin',
        reason: data.reason,
        ip_address: data.ip_address,
        financial_impact: {
          amount_paid: subscription.paid_amount,
          amount_remaining: subscription.remaining_amount,
        }
      });
      
      // ✅ تحديث حالة المعلن إلى غير نشط
      await this.updateAdvertiserStatus(subscription.advertiser_id, 'inactive');
      
      return {
        success: true,
        message: 'تم إيقاف الاشتراك بشكل كامل',
        data: {
          stopped_at: now,
          days_used: daysUsed,
          days_wasted: daysWasted
        }
      };
      
    } catch (error: any) {
      console.error('Error stopping subscription:', error);
      return {
        success: false,
        message: `خطأ في إيقاف الاشتراك: ${error.message}`
      };
    }
  }
  
  /**
   * 4. إعادة تشغيل بعد إيقاف كامل (Reactivate)
   * - يبدأ من جديد بنفس الباقة والشروط
   * - مدة جديدة كاملة
   */
  static async reactivateSubscription(data: {
    subscription_id: string;
    new_start_date?: Date; // إذا لم يُحدد، يبدأ من اليوم
    reactivated_by: string;
    notes?: string;
    ip_address?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data?: {
      reactivated_at: Date;
      new_start_date: Date;
      new_end_date: Date;
      total_days: number;
    };
  }> {
    try {
      const subscription = await SubscriptionAdminService.getById(data.subscription_id);
      
      if (!subscription) {
        return { success: false, message: 'الاشتراك غير موجود' };
      }
      
      // يمكن إعادة تشغيل اشتراك متوقف أو منتهي أو ملغي أو في انتظار الدفع
      const allowedStatuses = ['stopped', 'expired', 'cancelled', 'pending_payment'];
      if (!allowedStatuses.includes(subscription.status)) {
        return { 
          success: false, 
          message: `لا يمكن إعادة تشغيل اشتراك بحالة: ${subscription.status}. يجب أن يكون متوقفاً أو منتهياً.` 
        };
      }
      
      const now = getSaudiNow();
      const newStartDate = data.new_start_date ? (firestoreTimestampToDate(data.new_start_date) || now) : now;
      
      // المدة الأصلية من الباقة
      const plannedDays = subscription.planned_days || 
                          daysBetween(
                            firestoreTimestampToDate(subscription.original_start_date || subscription.start_date) || now, 
                            firestoreTimestampToDate(subscription.original_end_date || subscription.end_date) || now
                          );
      
      // حساب تاريخ النهاية الجديد
      const newEndDate = addDays(newStartDate, plannedDays);
      
      // تحديث الاشتراك
      const updateData: any = {
        status: 'active',
        start_date: Timestamp.fromDate(newStartDate),
        end_date: Timestamp.fromDate(newEndDate),
        adjusted_end_date: Timestamp.fromDate(newEndDate),
        resumed_at: Timestamp.fromDate(now),
        active_days: 0, // يبدأ من الصفر
        remaining_active_days: plannedDays,
        total_paused_days: 0, // نُعيد تصفير التوقفات
        current_pause_days: 0,
        updated_at: FieldValue.serverTimestamp()
      };
      
      await adminDb.collection('subscriptions').doc(data.subscription_id).update(updateData);
      
      // تسجيل في التاريخ
      await this.recordStatusChange({
        subscription_id: data.subscription_id,
        advertiser_id: subscription.advertiser_id,
        from_status: subscription.status as any,
        to_status: 'active',
        action_type: 'reactivate',
        changed_at: now,
        effective_from: newStartDate,
        days_before_change: 0,
        days_after_change: plannedDays,
        changed_by: data.reactivated_by,
        changed_by_type: 'admin',
        reason: `إعادة تنشيط من حالة: ${subscription.status}`,
        notes: data.notes,
        ip_address: data.ip_address,
        financial_impact: {
          amount_paid: subscription.paid_amount,
          amount_remaining: subscription.remaining_amount,
        }
      });
      
      // ✅ تحديث حالة المعلن إلى نشط
      await this.updateAdvertiserStatus(subscription.advertiser_id, 'active');
      
      return {
        success: true,
        message: `تم إعادة تشغيل الاشتراك بنجاح. المدة: ${plannedDays} يوم`,
        data: {
          reactivated_at: now,
          new_start_date: newStartDate,
          new_end_date: newEndDate,
          total_days: plannedDays
        }
      };
      
    } catch (error: any) {
      console.error('Error reactivating subscription:', error);
      return {
        success: false,
        message: `خطأ في إعادة تشغيل الاشتراك: ${error.message}`
      };
    }
  }
  
  /**
   * تسجيل تغيير الحالة في التاريخ
   */
  private static async recordStatusChange(data: Omit<SubscriptionStatusHistory, 'id' | 'created_at'>): Promise<void> {
    try {
      const historyData: any = {
        ...data,
        changed_at: Timestamp.fromDate(data.changed_at),
        effective_from: data.effective_from ? Timestamp.fromDate(data.effective_from) : null,
        effective_until: data.effective_until ? Timestamp.fromDate(data.effective_until) : null,
        created_at: FieldValue.serverTimestamp()
      };
      
      await adminDb.collection('subscription_status_history').add(historyData);
    } catch (error) {
      console.error('Error recording status change:', error);
      // لا نرمي خطأ هنا لأننا لا نريد أن يفشل التغيير بسبب مشكلة في التسجيل
    }
  }
  
  /**
   * الحصول على تاريخ الحالات لاشتراك معين
   */
  static async getStatusHistory(subscription_id: string): Promise<SubscriptionStatusHistory[]> {
    try {
      const snapshot = await adminDb
        .collection('subscription_status_history')
        .where('subscription_id', '==', subscription_id)
        .orderBy('changed_at', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SubscriptionStatusHistory[];
    } catch (error) {
      console.error('Error getting status history:', error);
      return [];
    }
  }
  
  /**
   * الحصول على الاشتراكات المتوقفة مؤقتاً
   */
  static async getPausedSubscriptions(): Promise<Subscription[]> {
    try {
      const snapshot = await adminDb
        .collection('subscriptions')
        .where('status', '==', 'paused')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Subscription[];
    } catch (error) {
      console.error('Error getting paused subscriptions:', error);
      return [];
    }
  }
}

