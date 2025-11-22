/**
 * Financial Service - نظام مالي متكامل للتعامل مع الاشتراكات والفواتير والمدفوعات
 * يضمن دقة العمليات الحسابية والربط الصحيح بين الكيانات المختلفة
 */

import { 
  Timestamp,
  FieldValue
} from 'firebase-admin/firestore';
import { adminDb } from '../firebase-admin';
import { Subscription, Invoice, Payment, Plan } from '../../types/models';
import { SubscriptionAdminService } from './subscription-admin.service';
import { InvoiceAdminService } from './invoice-admin.service';
import { PaymentAdminService } from './payment-admin.service';

export interface DiscountCalculation {
  base_price: number;
  discount_type: 'amount' | 'percentage';
  discount_amount: number;
  discount_value: number; // المبلغ الفعلي للخصم
  total_amount: number; // السعر النهائي بعد الخصم
}

export interface VATCalculation {
  subtotal: number;            // المبلغ قبل الضريبة
  vat_percentage: number;      // نسبة الضريبة
  vat_amount: number;          // مبلغ الضريبة
  total_with_vat: number;      // الإجمالي شامل الضريبة
}

export interface PaymentAllocation {
  subscription_id: string;
  invoice_id?: string;
  amount: number;
  allocated_to_invoices: Array<{
    invoice_id: string;
    amount: number;
  }>;
}

export class FinancialService {
  
  /**
   * حساب ضريبة القيمة المضافة (VAT)
   */
  static calculateVAT(
    subtotal: number,
    vatPercentage: number = 15
  ): VATCalculation {
    // التحقق من صحة المدخلات
    if (subtotal < 0) {
      throw new Error('Subtotal cannot be negative');
    }
    if (vatPercentage < 0 || vatPercentage > 100) {
      throw new Error('VAT percentage must be between 0 and 100');
    }
    
    const vatAmount = Math.round((subtotal * vatPercentage / 100) * 100) / 100;
    const totalWithVat = subtotal + vatAmount;
    
    return {
      subtotal,
      vat_percentage: vatPercentage,
      vat_amount: vatAmount,
      total_with_vat: totalWithVat
    };
  }
  
  /**
   * حساب الخصومات بدقة
   */
  static calculateDiscount(
    basePrice: number,
    discountType: 'amount' | 'percentage',
    discountAmount: number
  ): DiscountCalculation {
    // التحقق من صحة المدخلات
    if (basePrice < 0) {
      throw new Error('Base price cannot be negative');
    }
    if (discountAmount < 0) {
      throw new Error('Discount amount cannot be negative');
    }

    let discountValue = 0;
    let totalAmount = basePrice;

    if (discountType === 'percentage') {
      // التحقق من أن النسبة لا تتجاوز 100%
      if (discountAmount > 100) {
        throw new Error('Discount percentage cannot exceed 100%');
      }
      
      // حساب قيمة الخصم
      discountValue = (basePrice * discountAmount) / 100;
      totalAmount = basePrice - discountValue;
    } else if (discountType === 'amount') {
      // التحقق من أن الخصم لا يتجاوز السعر الأساسي
      if (discountAmount > basePrice) {
        throw new Error('Discount amount cannot exceed base price');
      }
      
      discountValue = discountAmount;
      totalAmount = basePrice - discountAmount;
    }

    // تقريب إلى منزلتين عشريتين
    discountValue = Math.round(discountValue * 100) / 100;
    totalAmount = Math.round(totalAmount * 100) / 100;

    return {
      base_price: basePrice,
      discount_type: discountType,
      discount_amount: discountAmount,
      discount_value: discountValue,
      total_amount: totalAmount
    };
  }

  /**
   * إنشاء اشتراك مع فاتورة تلقائياً (مع دعم VAT)
   */
  static async createSubscriptionWithInvoice(data: {
    advertiser_id: string;
    plan_id: string;
    start_date: Date;
    discount_type?: 'amount' | 'percentage';
    discount_amount?: number;
    initial_payment?: number;
    payment_method?: string;
    notes?: string;
    vat_percentage?: number;
    user_id?: string;
    ip_address?: string;
  }): Promise<{
    subscription_id: string;
    invoice_id: string;
    payment_id?: string;
  }> {
    // 1. جلب معلومات الخطة
    const planDoc = await adminDb.collection('plans').doc(data.plan_id).get();
    if (!planDoc.exists) {
      throw new Error('Plan not found');
    }
    const plan = { id: planDoc.id, ...planDoc.data() } as Plan;

    // 2. حساب تاريخ النهاية
    const startDate = new Date(data.start_date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.duration_days);

    // 3. حساب الخصومات
    const discount = this.calculateDiscount(
      plan.price,
      data.discount_type || 'amount',
      data.discount_amount || 0
    );

    // 4. حساب VAT على المبلغ بعد الخصم
    const vatPercentage = data.vat_percentage || 15;
    const vat = this.calculateVAT(discount.total_amount, vatPercentage);
    
    // 5. حساب المبالغ النهائية
    const totalWithVAT = vat.total_with_vat;
    const initialPayment = data.initial_payment || 0;
    const paidAmount = initialPayment;
    const remainingAmount = totalWithVAT - paidAmount;

    // تحديد حالة الدفع
    let paymentStatus: 'paid' | 'partial' | 'pending' = 'pending';
    if (paidAmount >= totalWithVAT) {
      paymentStatus = 'paid';
    } else if (paidAmount > 0) {
      paymentStatus = 'partial';
    }

    // 6. إنشاء الاشتراك
    const subscriptionData: Omit<Subscription, 'id' | 'created_at'> = {
      advertiser_id: data.advertiser_id,
      plan_id: data.plan_id,
      start_date: startDate,
      end_date: endDate,
      base_price: plan.price,
      discount_type: discount.discount_type,
      discount_amount: discount.discount_amount,
      total_amount: totalWithVAT, // المبلغ شامل الضريبة
      paid_amount: paidAmount,
      remaining_amount: remainingAmount,
      status: 'active',
      payment_status: paymentStatus
    };

    const subscriptionId = await SubscriptionAdminService.create(subscriptionData);

    // 7. إنشاء الفاتورة مع VAT
    const invoiceNumber = await this.generateInvoiceNumber();
    const invoiceData: Omit<Invoice, 'id' | 'created_at'> = {
      subscription_id: subscriptionId,
      invoice_number: invoiceNumber,
      
      // حقول VAT
      subtotal: vat.subtotal,
      vat_percentage: vat.vat_percentage,
      vat_amount: vat.vat_amount,
      amount: vat.total_with_vat,
      
      status: paymentStatus === 'paid' ? 'paid' : 'unpaid',
      issued_date: startDate,
      due_date: endDate,
      paid_date: paymentStatus === 'paid' ? new Date() : undefined
    };

    const invoiceId = await InvoiceAdminService.create(
      invoiceData,
      data.user_id || 'system',
      data.ip_address
    );

    // 8. إنشاء سجل الدفعة إذا كان هناك دفعة أولية
    let paymentId: string | undefined;
    if (initialPayment > 0) {
      const paymentData: Omit<Payment, 'id' | 'created_at'> = {
        subscription_id: subscriptionId,
        invoice_id: invoiceId,
        amount: initialPayment,
        payment_date: new Date(),
        payment_method: data.payment_method || 'cash',
        notes: data.notes || 'دفعة أولية'
      };

      paymentId = await PaymentAdminService.create(paymentData);
    }

    return {
      subscription_id: subscriptionId,
      invoice_id: invoiceId,
      payment_id: paymentId
    };
  }

  /**
   * تسجيل دفعة وتحديث الاشتراك والفاتورة تلقائياً
   */
  static async recordPayment(data: {
    subscription_id: string;
    invoice_id?: string;
    amount: number;
    payment_date: Date;
    payment_method?: string;
    transaction_id?: string;
    notes?: string;
  }): Promise<string> {
    // 1. التحقق من وجود الاشتراك
    const subscription = await SubscriptionAdminService.getById(data.subscription_id);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // 2. التحقق من المبلغ
    if (data.amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    if (data.amount > subscription.remaining_amount) {
      throw new Error(`Payment amount (${data.amount}) exceeds remaining amount (${subscription.remaining_amount})`);
    }

    // 3. حساب المبالغ الجديدة
    const newPaidAmount = subscription.paid_amount + data.amount;
    const newRemainingAmount = subscription.total_amount - newPaidAmount;

    // تحديد حالة الدفع الجديدة
    let newPaymentStatus: 'paid' | 'partial' | 'pending';
    if (newRemainingAmount <= 0.01) { // تقريب لتجنب مشاكل الفاصلة العشرية
      newPaymentStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newPaymentStatus = 'partial';
    } else {
      newPaymentStatus = 'pending';
    }

    // 4. تحديث الاشتراك
    await SubscriptionAdminService.update(data.subscription_id, {
      paid_amount: newPaidAmount,
      remaining_amount: Math.max(0, newRemainingAmount), // تأكد أن لا تكون سالبة
      payment_status: newPaymentStatus
    });

    // 5. تحديث الفاتورة إذا تم تحديدها
    if (data.invoice_id) {
      const invoice = await InvoiceAdminService.getById(data.invoice_id);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // حساب المدفوعات السابقة لهذه الفاتورة
      const invoicePayments = await PaymentAdminService.getByInvoiceId(data.invoice_id);
      const totalInvoicePayments = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
      const totalAfterThisPayment = totalInvoicePayments + data.amount;

      // تحديث حالة الفاتورة
      if (totalAfterThisPayment >= invoice.amount) {
        await InvoiceAdminService.updatePaymentStatus(data.invoice_id, 'paid', new Date());
      }
    } else {
      // إذا لم يتم تحديد فاتورة، نبحث عن الفاتورة المرتبطة بالاشتراك
      const invoices = await InvoiceAdminService.getBySubscriptionId(data.subscription_id);
      if (invoices.length > 0) {
        const unpaidInvoice = invoices.find(inv => inv.status === 'unpaid');
        if (unpaidInvoice && unpaidInvoice.id) {
          data.invoice_id = unpaidInvoice.id;
          
          // حساب المدفوعات السابقة
          const invoicePayments = await PaymentAdminService.getByInvoiceId(unpaidInvoice.id);
          const totalInvoicePayments = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
          const totalAfterThisPayment = totalInvoicePayments + data.amount;

          if (totalAfterThisPayment >= unpaidInvoice.amount) {
            await InvoiceAdminService.updatePaymentStatus(unpaidInvoice.id, 'paid', new Date());
          }
        }
      }
    }

    // 6. إنشاء سجل الدفعة
    const paymentData: Omit<Payment, 'id' | 'created_at'> = {
      subscription_id: data.subscription_id,
      invoice_id: data.invoice_id,
      amount: data.amount,
      payment_date: data.payment_date,
      payment_method: data.payment_method || 'cash',
      transaction_id: data.transaction_id,
      notes: data.notes
    };

    const paymentId = await PaymentAdminService.create(paymentData);

    return paymentId;
  }

  /**
   * التحقق من صلاحية الاشتراكات وتحديث الحالات
   */
  static async checkAndUpdateSubscriptionStatuses(): Promise<{
    updated: number;
    expired_subscriptions: string[];
  }> {
    const now = new Date();
    const activeSubscriptions = await SubscriptionAdminService.getActiveSubscriptions();
    
    const expiredSubscriptions: string[] = [];
    let updatedCount = 0;

    for (const subscription of activeSubscriptions) {
      const endDate = new Date(subscription.end_date);
      
      // إذا انتهى تاريخ الاشتراك
      if (endDate < now && subscription.id) {
        await SubscriptionAdminService.update(subscription.id, {
          status: 'expired'
        });
        expiredSubscriptions.push(subscription.id);
        updatedCount++;
      }
    }

    return {
      updated: updatedCount,
      expired_subscriptions: expiredSubscriptions
    };
  }

  /**
   * الحصول على ملخص مالي للمعلن
   */
  static async getAdvertiserFinancialSummary(advertiserId: string): Promise<{
    total_subscriptions: number;
    active_subscriptions: number;
    expired_subscriptions: number;
    total_spent: number;
    total_pending: number;
    total_paid: number;
    payment_history: Payment[];
    unpaid_invoices: Invoice[];
  }> {
    // 1. جلب جميع الاشتراكات
    const subscriptions = await SubscriptionAdminService.getByAdvertiserId(advertiserId);
    
    // 2. حساب الإحصائيات
    const activeCount = subscriptions.filter(s => s.status === 'active').length;
    const expiredCount = subscriptions.filter(s => s.status === 'expired').length;
    
    const totalSpent = subscriptions.reduce((sum, s) => sum + s.total_amount, 0);
    const totalPaid = subscriptions.reduce((sum, s) => sum + s.paid_amount, 0);
    const totalPending = subscriptions.reduce((sum, s) => sum + s.remaining_amount, 0);

    // 3. جلب سجل المدفوعات
    let allPayments: Payment[] = [];
    for (const sub of subscriptions) {
      if (sub.id) {
        const payments = await PaymentAdminService.getBySubscriptionId(sub.id);
        allPayments = allPayments.concat(payments);
      }
    }

    // ترتيب المدفوعات حسب التاريخ
    allPayments.sort((a, b) => {
      const dateA = new Date(a.payment_date).getTime();
      const dateB = new Date(b.payment_date).getTime();
      return dateB - dateA;
    });

    // 4. جلب الفواتير غير المدفوعة
    let unpaidInvoices: Invoice[] = [];
    for (const sub of subscriptions) {
      if (sub.id) {
        const invoices = await InvoiceAdminService.getBySubscriptionId(sub.id);
        const unpaid = invoices.filter(inv => inv.status === 'unpaid');
        unpaidInvoices = unpaidInvoices.concat(unpaid);
      }
    }

    return {
      total_subscriptions: subscriptions.length,
      active_subscriptions: activeCount,
      expired_subscriptions: expiredCount,
      total_spent: Math.round(totalSpent * 100) / 100,
      total_pending: Math.round(totalPending * 100) / 100,
      total_paid: Math.round(totalPaid * 100) / 100,
      payment_history: allPayments,
      unpaid_invoices: unpaidInvoices
    };
  }

  /**
   * توليد رقم فاتورة فريد
   */
  private static async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}${day}-${randomNum}`;
  }

  /**
   * التحقق من إمكانية تطبيق خصم على اشتراك
   */
  static validateDiscount(
    basePrice: number,
    discountType: 'amount' | 'percentage',
    discountAmount: number
  ): { valid: boolean; error?: string } {
    try {
      this.calculateDiscount(basePrice, discountType, discountAmount);
      return { valid: true };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * إلغاء اشتراك ومعالجة الأموال
   */
  static async cancelSubscription(
    subscriptionId: string,
    reason?: string
  ): Promise<{
    refund_amount: number;
    message: string;
  }> {
    const subscription = await SubscriptionAdminService.getById(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.status === 'cancelled') {
      throw new Error('Subscription is already cancelled');
    }

    // حساب مبلغ الاسترداد (المبلغ المدفوع غير المستخدم)
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

    // تحديث الفواتير المرتبطة
    const invoices = await InvoiceAdminService.getBySubscriptionId(subscriptionId);
    for (const invoice of invoices) {
      if (invoice.status === 'unpaid' && invoice.id) {
        await InvoiceAdminService.update(invoice.id, {
          status: 'cancelled'
        });
      }
    }

    return {
      refund_amount: refundAmount,
      message: `Subscription cancelled. Refund amount: ${refundAmount} SAR for ${Math.round(remainingDays)} remaining days.`
    };
  }
}

