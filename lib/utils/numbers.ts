/**
 * Number Utilities - توحيد الأرقام لتظهر بالإنجليزية
 */

/**
 * تحويل الأرقام العربية والفارسية إلى إنجليزية
 */
export function toEnglishNumerals(str: string | number): string {
  if (typeof str === 'number') {
    str = str.toString();
  }
  
  if (typeof str !== 'string') {
    return String(str);
  }
  
  // تحويل الأرقام العربية (٠-٩)
  str = str.replace(/[٠-٩]/g, (d) => {
    return String.fromCharCode(d.charCodeAt(0) - 1584);
  });
  
  // تحويل الأرقام الفارسية (۰-۹)
  str = str.replace(/[۰-۹]/g, (d) => {
    return String.fromCharCode(d.charCodeAt(0) - 1728);
  });
  
  return str;
}

/**
 * تنسيق رقم مع فواصل الآلاف (بالأرقام الإنجليزية)
 * مثال: 1234567 => 1,234,567
 */
export function formatNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined || num === '') return '0';
  
  const numValue = typeof num === 'string' ? parseFloat(toEnglishNumerals(num)) : num;
  
  if (isNaN(numValue)) return '0';
  
  return numValue.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    useGrouping: true
  });
}

/**
 * تنسيق السعر مع العملة (بالأرقام الإنجليزية)
 * مثال: 1500 => "1,500 ريال"
 */
export function formatPrice(
  price: number | string | null | undefined,
  currency: string = 'ريال'
): string {
  if (price === null || price === undefined || price === '') return `0 ${currency}`;
  
  const priceValue = typeof price === 'string' ? parseFloat(toEnglishNumerals(price)) : price;
  
  if (isNaN(priceValue)) return `0 ${currency}`;
  
  const formatted = priceValue.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: true
  });
  
  return `${formatted} ${currency}`;
}

/**
 * تنسيق النسبة المئوية (بالأرقام الإنجليزية)
 * مثال: 15 => "15%"
 */
export function formatPercentage(
  percent: number | string | null | undefined,
  decimals: number = 0
): string {
  if (percent === null || percent === undefined || percent === '') return '0%';
  
  const percentValue = typeof percent === 'string' ? parseFloat(toEnglishNumerals(percent)) : percent;
  
  if (isNaN(percentValue)) return '0%';
  
  return `${percentValue.toFixed(decimals)}%`;
}

/**
 * تنسيق رقم الهاتف السعودي (بالأرقام الإنجليزية)
 * مثال: 0548265582 => 0548265582
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // تحويل إلى أرقام إنجليزية
  let cleaned = toEnglishNumerals(phone);
  
  // إزالة أي رموز غير رقمية
  cleaned = cleaned.replace(/\D/g, '');
  
  // إذا كان يبدأ بـ +966، نحذفها
  if (cleaned.startsWith('966')) {
    cleaned = '0' + cleaned.substring(3);
  }
  
  return cleaned;
}

/**
 * تنسيق رقم الهاتف مع رمز الدولة (بالأرقام الإنجليزية)
 * مثال: 0548265582 => +966 54 826 5582
 */
export function formatPhoneInternational(phone: string | null | undefined): string {
  if (!phone) return '';
  
  let cleaned = formatPhone(phone);
  
  // إذا كان يبدأ بـ 0، نستبدلها بـ +966
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // تنسيق: +966 5X XXX XXXX
  if (cleaned.length === 9) {
    return `+966 ${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5)}`;
  }
  
  return `+966 ${cleaned}`;
}

/**
 * تحويل رقم إلى كلمات (بالأرقام الإنجليزية للأرقام)
 * مثال: 1500 => "1,500"
 */
export function numberToWords(num: number): string {
  // هذه دالة بسيطة، يمكن توسيعها لاحقاً
  return formatNumber(num);
}

/**
 * تقريب رقم إلى منزلتين عشريتين
 */
export function roundToTwo(num: number | string | null | undefined): number {
  if (num === null || num === undefined || num === '') return 0;
  
  const numValue = typeof num === 'string' ? parseFloat(toEnglishNumerals(num)) : num;
  
  if (isNaN(numValue)) return 0;
  
  return Math.round(numValue * 100) / 100;
}

/**
 * تحويل string إلى number مع التعامل مع الأرقام العربية
 */
export function parseNumber(str: string | number | null | undefined): number {
  if (str === null || str === undefined || str === '') return 0;
  
  if (typeof str === 'number') return str;
  
  const cleaned = toEnglishNumerals(str);
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? 0 : num;
}

/**
 * تنسيق حجم الملف (بالأرقام الإنجليزية)
 * مثال: 1536 => "1.5 KB"
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * تنسيق العدد بشكل مختصر (بالأرقام الإنجليزية)
 * مثال: 1500 => "1.5K", 1500000 => "1.5M"
 */
export function formatCompactNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0';
  
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`;
  
  return `${(num / 1000000000).toFixed(1)}B`;
}

/**
 * التحقق من أن القيمة رقم صحيح
 */
export function isValidNumber(value: any): boolean {
  if (typeof value === 'number') return !isNaN(value) && isFinite(value);
  if (typeof value === 'string') {
    const cleaned = toEnglishNumerals(value);
    const num = parseFloat(cleaned);
    return !isNaN(num) && isFinite(num);
  }
  return false;
}

/**
 * تنسيق رقم بصيغة معينة (custom format)
 */
export function formatNumberCustom(
  num: number | string | null | undefined,
  options: Intl.NumberFormatOptions = {}
): string {
  if (num === null || num === undefined || num === '') return '0';
  
  const numValue = typeof num === 'string' ? parseFloat(toEnglishNumerals(num)) : num;
  
  if (isNaN(numValue)) return '0';
  
  return numValue.toLocaleString('en-US', options);
}









