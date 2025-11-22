/**
 * دوال التنسيق (Formatting Utilities)
 */

export class FormattingUtils {
  
  /**
   * تنسيق المبلغ المالي (ريال سعودي)
   */
  static formatCurrency(amount: number, includeSymbol: boolean = true): string {
    const formatted = amount.toLocaleString('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return includeSymbol ? `${formatted} ريال` : formatted;
  }
  
  /**
   * تنسيق التاريخ (عربي)
   */
  static formatDate(date: Date | any, format: 'short' | 'long' | 'full' = 'short'): string {
    const parsedDate = date instanceof Date ? date : new Date(date);
    
    if (isNaN(parsedDate.getTime())) {
      return 'تاريخ غير صحيح';
    }
    
    switch (format) {
      case 'short':
        // 2025-11-22
        return parsedDate.toLocaleDateString('en-CA');
      
      case 'long':
        // 22 نوفمبر 2025
        return parsedDate.toLocaleDateString('ar-SA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      
      case 'full':
        // الجمعة، 22 نوفمبر 2025
        return parsedDate.toLocaleDateString('ar-SA', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      
      default:
        return parsedDate.toLocaleDateString('ar-SA');
    }
  }
  
  /**
   * تنسيق التاريخ والوقت
   */
  static formatDateTime(date: Date | any): string {
    const parsedDate = date instanceof Date ? date : new Date(date);
    
    if (isNaN(parsedDate.getTime())) {
      return 'تاريخ غير صحيح';
    }
    
    const dateStr = this.formatDate(parsedDate, 'long');
    const timeStr = parsedDate.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    return `${dateStr} - ${timeStr}`;
  }
  
  /**
   * تنسيق رقم الهاتف السعودي
   */
  static formatPhoneNumber(phone: string): string {
    // تنظيف الرقم أولاً
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // تحويل إلى التنسيق الموحد
    if (cleaned.startsWith('+966')) {
      cleaned = '0' + cleaned.substring(4);
    } else if (cleaned.startsWith('966')) {
      cleaned = '0' + cleaned.substring(3);
    }
    
    // تنسيق: 0512 345 678
    if (cleaned.length === 10) {
      return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
    }
    
    return phone;
  }
  
  /**
   * تنسيق IBAN
   */
  static formatIBAN(iban: string): string {
    // تنظيف IBAN
    const cleaned = iban.replace(/\s/g, '').toUpperCase();
    
    // تنسيق: SA12 3456 7890 1234 5678 9012
    return cleaned.match(/.{1,4}/g)?.join(' ') || iban;
  }
  
  /**
   * تنسيق النسبة المئوية
   */
  static formatPercentage(value: number, decimals: number = 0): string {
    return `${value.toFixed(decimals)}%`;
  }
  
  /**
   * تنسيق حالة الفاتورة
   */
  static formatInvoiceStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'paid': 'مدفوعة',
      'unpaid': 'غير مدفوعة',
      'partial': 'مدفوعة جزئياً',
      'cancelled': 'ملغاة',
      'overdue': 'متأخرة'
    };
    
    return statusMap[status] || status;
  }
  
  /**
   * تنسيق حالة الاشتراك
   */
  static formatSubscriptionStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'active': 'نشط',
      'expired': 'منتهي',
      'cancelled': 'ملغى',
      'pending': 'معلق'
    };
    
    return statusMap[status] || status;
  }
  
  /**
   * تنسيق حالة الدفع
   */
  static formatPaymentStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'paid': 'مدفوع',
      'partial': 'جزئي',
      'pending': 'معلق'
    };
    
    return statusMap[status] || status;
  }
  
  /**
   * تنسيق نوع الخصم
   */
  static formatDiscountType(type: string): string {
    const typeMap: Record<string, string> = {
      'amount': 'مبلغ ثابت',
      'percentage': 'نسبة مئوية'
    };
    
    return typeMap[type] || type;
  }
  
  /**
   * تنسيق طريقة الدفع
   */
  static formatPaymentMethod(method: string): string {
    const methodMap: Record<string, string> = {
      'cash': 'نقداً',
      'bank_transfer': 'تحويل بنكي',
      'card': 'بطاقة',
      'online': 'دفع إلكتروني',
      'check': 'شيك'
    };
    
    return methodMap[method] || method;
  }
  
  /**
   * تنسيق الفترة الزمنية (بالأيام)
   */
  static formatDuration(days: number): string {
    if (days === 1) return 'يوم واحد';
    if (days === 2) return 'يومان';
    if (days < 11) return `${days} أيام`;
    if (days === 15) return '15 يوم';
    if (days === 30) return 'شهر';
    if (days === 60) return 'شهرين';
    if (days === 90) return '3 أشهر';
    if (days === 180) return '6 أشهر';
    if (days === 365) return 'سنة';
    
    return `${days} يوم`;
  }
  
  /**
   * حساب الأيام المتبقية
   */
  static calculateRemainingDays(endDate: Date): number {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  
  /**
   * تنسيق الأيام المتبقية
   */
  static formatRemainingDays(endDate: Date): string {
    const days = this.calculateRemainingDays(endDate);
    
    if (days < 0) {
      return `متأخر ${Math.abs(days)} ${Math.abs(days) === 1 ? 'يوم' : 'أيام'}`;
    } else if (days === 0) {
      return 'ينتهي اليوم';
    } else if (days === 1) {
      return 'ينتهي غداً';
    } else if (days <= 7) {
      return `باقي ${days} أيام`;
    } else {
      return `باقي ${days} يوم`;
    }
  }
  
  /**
   * تنسيق حجم الملف
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 بايت';
    
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }
  
  /**
   * تقصير النص
   */
  static truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
  
  /**
   * تنسيق رقم الفاتورة
   */
  static formatInvoiceNumber(invoiceNumber: string): string {
    // INV-202511-0001 → #INV-202511-0001
    return invoiceNumber.startsWith('#') ? invoiceNumber : `#${invoiceNumber}`;
  }
  
  /**
   * تنسيق رقم الاشتراك
   */
  static formatSubscriptionNumber(subscriptionNumber: string): string {
    // SUB-202511-0001 → #SUB-202511-0001
    return subscriptionNumber.startsWith('#') ? subscriptionNumber : `#${subscriptionNumber}`;
  }
  
  /**
   * تحويل Firestore Timestamp إلى Date
   */
  static timestampToDate(timestamp: any): Date {
    if (!timestamp) return new Date();
    
    // Firestore Timestamp
    if (timestamp.seconds !== undefined) {
      return new Date(timestamp.seconds * 1000);
    }
    
    // Already a Date
    if (timestamp instanceof Date) {
      return timestamp;
    }
    
    // String date
    return new Date(timestamp);
  }
  
  /**
   * تنسيق العنوان
   */
  static formatAddress(address: {
    street?: string;
    city?: string;
    district?: string;
    postal_code?: string;
  }): string {
    const parts = [];
    
    if (address.street) parts.push(address.street);
    if (address.district) parts.push(address.district);
    if (address.city) parts.push(address.city);
    if (address.postal_code) parts.push(`الرمز البريدي: ${address.postal_code}`);
    
    return parts.join('، ');
  }
  
  /**
   * تنسيق Badge HTML للحالة
   */
  static getStatusBadgeClass(status: string): string {
    const classMap: Record<string, string> = {
      'paid': 'bg-green-100 text-green-800',
      'unpaid': 'bg-red-100 text-red-800',
      'partial': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-gray-100 text-gray-800',
      'active': 'bg-green-100 text-green-800',
      'expired': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'sent': 'bg-blue-100 text-blue-800',
      'failed': 'bg-red-100 text-red-800'
    };
    
    return classMap[status] || 'bg-gray-100 text-gray-800';
  }
  
  /**
   * تحويل الرقم إلى كلمات (عربي)
   */
  static numberToArabicWords(num: number): string {
    // تطبيق بسيط للأرقام الصغيرة
    const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
    const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
    
    if (num === 0) return 'صفر';
    if (num < 10) return ones[num];
    if (num === 10) return 'عشرة';
    if (num === 11) return 'أحد عشر';
    if (num === 12) return 'اثنا عشر';
    if (num < 20) return ones[num - 10] + ' عشر';
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const one = num % 10;
      return ones[one] ? `${ones[one]} و${tens[ten]}` : tens[ten];
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const remainder = num % 100;
      const hundredPart = hundreds[hundred];
      const remainderPart = remainder > 0 ? ` و${this.numberToArabicWords(remainder)}` : '';
      return hundredPart + remainderPart;
    }
    
    // للأرقام الأكبر، عرض رقمي فقط
    return num.toLocaleString('ar-SA');
  }
}

/**
 * دوال التنسيق للفواتير
 */
export class InvoiceFormatter {
  
  /**
   * تنسيق ملخص الفاتورة
   */
  static formatInvoiceSummary(invoice: any): string {
    const subtotal = FormattingUtils.formatCurrency(invoice.subtotal);
    const vat = FormattingUtils.formatCurrency(invoice.vat_amount);
    const total = FormattingUtils.formatCurrency(invoice.amount);
    
    return `
      المبلغ قبل الضريبة: ${subtotal}
      الضريبة (${invoice.vat_percentage}%): ${vat}
      الإجمالي: ${total}
    `.trim();
  }
  
  /**
   * تنسيق حالة الفاتورة مع التفاصيل
   */
  static formatInvoiceStatusDetailed(invoice: any): string {
    const status = FormattingUtils.formatInvoiceStatus(invoice.status);
    
    if (invoice.status === 'paid' && invoice.paid_date) {
      const date = FormattingUtils.formatDate(invoice.paid_date, 'long');
      return `${status} - ${date}`;
    }
    
    if (invoice.status === 'unpaid' && invoice.due_date) {
      const remaining = FormattingUtils.formatRemainingDays(invoice.due_date);
      return `${status} - ${remaining}`;
    }
    
    return status;
  }
}

