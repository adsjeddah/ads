/**
 * خدمة فترة السماح (Grace Period Service)
 * نظام يدوي للأدمن فقط لتمديد الاشتراكات بدون رسوم
 */

import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../firebase-admin';
import { Subscription, GracePeriodExtension } from '../../types/models';
import { getSaudiNow, addDays, firestoreTimestampToDate } from '../utils/date';

export class GracePeriodService {
  
  /**
   * تفعيل فترة سماح جديدة (يدوي من الأدمن)
   * يمكن تكرارها أكثر من مرة
   */
  static async activateGracePeriod(
    subscriptionId: string,
    adminUid: string,
    days: number = 3,
    reason?: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const subscriptionRef = adminDb.collection('subscriptions').doc(subscriptionId);
      const subscriptionDoc = await subscriptionRef.get();

      if (!subscriptionDoc.exists) {
        return { success: false, message: 'الاشتراك غير موجود' };
      }

      const subscription = subscriptionDoc.data() as Subscription;
      
      // التحقق من أن الاشتراك نشط أو منتهي
      if (!['active', 'expired'].includes(subscription.status)) {
        return { 
          success: false, 
          message: 'لا يمكن تفعيل فترة السماح إلا للاشتراكات النشطة أو المنتهية' 
        };
      }

      const now = getSaudiNow();
      
      // تحديد تاريخ النهاية الحالي
      let currentEndDate: Date;
      
      if (subscription.is_in_grace_period && subscription.grace_period_end_date) {
        // إذا كان في فترة سماح حالياً، نمدد من تاريخ النهاية الحالي
        const tempDate = firestoreTimestampToDate(subscription.grace_period_end_date);
        currentEndDate = tempDate || now;
      } else {
        // إذا لم يكن في فترة سماح، نبدأ من تاريخ انتهاء الاشتراك
        const tempDate = firestoreTimestampToDate(subscription.end_date);
        currentEndDate = tempDate || now;
      }

      // حساب تاريخ النهاية الجديد
      const newEndDate = addDays(currentEndDate, days);

      // إنشاء سجل التمديد
      const extension: GracePeriodExtension = {
        extended_at: now,
        extended_by: adminUid,
        days_added: days,
        reason: reason || 'تمديد فترة سماح',
        previous_end_date: currentEndDate,
        new_end_date: newEndDate,
        notes: `تم تمديد فترة السماح لمدة ${days} أيام`
      };

      // الحصول على التمديدات السابقة
      const previousExtensions = subscription.grace_period_extensions || [];
      const totalExtensions = (subscription.total_grace_extensions || 0) + 1;

      // تحديث الاشتراك
      const updateData: any = {
        is_in_grace_period: true,
        grace_period_days: days,
        grace_period_end_date: Timestamp.fromDate(newEndDate),
        grace_period_started_at: subscription.is_in_grace_period 
          ? subscription.grace_period_started_at // الحفاظ على تاريخ البداية الأصلي
          : Timestamp.fromDate(now), // تاريخ جديد إذا كانت المرة الأولى
        grace_period_extensions: [...previousExtensions, extension],
        total_grace_extensions: totalExtensions,
        status: 'active', // إعادة تفعيل الاشتراك
        updated_at: FieldValue.serverTimestamp()
      };

      await subscriptionRef.update(updateData);

      return {
        success: true,
        message: `تم تفعيل فترة سماح لمدة ${days} أيام بنجاح`,
        data: {
          subscription_id: subscriptionId,
          new_end_date: newEndDate,
          total_extensions: totalExtensions,
          days_added: days
        }
      };

    } catch (error: any) {
      console.error('Error activating grace period:', error);
      return {
        success: false,
        message: error.message || 'خطأ في تفعيل فترة السماح'
      };
    }
  }

  /**
   * إنهاء فترة السماح يدوياً
   */
  static async endGracePeriod(
    subscriptionId: string,
    adminUid: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const subscriptionRef = adminDb.collection('subscriptions').doc(subscriptionId);
      const subscriptionDoc = await subscriptionRef.get();

      if (!subscriptionDoc.exists) {
        return { success: false, message: 'الاشتراك غير موجود' };
      }

      const subscription = subscriptionDoc.data() as Subscription;

      if (!subscription.is_in_grace_period) {
        return { success: false, message: 'الاشتراك ليس في فترة سماح' };
      }

      const now = getSaudiNow();

      // تحديث الاشتراك
      await subscriptionRef.update({
        is_in_grace_period: false,
        status: 'expired',
        actual_end_date: Timestamp.fromDate(now),
        updated_at: FieldValue.serverTimestamp()
      });

      // إضافة ملاحظة في السجل
      const gracePeriodEndDateConverted = firestoreTimestampToDate(subscription.grace_period_end_date!);
      const extension: GracePeriodExtension = {
        extended_at: now,
        extended_by: adminUid,
        days_added: 0,
        reason: reason || 'إنهاء فترة السماح يدوياً',
        previous_end_date: gracePeriodEndDateConverted || now,
        new_end_date: now,
        notes: 'تم إنهاء فترة السماح من قبل الإدارة'
      };

      const previousExtensions = subscription.grace_period_extensions || [];
      await subscriptionRef.update({
        grace_period_extensions: [...previousExtensions, extension]
      });

      return {
        success: true,
        message: 'تم إنهاء فترة السماح بنجاح'
      };

    } catch (error: any) {
      console.error('Error ending grace period:', error);
      return {
        success: false,
        message: error.message || 'خطأ في إنهاء فترة السماح'
      };
    }
  }

  /**
   * الحصول على معلومات فترة السماح
   */
  static async getGracePeriodInfo(subscriptionId: string): Promise<{
    is_in_grace_period: boolean;
    days_remaining?: number;
    end_date?: Date;
    total_extensions: number;
    extensions: GracePeriodExtension[];
  } | null> {
    try {
      const subscriptionDoc = await adminDb
        .collection('subscriptions')
        .doc(subscriptionId)
        .get();

      if (!subscriptionDoc.exists) {
        return null;
      }

      const subscription = subscriptionDoc.data() as Subscription;

      if (!subscription.is_in_grace_period) {
        return {
          is_in_grace_period: false,
          total_extensions: subscription.total_grace_extensions || 0,
          extensions: subscription.grace_period_extensions || []
        };
      }

      const now = getSaudiNow();
      const endDate = firestoreTimestampToDate(subscription.grace_period_end_date!);
      if (!endDate) {
        return {
          is_in_grace_period: false,
          total_extensions: subscription.total_grace_extensions || 0,
          extensions: subscription.grace_period_extensions || []
        };
      }
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        is_in_grace_period: true,
        days_remaining: Math.max(0, daysRemaining),
        end_date: endDate,
        total_extensions: subscription.total_grace_extensions || 0,
        extensions: subscription.grace_period_extensions || []
      };

    } catch (error: any) {
      console.error('Error getting grace period info:', error);
      return null;
    }
  }

  /**
   * جلب جميع الاشتراكات في فترة سماح
   */
  static async getAllGracePeriodSubscriptions(): Promise<any[]> {
    try {
      const snapshot = await adminDb
        .collection('subscriptions')
        .where('is_in_grace_period', '==', true)
        .get();

      const subscriptions = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const gracePeriodInfo = await this.getGracePeriodInfo(doc.id);
        
        subscriptions.push({
          id: doc.id,
          ...data,
          grace_period_info: gracePeriodInfo
        });
      }

      return subscriptions;

    } catch (error: any) {
      console.error('Error getting grace period subscriptions:', error);
      return [];
    }
  }

  /**
   * التحقق من انتهاء فترات السماح (للاستخدام في check-subscriptions)
   */
  static async checkExpiredGracePeriods(): Promise<void> {
    try {
      const now = getSaudiNow();
      const snapshot = await adminDb
        .collection('subscriptions')
        .where('is_in_grace_period', '==', true)
        .get();

      for (const doc of snapshot.docs) {
        const subscription = doc.data() as Subscription;
        const gracePeriodEndDate = firestoreTimestampToDate(subscription.grace_period_end_date!);

        // إذا انتهت فترة السماح
        if (gracePeriodEndDate && gracePeriodEndDate < now) {
          await doc.ref.update({
            is_in_grace_period: false,
            status: 'expired',
            actual_end_date: Timestamp.fromDate(now),
            updated_at: FieldValue.serverTimestamp()
          });

          console.log(`Grace period expired for subscription: ${doc.id}`);
        }
      }

    } catch (error: any) {
      console.error('Error checking expired grace periods:', error);
    }
  }

  /**
   * إحصائيات فترات السماح
   */
  static async getGracePeriodStats(): Promise<{
    total: number;
    expiring_soon: number; // خلال يوم واحد
    by_extensions: { [key: number]: number };
  }> {
    try {
      const snapshot = await adminDb
        .collection('subscriptions')
        .where('is_in_grace_period', '==', true)
        .get();

      const now = getSaudiNow();
      const oneDayFromNow = addDays(now, 1);

      let expiringSoon = 0;
      const byExtensions: { [key: number]: number } = {};

      snapshot.docs.forEach(doc => {
        const subscription = doc.data() as Subscription;
        const gracePeriodEndDate = firestoreTimestampToDate(subscription.grace_period_end_date!);

        // عد الاشتراكات التي تنتهي قريباً
        if (gracePeriodEndDate && gracePeriodEndDate <= oneDayFromNow) {
          expiringSoon++;
        }

        // تصنيف حسب عدد التمديدات
        const extensions = subscription.total_grace_extensions || 0;
        byExtensions[extensions] = (byExtensions[extensions] || 0) + 1;
      });

      return {
        total: snapshot.size,
        expiring_soon: expiringSoon,
        by_extensions: byExtensions
      };

    } catch (error: any) {
      console.error('Error getting grace period stats:', error);
      return {
        total: 0,
        expiring_soon: 0,
        by_extensions: {}
      };
    }
  }
}

