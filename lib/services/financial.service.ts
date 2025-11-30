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
import { getSaudiNow, addDays, toSaudiTime } from '../utils/date';

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
   * 🆕 تحديث coverage_type للمعلن بناءً على اشتراكاته النشطة
   * يتم استدعاء هذه الدالة تلقائياً بعد إنشاء أو تعديل أي اشتراك
   */
  static async updateAdvertiserCoverageFromSubscriptions(advertiserId: string): Promise<{
    updated: boolean;
    new_coverage_type: 'kingdom' | 'city' | 'both' | null;
    coverage_cities: string[];
  }> {
    console.log(`🔄 تحديث coverage_type للمعلن ${advertiserId}...`);
    
    // 1. جلب جميع الاشتراكات النشطة للمعلن
    const subscriptions = await SubscriptionAdminService.getByAdvertiserId(advertiserId);
    
    // 2. فلترة الاشتراكات النشطة فقط (active فقط!)
    // ❌ لا نحسب: paused, stopped, expired, cancelled, pending_payment
    // ✅ فقط active = الاشتراك الذي يجب أن يظهر فيه المعلن
    const activeSubscriptions = subscriptions.filter(sub => 
      sub.status === 'active'
    );
    
    if (activeSubscriptions.length === 0) {
      console.log(`   ℹ️ لا يوجد اشتراكات نشطة للمعلن`);
      return { updated: false, new_coverage_type: null, coverage_cities: [] };
    }
    
    // 3. تحديد نوع التغطية بناءً على الاشتراكات
    let hasKingdomSubscription = false;
    let hasCitySubscription = false;
    const coverageCities: string[] = [];
    
    for (const sub of activeSubscriptions) {
      // جلب معلومات الباقة لمعرفة نوع التغطية
      const planDoc = await adminDb.collection('plans').doc(sub.plan_id).get();
      if (!planDoc.exists) continue;
      
      const plan = planDoc.data() as any;
      
      // التحقق من نوع التغطية من الاشتراك أو الباقة
      const coverageArea = sub.coverage_area || plan.plan_type;
      
      if (coverageArea === 'kingdom') {
        hasKingdomSubscription = true;
        console.log(`   ✅ اشتراك مملكة: ${sub.id}`);
      } else if (coverageArea === 'city') {
        hasCitySubscription = true;
        const city = sub.city || plan.city;
        if (city && !coverageCities.includes(city)) {
          coverageCities.push(city);
          console.log(`   ✅ اشتراك مدينة (${city}): ${sub.id}`);
        }
      }
    }
    
    // 4. تحديد نوع التغطية النهائي
    let newCoverageType: 'kingdom' | 'city' | 'both';
    
    if (hasKingdomSubscription && hasCitySubscription) {
      newCoverageType = 'both';
    } else if (hasKingdomSubscription) {
      newCoverageType = 'kingdom';
    } else {
      newCoverageType = 'city';
    }
    
    // 5. تحديث المعلن
    const updateData: any = {
      coverage_type: newCoverageType,
      updated_at: FieldValue.serverTimestamp()
    };
    
    if (coverageCities.length > 0) {
      updateData.coverage_cities = coverageCities;
    }
    
    await adminDb.collection('advertisers').doc(advertiserId).update(updateData);
    
    console.log(`   ✅ تم تحديث coverage_type إلى: ${newCoverageType}`);
    if (coverageCities.length > 0) {
      console.log(`   ✅ المدن المغطاة: ${coverageCities.join(', ')}`);
    }
    
    return {
      updated: true,
      new_coverage_type: newCoverageType,
      coverage_cities: coverageCities
    };
  }
  
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
   * إنشاء اشتراك مع فاتورة تلقائياً (مع دعم VAT والتغطية الجغرافية)
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
    
    // 🆕 التغطية الجغرافية
    coverage_area?: 'kingdom' | 'city';
    city?: string;
  }): Promise<{
    subscription_id: string;
    invoice_id: string;
    payment_id?: string;
  }> {
    // 1. جلب معلومات المعلن للتحقق من إعدادات VAT
    const advertiserDoc = await adminDb.collection('advertisers').doc(data.advertiser_id).get();
    if (!advertiserDoc.exists) {
      throw new Error('Advertiser not found');
    }
    const advertiser = { id: advertiserDoc.id, ...advertiserDoc.data() } as any;
    const includeVAT = advertiser.include_vat || false;
    
    // 2. جلب معلومات الخطة
    const planDoc = await adminDb.collection('plans').doc(data.plan_id).get();
    if (!planDoc.exists) {
      throw new Error('Plan not found');
    }
    const plan = { id: planDoc.id, ...planDoc.data() } as Plan;

    // 3. حساب تاريخ النهاية (بالتوقيت السعودي)
    const startDate = toSaudiTime(data.start_date);
    const endDate = addDays(startDate, plan.duration_days);

    // 4. حساب الخصومات
    const discount = this.calculateDiscount(
      plan.price,
      data.discount_type || 'amount',
      data.discount_amount || 0
    );

    // 5. حساب VAT على المبلغ بعد الخصم (فقط إذا كان المعلن يطلبه)
    let totalFinal = discount.total_amount;
    let vatAmount = 0;
    let vatPercentage = 0;
    
    if (includeVAT) {
      vatPercentage = data.vat_percentage || advertiser.vat_percentage || 15;
      const vat = this.calculateVAT(discount.total_amount, vatPercentage);
      totalFinal = vat.total_with_vat;
      vatAmount = vat.vat_amount;
    }
    
    // 6. حساب المبالغ النهائية
    const initialPayment = data.initial_payment || 0;
    const paidAmount = initialPayment;
    const remainingAmount = totalFinal - paidAmount;

    // تحديد حالة الدفع
    let paymentStatus: 'paid' | 'partial' | 'pending' = 'pending';
    if (paidAmount >= totalFinal) {
      paymentStatus = 'paid';
    } else if (paidAmount > 0) {
      paymentStatus = 'partial';
    }

    // 🆕 تحديد حالة الاشتراك حسب نظام "الدفع عند التوصيل"
    // ✅ إذا دفع ريال واحد على الأقل → يبدأ الاشتراك فوراً (active)
    // ⏳ إذا لم يدفع شيئاً → ينتظر أول دفعة (pending_payment)
    let subscriptionStatus: 'active' | 'pending_payment' = 'pending_payment';
    if (paidAmount >= 1) {
      subscriptionStatus = 'active';
    }

    // 7. إنشاء الاشتراك
    const subscriptionData: Omit<Subscription, 'id' | 'created_at'> = {
      advertiser_id: data.advertiser_id,
      plan_id: data.plan_id,
      start_date: startDate,
      end_date: endDate,
      base_price: plan.price,
      discount_type: discount.discount_type,
      discount_amount: discount.discount_amount,
      total_amount: totalFinal, // المبلغ النهائي (مع أو بدون ضريبة)
      paid_amount: paidAmount,
      remaining_amount: remainingAmount,
      status: subscriptionStatus, // 🆕 حالة ديناميكية حسب الدفع
      payment_status: paymentStatus,
      
      // 🆕 التغطية الجغرافية للاشتراك
      coverage_area: data.coverage_area,
      city: data.city
    };

    const subscriptionId = await SubscriptionAdminService.create(subscriptionData);

    // 8. إنشاء الفاتورة (مع أو بدون VAT حسب إعدادات المعلن)
    const invoiceNumber = await this.generateInvoiceNumber();
    const invoiceData: Omit<Invoice, 'id' | 'created_at'> = {
      subscription_id: subscriptionId,
      invoice_number: invoiceNumber,
      
      // حقول VAT (إذا كان المعلن يطلبها)
      subtotal: includeVAT ? discount.total_amount : totalFinal,
      vat_percentage: includeVAT ? vatPercentage : 0,
      vat_amount: includeVAT ? vatAmount : 0,
      amount: totalFinal,
      
      status: paymentStatus === 'paid' ? 'paid' : 'unpaid',
      issued_date: startDate,
      due_date: endDate,
      paid_date: paymentStatus === 'paid' ? getSaudiNow() : undefined
    };

    const invoiceId = await InvoiceAdminService.create(
      invoiceData,
      data.user_id || 'system',
      data.ip_address
    );

    // 9. إنشاء سجل الدفعة إذا كان هناك دفعة أولية
    let paymentId: string | undefined;
    if (initialPayment > 0) {
      const paymentData: Omit<Payment, 'id' | 'created_at'> = {
        subscription_id: subscriptionId,
        invoice_id: invoiceId,
        amount: initialPayment,
        payment_date: getSaudiNow(),
        payment_method: data.payment_method || 'cash',
        notes: data.notes || 'دفعة أولية'
      };

      paymentId = await PaymentAdminService.create(paymentData);
    }

    // 🆕 تحديث coverage_type للمعلن بناءً على الاشتراكات النشطة
    try {
      const coverageUpdate = await this.updateAdvertiserCoverageFromSubscriptions(data.advertiser_id);
      console.log(`📊 تم تحديث تغطية المعلن: ${coverageUpdate.new_coverage_type}`);
    } catch (coverageError) {
      // نسجل الخطأ لكن لا نوقف العملية
      console.error('⚠️ خطأ في تحديث coverage_type للمعلن:', coverageError);
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
    const oldPaidAmount = subscription.paid_amount || 0;
    const newPaidAmount = oldPaidAmount + data.amount;
    const newRemainingAmount = subscription.total_amount - newPaidAmount;

    console.log(`💰 حساب الدفعة الجديدة للاشتراك ${data.subscription_id}:`);
    console.log(`   - المبلغ الكلي: ${subscription.total_amount} ريال`);
    console.log(`   - المدفوع السابق: ${oldPaidAmount} ريال`);
    console.log(`   - الدفعة الجديدة: ${data.amount} ريال`);
    console.log(`   - المدفوع الإجمالي: ${newPaidAmount} ريال`);
    console.log(`   - المتبقي: ${Math.max(0, newRemainingAmount)} ريال`);

    // تحديد حالة الدفع الجديدة
    let newPaymentStatus: 'paid' | 'partial' | 'pending';
    if (newRemainingAmount <= 0.01) { // تقريب لتجنب مشاكل الفاصلة العشرية
      newPaymentStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newPaymentStatus = 'partial';
    } else {
      newPaymentStatus = 'pending';
    }

    console.log(`   - حالة الدفع الجديدة: ${newPaymentStatus}`);

    // 4. تحديث الاشتراك
    await SubscriptionAdminService.update(data.subscription_id, {
      paid_amount: newPaidAmount,
      remaining_amount: Math.max(0, newRemainingAmount), // تأكد أن لا تكون سالبة
      payment_status: newPaymentStatus
    });

    console.log(`✅ تم تحديث الاشتراك ${data.subscription_id} بنجاح`);

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

      console.log(`📄 تحديث الفاتورة ${data.invoice_id}:`);
      console.log(`   - مبلغ الفاتورة: ${invoice.amount} ريال`);
      console.log(`   - المدفوع السابق: ${totalInvoicePayments} ريال`);
      console.log(`   - الدفعة الجديدة: ${data.amount} ريال`);
      console.log(`   - المدفوع الإجمالي: ${totalAfterThisPayment} ريال`);

      // تحديث حالة الفاتورة
      if (totalAfterThisPayment >= invoice.amount) {
        await InvoiceAdminService.updatePaymentStatus(data.invoice_id, 'paid', getSaudiNow(), totalAfterThisPayment);
        console.log(`   - الحالة الجديدة: مدفوعة ✅`);
      } else if (totalAfterThisPayment > 0) {
        // 🆕 تحديث الحالة إلى "مدفوعة جزئياً" مع المبلغ المدفوع
        await InvoiceAdminService.updatePaymentStatus(data.invoice_id, 'partial', undefined, totalAfterThisPayment);
        console.log(`   - الحالة الجديدة: مدفوعة جزئياً (${totalAfterThisPayment} من ${invoice.amount}) 📝`);
      }
    } else {
      // إذا لم يتم تحديد فاتورة، نبحث عن الفاتورة المرتبطة بالاشتراك
      const invoices = await InvoiceAdminService.getBySubscriptionId(data.subscription_id);
      if (invoices.length > 0) {
        // البحث عن فاتورة غير مدفوعة أو مدفوعة جزئياً
        const targetInvoice = invoices.find(inv => inv.status === 'unpaid' || inv.status === 'partial');
        if (targetInvoice && targetInvoice.id) {
          data.invoice_id = targetInvoice.id;
          
          // حساب المدفوعات السابقة
          const invoicePayments = await PaymentAdminService.getByInvoiceId(targetInvoice.id);
          const totalInvoicePayments = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
          const totalAfterThisPayment = totalInvoicePayments + data.amount;

          console.log(`📄 تحديث الفاتورة المرتبطة ${targetInvoice.id}:`);
          console.log(`   - مبلغ الفاتورة: ${targetInvoice.amount} ريال`);
          console.log(`   - المدفوع الإجمالي: ${totalAfterThisPayment} ريال`);

          if (totalAfterThisPayment >= targetInvoice.amount) {
            await InvoiceAdminService.updatePaymentStatus(targetInvoice.id, 'paid', getSaudiNow(), totalAfterThisPayment);
            console.log(`   - الحالة الجديدة: مدفوعة ✅`);
          } else if (totalAfterThisPayment > 0) {
            // 🆕 تحديث الحالة إلى "مدفوعة جزئياً"
            await InvoiceAdminService.updatePaymentStatus(targetInvoice.id, 'partial', undefined, totalAfterThisPayment);
            console.log(`   - الحالة الجديدة: مدفوعة جزئياً 📝`);
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
   * ⚠️ تحديث: يأخذ في الاعتبار الاشتراكات المتوقفة مؤقتاً
   * ⚠️ تحديث جديد: يطبق فترة السماح التلقائية حسب نوع العميل فقط عند عدم وجود دفعات
   */
  static async checkAndUpdateSubscriptionStatuses(): Promise<{
    updated: number;
    expired_subscriptions: string[];
    grace_period_activated: string[];
  }> {
    const now = getSaudiNow();
    const activeSubscriptions = await SubscriptionAdminService.getActiveSubscriptions();
    
    const expiredSubscriptions: string[] = [];
    const gracePeriodActivated: string[] = [];
    let updatedCount = 0;

    for (const subscription of activeSubscriptions) {
      // ⚠️ تجاهل الاشتراكات المتوقفة مؤقتاً أو المتوقفة كلياً
      // لأنها لا تحسب الأيام ولا تنتهي تلقائياً
      if (subscription.status === 'paused' || subscription.status === 'stopped') {
        continue;
      }
      
      const endDate = toSaudiTime(subscription.end_date);
      
      // إذا انتهى تاريخ الاشتراك (فقط للاشتراكات النشطة)
      if (endDate < now && subscription.id && subscription.status === 'active') {
        const paidAmount = subscription.paid_amount || 0;
        
        // ✅ إذا تم دفع أي مبلغ: الإعلان يتوقف بدون فترة سماح
        if (paidAmount > 0) {
          await SubscriptionAdminService.update(subscription.id, {
            status: 'expired',
            actual_end_date: now
          });
          expiredSubscriptions.push(subscription.id);
          updatedCount++;
          
          console.log(`✅ اشتراك ${subscription.id} انتهى بدون فترة سماح (تم دفع ${paidAmount} ريال)`);
        } 
        // ✅ إذا لم يتم دفع أي مبلغ: تطبيق فترة سماح تلقائية حسب نوع العميل
        else {
          // الحصول على معلومات المعلن لمعرفة نوع العميل
          const advertiserDoc = await adminDb.collection('advertisers').doc(subscription.advertiser_id).get();
          const advertiser = advertiserDoc.data();
          
          // تحديد عدد أيام السماح حسب نوع العميل
          let graceDays = 3; // افتراضي للعملاء الجدد
          
          if (advertiser?.customer_type === 'vip') {
            graceDays = 14; // VIP: 14 يوم
          } else if (advertiser?.customer_type === 'trusted') {
            graceDays = 7; // موثوق: 7 أيام
          } else if (advertiser?.customer_type === 'new') {
            graceDays = 3; // جديد: 3 أيام
          } else {
            graceDays = 3; // افتراضي: 3 أيام
          }
          
          const gracePeriodEndDate = addDays(now, graceDays);
          
          // تفعيل فترة السماح التلقائية
          await SubscriptionAdminService.update(subscription.id, {
            is_in_grace_period: true,
            grace_period_days: graceDays,
            grace_period_end_date: gracePeriodEndDate,
            grace_period_started_at: now,
            updated_at: now
          });
          
          gracePeriodActivated.push(subscription.id);
          updatedCount++;
          
          const customerTypeAr = advertiser?.customer_type === 'vip' ? 'VIP' : 
                                 advertiser?.customer_type === 'trusted' ? 'موثوق' : 
                                 advertiser?.customer_type === 'new' ? 'جديد' : 'عادي';
          
          console.log(`✅ اشتراك ${subscription.id} دخل فترة سماح (${graceDays} يوم) - نوع العميل: ${customerTypeAr}`);
        }
      }
    }

    return {
      updated: updatedCount,
      expired_subscriptions: expiredSubscriptions,
      grace_period_activated: gracePeriodActivated
    };
  }

  /**
   * الحصول على ملخص مالي للمعلن
   */
  static async getAdvertiserFinancialSummary(advertiserId: string): Promise<{
    total_subscriptions: number;
    active_subscriptions: number;
    expired_subscriptions: number;
    total_revenue: number;
    total_spent: number;
    total_pending: number;
    total_paid: number;
    total_invoices: number;
    paid_invoices: number;
    unpaid_invoices: number;
    payment_history: Payment[];
    unpaid_invoices_list: Invoice[];
  }> {
    // 1. جلب جميع الاشتراكات
    const subscriptions = await SubscriptionAdminService.getByAdvertiserId(advertiserId);
    
    // 2. حساب الإحصائيات
    const activeCount = subscriptions.filter(s => s.status === 'active').length;
    const expiredCount = subscriptions.filter(s => s.status === 'expired').length;
    
    const totalSpent = subscriptions.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const totalPaid = subscriptions.reduce((sum, s) => sum + (s.paid_amount || 0), 0);
    const totalPending = subscriptions.reduce((sum, s) => sum + (s.remaining_amount || 0), 0);

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

    // 4. جلب جميع الفواتير
    let allInvoices: Invoice[] = [];
    let unpaidInvoicesList: Invoice[] = [];
    for (const sub of subscriptions) {
      if (sub.id) {
        const invoices = await InvoiceAdminService.getBySubscriptionId(sub.id);
        allInvoices = allInvoices.concat(invoices);
        const unpaid = invoices.filter(inv => inv.status === 'unpaid');
        unpaidInvoicesList = unpaidInvoicesList.concat(unpaid);
      }
    }

    // 5. حساب إحصائيات الفواتير
    const paidInvoicesCount = allInvoices.filter(inv => inv.status === 'paid').length;
    const unpaidInvoicesCount = allInvoices.filter(inv => inv.status !== 'paid').length;

    return {
      total_subscriptions: subscriptions.length,
      active_subscriptions: activeCount,
      expired_subscriptions: expiredCount,
      total_revenue: Math.round(totalSpent * 100) / 100, // إجمالي الإيرادات (مجموع قيمة الاشتراكات)
      total_spent: Math.round(totalSpent * 100) / 100, // للتوافق مع الكود القديم
      total_pending: Math.round(totalPending * 100) / 100,
      total_paid: Math.round(totalPaid * 100) / 100,
      total_invoices: allInvoices.length,
      paid_invoices: paidInvoicesCount,
      unpaid_invoices: unpaidInvoicesCount,
      payment_history: allPayments,
      unpaid_invoices_list: unpaidInvoicesList
    };
  }

  /**
   * توليد رقم فاتورة فريد
   */
  private static async generateInvoiceNumber(): Promise<string> {
    const now = getSaudiNow();
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
    const now = getSaudiNow();
    const startDate = toSaudiTime(subscription.start_date);
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

