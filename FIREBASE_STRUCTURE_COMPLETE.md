# 🗄️ بنية Firebase الكاملة - نظام إعلانات جدة
## Database Structure & Relationships Documentation

---

## 📋 جدول المحتويات

1. [نظرة عامة](#overview)
2. [Collections الأساسية](#core-collections)
3. [Collections التحسينات](#enhancement-collections)
4. [مخطط العلاقات](#relationships-diagram)
5. [أمثلة على الاستعلامات](#query-examples)
6. [التحقق من البنية](#verification)

---

## 🎯 نظرة عامة {#overview}

### البنية الكاملة للنظام

```
Firebase Project: jeddah-ads-46daa
├── Collections الأساسية (8) ✅
│   ├── advertisers         (المعلنين)
│   ├── plans               (الباقات الإعلانية)
│   ├── subscriptions       (الاشتراكات)
│   ├── invoices            (الفواتير)
│   ├── payments            (المدفوعات)
│   ├── ad_requests         (طلبات الإعلان)
│   ├── statistics          (الإحصائيات)
│   └── admins              (المسؤولين)
│
└── Collections التحسينات (4) 🆕
    ├── invoice_audits      (سجل تدقيق الفواتير)
    ├── reminders           (التذكيرات التلقائية)
    ├── refunds             (الاستردادات)
    └── notifications       (الإشعارات)
```

---

## 📦 Collections الأساسية {#core-collections}

### 1️⃣ advertisers (المعلنين)

**الوصف:** الشركات والعملاء الذين يشترون الإعلانات

**البنية:**
```typescript
{
  id: string;                    // معرف تلقائي من Firestore
  company_name: string;          // اسم الشركة
  phone: string;                 // رقم الجوال
  whatsapp?: string;             // واتساب (اختياري)
  email?: string;                // البريد الإلكتروني
  services?: string;             // الخدمات المقدمة
  icon_url?: string;             // رابط الأيقونة/الشعار
  status: 'active' | 'inactive' | 'pending';
  created_at: Timestamp;         // تاريخ التسجيل
  updated_at: Timestamp;         // آخر تحديث
}
```

**العلاقات:**
```
advertisers (1) ──→ (M) subscriptions    "معلن واحد له عدة اشتراكات"
advertisers (1) ──→ (M) statistics       "معلن واحد له إحصائيات يومية"
advertisers (1) ──→ (M) reminders        "معلن واحد يستقبل عدة تذكيرات"
```

**مثال:**
```javascript
{
  id: "adv_xyz123",
  company_name: "شركة التقنية الحديثة",
  phone: "0501234567",
  whatsapp: "0501234567",
  email: "info@moderntech.sa",
  services: "تطوير تطبيقات الجوال",
  icon_url: "https://storage.../logo.png",
  status: "active",
  created_at: Timestamp,
  updated_at: Timestamp
}
```

---

### 2️⃣ plans (الباقات الإعلانية)

**الوصف:** خطط الأسعار المختلفة للإعلانات

**البنية:**
```typescript
{
  id: string;
  name: string;                  // اسم الباقة
  description?: string;          // وصف الباقة
  duration_days: number;         // المدة بالأيام (15, 30, 60, 90, 180, 365)
  price: number;                 // السعر بالريال
  features?: string | string[];  // المميزات
  is_active?: boolean;           // نشطة أم لا
  created_at: Timestamp;
}
```

**الباقات المتوفرة:**
| الباقة | المدة | السعر التقريبي |
|--------|------|----------------|
| 15 يوم | 15 | 500 ريال |
| شهرية | 30 | 900 ريال |
| شهرين | 60 | 1,700 ريال |
| 3 أشهر | 90 | 2,400 ريال |
| 6 أشهر | 180 | 4,500 ريال |
| سنوية | 365 | 8,000 ريال |

**العلاقات:**
```
plans (1) ──→ (M) subscriptions    "باقة واحدة تُستخدم في عدة اشتراكات"
plans (1) ──→ (M) ad_requests      "باقة واحدة في عدة طلبات"
```

**مثال:**
```javascript
{
  id: "plan_monthly",
  name: "باقة شهرية",
  description: "إعلان لمدة شهر كامل",
  duration_days: 30,
  price: 900,
  features: ["ظهور يومي", "إحصائيات مفصلة"],
  is_active: true,
  created_at: Timestamp
}
```

---

### 3️⃣ subscriptions (الاشتراكات)

**الوصف:** ربط المعلن بالباقة الإعلانية - القلب النابض للنظام

**البنية:**
```typescript
{
  id: string;
  advertiser_id: string;         // → advertisers
  plan_id: string;               // → plans
  start_date: Timestamp;         // تاريخ البداية
  end_date: Timestamp;           // تاريخ النهاية (محسوب تلقائياً)
  
  // المالية
  base_price: number;            // السعر الأساسي من الباقة
  discount_type: 'amount' | 'percentage';
  discount_amount: number;       // قيمة الخصم
  total_amount: number;          // المبلغ الإجمالي بعد الخصم
  paid_amount: number;           // المبلغ المدفوع
  remaining_amount: number;      // المبلغ المتبقي
  
  // الحالات
  status: 'active' | 'expired' | 'cancelled';
  payment_status: 'paid' | 'partial' | 'pending';
  
  created_at: Timestamp;
}
```

**دورة الحياة:**
```
1. إنشاء → status: 'active', payment_status: 'pending'
2. دفعة جزئية → payment_status: 'partial'
3. دفع كامل → payment_status: 'paid'
4. انتهاء المدة → status: 'expired'
5. إلغاء → status: 'cancelled'
```

**العلاقات:**
```
subscriptions (M) ──→ (1) advertisers    "اشتراك ينتمي لمعلن واحد"
subscriptions (M) ──→ (1) plans          "اشتراك يستخدم باقة واحدة"
subscriptions (1) ──→ (M) invoices       "اشتراك له فاتورة أو أكثر"
subscriptions (1) ──→ (M) payments       "اشتراك له عدة دفعات"
subscriptions (1) ──→ (M) refunds        "اشتراك قد يكون له استرداد"
```

**مثال:**
```javascript
{
  id: "sub_abc789",
  advertiser_id: "adv_xyz123",      // ← معلن محدد
  plan_id: "plan_monthly",          // ← باقة شهرية
  start_date: Timestamp("2024-11-01"),
  end_date: Timestamp("2024-12-01"),  // 30 يوم من البداية
  
  base_price: 900,                   // من الباقة
  discount_type: "percentage",
  discount_amount: 10,               // 10% خصم
  total_amount: 810,                 // 900 - 90 = 810
  paid_amount: 500,                  // دفعة أولى
  remaining_amount: 310,             // 810 - 500 = 310
  
  status: "active",                  // نشط
  payment_status: "partial",         // دفع جزئي
  
  created_at: Timestamp
}
```

---

### 4️⃣ invoices (الفواتير)

**الوصف:** مستندات الدفع المرتبطة بالاشتراكات

**البنية (محدثة مع الضرائب):**
```typescript
{
  id: string;
  subscription_id: string;       // → subscriptions
  invoice_number: string;        // رقم فريد: INV-YYYYMM-####
  
  // المالية (مع الضرائب)
  subtotal: number;              // المبلغ قبل الضريبة
  vat_percentage: number;        // نسبة الضريبة (15%)
  vat_amount: number;            // مبلغ الضريبة
  amount: number;                // الإجمالي (subtotal + vat)
  
  // الحالات
  status: 'paid' | 'unpaid' | 'cancelled';
  
  // التواريخ
  issued_date: Timestamp;        // تاريخ الإصدار
  due_date?: Timestamp;          // تاريخ الاستحقاق
  paid_date?: Timestamp;         // تاريخ الدفع (عند الدفع الكامل)
  
  // إضافات
  sent_to_customer?: boolean;    // هل تم إرسالها
  sent_date?: Timestamp;         // تاريخ الإرسال
  payment_link?: string;         // رابط الدفع الإلكتروني
  
  created_at: Timestamp;
  updated_at?: Timestamp;
}
```

**رقم الفاتورة:**
```
Format: INV-YYYYMM-####
مثال: INV-202411-0001
      INV-202411-0002
      INV-202412-0001  (شهر جديد)
```

**العلاقات:**
```
invoices (M) ──→ (1) subscriptions    "فاتورة تنتمي لاشتراك واحد"
invoices (1) ──→ (M) payments         "فاتورة لها عدة دفعات"
invoices (1) ──→ (M) invoice_audits   "فاتورة لها سجل تدقيق"
invoices (1) ──→ (M) reminders        "فاتورة تولد تذكيرات"
invoices (1) ──→ (M) notifications    "فاتورة تولد إشعارات"
```

**مثال:**
```javascript
{
  id: "inv_def456",
  subscription_id: "sub_abc789",     // ← اشتراك محدد
  invoice_number: "INV-202411-0015",
  
  subtotal: 810,                     // المبلغ بعد الخصم
  vat_percentage: 15,                // ضريبة 15%
  vat_amount: 121.5,                 // 810 * 0.15
  amount: 931.5,                     // 810 + 121.5
  
  status: "unpaid",
  
  issued_date: Timestamp("2024-11-01"),
  due_date: Timestamp("2024-12-01"),
  paid_date: null,
  
  sent_to_customer: false,
  
  created_at: Timestamp,
  updated_at: Timestamp
}
```

---

### 5️⃣ payments (المدفوعات)

**الوصف:** سجل جميع الدفعات المالية

**البنية:**
```typescript
{
  id: string;
  subscription_id: string;       // → subscriptions (مطلوب)
  invoice_id?: string;           // → invoices (اختياري)
  
  amount: number;                // المبلغ المدفوع
  payment_date: Timestamp;       // تاريخ الدفع
  payment_method?: string;       // طريقة الدفع (cash, bank, card, online)
  transaction_id?: string;       // معرف المعاملة المصرفية
  notes?: string;                // ملاحظات
  
  created_at: Timestamp;
}
```

**العلاقات:**
```
payments (M) ──→ (1) subscriptions    "دفعة تنتمي لاشتراك واحد"
payments (M) ──→ (1) invoices         "دفعة قد تكون مرتبطة بفاتورة"
```

**مثال:**
```javascript
{
  id: "pay_ghi789",
  subscription_id: "sub_abc789",     // ← اشتراك محدد
  invoice_id: "inv_def456",          // ← فاتورة محددة
  
  amount: 500,                       // دفعة أولى
  payment_date: Timestamp("2024-11-01"),
  payment_method: "bank_transfer",
  transaction_id: "TXN20241101001",
  notes: "دفعة أولى - تحويل بنكي",
  
  created_at: Timestamp
}
```

---

### 6️⃣ ad_requests (طلبات الإعلان)

**الوصف:** طلبات من العملاء المحتملين

**البنية:**
```typescript
{
  id: string;
  company_name: string;          // اسم الشركة
  contact_name: string;          // اسم جهة الاتصال
  phone: string;                 // رقم الجوال
  whatsapp?: string;             // واتساب
  email?: string;                // البريد
  plan_id?: string;              // → plans (الباقة المطلوبة)
  message?: string;              // رسالة العميل
  status: 'pending' | 'contacted' | 'converted' | 'rejected';
  created_at: Timestamp;
}
```

**العلاقات:**
```
ad_requests (M) ──→ (1) plans    "طلب قد يحدد باقة معينة"
```

---

### 7️⃣ statistics (الإحصائيات)

**الوصف:** المشاهدات والنقرات اليومية للمعلنين

**البنية:**
```typescript
{
  id: string;
  advertiser_id: string;         // → advertisers
  date: Timestamp;               // التاريخ (يومي)
  views: number;                 // عدد المشاهدات
  clicks: number;                // عدد النقرات
}
```

**العلاقات:**
```
statistics (M) ──→ (1) advertisers    "إحصائية تنتمي لمعلن واحد"
```

---

### 8️⃣ admins (المسؤولين)

**الوصف:** مستخدمي لوحة التحكم

**البنية:**
```typescript
{
  id: string;
  email: string;                 // البريد الإلكتروني
  name: string;                  // الاسم
  role: 'super_admin' | 'admin'; // الدور
  created_at: Timestamp;
}
```

---

## 🆕 Collections التحسينات {#enhancement-collections}

### 9️⃣ invoice_audits (سجل التدقيق)

**الوصف:** تتبع جميع التعديلات على الفواتير

**البنية:**
```typescript
{
  id: string;
  invoice_id: string;            // → invoices
  action: 'created' | 'updated' | 'deleted' | 'paid' | 'cancelled' | 'sent';
  changed_fields?: {             // الحقول المعدلة
    field_name: {
      old: any;                  // القيمة القديمة
      new: any;                  // القيمة الجديدة
    }
  };
  performed_by: string;          // معرف المسؤول
  performed_at: Timestamp;       // وقت التعديل
  ip_address?: string;           // عنوان IP
  user_agent?: string;           // المتصفح
  notes?: string;                // ملاحظات
  created_at: Timestamp;
}
```

**الفائدة:**
- ✅ شفافية كاملة
- ✅ حل النزاعات
- ✅ مساءلة واضحة
- ✅ اكتشاف الأخطاء

**العلاقات:**
```
invoice_audits (M) ──→ (1) invoices    "سجل تدقيق ينتمي لفاتورة واحدة"
```

**مثال:**
```javascript
{
  id: "audit_xyz",
  invoice_id: "inv_def456",
  action: "updated",
  changed_fields: {
    amount: {
      old: 900,
      new: 931.5
    },
    vat_amount: {
      old: 0,
      new: 121.5
    }
  },
  performed_by: "admin_uid_123",
  performed_at: Timestamp,
  ip_address: "192.168.1.1",
  user_agent: "Mozilla/5.0...",
  notes: "إضافة ضريبة القيمة المضافة",
  created_at: Timestamp
}
```

---

### 🔟 reminders (التذكيرات)

**الوصف:** تذكيرات تلقائية للعملاء

**البنية:**
```typescript
{
  id: string;
  invoice_id?: string;           // → invoices
  subscription_id?: string;      // → subscriptions
  advertiser_id: string;         // → advertisers
  
  reminder_type: 'due_soon' | 'overdue' | 'subscription_expiring' | 'custom';
  
  scheduled_date: Timestamp;     // متى يُرسل
  sent_date?: Timestamp;         // متى أُرسل فعلياً
  
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  delivery_method: 'whatsapp' | 'email' | 'sms';
  
  message: string;               // نص التذكير
  error_message?: string;        // في حالة الفشل
  
  created_at: Timestamp;
}
```

**أنواع التذكيرات:**
| النوع | الوصف | التوقيت |
|-------|-------|---------|
| `due_soon` | فاتورة قريبة من الاستحقاق | قبل 3 أيام من due_date |
| `overdue` | فاتورة متأخرة | بعد due_date |
| `subscription_expiring` | اشتراك قرب الانتهاء | قبل 7 أيام من end_date |
| `custom` | تذكير مخصص | حسب الحاجة |

**العلاقات:**
```
reminders (M) ──→ (1) invoices       "تذكير قد يكون مرتبط بفاتورة"
reminders (M) ──→ (1) subscriptions  "تذكير قد يكون مرتبط باشتراك"
reminders (M) ──→ (1) advertisers    "تذكير يُرسل لمعلن واحد"
```

**مثال:**
```javascript
{
  id: "rem_abc",
  invoice_id: "inv_def456",
  subscription_id: "sub_abc789",
  advertiser_id: "adv_xyz123",
  
  reminder_type: "due_soon",
  
  scheduled_date: Timestamp("2024-11-28"),  // 3 أيام قبل
  sent_date: Timestamp("2024-11-28 09:00"),
  
  status: "sent",
  delivery_method: "whatsapp",
  
  message: "تذكير: فاتورتك INV-202411-0015 مستحقة خلال 3 أيام...",
  
  created_at: Timestamp
}
```

---

### 1️⃣1️⃣ refunds (الاستردادات)

**الوصف:** معالجة المبالغ المستردة عند الإلغاء

**البنية:**
```typescript
{
  id: string;
  subscription_id: string;       // → subscriptions
  invoice_id?: string;           // → invoices
  payment_id?: string;           // → payments
  
  original_amount: number;       // المبلغ الأصلي المدفوع
  refund_amount: number;         // المبلغ المسترد
  refund_reason: string;         // سبب الاسترداد
  
  refund_method: 'cash' | 'bank_transfer' | 'card' | 'online';
  refund_date: Timestamp;        // تاريخ الاسترداد
  
  processed_by: string;          // معرف المسؤول
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  
  bank_details?: string;         // تفاصيل البنك (للتحويل)
  notes?: string;                // ملاحظات
  
  created_at: Timestamp;
  completed_at?: Timestamp;      // تاريخ الاكتمال
}
```

**العلاقات:**
```
refunds (M) ──→ (1) subscriptions    "استرداد ينتمي لاشتراك واحد"
refunds (M) ──→ (1) invoices         "استرداد قد يكون مرتبط بفاتورة"
refunds (M) ──→ (1) payments         "استرداد قد يكون مرتبط بدفعة"
```

**مثال:**
```javascript
{
  id: "ref_xyz",
  subscription_id: "sub_abc789",
  invoice_id: "inv_def456",
  payment_id: "pay_ghi789",
  
  original_amount: 931.5,        // المبلغ المدفوع
  refund_amount: 465.75,         // نصف المبلغ (15 يوم من 30)
  refund_reason: "إلغاء الاشتراك - طلب العميل",
  
  refund_method: "bank_transfer",
  refund_date: Timestamp("2024-11-15"),
  
  processed_by: "admin_uid_123",
  status: "completed",
  
  bank_details: "IBAN: SA...",
  notes: "تم التحويل البنكي بنجاح",
  
  created_at: Timestamp("2024-11-15"),
  completed_at: Timestamp("2024-11-16")
}
```

---

### 1️⃣2️⃣ notifications (الإشعارات)

**الوصف:** سجل جميع الرسائل المرسلة للعملاء

**البنية:**
```typescript
{
  id: string;
  type: string;                  // نوع الإشعار (invoice_whatsapp, reminder_email, etc)
  invoice_id?: string;           // → invoices
  advertiser_id: string;         // → advertisers
  
  recipient: string;             // رقم/بريد المستلم
  message: string;               // نص الرسالة
  
  status: 'sent' | 'failed' | 'pending';
  sent_at?: Timestamp;           // وقت الإرسال
  error?: string;                // في حالة الفشل
  
  created_at: Timestamp;
}
```

**العلاقات:**
```
notifications (M) ──→ (1) invoices      "إشعار قد يكون مرتبط بفاتورة"
notifications (M) ──→ (1) advertisers   "إشعار يُرسل لمعلن واحد"
```

---

## 🔗 مخطط العلاقات الكامل {#relationships-diagram}

```
┌──────────────────────────────────────────────────────────────────┐
│                     نظام إعلانات جدة                             │
│                    Schema & Relationships                        │
└──────────────────────────────────────────────────────────────────┘

                          advertisers
                          (المعلنين)
                               │
                    ┌──────────┼──────────┐
                    │          │          │
                    ▼          ▼          ▼
             subscriptions  statistics  reminders
             (الاشتراكات)  (إحصائيات)  (تذكيرات)
                    │
          ┌─────────┼─────────┐
          │         │         │
          ▼         ▼         ▼
      invoices  payments  refunds
      (فواتير)  (مدفوعات) (استردادات)
          │
    ┌─────┼─────┐
    │     │     │
    ▼     ▼     ▼
invoice_audits  reminders  notifications
(تدقيق)       (تذكيرات)   (إشعارات)


            plans
           (الباقات)
              │
       ┌──────┴──────┐
       │             │
       ▼             ▼
  subscriptions  ad_requests
  (اشتراكات)    (طلبات)


Legend:
─────────
(1) ──→ (M)  : علاقة واحد لمتعدد (One-to-Many)
(M) ──→ (1)  : علاقة متعدد لواحد (Many-to-One)
```

---

## 📝 أمثلة على الاستعلامات {#query-examples}

### مثال 1: جلب جميع اشتراكات معلن معين

```javascript
// Firebase Query
const subscriptions = await db
  .collection('subscriptions')
  .where('advertiser_id', '==', 'adv_xyz123')
  .orderBy('created_at', 'desc')
  .get();

// النتيجة: جميع الاشتراكات المرتبطة بهذا المعلن
```

---

### مثال 2: جلب فاتورة مع جميع المدفوعات

```javascript
// 1. جلب الفاتورة
const invoice = await db.collection('invoices').doc('inv_def456').get();

// 2. جلب المدفوعات المرتبطة
const payments = await db
  .collection('payments')
  .where('invoice_id', '==', 'inv_def456')
  .orderBy('payment_date', 'desc')
  .get();

// النتيجة: الفاتورة + جميع الدفعات
```

---

### مثال 3: جلب ملخص مالي كامل لمعلن

```javascript
async function getAdvertiserFinancialSummary(advertiserId) {
  // 1. جلب المعلن
  const advertiser = await db.collection('advertisers').doc(advertiserId).get();
  
  // 2. جلب جميع الاشتراكات
  const subscriptions = await db
    .collection('subscriptions')
    .where('advertiser_id', '==', advertiserId)
    .get();
  
  // 3. لكل اشتراك، جلب الفواتير والمدفوعات
  const allData = [];
  
  for (const sub of subscriptions.docs) {
    const subData = sub.data();
    
    // الفواتير
    const invoices = await db
      .collection('invoices')
      .where('subscription_id', '==', sub.id)
      .get();
    
    // المدفوعات
    const payments = await db
      .collection('payments')
      .where('subscription_id', '==', sub.id)
      .get();
    
    allData.push({
      subscription: subData,
      invoices: invoices.docs.map(d => d.data()),
      payments: payments.docs.map(d => d.data())
    });
  }
  
  return {
    advertiser: advertiser.data(),
    subscriptions: allData
  };
}
```

---

### مثال 4: جلب جميع الفواتير غير المدفوعة

```javascript
const unpaidInvoices = await db
  .collection('invoices')
  .where('status', '==', 'unpaid')
  .orderBy('due_date', 'asc')
  .get();

// النتيجة: الفواتير مرتبة حسب تاريخ الاستحقاق
```

---

### مثال 5: جلب التذكيرات المعلقة

```javascript
const pendingReminders = await db
  .collection('reminders')
  .where('status', '==', 'pending')
  .where('scheduled_date', '<=', new Date())
  .get();

// النتيجة: التذكيرات الجاهزة للإرسال
```

---

## ✅ التحقق من البنية {#verification}

### استخدام السكريبت

```bash
# 1. تثبيت المتطلبات
npm install firebase-admin

# 2. تشغيل السكريبت
node scripts/check-firebase-structure.js
```

### النتيجة المتوقعة

```
🔍 بدء فحص بنية Firebase...

Project ID: jeddah-ads-46daa
================================================================================

📦 فحص: advertisers... ✅ موجود (15 وثائق)
📦 فحص: plans... ✅ موجود (6 وثائق)
📦 فحص: subscriptions... ✅ موجود (42 وثائق)
📦 فحص: invoices... ✅ موجود (42 وثائق)
📦 فحص: payments... ✅ موجود (89 وثائق)
📦 فحص: ad_requests... ✅ موجود (8 وثائق)
📦 فحص: statistics... ✅ موجود (350 وثائق)
📦 فحص: admins... ✅ موجود (2 وثائق)

📦 فحص: invoice_audits... ❌ غير موجود
📦 فحص: reminders... ❌ غير موجود
📦 فحص: refunds... ❌ غير موجود
📦 فحص: notifications... ❌ غير موجود

================================================================================
📊 ملخص النتائج
================================================================================

✅ Collections موجودة: 8
❌ Collections مفقودة: 4 (جميعها اختيارية للتحسينات)

💡 هل تريد إنشاء Collections المفقودة؟
الإجابة (y/n):
```

---

## 🎯 ملاحظات مهمة

### 1. الربط بين الجداول

**✅ مؤكد ومُختبر:**
- subscriptions → advertisers ✅
- subscriptions → plans ✅
- invoices → subscriptions ✅
- payments → subscriptions ✅
- payments → invoices ✅
- statistics → advertisers ✅

**🆕 جديد (للتحسينات):**
- invoice_audits → invoices
- reminders → invoices/subscriptions/advertisers
- refunds → subscriptions/invoices/payments
- notifications → invoices/advertisers

---

### 2. التكامل الكامل

```typescript
// عند إنشاء اشتراك جديد:
FinancialService.createSubscriptionWithInvoice({
  advertiser_id: 'adv_xyz',  // ← من advertisers
  plan_id: 'plan_monthly',   // ← من plans
  ...
});

// يتم تلقائياً:
// 1. إنشاء subscription
// 2. إنشاء invoice
// 3. إنشاء payment (إن وجدت دفعة أولية)
// 4. إنشاء invoice_audit (تسجيل العملية)
```

---

### 3. الفهرسة (Indexes)

**المطلوبة في Firestore:**
```
subscriptions:
  - advertiser_id (ASC), created_at (DESC)
  - status (ASC), end_date (ASC)

invoices:
  - subscription_id (ASC), created_at (DESC)
  - status (ASC), due_date (ASC)

payments:
  - subscription_id (ASC), payment_date (DESC)
  - invoice_id (ASC), payment_date (DESC)

statistics:
  - advertiser_id (ASC), date (DESC)

reminders:
  - status (ASC), scheduled_date (ASC)
  - advertiser_id (ASC), status (ASC)
```

---

## 📞 الدعم

لأي استفسارات:
1. راجع هذا الملف أولاً
2. استخدم السكريبت للتحقق: `node scripts/check-firebase-structure.js`
3. راجع التقارير الشاملة الأخرى

---

**✅ البنية موثقة بالكامل ومُختبرة!**
**آخر تحديث: نوفمبر 2024**

