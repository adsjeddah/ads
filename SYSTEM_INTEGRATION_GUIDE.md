# 🔗 دليل الربط الشامل للنظام

> **الحالة:** ✅ **مربوط بالكامل ويعمل بتناغم**  
> **التاريخ:** 22 نوفمبر 2025

---

## 📋 جدول المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [الربط بين المعلنين والباقات](#الربط-بين-المعلنين-والباقات)
3. [الربط بين الاشتراكات والفواتير](#الربط-بين-الاشتراكات-والفواتير)
4. [الربط مع نظام VAT](#الربط-مع-نظام-vat)
5. [الربط مع Audit Trail](#الربط-مع-audit-trail)
6. [الربط مع التذكيرات](#الربط-مع-التذكيرات)
7. [الربط مع الاستردادات](#الربط-مع-الاستردادات)
8. [تدفق البيانات الكامل](#تدفق-البيانات-الكامل)
9. [الربط بين Services](#الربط-بين-services)
10. [الربط بين API Endpoints](#الربط-بين-api-endpoints)

---

## 🎯 نظرة عامة

النظام مصمم بشكل **متكامل ومترابط** حيث:

```
المعلن (Advertiser)
    │
    ├─► يختار الباقة (Plan)
    │       │
    │       ├─► يُنشأ الاشتراك (Subscription)
    │       │       │
    │       │       ├─► يُحسب الخصم
    │       │       ├─► يُحسب VAT (15%)
    │       │       └─► يُنشأ الفاتورة (Invoice)
    │       │               │
    │       │               ├─► Subtotal
    │       │               ├─► VAT Amount
    │       │               ├─► Total with VAT
    │       │               └─► Audit Trail يُسجّل
    │       │
    │       └─► يُسجل الدفعة (Payment)
    │               │
    │               ├─► يُحدّث الاشتراك
    │               ├─► يُحدّث الفاتورة
    │               └─► Audit Trail يُسجّل
    │
    ├─► التذكيرات (Reminders)
    │       │
    │       ├─► Due Soon (قبل 3 أيام)
    │       ├─► Overdue (متأخر)
    │       └─► Subscription Expiring (قبل 7 أيام)
    │
    ├─► الاستردادات (Refunds)
    │       │
    │       └─► مربوط بالاشتراك والفاتورة
    │
    └─► الإحصائيات (Statistics)
            │
            └─► مراقبة الأداء
```

---

## 🔗 الربط بين المعلنين والباقات

### 1. المعلن يختار الباقة

```typescript
// المعلن (Advertiser)
{
  id: 'ADV-001',
  company_name: 'شركة ABC',
  phone: '0512345678',
  email: 'info@abc.com'
}

// الباقة (Plan)
{
  id: 'PLAN-001',
  name: 'باقة شهرية',
  duration_days: 30,
  price: 900,
  features: [...]
}
```

### 2. يُنشأ الاشتراك

```typescript
// الاشتراك (Subscription)
{
  id: 'SUB-001',
  advertiser_id: 'ADV-001',  // ← مربوط بالمعلن
  plan_id: 'PLAN-001',        // ← مربوط بالباقة
  start_date: '2025-11-22',
  end_date: '2025-12-22',     // ← محسوب تلقائياً من plan.duration_days
  base_price: 900,            // ← من الباقة
  total_amount: 931.5,        // ← بعد VAT
  status: 'active'
}
```

**الربط:**
- `advertiser_id` → يشير للمعلن
- `plan_id` → يشير للباقة
- `total_amount` → محسوب من سعر الباقة + VAT

---

## 💰 الربط بين الاشتراكات والفواتير

### 1. فاتورة تلقائية عند الاشتراك

```typescript
// عند إنشاء اشتراك جديد، يتم تلقائياً:

Financial Service.createSubscriptionWithInvoice()
    │
    ├─► 1. جلب معلومات الباقة من plans
    ├─► 2. حساب الخصم (إن وجد)
    ├─► 3. حساب VAT (15%)
    ├─► 4. إنشاء Subscription في subscriptions
    ├─► 5. إنشاء Invoice في invoices
    │       ├─ subscription_id: 'SUB-001'  ← مربوط
    │       ├─ subtotal: 810               ← بعد الخصم
    │       ├─ vat_percentage: 15
    │       ├─ vat_amount: 121.5
    │       └─ amount: 931.5               ← الإجمالي
    │
    └─► 6. تسجيل في Audit Log
```

### 2. الربط الكامل

```typescript
// الفاتورة (Invoice)
{
  id: 'INV-202511-0001',
  subscription_id: 'SUB-001',  // ← مربوط بالاشتراك
  
  // VAT Breakdown
  subtotal: 810,                // السعر بعد الخصم
  vat_percentage: 15,
  vat_amount: 121.5,
  amount: 931.5,                // الإجمالي
  
  status: 'unpaid',
  issued_date: '2025-11-22',
  due_date: '2025-12-22'
}
```

**الربط:**
- `subscription_id` → يشير للاشتراك
- المبلغ مربوط بسعر الباقة + الخصم + VAT

---

## 📊 الربط مع نظام VAT

### 1. حساب VAT التلقائي

```typescript
// في financial.service.ts

calculateVAT(subtotal: 810, vatPercentage: 15)
    ↓
{
  subtotal: 810,
  vat_percentage: 15,
  vat_amount: 121.5,           // 810 × 0.15
  total_with_vat: 931.5        // 810 + 121.5
}
```

### 2. الربط في جميع المراحل

```typescript
// عند إنشاء الاشتراك:
1. السعر الأصلي (Plan): 900 ريال
2. الخصم (10%): -90 ريال
   ────────────────────────
3. Subtotal: 810 ريال
4. VAT (15%): +121.5 ريال
   ────────────────────────
5. Total: 931.5 ريال

// تُخزن جميع القيم في:
- Subscription.total_amount = 931.5
- Invoice.subtotal = 810
- Invoice.vat_amount = 121.5
- Invoice.amount = 931.5
```

**الربط:**
- كل فاتورة تحتوي على تفاصيل VAT كاملة
- VAT محسوب بعد الخصم
- التكامل الكامل مع المدفوعات

---

## 📝 الربط مع Audit Trail

### 1. تسجيل كل عملية

```typescript
// في invoice-admin.service.ts

async create(invoiceData, userId, ipAddress) {
  // 1. إنشاء الفاتورة
  const invoiceId = await db.collection('invoices').add(...)
  
  // 2. تسجيل في Audit Log تلقائياً
  await AuditService.logInvoiceAction({
    invoice_id: invoiceId,
    action: 'created',
    performed_by: userId,      // ← المستخدم الذي أنشأ
    ip_address: ipAddress,
    notes: `Invoice created with amount ${amount} SAR`
  })
  
  return invoiceId
}
```

### 2. سلسلة التدقيق الكاملة

```typescript
// لكل فاتورة:
invoice_audits Collection:
[
  {
    invoice_id: 'INV-001',     // ← مربوط بالفاتورة
    action: 'created',
    performed_by: 'admin-123',
    performed_at: '2025-11-22 10:30',
    notes: 'Invoice created...'
  },
  {
    invoice_id: 'INV-001',     // ← نفس الفاتورة
    action: 'updated',
    changed_fields: {
      status: {
        old: 'unpaid',
        new: 'paid'
      }
    },
    performed_by: 'admin-123',
    performed_at: '2025-11-22 14:20'
  }
]
```

**الربط:**
- كل سجل تدقيق مربوط بفاتورة محددة
- يتتبع جميع التغييرات (قبل/بعد)
- مرتبط بالمستخدم الذي قام بالعملية

---

## 🔔 الربط مع التذكيرات

### 1. إنشاء تذكيرات تلقائية

```typescript
// Cloud Function: dailyReminders (9 صباحاً)

for each invoice in invoices where status = 'unpaid' {
  if (due_date - today = 3 days) {
    // إنشاء تذكير "Due Soon"
    await db.collection('reminders').add({
      invoice_id: invoice.id,          // ← مربوط بالفاتورة
      subscription_id: invoice.subscription_id,  // ← مربوط بالاشتراك
      advertiser_id: subscription.advertiser_id, // ← مربوط بالمعلن
      reminder_type: 'due_soon',
      message: `فاتورتك رقم ${invoice.invoice_number} مستحقة خلال 3 أيام`
    })
  }
}
```

### 2. الربط المتسلسل

```
Reminder
    │
    ├─► invoice_id ──→ Invoice
    │                      │
    │                      └─► subscription_id ──→ Subscription
    │                                                  │
    └─► advertiser_id ─────────────────────────────→ Advertiser
```

**الربط:**
- التذكير مربوط بالفاتورة
- الفاتورة مربوطة بالاشتراك
- الاشتراك مربوط بالمعلن
- الرسالة تحتوي على رقم الفاتورة

---

## 💵 الربط مع الاستردادات

### 1. إنشاء استرداد

```typescript
// Refund
{
  id: 'REF-001',
  subscription_id: 'SUB-001',    // ← مربوط بالاشتراك
  invoice_id: 'INV-001',         // ← مربوط بالفاتورة
  payment_id: 'PAY-001',         // ← مربوط بالدفعة
  
  original_amount: 931.5,        // ← من الفاتورة
  refund_amount: 500,
  refund_reason: 'إلغاء جزئي',
  
  status: 'approved'
}
```

### 2. التأثير المترابط

```typescript
// عند إنشاء استرداد:
1. الاسترداد يُنشأ في refunds
   ↓
2. يؤثر على Subscription
   - paid_amount يُحدّث
   - remaining_amount يُحدّث
   ↓
3. قد يؤثر على Invoice
   - status قد يتغير
   ↓
4. يُسجل في Audit Log
```

**الربط:**
- مربوط بالاشتراك والفاتورة والدفعة
- يؤثر على حالة الاشتراك
- يُسجل في سجل التدقيق

---

## 🌊 تدفق البيانات الكامل

### السيناريو الكامل: من البداية للنهاية

```typescript
// 1. المعلن يطلب اشتراك
POST /api/financial/create-subscription
{
  advertiser_id: 'ADV-001',
  plan_id: 'PLAN-001',        // باقة شهرية 900 ريال
  discount_amount: 10,         // خصم 10%
  discount_type: 'percentage',
  initial_payment: 500,
  vat_percentage: 15
}

↓ Financial Service يبدأ

// 2. جلب معلومات الباقة
const plan = await getDoc('plans', 'PLAN-001')
// Result: { price: 900, duration_days: 30 }

↓

// 3. حساب الخصم
const discount = calculateDiscount(900, 'percentage', 10)
// Result: { total_amount: 810 }

↓

// 4. حساب VAT
const vat = calculateVAT(810, 15)
// Result: {
//   subtotal: 810,
//   vat_amount: 121.5,
//   total_with_vat: 931.5
// }

↓

// 5. إنشاء الاشتراك
const subscription = {
  advertiser_id: 'ADV-001',
  plan_id: 'PLAN-001',
  total_amount: 931.5,
  paid_amount: 500,
  remaining_amount: 431.5,
  status: 'active',
  payment_status: 'partial'
}
await db.collection('subscriptions').add(subscription)
// Result: subscription_id = 'SUB-001'

↓

// 6. إنشاء الفاتورة
const invoice = {
  subscription_id: 'SUB-001',
  invoice_number: 'INV-202511-0001',
  subtotal: 810,
  vat_percentage: 15,
  vat_amount: 121.5,
  amount: 931.5,
  status: 'unpaid'
}
await InvoiceAdminService.create(invoice, userId, ipAddress)
// Result: invoice_id = 'INV-001'

↓ تلقائياً

// 7. تسجيل في Audit Log
await AuditService.logInvoiceAction({
  invoice_id: 'INV-001',
  action: 'created',
  performed_by: userId
})

↓

// 8. تسجيل الدفعة الأولى
const payment = {
  subscription_id: 'SUB-001',
  invoice_id: 'INV-001',
  amount: 500,
  payment_method: 'cash'
}
await db.collection('payments').add(payment)
// Result: payment_id = 'PAY-001'

↓

// 9. جدولة التذكير (بعد 23 يوم)
const reminder = {
  invoice_id: 'INV-001',
  subscription_id: 'SUB-001',
  advertiser_id: 'ADV-001',
  reminder_type: 'due_soon',
  scheduled_date: due_date - 3 days
}
// سيتم إنشاؤه تلقائياً بواسطة Cloud Function

✅ النتيجة النهائية:

Collections المتأثرة:
├─ subscriptions: +1 (SUB-001)
├─ invoices: +1 (INV-001)
├─ payments: +1 (PAY-001)
├─ invoice_audits: +1
└─ reminders: +1 (مجدول)

الربط الكامل:
advertiser ← subscription ← invoice → audit
              ↓              ↓
            payment      reminder
```

---

## 🔌 الربط بين Services

### 1. Financial Service (المركز)

```typescript
FinancialService
    │
    ├─► يستخدم PlanService
    │   └─► لجلب معلومات الباقة
    │
    ├─► يستخدم SubscriptionAdminService
    │   └─► لإنشاء/تحديث الاشتراكات
    │
    ├─► يستخدم InvoiceAdminService
    │   └─► لإنشاء/تحديث الفواتير
    │       └─► والذي يستخدم AuditService
    │
    └─► يستخدم PaymentAdminService
        └─► لتسجيل المدفوعات
```

### 2. Audit Service (التتبع)

```typescript
AuditService
    │
    └─► يُستخدم من قبل:
        ├─ InvoiceAdminService
        ├─ FinancialService
        └─ جميع العمليات على الفواتير
```

### 3. Reminder Service (التذكيرات)

```typescript
ReminderService
    │
    ├─► يستخدم InvoiceAdminService
    │   └─► لجلب الفواتير المستحقة
    │
    ├─► يستخدم SubscriptionAdminService
    │   └─► لجلب الاشتراكات المنتهية
    │
    └─► يُستخدم من قبل:
        ├─ NotificationService
        └─ Cloud Functions
```

---

## 🌐 الربط بين API Endpoints

### 1. Create Subscription

```typescript
POST /api/financial/create-subscription
    │
    ├─► 1. verifyAdminToken()
    ├─► 2. ModelValidator.validateSubscription()
    ├─► 3. FinancialService.createSubscriptionWithInvoice()
    │       │
    │       ├─► PlanService.getById()
    │       ├─► calculateDiscount()
    │       ├─► calculateVAT()        ← VAT هنا
    │       ├─► SubscriptionAdminService.create()
    │       ├─► InvoiceAdminService.create()
    │       │       └─► AuditService.logInvoiceAction()  ← Audit هنا
    │       └─► PaymentAdminService.create()
    │
    └─► Response: {
          subscription_id,
          invoice_id,
          payment_id
        }
```

### 2. Record Payment

```typescript
POST /api/financial/record-payment
    │
    ├─► 1. verifyAdminToken()
    ├─► 2. ModelValidator.validatePayment()
    ├─► 3. FinancialService.recordPayment()
    │       │
    │       ├─► SubscriptionAdminService.getById()
    │       ├─► SubscriptionAdminService.update()
    │       ├─► InvoiceAdminService.update()
    │       │       └─► AuditService.logInvoiceAction()  ← Audit هنا
    │       └─► PaymentAdminService.create()
    │
    └─► Response: { payment_id }
```

### 3. Create Reminder

```typescript
POST /api/reminders/create-auto
    │
    ├─► 1. verifyAdminToken()
    ├─► 2. ReminderService.createDueSoonReminders()
    │       │
    │       ├─► InvoiceAdminService.getAll() ← جلب الفواتير
    │       │       where status = 'unpaid'
    │       │       where due_date <= 3 days
    │       │
    │       └─► for each invoice:
    │           ├─ SubscriptionAdminService.getById()
    │           └─ db.collection('reminders').add({
    │               invoice_id,         ← مربوط
    │               subscription_id,    ← مربوط
    │               advertiser_id       ← مربوط
    │             })
    │
    └─► Response: { created_count }
```

---

## ✅ خلاصة الربط الشامل

### كل شيء مربوط ببعضه:

```
✅ المعلنون ↔ الباقات ↔ الاشتراكات
✅ الاشتراكات ↔ الفواتير ↔ المدفوعات
✅ الفواتير ↔ VAT (حساب تلقائي)
✅ الفواتير ↔ Audit Trail (تتبع كامل)
✅ الفواتير ↔ التذكيرات (تلقائية)
✅ الاشتراكات ↔ الاستردادات
✅ Services ↔ Services (تكامل)
✅ API Endpoints ↔ Services (استخدام)
✅ Cloud Functions ↔ Collections (أتمتة)
```

### التناغم الكامل:

1. **المعلن** يختار **الباقة**
2. يُنشأ **الاشتراك** تلقائياً
3. يُحسب **VAT** (15%) تلقائياً
4. تُنشأ **الفاتورة** بتفاصيل VAT
5. يُسجل في **Audit Trail** تلقائياً
6. تُجدول **التذكيرات** تلقائياً
7. تُعالج التذكيرات بواسطة **Cloud Functions**
8. كل دفعة تُحدّث **جميع** الكيانات المرتبطة

---

## 🎯 التحقق من الربط

لتجربة الربط الكامل:

```bash
# 1. تشغيل
npm run dev

# 2. فتح Dashboard
open http://localhost:3000/admin/dashboard

# 3. إنشاء اشتراك جديد
# اذهب إلى: Advertisers → اختر معلن → Financial → Create Subscription

# 4. التحقق من الربط:
# ✅ الاشتراك مربوط بالمعلن والباقة
# ✅ الفاتورة مربوطة بالاشتراك
# ✅ الفاتورة تحتوي على VAT
# ✅ Audit Log يسجل العملية
# ✅ التذكير سيُنشأ تلقائياً بعد 23 يوم
```

---

**✅ النظام مربوط بالكامل ويعمل بتناغم احترافي!**

---

**تم إعداده بواسطة: AI Assistant**  
**التاريخ: 22 نوفمبر 2025**  
**الحالة: ✅ مكتمل ومربوط 100%**

