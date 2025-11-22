/**
 * دوال التحقق من الصحة (Validation Utilities)
 */

export class ValidationUtils {
  
  /**
   * التحقق من رقم الهاتف السعودي
   */
  static isValidSaudiPhone(phone: string): boolean {
    // يجب أن يبدأ بـ 05 أو +9665 أو 9665
    const patterns = [
      /^05\d{8}$/,           // 0512345678
      /^\+9665\d{8}$/,       // +966512345678
      /^9665\d{8}$/          // 966512345678
    ];
    
    return patterns.some(pattern => pattern.test(phone));
  }
  
  /**
   * التحقق من البريد الإلكتروني
   */
  static isValidEmail(email: string): boolean {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  }
  
  /**
   * التحقق من المبلغ المالي
   */
  static isValidAmount(amount: number): boolean {
    return typeof amount === 'number' && 
           !isNaN(amount) && 
           amount >= 0 && 
           Number.isFinite(amount);
  }
  
  /**
   * التحقق من نسبة الخصم
   */
  static isValidDiscountPercentage(percentage: number): boolean {
    return this.isValidAmount(percentage) && 
           percentage >= 0 && 
           percentage <= 100;
  }
  
  /**
   * التحقق من نسبة الضريبة
   */
  static isValidVATPercentage(percentage: number): boolean {
    return this.isValidAmount(percentage) && 
           percentage >= 0 && 
           percentage <= 100;
  }
  
  /**
   * التحقق من التاريخ
   */
  static isValidDate(date: any): boolean {
    if (!date) return false;
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }
  
  /**
   * التحقق من أن التاريخ في المستقبل
   */
  static isFutureDate(date: Date): boolean {
    return new Date(date) > new Date();
  }
  
  /**
   * التحقق من أن التاريخ في الماضي
   */
  static isPastDate(date: Date): boolean {
    return new Date(date) < new Date();
  }
  
  /**
   * التحقق من نطاق التاريخ
   */
  static isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
    const checkDate = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return checkDate >= start && checkDate <= end;
  }
  
  /**
   * التحقق من رقم IBAN السعودي
   */
  static isValidSaudiIBAN(iban: string): boolean {
    // يجب أن يبدأ بـ SA ويكون 24 حرف
    const pattern = /^SA\d{22}$/;
    return pattern.test(iban.replace(/\s/g, ''));
  }
  
  /**
   * التحقق من الرقم التجاري
   */
  static isValidCommercialNumber(number: string): boolean {
    // 10 أرقام
    const pattern = /^\d{10}$/;
    return pattern.test(number);
  }
  
  /**
   * التحقق من الرقم الضريبي
   */
  static isValidTaxNumber(number: string): boolean {
    // 15 رقم
    const pattern = /^\d{15}$/;
    return pattern.test(number);
  }
  
  /**
   * تنظيف رقم الهاتف
   */
  static cleanPhoneNumber(phone: string): string {
    // إزالة المسافات والشرطات
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // تحويل إلى التنسيق الموحد (05xxxxxxxx)
    if (cleaned.startsWith('+966')) {
      cleaned = '0' + cleaned.substring(4);
    } else if (cleaned.startsWith('966')) {
      cleaned = '0' + cleaned.substring(3);
    }
    
    return cleaned;
  }
  
  /**
   * تنظيف IBAN
   */
  static cleanIBAN(iban: string): string {
    return iban.replace(/\s/g, '').toUpperCase();
  }
  
  /**
   * تقريب المبلغ لمنزلتين عشريتين
   */
  static roundAmount(amount: number): number {
    return Math.round(amount * 100) / 100;
  }
  
  /**
   * التحقق من أن السلسلة ليست فارغة
   */
  static isNotEmpty(str: string | undefined | null): boolean {
    return Boolean(str && str.trim().length > 0);
  }
  
  /**
   * التحقق من الحد الأدنى للطول
   */
  static hasMinLength(str: string, minLength: number): boolean {
    return str.length >= minLength;
  }
  
  /**
   * التحقق من الحد الأقصى للطول
   */
  static hasMaxLength(str: string, maxLength: number): boolean {
    return str.length <= maxLength;
  }
  
  /**
   * التحقق من معرف Firebase
   */
  static isValidFirebaseId(id: string): boolean {
    // معرفات Firebase تكون عادةً 20 حرف
    const pattern = /^[a-zA-Z0-9_-]{20}$/;
    return pattern.test(id);
  }
  
  /**
   * التحقق من URL
   */
  static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * التحقق من عنوان IP
   */
  static isValidIP(ip: string): boolean {
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    if (ipv4Pattern.test(ip)) {
      const parts = ip.split('.');
      return parts.every(part => parseInt(part) <= 255);
    }
    
    return ipv6Pattern.test(ip);
  }
}

/**
 * دوال التحقق من صحة نماذج البيانات
 */
export class ModelValidator {
  
  /**
   * التحقق من بيانات المعلن
   */
  static validateAdvertiser(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!ValidationUtils.isNotEmpty(data.company_name)) {
      errors.push('اسم الشركة مطلوب');
    }
    
    if (!ValidationUtils.isNotEmpty(data.contact_person)) {
      errors.push('اسم الشخص المسؤول مطلوب');
    }
    
    if (!ValidationUtils.isValidSaudiPhone(data.phone)) {
      errors.push('رقم الهاتف غير صحيح');
    }
    
    if (data.email && !ValidationUtils.isValidEmail(data.email)) {
      errors.push('البريد الإلكتروني غير صحيح');
    }
    
    if (data.commercial_number && !ValidationUtils.isValidCommercialNumber(data.commercial_number)) {
      errors.push('الرقم التجاري غير صحيح');
    }
    
    if (data.tax_number && !ValidationUtils.isValidTaxNumber(data.tax_number)) {
      errors.push('الرقم الضريبي غير صحيح');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * التحقق من بيانات الاشتراك
   */
  static validateSubscription(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.advertiser_id) {
      errors.push('معرف المعلن مطلوب');
    }
    
    if (!data.plan_id) {
      errors.push('معرف الباقة مطلوب');
    }
    
    if (!ValidationUtils.isValidDate(data.start_date)) {
      errors.push('تاريخ البدء غير صحيح');
    }
    
    if (data.discount_type && !['amount', 'percentage'].includes(data.discount_type)) {
      errors.push('نوع الخصم غير صحيح');
    }
    
    if (data.discount_amount) {
      if (!ValidationUtils.isValidAmount(data.discount_amount)) {
        errors.push('قيمة الخصم غير صحيحة');
      }
      
      if (data.discount_type === 'percentage' && 
          !ValidationUtils.isValidDiscountPercentage(data.discount_amount)) {
        errors.push('نسبة الخصم يجب أن تكون بين 0 و 100');
      }
    }
    
    if (data.initial_payment && !ValidationUtils.isValidAmount(data.initial_payment)) {
      errors.push('الدفعة الأولية غير صحيحة');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * التحقق من بيانات الفاتورة
   */
  static validateInvoice(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.subscription_id) {
      errors.push('معرف الاشتراك مطلوب');
    }
    
    if (!ValidationUtils.isNotEmpty(data.invoice_number)) {
      errors.push('رقم الفاتورة مطلوب');
    }
    
    if (!ValidationUtils.isValidAmount(data.subtotal)) {
      errors.push('المبلغ قبل الضريبة غير صحيح');
    }
    
    if (!ValidationUtils.isValidVATPercentage(data.vat_percentage)) {
      errors.push('نسبة الضريبة غير صحيحة');
    }
    
    if (!ValidationUtils.isValidAmount(data.vat_amount)) {
      errors.push('مبلغ الضريبة غير صحيح');
    }
    
    if (!ValidationUtils.isValidAmount(data.amount)) {
      errors.push('المبلغ الإجمالي غير صحيح');
    }
    
    if (!['paid', 'unpaid', 'cancelled'].includes(data.status)) {
      errors.push('حالة الفاتورة غير صحيحة');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * التحقق من بيانات الدفعة
   */
  static validatePayment(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.subscription_id) {
      errors.push('معرف الاشتراك مطلوب');
    }
    
    if (!ValidationUtils.isValidAmount(data.amount)) {
      errors.push('المبلغ غير صحيح');
    }
    
    if (data.amount <= 0) {
      errors.push('المبلغ يجب أن يكون أكبر من صفر');
    }
    
    if (!ValidationUtils.isValidDate(data.payment_date)) {
      errors.push('تاريخ الدفعة غير صحيح');
    }
    
    if (!data.payment_method) {
      errors.push('طريقة الدفع مطلوبة');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * التحقق من بيانات الاسترداد
   */
  static validateRefund(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.subscription_id) {
      errors.push('معرف الاشتراك مطلوب');
    }
    
    if (!ValidationUtils.isValidAmount(data.original_amount)) {
      errors.push('المبلغ الأصلي غير صحيح');
    }
    
    if (!ValidationUtils.isValidAmount(data.refund_amount)) {
      errors.push('مبلغ الاسترداد غير صحيح');
    }
    
    if (data.refund_amount > data.original_amount) {
      errors.push('مبلغ الاسترداد لا يمكن أن يتجاوز المبلغ الأصلي');
    }
    
    if (!ValidationUtils.isNotEmpty(data.refund_reason)) {
      errors.push('سبب الاسترداد مطلوب');
    }
    
    if (!data.refund_method) {
      errors.push('طريقة الاسترداد مطلوبة');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

