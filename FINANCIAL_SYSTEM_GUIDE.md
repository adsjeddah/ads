# 📊 دليل النظام المالي المتكامل

## نظرة عامة

تم إنشاء نظام مالي متكامل ودقيق للتعامل مع الاشتراكات والفواتير والمدفوعات بدقة كاملة.

---

## 🎯 المميزات الرئيسية

### ✅ ما تم إصلاحه:
1. ✅ **ربط تلقائي** بين الاشتراك والفاتورة عند الإنشاء
2. ✅ **تحديث تلقائي** لحالة الاشتراك عند كل دفعة
3. ✅ **تحديث تلقائي** لحالة الفاتورة عند الدفع الكامل
4. ✅ **حساب دقيق** للخصومات (نسبة أو مبلغ)
5. ✅ **التحقق التلقائي** من صلاحية الاشتراكات
6. ✅ **سجل كامل** للمدفوعات مع ربط بالفواتير
7. ✅ **حساب مبالغ الاسترداد** عند الإلغاء
8. ✅ **ملخص مالي شامل** لكل معلن

---

## 📋 الكيانات الأساسية

### 1. Subscription (الاشتراك)
```typescript
{
  advertiser_id: string;      // معرف المعلن
  plan_id: string;            // معرف الخطة
  start_date: Date;           // تاريخ البداية
  end_date: Date;             // تاريخ النهاية (محسوب تلقائياً)
  base_price: number;         // السعر الأساسي
  discount_type: 'amount' | 'percentage';
  discount_amount: number;    // قيمة الخصم
  total_amount: number;       // المبلغ الإجمالي بعد الخصم
  paid_amount: number;        // المبلغ المدفوع
  remaining_amount: number;   // المبلغ المتبقي
  status: 'active' | 'expired' | 'cancelled';
  payment_status: 'paid' | 'partial' | 'pending';
}
```

### 2. Invoice (الفاتورة)
```typescript
{
  subscription_id: string;    // معرف الاشتراك
  invoice_number: string;     // رقم الفاتورة (فريد)
  amount: number;             // المبلغ
  status: 'paid' | 'unpaid' | 'cancelled';
  issued_date: Date;          // تاريخ الإصدار
  due_date: Date;             // تاريخ الاستحقاق
  paid_date?: Date;           // تاريخ الدفع (عند الدفع)
}
```

### 3. Payment (الدفعة)
```typescript
{
  subscription_id: string;    // معرف الاشتراك
  invoice_id?: string;        // معرف الفاتورة (اختياري)
  amount: number;             // المبلغ المدفوع
  payment_date: Date;         // تاريخ الدفع
  payment_method?: string;    // طريقة الدفع (cash, bank, etc)
  transaction_id?: string;    // معرف المعاملة المصرفية
  notes?: string;             // ملاحظات
}
```

---

## 🔧 FinancialService - الدوال المتاحة

### 1. حساب الخصومات
```typescript
FinancialService.calculateDiscount(
  basePrice: number,
  discountType: 'amount' | 'percentage',
  discountAmount: number
)
```

**مثال:**
```typescript
// خصم نسبة
const result = FinancialService.calculateDiscount(1000, 'percentage', 20);
// { base_price: 1000, discount_value: 200, total_amount: 800 }

// خصم مبلغ
const result = FinancialService.calculateDiscount(1000, 'amount', 150);
// { base_price: 1000, discount_value: 150, total_amount: 850 }
```

**التحققات:**
- ✅ السعر الأساسي لا يمكن أن يكون سالباً
- ✅ الخصم لا يمكن أن يكون سالباً
- ✅ النسبة لا تتجاوز 100%
- ✅ المبلغ لا يتجاوز السعر الأساسي

---

### 2. إنشاء اشتراك مع فاتورة
```typescript
FinancialService.createSubscriptionWithInvoice({
  advertiser_id: string;
  plan_id: string;
  start_date: Date;
  discount_type?: 'amount' | 'percentage';
  discount_amount?: number;
  initial_payment?: number;
  payment_method?: string;
  notes?: string;
})
```

**ما يحدث تلقائياً:**
1. جلب معلومات الخطة من قاعدة البيانات
2. حساب تاريخ النهاية (start_date + plan.duration_days)
3. حساب الخصومات بدقة
4. إنشاء الاشتراك
5. إنشاء فاتورة مرتبطة
6. تسجيل الدفعة الأولية (إن وجدت)
7. تحديث حالة الاشتراك والفاتورة

**مثال:**
```typescript
const result = await FinancialService.createSubscriptionWithInvoice({
  advertiser_id: 'adv_123',
  plan_id: 'plan_monthly',
  start_date: new Date('2024-01-01'),
  discount_type: 'percentage',
  discount_amount: 15,
  initial_payment: 500,
  payment_method: 'bank_transfer',
  notes: 'عرض خاص'
});

// Returns:
// {
//   subscription_id: 'sub_xxx',
//   invoice_id: 'inv_yyy',
//   payment_id: 'pay_zzz'
// }
```

---

### 3. تسجيل دفعة
```typescript
FinancialService.recordPayment({
  subscription_id: string;
  invoice_id?: string;
  amount: number;
  payment_date: Date;
  payment_method?: string;
  transaction_id?: string;
  notes?: string;
})
```

**ما يحدث تلقائياً:**
1. التحقق من وجود الاشتراك
2. التحقق من أن المبلغ لا يتجاوز المتبقي
3. تحديث `paid_amount` و `remaining_amount`
4. تحديث `payment_status` (pending/partial/paid)
5. تحديث حالة الفاتورة إلى `paid` عند اكتمال الدفع
6. تسجيل الدفعة في قاعدة البيانات

**مثال:**
```typescript
const paymentId = await FinancialService.recordPayment({
  subscription_id: 'sub_123',
  invoice_id: 'inv_456',
  amount: 300,
  payment_date: new Date(),
  payment_method: 'cash',
  transaction_id: 'TXN123456',
  notes: 'دفعة ثانية'
});
```

**التحققات:**
- ✅ المبلغ يجب أن يكون أكبر من صفر
- ✅ المبلغ لا يتجاوز المتبقي
- ✅ الاشتراك موجود وصالح

---

### 4. الحصول على ملخص مالي
```typescript
FinancialService.getAdvertiserFinancialSummary(advertiserId: string)
```

**يعرض:**
```typescript
{
  total_subscriptions: number;        // إجمالي الاشتراكات
  active_subscriptions: number;       // الاشتراكات النشطة
  expired_subscriptions: number;      // الاشتراكات المنتهية
  total_spent: number;                // إجمالي المبلغ
  total_paid: number;                 // المبلغ المدفوع
  total_pending: number;              // المبلغ المستحق
  payment_history: Payment[];         // سجل المدفوعات الكامل
  unpaid_invoices: Invoice[];         // الفواتير غير المدفوعة
}
```

**مثال:**
```typescript
const summary = await FinancialService.getAdvertiserFinancialSummary('adv_123');

console.log(`إجمالي المدفوع: ${summary.total_paid} ريال`);
console.log(`المتبقي: ${summary.total_pending} ريال`);
console.log(`عدد الفواتير غير المدفوعة: ${summary.unpaid_invoices.length}`);
```

---

### 5. التحقق من صلاحية الاشتراكات
```typescript
FinancialService.checkAndUpdateSubscriptionStatuses()
```

**الاستخدام:**
- يتحقق من جميع الاشتراكات النشطة
- يحدث الحالة إلى `expired` للاشتراكات المنتهية
- يُنصح بتشغيله يومياً عبر Cron Job

**مثال:**
```typescript
const result = await FinancialService.checkAndUpdateSubscriptionStatuses();

console.log(`تم تحديث ${result.updated} اشتراكات منتهية`);
console.log('الاشتراكات المنتهية:', result.expired_subscriptions);
```

---

### 6. إلغاء اشتراك
```typescript
FinancialService.cancelSubscription(
  subscriptionId: string,
  reason?: string
)
```

**ما يحدث:**
1. حساب الأيام المتبقية من الاشتراك
2. حساب مبلغ الاسترداد (نسبي للأيام المتبقية)
3. تحديث حالة الاشتراك إلى `cancelled`
4. إلغاء الفواتير غير المدفوعة

**مثال:**
```typescript
const result = await FinancialService.cancelSubscription(
  'sub_123',
  'طلب العميل'
);

console.log(result.message);
console.log(`مبلغ الاسترداد: ${result.refund_amount} ريال`);
```

---

## 🌐 API Endpoints الجديدة

### 1. إنشاء اشتراك
```http
POST /api/financial/create-subscription

Body:
{
  "advertiser_id": "adv_123",
  "plan_id": "plan_456",
  "start_date": "2024-01-01",
  "discount_type": "percentage",
  "discount_amount": 10,
  "initial_payment": 450,
  "payment_method": "cash",
  "notes": "عرض ترحيبي"
}

Response:
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "subscription_id": "sub_xxx",
    "invoice_id": "inv_yyy",
    "payment_id": "pay_zzz"
  }
}
```

---

### 2. تسجيل دفعة
```http
POST /api/financial/record-payment

Body:
{
  "subscription_id": "sub_123",
  "invoice_id": "inv_456",
  "amount": 300,
  "payment_date": "2024-01-15",
  "payment_method": "bank_transfer",
  "transaction_id": "TXN123",
  "notes": "دفعة شهرية"
}

Response:
{
  "success": true,
  "message": "Payment recorded successfully",
  "payment_id": "pay_xxx"
}
```

---

### 3. ملخص مالي
```http
GET /api/financial/advertiser-summary?advertiser_id=adv_123

Response:
{
  "success": true,
  "data": {
    "total_subscriptions": 5,
    "active_subscriptions": 2,
    "expired_subscriptions": 3,
    "total_spent": 5000,
    "total_paid": 4200,
    "total_pending": 800,
    "payment_history": [...],
    "unpaid_invoices": [...]
  }
}
```

---

### 4. التحقق من الاشتراكات
```http
POST /api/financial/check-subscriptions

Response:
{
  "success": true,
  "message": "Updated 3 expired subscriptions",
  "data": {
    "updated": 3,
    "expired_subscriptions": ["sub_1", "sub_2", "sub_3"]
  }
}
```

---

### 5. إلغاء اشتراك
```http
POST /api/financial/cancel-subscription

Body:
{
  "subscription_id": "sub_123",
  "reason": "طلب العميل"
}

Response:
{
  "success": true,
  "message": "Subscription cancelled. Refund amount: 150 SAR for 15 remaining days.",
  "refund_amount": 150
}
```

---

### 6. حساب الخصومات
```http
POST /api/financial/calculate-discount

Body:
{
  "base_price": 1000,
  "discount_type": "percentage",
  "discount_amount": 20
}

Response:
{
  "success": true,
  "data": {
    "base_price": 1000,
    "discount_type": "percentage",
    "discount_amount": 20,
    "discount_value": 200,
    "total_amount": 800
  }
}
```

---

## 🔄 سيناريوهات الاستخدام

### سيناريو 1: معلن جديد يسجل
```typescript
// 1. إنشاء اشتراك جديد
const result = await FinancialService.createSubscriptionWithInvoice({
  advertiser_id: 'adv_new',
  plan_id: 'plan_monthly',
  start_date: new Date(),
  discount_type: 'percentage',
  discount_amount: 15,           // خصم 15%
  initial_payment: 850,          // دفعة أولية
  payment_method: 'bank_transfer'
});

// النتيجة:
// - اشتراك جديد بحالة active
// - فاتورة بمبلغ 850 ريال (1000 - 15%)
// - دفعة مسجلة بمبلغ 850
// - payment_status = 'paid' (مدفوع بالكامل)
```

---

### سيناريو 2: دفعة جزئية
```typescript
// 1. إنشاء اشتراك بدفعة جزئية
const result = await FinancialService.createSubscriptionWithInvoice({
  advertiser_id: 'adv_123',
  plan_id: 'plan_monthly',
  start_date: new Date(),
  initial_payment: 500,          // دفعة جزئية من 1000
  payment_method: 'cash'
});

// النتيجة:
// - total_amount = 1000
// - paid_amount = 500
// - remaining_amount = 500
// - payment_status = 'partial'

// 2. تسجيل دفعة ثانية
const paymentId = await FinancialService.recordPayment({
  subscription_id: result.subscription_id,
  amount: 300,
  payment_date: new Date()
});

// النتيجة بعد الدفعة:
// - paid_amount = 800
// - remaining_amount = 200
// - payment_status = 'partial' (لا يزال هناك متبقي)

// 3. تسجيل الدفعة الأخيرة
const lastPaymentId = await FinancialService.recordPayment({
  subscription_id: result.subscription_id,
  amount: 200,
  payment_date: new Date()
});

// النتيجة النهائية:
// - paid_amount = 1000
// - remaining_amount = 0
// - payment_status = 'paid'
// - invoice.status = 'paid'
// - invoice.paid_date = تاريخ الدفعة الأخيرة
```

---

### سيناريو 3: انتهاء صلاحية اشتراك
```typescript
// يتم تشغيل هذا يومياً
const result = await FinancialService.checkAndUpdateSubscriptionStatuses();

// إذا كان هناك اشتراك انتهى:
// - status = 'expired'
// - يبقى payment_status كما هو
// - المعلن يحتاج إلى تجديد
```

---

### سيناريو 4: إلغاء اشتراك
```typescript
// المعلن يطلب إلغاء الاشتراك
const result = await FinancialService.cancelSubscription(
  'sub_123',
  'الشركة أوقفت نشاطها'
);

// النتيجة:
// - status = 'cancelled'
// - حساب الأيام المتبقية
// - حساب مبلغ الاسترداد
// - إلغاء الفواتير غير المدفوعة
```

---

## ✅ ضمانات الدقة

### 1. الحسابات المالية
- ✅ تقريب جميع المبالغ إلى منزلتين عشريتين
- ✅ التحقق من عدم وجود مبالغ سالبة
- ✅ التحقق من صحة الخصومات قبل التطبيق

### 2. حالات الاشتراك
- ✅ `active`: الاشتراك ساري ولم ينته
- ✅ `expired`: انتهى تاريخ end_date
- ✅ `cancelled`: تم الإلغاء يدوياً

### 3. حالات الدفع
- ✅ `paid`: المبلغ المدفوع = المبلغ الإجمالي
- ✅ `partial`: المبلغ المدفوع < المبلغ الإجمالي
- ✅ `pending`: لم يتم أي دفع

### 4. ربط البيانات
- ✅ كل اشتراك يجب أن يكون له فاتورة واحدة على الأقل
- ✅ كل دفعة يجب أن ترتبط باشتراك
- ✅ الدفعة قد ترتبط أو لا ترتبط بفاتورة محددة

---

## 🎯 أفضل الممارسات

### 1. عند إنشاء اشتراك جديد
```typescript
// ✅ صحيح - استخدم FinancialService
const result = await FinancialService.createSubscriptionWithInvoice({...});

// ❌ خطأ - لا تستخدم SubscriptionAdminService مباشرة
const subId = await SubscriptionAdminService.create({...});
```

### 2. عند تسجيل دفعة
```typescript
// ✅ صحيح - استخدم recordPayment
const paymentId = await FinancialService.recordPayment({...});

// ❌ خطأ - لا تستخدم PaymentAdminService مباشرة
const payId = await PaymentAdminService.create({...});
```

### 3. عند حساب الخصومات
```typescript
// ✅ صحيح - استخدم calculateDiscount
const result = FinancialService.calculateDiscount(1000, 'percentage', 20);

// ❌ خطأ - لا تحسب يدوياً
const discount = price * 0.20;
```

---

## 🔍 التحقق والمراقبة

### يوميا
```typescript
// تشغيل التحقق من الاشتراكات
await FinancialService.checkAndUpdateSubscriptionStatuses();
```

### عند عرض معلن
```typescript
// جلب الملخص المالي
const summary = await FinancialService.getAdvertiserFinancialSummary(advertiserId);
```

### قبل إنشاء اشتراك
```typescript
// التحقق من صحة الخصم
const validation = FinancialService.validateDiscount(price, type, amount);
if (!validation.valid) {
  console.error('خطأ في الخصم:', validation.error);
}
```

---

## 📊 التقارير المالية

يمكن استخدام `getAdvertiserFinancialSummary` للحصول على:
- سجل المدفوعات الكامل
- الفواتير غير المدفوعة
- إحصائيات شاملة

**مثال: تقرير شهري**
```typescript
const allAdvertisers = await AdvertiserAdminService.getAll();
const report = [];

for (const advertiser of allAdvertisers) {
  const summary = await FinancialService.getAdvertiserFinancialSummary(advertiser.id);
  report.push({
    advertiser_name: advertiser.company_name,
    total_paid: summary.total_paid,
    total_pending: summary.total_pending,
    payment_count: summary.payment_history.length
  });
}

console.table(report);
```

---

## ⚠️ ملاحظات مهمة

1. **جميع المبالغ بالريال السعودي (SAR)**
2. **التواريخ بتوقيت UTC**
3. **يُنصح بتشغيل `checkAndUpdateSubscriptionStatuses` يومياً**
4. **حفظ transaction_id عند الدفع عبر البنك للمراجع**
5. **مراجعة unpaid_invoices دورياً**

---

## 🚀 الخطوات التالية

1. ✅ تكامل النظام مع Dashboard
2. ✅ إضافة إشعارات عند اقتراب نهاية الاشتراك
3. ✅ تقارير مالية شهرية تلقائية
4. ✅ تكامل مع بوابات الدفع الإلكتروني
5. ✅ إرسال الفواتير عبر WhatsApp/Email

---

## 📞 الدعم الفني

للاستفسارات أو المشاكل:
- راجع هذا الدليل أولاً
- تحقق من logs في حالة الأخطاء
- جميع الدوال تُرجع أخطاء واضحة

---

**تم بناء النظام بدقة متناهية لضمان سلامة العمليات المالية! ✅**

