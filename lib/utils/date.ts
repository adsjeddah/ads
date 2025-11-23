/**
 * Date Utilities - توحيد التواريخ بالتقويم الميلادي والتوقيت السعودي
 * Saudi Arabia Timezone: Asia/Riyadh (UTC+3)
 */

import { format as dateFnsFormat, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toEnglishNumerals } from './numbers';

// التوقيت السعودي
export const SAUDI_TIMEZONE = 'Asia/Riyadh';

/**
 * تحويل التاريخ إلى التوقيت السعودي
 */
export function toSaudiTime(date: Date | string | number): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
  
  // تحويل إلى توقيت الرياض
  const saudiTime = new Date(dateObj.toLocaleString('en-US', { 
    timeZone: SAUDI_TIMEZONE 
  }));
  
  return saudiTime;
}

/**
 * الحصول على التاريخ والوقت الحالي بتوقيت السعودية
 */
export function getSaudiNow(): Date {
  return toSaudiTime(new Date());
}

/**
 * تنسيق التاريخ بالتقويم الميلادي (الأرقام بالإنجليزية)
 * @param date - التاريخ المراد تنسيقه
 * @param formatStr - نمط التنسيق (افتراضي: dd/MM/yyyy)
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  formatStr: string = 'dd/MM/yyyy'
): string {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    
    // التحقق من صحة التاريخ
    if (isNaN(dateObj.getTime())) {
      return '-';
    }
    
    // تحويل إلى التوقيت السعودي
    const saudiDate = toSaudiTime(dateObj);
    
    // تنسيق التاريخ بالأرقام الإنجليزية
    const formatted = dateFnsFormat(saudiDate, formatStr);
    
    // التأكد من استخدام الأرقام الإنجليزية فقط
    return toEnglishNumerals(formatted);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

/**
 * تنسيق التاريخ والوقت معاً
 */
export function formatDateTime(
  date: Date | string | number | null | undefined,
  formatStr: string = 'dd/MM/yyyy HH:mm'
): string {
  return formatDate(date, formatStr);
}

/**
 * تنسيق الوقت فقط
 */
export function formatTime(
  date: Date | string | number | null | undefined,
  formatStr: string = 'HH:mm:ss'
): string {
  return formatDate(date, formatStr);
}

/**
 * تنسيق التاريخ بشكل طويل (مثال: 23 نوفمبر 2025)
 */
export function formatDateLong(
  date: Date | string | number | null | undefined
): string {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (isNaN(dateObj.getTime())) return '-';
    
    const saudiDate = toSaudiTime(dateObj);
    
    // استخدام locale العربي للأسماء فقط، مع الأرقام الإنجليزية
    const formatted = dateFnsFormat(saudiDate, 'dd MMMM yyyy', { locale: ar });
    return toEnglishNumerals(formatted);
  } catch (error) {
    console.error('Error formatting date long:', error);
    return '-';
  }
}

/**
 * تنسيق التاريخ للإدخال في input type="date"
 */
export function formatDateForInput(
  date: Date | string | number | null | undefined
): string {
  return formatDate(date, 'yyyy-MM-dd');
}

/**
 * حساب الفرق بين تاريخين بالأيام
 */
export function daysBetween(
  startDate: Date | string | number,
  endDate: Date | string | number
): number {
  const start = toSaudiTime(startDate);
  const end = toSaudiTime(endDate);
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * إضافة أيام إلى تاريخ
 */
export function addDays(date: Date | string | number, days: number): Date {
  const dateObj = toSaudiTime(date);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
}

/**
 * التحقق من أن التاريخ في المستقبل
 */
export function isFutureDate(date: Date | string | number): boolean {
  const dateObj = toSaudiTime(date);
  const now = getSaudiNow();
  return dateObj > now;
}

/**
 * التحقق من أن التاريخ في الماضي
 */
export function isPastDate(date: Date | string | number): boolean {
  const dateObj = toSaudiTime(date);
  const now = getSaudiNow();
  return dateObj < now;
}

/**
 * تنسيق التاريخ النسبي (مثال: منذ ساعتين، قبل 3 أيام)
 */
export function formatRelativeDate(date: Date | string | number): string {
  const dateObj = toSaudiTime(date);
  const now = getSaudiNow();
  
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return 'الآن';
  if (diffMin < 60) return `منذ ${diffMin} ${diffMin === 1 ? 'دقيقة' : 'دقائق'}`;
  if (diffHour < 24) return `منذ ${diffHour} ${diffHour === 1 ? 'ساعة' : 'ساعات'}`;
  if (diffDay < 7) return `منذ ${diffDay} ${diffDay === 1 ? 'يوم' : 'أيام'}`;
  
  return formatDate(dateObj);
}

/**
 * الحصول على بداية اليوم (00:00:00)
 */
export function startOfDay(date: Date | string | number): Date {
  const dateObj = toSaudiTime(date);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
}

/**
 * الحصول على نهاية اليوم (23:59:59)
 */
export function endOfDay(date: Date | string | number): Date {
  const dateObj = toSaudiTime(date);
  dateObj.setHours(23, 59, 59, 999);
  return dateObj;
}

/**
 * تحويل Firestore Timestamp إلى Date
 */
export function firestoreTimestampToDate(timestamp: any): Date | null {
  if (!timestamp) return null;
  
  // إذا كان Firestore Timestamp
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return toSaudiTime(timestamp.toDate());
  }
  
  // إذا كان object مع seconds و nanoseconds
  if (timestamp.seconds !== undefined) {
    return toSaudiTime(new Date(timestamp.seconds * 1000));
  }
  
  // إذا كان Date object أو string
  return toSaudiTime(timestamp);
}

