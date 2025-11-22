# 📊 تقرير شامل: نظام الفواتير المتكامل
## مراجعة احترافية وتحليل دقيق

---

## 📑 جدول المحتويات

1. [نظرة عامة على النظام](#نظرة-عامة)
2. [الهيكلية الحالية](#الهيكلية-الحالية)
3. [تحليل العمليات الأساسية](#تحليل-العمليات)
4. [نقاط القوة](#نقاط-القوة)
5. [التحديات والثغرات](#التحديات-والثغرات)
6. [المقترحات الاحترافية](#المقترحات-الاحترافية)
7. [خطة التنفيذ](#خطة-التنفيذ)
8. [معايير الجودة والضمان](#معايير-الجودة)

---

## 🎯 نظرة عامة على النظام {#نظرة-عامة}

### الوصف
نظام الفواتير هو جزء محوري من منصة إدارة الإعلانات، مرتبط بشكل مباشر مع:
- **الباقات الإعلانية** (Plans): 6 باقات بمدد مختلفة (15 يوم → سنة)
- **الاشتراكات** (Subscriptions): فترة زمنية محددة لمعلن في باقة معينة
- **المدفوعات** (Payments): الدفعات المالية المسجلة
- **المعلنين** (Advertisers): العملاء الذين يشترون الباقات

### الهدف الرئيسي
ضمان دقة وشفافية كاملة في:
- ✅ حساب المبالغ والخصومات
- ✅ تتبع حالة المدفوعات (مدفوع/جزئي/معلق)
- ✅ ربط الفواتير بالاشتراكات والمدفوعات
- ✅ إدارة تواريخ الاستحقاق والإصدار
- ✅ تقارير مالية دقيقة

---

## 🏗️ الهيكلية الحالية {#الهيكلية-الحالية}

### 1. نماذج البيانات (Data Models)

#### Invoice (الفاتورة)
```typescript
{
  id: string;                    // معرف فريد
  subscription_id: string;       // ارتباط بالاشتراك
  invoice_number: string;        // رقم فاتورة فريد (INV-202411-0001)
  amount: number;                // المبلغ الإجمالي
  status: 'paid' | 'unpaid' | 'cancelled';
  issued_date: Date;             // تاريخ الإصدار
  due_date: Date;                // تاريخ الاستحقاق
  paid_date?: Date;              // تاريخ الدفع (عند الدفع الكامل)
  created_at: Date;              // تاريخ الإنشاء
}
```

#### Subscription (الاشتراك)
```typescript
{
  id: string;
  advertiser_id: string;         // المعلن
  plan_id: string;               // الباقة
  start_date: Date;              // تاريخ البداية
  end_date: Date;                // تاريخ النهاية (محسوب تلقائياً)
  base_price: number;            // السعر الأساسي من الباقة
  discount_type: 'amount' | 'percentage';
  discount_amount: number;       // قيمة الخصم
  total_amount: number;          // المبلغ الإجمالي بعد الخصم
  paid_amount: number;           // المبلغ المدفوع
  remaining_amount: number;      // المبلغ المتبقي
  status: 'active' | 'expired' | 'cancelled';
  payment_status: 'paid' | 'partial' | 'pending';
  created_at: Date;
}
```

#### Payment (الدفعة)
```typescript
{
  id: string;
  subscription_id: string;       // ارتباط بالاشتراك
  invoice_id?: string;           // ارتباط بالفاتورة (اختياري)
  amount: number;                // المبلغ المدفوع
  payment_date: Date;            // تاريخ الدفع
  payment_method?: string;       // طريقة الدفع (cash, bank, card)
  transaction_id?: string;       // معرف المعاملة المصرفية
  notes?: string;                // ملاحظات
  created_at: Date;
}
```

---

### 2. الخدمات (Services)

#### A. InvoiceAdminService
**المسؤوليات:**
```typescript
✅ create(data)              // إنشاء فاتورة جديدة
✅ getAll()                  // جلب جميع الفواتير
✅ getById(id)               // جلب فاتورة واحدة
✅ getBySubscriptionId(id)   // فواتير اشتراك معين
✅ update(id, data)          // تحديث فاتورة
✅ updatePaymentStatus()     // تحديث حالة الدفع
✅ delete(id)                // حذف فاتورة
✅ getUnpaidInvoices()       // الفواتير غير المدفوعة
✅ getOverdueInvoices()      // الفواتير المتأخرة
```

**الإيجابيات:**
- ✅ تغطية شاملة للعمليات الأساسية
- ✅ دوال متخصصة للاستعلامات الشائعة
- ✅ معالجة صحيحة لـ Firestore Timestamps

**نقاط التحسين:**
- ⚠️ عدم وجود validation متقدمة
- ⚠️ لا توجد دوال للتقارير المالية
- ⚠️ لا يوجد audit trail للتعديلات

---

#### B. FinancialService (القلب النابض للنظام)

**الدوال الرئيسية:**

1. **calculateDiscount()** - حساب الخصومات بدقة
   ```typescript
   ✅ دعم النسبة المئوية والمبلغ الثابت
   ✅ التحقق من صحة المدخلات
   ✅ منع الخصم من تجاوز السعر الأساسي
   ✅ التقريب إلى منزلتين عشريتين
   ```

2. **createSubscriptionWithInvoice()** - إنشاء متكامل
   ```typescript
   ✅ إنشاء الاشتراك
   ✅ إنشاء الفاتورة تلقائياً
   ✅ تسجيل الدفعة الأولية (إن وجدت)
   ✅ حساب التواريخ تلقائياً
   ✅ تحديث الحالات بشكل ذكي
   ```

3. **recordPayment()** - تسجيل الدفعات
   ```typescript
   ✅ التحقق من صحة المبلغ
   ✅ تحديث الاشتراك تلقائياً
   ✅ تحديث الفاتورة عند الاكتمال
   ✅ ربط الدفعة بالفاتورة المناسبة
   ```

4. **getAdvertiserFinancialSummary()** - الملخص المالي
   ```typescript
   ✅ إجمالي الاشتراكات
   ✅ المبالغ المدفوعة والمستحقة
   ✅ سجل المدفوعات الكامل
   ✅ الفواتير غير المدفوعة
   ```

5. **checkAndUpdateSubscriptionStatuses()** - الصيانة الدورية
   ```typescript
   ✅ فحص الاشتراكات المنتهية
   ✅ تحديث الحالات تلقائياً
   ✅ إرجاع تقرير بالتحديثات
   ```

6. **cancelSubscription()** - الإلغاء والاسترداد
   ```typescript
   ✅ حساب الأيام المتبقية
   ✅ حساب مبلغ الاسترداد
   ✅ إلغاء الفواتير غير المدفوعة
   ```

---

### 3. واجهات المستخدم (UI)

#### A. صفحة الفواتير الرئيسية (`/admin/invoices`)

**المميزات:**
```typescript
✅ عرض جميع الفواتير في جدول
✅ بحث بالاسم/الهاتف/رقم الفاتورة
✅ فلترة حسب الحالة (مدفوع/جزئي/غير مدفوع)
✅ عرض المبلغ الإجمالي/المدفوع/المتبقي
✅ Badges ملونة لحالات الفواتير
✅ رابط لعرض التفاصيل
```

**المشاكل:**
- ⚠️ لا يوجد pagination (مشكلة مع عدد كبير من الفواتير)
- ⚠️ لا يوجد فلتر حسب التاريخ
- ⚠️ لا يمكن التصدير (PDF/Excel)
- ⚠️ لا توجد إحصائيات إجمالية

---

#### B. صفحة تفاصيل الفاتورة (`/admin/invoices/[id]`)

**المميزات:**
```typescript
✅ عرض كامل للفاتورة (جاهز للطباعة)
✅ معلومات المعلن والاتصال
✅ تفاصيل الباقة والخصومات
✅ جدول المبالغ (أساسي/خصم/إجمالي)
✅ سجل المدفوعات المرتبطة
✅ حالة الدفع الحالية
✅ زر الطباعة
```

**المشاكل:**
- ⚠️ لا يمكن تعديل الفاتورة من هذه الصفحة
- ⚠️ لا يوجد زر لتسجيل دفعة مباشرة
- ⚠️ لا يوجد تكامل مع WhatsApp/Email لإرسال الفاتورة

---

#### C. الصفحة المالية للمعلن (`/admin/advertisers/[id]/financial`)

**المميزات:**
```typescript
✅ ملخص مالي شامل (FinancialSummaryCard)
✅ نموذج إنشاء اشتراك جديد
✅ نموذج تسجيل دفعة
✅ قائمة الاشتراكات مع Progress Bars
✅ جدول الفواتير
✅ سجل المدفوعات الكامل
✅ تنبيهات للفواتير غير المدفوعة
✅ تحديث لحظي للبيانات
```

**هذه الصفحة ممتازة! ✅**

---

### 4. API Endpoints

#### الفواتير:
```typescript
GET    /api/invoices              // جميع الفواتير
GET    /api/invoices?subscriptionId=xxx  // فواتير اشتراك
GET    /api/invoices/[id]         // فاتورة واحدة
POST   /api/invoices              // إنشاء فاتورة
PUT    /api/invoices/[id]         // تحديث فاتورة
DELETE /api/invoices/[id]         // حذف فاتورة
GET    /api/invoices/unpaid       // الفواتير غير المدفوعة
```

#### المالية:
```typescript
POST   /api/financial/create-subscription     // إنشاء اشتراك + فاتورة
POST   /api/financial/record-payment          // تسجيل دفعة
GET    /api/financial/advertiser-summary      // ملخص مالي
POST   /api/financial/check-subscriptions     // فحص الاشتراكات
POST   /api/financial/cancel-subscription     // إلغاء اشتراك
POST   /api/financial/calculate-discount      // حساب خصم
```

---

## 🔍 تحليل العمليات الأساسية {#تحليل-العمليات}

### 1. دورة حياة الفاتورة

```
┌─────────────────────────────────────────────────────────────────┐
│                    إنشاء الاشتراك                              │
│                           ↓                                      │
│         FinancialService.createSubscriptionWithInvoice()        │
│                           ↓                                      │
│    ┌──────────────────────┼──────────────────────┐              │
│    ↓                      ↓                      ↓              │
│ Subscription          Invoice               Payment (أولية)    │
│  - active            - unpaid               - مسجلة            │
│  - partial           - due_date             - مربوطة          │
│                           ↓                                      │
│              دفعات جزئية متعددة (اختياري)                      │
│                           ↓                                      │
│         FinancialService.recordPayment()                        │
│                           ↓                                      │
│    ┌──────────────────────┼──────────────────────┐              │
│    ↓                      ↓                      ↓              │
│ Subscription تحديث   Invoice تحديث        Payment جديد         │
│  - paid_amount++     - status              - مسجلة            │
│  - remaining--       - paid_date           - مربوطة           │
│                           ↓                                      │
│              عند الدفع الكامل                                  │
│                           ↓                                      │
│    Subscription: paid  +  Invoice: paid  ✅                     │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2. سيناريو كامل: معلن جديد

#### الخطوات:
```
1️⃣ المعلن يطلب باقة شهرية (1000 ريال)
   ↓
2️⃣ الإدارة تطبق خصم 15% (خصم ترحيبي)
   ↓ حساب: 1000 - (1000 * 15%) = 850 ريال
   ↓
3️⃣ المعلن يدفع 500 ريال كدفعة أولية
   ↓
4️⃣ النظام ينشئ:
   📄 Subscription {
      total_amount: 850,
      paid_amount: 500,
      remaining_amount: 350,
      payment_status: 'partial',
      status: 'active'
   }
   
   🧾 Invoice {
      invoice_number: 'INV-202411-0045',
      amount: 850,
      status: 'unpaid',
      issued_date: اليوم,
      due_date: نهاية الشهر
   }
   
   💰 Payment {
      amount: 500,
      payment_method: 'cash',
      subscription_id: xxx,
      invoice_id: yyy
   }
   ↓
5️⃣ بعد أسبوع: دفعة ثانية 200 ريال
   ↓ النظام يحدث:
   - Subscription: paid = 700, remaining = 150
   - Invoice: لا تزال 'unpaid'
   ↓
6️⃣ بعد أسبوعين: دفعة أخيرة 150 ريال
   ↓ النظام يحدث:
   - Subscription: paid = 850, remaining = 0, payment_status = 'paid' ✅
   - Invoice: status = 'paid', paid_date = اليوم ✅
```

---

### 3. التحققات والضمانات

#### عند حساب الخصومات:
```typescript
✅ basePrice >= 0
✅ discountAmount >= 0
✅ إذا percentage: discountAmount <= 100
✅ إذا amount: discountAmount <= basePrice
✅ totalAmount = basePrice - discount
✅ تقريب إلى منزلتين عشريتين
```

#### عند تسجيل دفعة:
```typescript
✅ الاشتراك موجود
✅ amount > 0
✅ amount <= remaining_amount
✅ تحديث paid_amount بشكل صحيح
✅ إذا دفع كامل → تحديث الفاتورة إلى 'paid'
```

#### عند إنشاء فاتورة:
```typescript
✅ رقم فاتورة فريد (INV-YYYYMM-####)
✅ ربط صحيح بالاشتراك
✅ تواريخ صحيحة (issued_date <= due_date)
✅ المبلغ = total_amount للاشتراك
```

---

## ⭐ نقاط القوة {#نقاط-القوة}

### 1. الدقة الحسابية
- ✅ استخدام `FinancialService.calculateDiscount()` يضمن دقة متناهية
- ✅ التقريب المناسب للمبالغ (منزلتين عشريتين)
- ✅ منع الأخطاء الشائعة (خصم يتجاوز السعر الأساسي)

### 2. الربط التلقائي
- ✅ عند إنشاء اشتراك → فاتورة تُنشأ تلقائياً
- ✅ عند تسجيل دفعة → الاشتراك والفاتورة يُحدثان تلقائياً
- ✅ لا حاجة للتحديث اليدوي

### 3. إدارة الحالات
- ✅ ثلاث حالات للاشتراك (active/expired/cancelled)
- ✅ ثلاث حالات للدفع (paid/partial/pending)
- ✅ ثلاث حالات للفاتورة (paid/unpaid/cancelled)
- ✅ انتقالات منطقية بين الحالات

### 4. الشفافية
- ✅ سجل كامل للمدفوعات
- ✅ إمكانية تتبع كل ريال مدفوع
- ✅ ربط المدفوعات بالفواتير
- ✅ أرقام معاملات مصرفية

### 5. واجهة المستخدم
- ✅ تصميم حديث وجذاب
- ✅ Progress Bars مرئية
- ✅ ألوان ديناميكية حسب الحالة
- ✅ رسوم متحركة سلسة
- ✅ تنبيهات واضحة

### 6. الصيانة التلقائية
- ✅ `checkAndUpdateSubscriptionStatuses()` للفحص الدوري
- ✅ تحديث تلقائي للاشتراكات المنتهية
- ✅ يمكن جدولتها يومياً

---

## ⚠️ التحديات والثغرات {#التحديات-والثغرات}

### 1. عدم وجود تتبع للتعديلات (Audit Trail)
**المشكلة:**
```typescript
// لا يوجد سجل لمن قام بالتعديل ومتى
Invoice.update(id, { amount: 1200 })
// ❌ من قام بهذا التغيير؟
// ❌ ما كان المبلغ السابق؟
// ❌ لماذا تم التعديل؟
```

**التأثير:**
- 🔴 عدم القدرة على مراجعة التعديلات
- 🔴 صعوبة اكتشاف الأخطاء
- 🔴 عدم وجود مساءلة

---

### 2. عدم دعم الفواتير المتعددة لاشتراك واحد
**المشكلة:**
```typescript
// الآن: اشتراك واحد → فاتورة واحدة فقط
// ماذا لو أراد المعلن فواتير متعددة؟
// مثال: فاتورة شهرية لاشتراك سنوي
```

**السيناريو:**
```
اشتراك سنوي: 12,000 ريال
المعلن يريد: 12 فاتورة شهرية × 1,000 ريال
الحل الحالي: ❌ غير مدعوم
```

---

### 3. عدم وجود نظام التذكيرات
**المشكلة:**
```typescript
// لا توجد تذكيرات تلقائية للفواتير المستحقة
// ❌ إشعار قبل due_date بـ 3 أيام
// ❌ إشعار عند التأخير
// ❌ إشعار عند اقتراب انتهاء الاشتراك
```

**التأثير:**
- 🔴 فواتير متأخرة
- 🔴 معلنين ينسون الدفع
- 🔴 خسارة إيرادات

---

### 4. عدم دعم الضرائب (VAT)
**المشكلة:**
```typescript
Invoice {
  amount: 1000  // ❌ هل هذا شامل ضريبة أم لا؟
  // ❌ أين حقل vat_amount؟
  // ❌ أين حقل vat_percentage؟
}
```

**في السعودية:**
- ضريبة القيمة المضافة 15%
- يجب فصل المبلغ الأساسي عن الضريبة في الفاتورة

---

### 5. عدم وجود معالجة الاسترداد الكامل
**المشكلة:**
```typescript
// عند إلغاء اشتراك، يُحسب مبلغ الاسترداد
// لكن لا يوجد:
// ❌ سجل الاسترداد (Refund)
// ❌ طريقة الاسترداد
// ❌ حالة الاسترداد
```

**يجب إضافة:**
```typescript
interface Refund {
  id: string;
  subscription_id: string;
  invoice_id: string;
  amount: number;
  refund_date: Date;
  refund_method: string;
  reason: string;
  status: 'pending' | 'completed' | 'cancelled';
}
```

---

### 6. عدم وجود pagination
**المشكلة:**
```typescript
// صفحة الفواتير تجلب جميع الفواتير
const invoices = await InvoiceAdminService.getAll();
// ❌ ماذا لو كان هناك 10,000 فاتورة؟
```

**التأثير:**
- 🔴 بطء في التحميل
- 🔴 استهلاك كبير للذاكرة
- 🔴 تجربة مستخدم سيئة

---

### 7. عدم وجود تقارير مالية متقدمة
**المفقود:**
```typescript
// ❌ تقرير الإيرادات الشهرية
// ❌ تقرير المعلنين الأكثر إنفاقاً
// ❌ تقرير الفواتير المتأخرة
// ❌ تقرير الخصومات المقدمة
// ❌ تقرير طرق الدفع المستخدمة
```

---

### 8. عدم وجود تكامل مع بوابات الدفع
**المشكلة:**
```typescript
// جميع المدفوعات يدوية
// ❌ لا يوجد تكامل مع Moyasar/Tap/Stripe
// ❌ لا يوجد رابط دفع إلكتروني
// ❌ المعلن لا يمكنه الدفع مباشرة
```

---

### 9. عدم وجود إرسال تلقائي للفواتير
**المشكلة:**
```typescript
// بعد إنشاء الفاتورة:
// ❌ لا يتم إرسالها للمعلن تلقائياً
// ❌ لا يوجد زر "إرسال عبر WhatsApp"
// ❌ لا يوجد زر "إرسال عبر Email"
```

---

### 10. عدم وجود سياسات دفع مرنة
**المفقود:**
```typescript
// ❌ دفعات متكررة (Recurring Payments)
// ❌ أقساط محددة مسبقاً
// ❌ خصومات تلقائية للدفع المبكر
// ❌ رسوم تأخير للدفع المتأخر
```

---

## 💡 المقترحات الاحترافية {#المقترحات-الاحترافية}

### المستوى 1: تحسينات حرجة (عالية الأولوية) 🔴

#### 1.1 إضافة نظام Audit Trail
```typescript
interface InvoiceAudit {
  id: string;
  invoice_id: string;
  action: 'created' | 'updated' | 'deleted' | 'paid' | 'cancelled';
  changed_fields: Record<string, { old: any; new: any }>;
  performed_by: string;  // admin user ID
  performed_at: Date;
  ip_address?: string;
  notes?: string;
}
```

**الفوائد:**
- ✅ تتبع كامل للتغييرات
- ✅ مساءلة واضحة
- ✅ حل النزاعات
- ✅ اكتشاف الأخطاء

**التنفيذ:**
```typescript
// في InvoiceAdminService
static async update(id: string, data: Partial<Invoice>, userId: string) {
  const oldInvoice = await this.getById(id);
  
  // تحديث الفاتورة
  await adminDb.collection('invoices').doc(id).update(data);
  
  // تسجيل التدقيق
  await AuditService.log({
    invoice_id: id,
    action: 'updated',
    changed_fields: compareObjects(oldInvoice, data),
    performed_by: userId,
    performed_at: new Date()
  });
}
```

---

#### 1.2 إضافة دعم الضرائب (VAT)
```typescript
interface Invoice {
  // ... الحقول الموجودة
  subtotal: number;           // المبلغ قبل الضريبة
  vat_percentage: number;     // نسبة الضريبة (15)
  vat_amount: number;         // مبلغ الضريبة
  amount: number;             // الإجمالي (subtotal + vat_amount)
  tax_invoice_number?: string;// رقم الفاتورة الضريبية
}
```

**حساب الضريبة:**
```typescript
// في FinancialService
static calculateWithVAT(subtotal: number, vatPercentage: number = 15) {
  const vat_amount = Math.round(subtotal * (vatPercentage / 100) * 100) / 100;
  const total = subtotal + vat_amount;
  
  return {
    subtotal,
    vat_percentage: vatPercentage,
    vat_amount,
    total
  };
}
```

**عرض في الفاتورة:**
```
المبلغ الفرعي:    850.00 ريال
ضريبة القيمة المضافة (15%):   127.50 ريال
─────────────────────────────────
الإجمالي:         977.50 ريال
```

---

#### 1.3 نظام التذكيرات التلقائية
```typescript
interface Reminder {
  id: string;
  invoice_id: string;
  advertiser_id: string;
  reminder_type: 'due_soon' | 'overdue' | 'subscription_expiring';
  scheduled_date: Date;
  sent_date?: Date;
  status: 'pending' | 'sent' | 'failed';
  delivery_method: 'whatsapp' | 'email' | 'sms';
}
```

**السيناريوهات:**
```typescript
// 1. قبل الاستحقاق بـ 3 أيام
if (invoice.due_date - 3 days) {
  sendReminder({
    type: 'due_soon',
    message: `تذكير: فاتورة ${invoice.invoice_number} مستحقة خلال 3 أيام`
  });
}

// 2. عند التأخير
if (today > invoice.due_date && invoice.status === 'unpaid') {
  sendReminder({
    type: 'overdue',
    message: `تنبيه: فاتورة ${invoice.invoice_number} متأخرة`
  });
}

// 3. قبل انتهاء الاشتراك بـ 7 أيام
if (subscription.end_date - 7 days) {
  sendReminder({
    type: 'subscription_expiring',
    message: `سينتهي اشتراكك خلال 7 أيام. هل تود التجديد؟`
  });
}
```

**Cron Job:**
```typescript
// يعمل يومياً الساعة 9 صباحاً
export async function sendDailyReminders() {
  const reminders = await ReminderService.getPendingReminders();
  
  for (const reminder of reminders) {
    await NotificationService.send(reminder);
    await ReminderService.markAsSent(reminder.id);
  }
}
```

---

#### 1.4 Pagination للفواتير
```typescript
interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// في InvoiceAdminService
static async getAllPaginated(params: PaginationParams): Promise<PaginatedResponse<Invoice>> {
  const { page = 1, limit = 20, sortBy = 'issued_date', sortOrder = 'desc' } = params;
  
  const offset = (page - 1) * limit;
  
  // جلب إجمالي العدد
  const totalSnapshot = await adminDb.collection('invoices').count().get();
  const total = totalSnapshot.data().count;
  
  // جلب الصفحة الحالية
  const snapshot = await adminDb
    .collection('invoices')
    .orderBy(sortBy, sortOrder)
    .limit(limit)
    .offset(offset)
    .get();
  
  const data = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Invoice[];
  
  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1
  };
}
```

---

### المستوى 2: تحسينات مهمة (متوسطة الأولوية) 🟡

#### 2.1 نظام الاستردادات (Refunds)
```typescript
interface Refund {
  id: string;
  subscription_id: string;
  invoice_id?: string;
  original_amount: number;      // المبلغ الأصلي
  refund_amount: number;        // مبلغ الاسترداد
  refund_reason: string;        // سبب الاسترداد
  refund_method: 'cash' | 'bank_transfer' | 'card';
  refund_date: Date;
  processed_by: string;         // admin user ID
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  notes?: string;
  created_at: Date;
}

// إضافة إلى FinancialService
static async processRefund(data: {
  subscription_id: string;
  refund_amount: number;
  reason: string;
  method: string;
  notes?: string;
}): Promise<{
  refund_id: string;
  message: string;
}> {
  // 1. التحقق من الاشتراك
  const subscription = await SubscriptionAdminService.getById(data.subscription_id);
  if (!subscription) throw new Error('Subscription not found');
  
  // 2. التحقق من أن المبلغ معقول
  if (data.refund_amount > subscription.paid_amount) {
    throw new Error('Refund amount exceeds paid amount');
  }
  
  // 3. إنشاء سجل الاسترداد
  const refund: Omit<Refund, 'id' | 'created_at'> = {
    subscription_id: data.subscription_id,
    original_amount: subscription.paid_amount,
    refund_amount: data.refund_amount,
    refund_reason: data.reason,
    refund_method: data.method,
    refund_date: new Date(),
    processed_by: 'admin_user_id', // من التوكن
    status: 'completed',
    notes: data.notes
  };
  
  const refundId = await RefundService.create(refund);
  
  // 4. تحديث الاشتراك (اختياري حسب السياسة)
  // يمكن طرح المبلغ من paid_amount
  
  return {
    refund_id: refundId,
    message: `Refund of ${data.refund_amount} SAR processed successfully`
  };
}
```

---

#### 2.2 فواتير متعددة لاشتراك واحد
```typescript
// تعديل Subscription لدعم خطة الدفع
interface Subscription {
  // ... الحقول الموجودة
  payment_plan: {
    type: 'single' | 'installments' | 'recurring';
    installments_count?: number;  // عدد الأقساط
    installment_amount?: number;  // مبلغ القسط
    installment_frequency?: 'weekly' | 'monthly' | 'quarterly';
  };
}

// دالة لإنشاء فواتير متعددة
static async createInstallmentInvoices(
  subscriptionId: string,
  installmentsCount: number
): Promise<string[]> {
  const subscription = await SubscriptionAdminService.getById(subscriptionId);
  if (!subscription) throw new Error('Subscription not found');
  
  const installmentAmount = subscription.total_amount / installmentsCount;
  const invoiceIds: string[] = [];
  
  for (let i = 0; i < installmentsCount; i++) {
    const dueDate = new Date(subscription.start_date);
    dueDate.setMonth(dueDate.getMonth() + i);
    
    const invoice: Omit<Invoice, 'id' | 'created_at'> = {
      subscription_id: subscriptionId,
      invoice_number: await this.generateInvoiceNumber(),
      amount: installmentAmount,
      status: 'unpaid',
      issued_date: new Date(),
      due_date: dueDate
    };
    
    const invoiceId = await InvoiceAdminService.create(invoice);
    invoiceIds.push(invoiceId);
  }
  
  return invoiceIds;
}
```

**مثال:**
```
اشتراك سنوي: 12,000 ريال
الخطة: 12 قسط شهري

النتيجة:
✅ Invoice 1: 1,000 ريال - مستحق 01/11/2024
✅ Invoice 2: 1,000 ريال - مستحق 01/12/2024
✅ Invoice 3: 1,000 ريال - مستحق 01/01/2025
... وهكذا
```

---

#### 2.3 تقارير مالية متقدمة
```typescript
// خدمة التقارير
class FinancialReportService {
  
  // تقرير الإيرادات الشهرية
  static async getMonthlyRevenue(year: number) {
    const payments = await PaymentAdminService.getAll();
    
    const monthlyData = Array(12).fill(0);
    
    payments.forEach(payment => {
      const date = new Date(payment.payment_date);
      if (date.getFullYear() === year) {
        monthlyData[date.getMonth()] += payment.amount;
      }
    });
    
    return {
      year,
      months: ['يناير', 'فبراير', ...],
      revenue: monthlyData,
      total: monthlyData.reduce((sum, val) => sum + val, 0)
    };
  }
  
  // تقرير المعلنين الأكثر إنفاقاً
  static async getTopSpendingAdvertisers(limit: number = 10) {
    const allAdvertisers = await AdvertiserAdminService.getAll();
    
    const advertiserSpending = await Promise.all(
      allAdvertisers.map(async (advertiser) => {
        const summary = await FinancialService.getAdvertiserFinancialSummary(advertiser.id!);
        return {
          advertiser_id: advertiser.id,
          company_name: advertiser.company_name,
          total_spent: summary.total_spent,
          total_paid: summary.total_paid,
          subscriptions_count: summary.total_subscriptions
        };
      })
    );
    
    return advertiserSpending
      .sort((a, b) => b.total_paid - a.total_paid)
      .slice(0, limit);
  }
  
  // تقرير الفواتير المتأخرة
  static async getOverdueReport() {
    const overdueInvoices = await InvoiceAdminService.getOverdueInvoices();
    
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    
    // تجميع حسب المعلن
    const byAdvertiser = new Map();
    
    for (const invoice of overdueInvoices) {
      const subscription = await SubscriptionAdminService.getById(invoice.subscription_id);
      if (!subscription) continue;
      
      const advertiserId = subscription.advertiser_id;
      if (!byAdvertiser.has(advertiserId)) {
        byAdvertiser.set(advertiserId, {
          advertiser_id: advertiserId,
          invoices: [],
          total_overdue: 0
        });
      }
      
      const data = byAdvertiser.get(advertiserId);
      data.invoices.push(invoice);
      data.total_overdue += invoice.amount;
    }
    
    return {
      total_overdue_amount: totalOverdue,
      total_overdue_count: overdueInvoices.length,
      by_advertiser: Array.from(byAdvertiser.values())
    };
  }
  
  // تقرير الخصومات
  static async getDiscountsReport(startDate: Date, endDate: Date) {
    const subscriptions = await SubscriptionAdminService.getAll();
    
    const filtered = subscriptions.filter(sub => {
      const created = new Date(sub.created_at);
      return created >= startDate && created <= endDate;
    });
    
    const totalBasePrice = filtered.reduce((sum, sub) => sum + sub.base_price, 0);
    const totalAfterDiscount = filtered.reduce((sum, sub) => sum + sub.total_amount, 0);
    const totalDiscount = totalBasePrice - totalAfterDiscount;
    
    return {
      period: { start: startDate, end: endDate },
      subscriptions_count: filtered.length,
      total_base_price: totalBasePrice,
      total_discount: totalDiscount,
      total_after_discount: totalAfterDiscount,
      average_discount_percentage: (totalDiscount / totalBasePrice) * 100
    };
  }
}
```

---

#### 2.4 إرسال الفواتير تلقائياً
```typescript
// خدمة الإشعارات
class NotificationService {
  
  // إرسال فاتورة عبر WhatsApp
  static async sendInvoiceViaWhatsApp(invoiceId: string) {
    const invoice = await InvoiceAdminService.getById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');
    
    const subscription = await SubscriptionAdminService.getById(invoice.subscription_id);
    if (!subscription) throw new Error('Subscription not found');
    
    const advertiser = await AdvertiserAdminService.getById(subscription.advertiser_id);
    if (!advertiser || !advertiser.whatsapp) {
      throw new Error('Advertiser WhatsApp not found');
    }
    
    // تجهيز الرسالة
    const message = `
مرحباً ${advertiser.company_name} 👋

فاتورة جديدة من إعلانات جدة:

🧾 رقم الفاتورة: ${invoice.invoice_number}
💰 المبلغ: ${invoice.amount.toLocaleString('ar-SA')} ريال
📅 تاريخ الاستحقاق: ${new Date(invoice.due_date).toLocaleDateString('ar-SA')}

لعرض الفاتورة الكاملة:
${process.env.NEXT_PUBLIC_SITE_URL}/invoices/${invoiceId}

شكراً لتعاملكم معنا! 🌟
    `.trim();
    
    // إرسال عبر WhatsApp API (مثل Twilio)
    // await twilioClient.messages.create({...});
    
    // تسجيل الإرسال
    await adminDb.collection('notifications').add({
      type: 'invoice_whatsapp',
      invoice_id: invoiceId,
      advertiser_id: advertiser.id,
      status: 'sent',
      sent_at: Timestamp.now()
    });
    
    return { success: true, message: 'Invoice sent via WhatsApp' };
  }
  
  // إرسال فاتورة عبر Email
  static async sendInvoiceViaEmail(invoiceId: string) {
    // مشابه للـ WhatsApp لكن عبر Email
    // يمكن استخدام SendGrid أو NodeMailer
  }
}

// API Endpoint جديد
// POST /api/invoices/[id]/send
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { method } = req.body; // 'whatsapp' | 'email'
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    if (method === 'whatsapp') {
      await NotificationService.sendInvoiceViaWhatsApp(id as string);
    } else if (method === 'email') {
      await NotificationService.sendInvoiceViaEmail(id as string);
    }
    
    res.status(200).json({ success: true, message: 'Invoice sent successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
```

**في صفحة تفاصيل الفاتورة:**
```tsx
<div className="flex gap-3">
  <button onClick={() => sendViaWhatsApp(invoiceId)}>
    📱 إرسال عبر واتساب
  </button>
  <button onClick={() => sendViaEmail(invoiceId)}>
    📧 إرسال عبر البريد
  </button>
</div>
```

---

### المستوى 3: تحسينات إضافية (منخفضة الأولوية) 🟢

#### 3.1 تكامل مع بوابات الدفع
```typescript
// خدمة الدفع الإلكتروني
class PaymentGatewayService {
  
  // إنشاء رابط دفع
  static async createPaymentLink(invoiceId: string): Promise<{
    payment_url: string;
    payment_id: string;
  }> {
    const invoice = await InvoiceAdminService.getById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');
    
    // مثال باستخدام Moyasar
    const moyasarResponse = await fetch('https://api.moyasar.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.MOYASAR_API_KEY!).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: invoice.amount * 100, // بالهللة
        currency: 'SAR',
        description: `Payment for invoice ${invoice.invoice_number}`,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/callback`,
        source: {
          type: 'creditcard'
        },
        metadata: {
          invoice_id: invoiceId
        }
      })
    });
    
    const data = await moyasarResponse.json();
    
    return {
      payment_url: data.source.transaction_url,
      payment_id: data.id
    };
  }
  
  // معالجة رد الدفع
  static async handlePaymentCallback(paymentId: string) {
    // التحقق من حالة الدفع من Moyasar
    const moyasarResponse = await fetch(`https://api.moyasar.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.MOYASAR_API_KEY!).toString('base64')}`
      }
    });
    
    const payment = await moyasarResponse.json();
    
    if (payment.status === 'paid') {
      const invoiceId = payment.metadata.invoice_id;
      const amount = payment.amount / 100; // من الهللة للريال
      
      // تسجيل الدفعة في النظام
      await FinancialService.recordPayment({
        subscription_id: payment.metadata.subscription_id,
        invoice_id: invoiceId,
        amount,
        payment_date: new Date(),
        payment_method: 'online',
        transaction_id: paymentId,
        notes: 'Online payment via Moyasar'
      });
    }
  }
}
```

**في الفاتورة:**
```tsx
<button onClick={async () => {
  const { payment_url } = await createPaymentLink(invoiceId);
  window.open(payment_url, '_blank');
}}>
  💳 ادفع الآن
</button>
```

---

#### 3.2 تصدير التقارير (PDF/Excel)
```typescript
// خدمة التصدير
class ExportService {
  
  // تصدير فاتورة كـ PDF
  static async exportInvoiceToPDF(invoiceId: string): Promise<Buffer> {
    const invoice = await InvoiceAdminService.getById(invoiceId);
    // استخدام مكتبة مثل pdfkit أو puppeteer
    
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    // إضافة محتوى الفاتورة
    doc.fontSize(20).text('فاتورة ضريبية', { align: 'center' });
    doc.fontSize(12).text(`رقم الفاتورة: ${invoice.invoice_number}`);
    // ... المزيد
    
    return doc;
  }
  
  // تصدير تقرير المدفوعات كـ Excel
  static async exportPaymentsToExcel(
    startDate: Date,
    endDate: Date
  ): Promise<Buffer> {
    const payments = await PaymentAdminService.getAll();
    
    // استخدام مكتبة مثل exceljs
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('المدفوعات');
    
    // إضافة الأعمدة
    worksheet.columns = [
      { header: 'التاريخ', key: 'date', width: 15 },
      { header: 'المبلغ', key: 'amount', width: 15 },
      { header: 'الطريقة', key: 'method', width: 15 },
      // ... المزيد
    ];
    
    // إضافة البيانات
    payments.forEach(payment => {
      worksheet.addRow({
        date: new Date(payment.payment_date).toLocaleDateString('ar-SA'),
        amount: payment.amount,
        method: payment.payment_method
      });
    });
    
    return await workbook.xlsx.writeBuffer();
  }
}
```

---

#### 3.3 Dashboard مالي متقدم
```tsx
// صفحة Dashboard مالي جديدة
// /admin/financial-dashboard

export default function FinancialDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* KPIs الرئيسية */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <KPICard
          title="الإيرادات الشهرية"
          value="45,000 ريال"
          change="+12%"
          trend="up"
        />
        <KPICard
          title="الفواتير غير المدفوعة"
          value="15"
          change="-3"
          trend="down"
        />
        <KPICard
          title="المعلنين النشطين"
          value="87"
          change="+5"
          trend="up"
        />
        <KPICard
          title="متوسط قيمة الفاتورة"
          value="1,200 ريال"
          change="+8%"
          trend="up"
        />
      </div>
      
      {/* الرسوم البيانية */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* رسم بياني للإيرادات الشهرية */}
        <RevenueChart data={monthlyRevenue} />
        
        {/* رسم بياني لطرق الدفع */}
        <PaymentMethodsChart data={paymentMethods} />
      </div>
      
      {/* جداول البيانات */}
      <div className="grid grid-cols-2 gap-6">
        {/* أكثر المعلنين إنفاقاً */}
        <TopSpendersTable data={topSpenders} />
        
        {/* الفواتير المتأخرة */}
        <OverdueInvoicesTable data={overdueInvoices} />
      </div>
    </div>
  );
}
```

---

## 📋 خطة التنفيذ {#خطة-التنفيذ}

### المرحلة 1: الأساسيات الحرجة (أسبوع 1-2)
```
الأولوية العالية 🔴

✅ Day 1-3: إضافة Audit Trail
   - إنشاء model وservice
   - تطبيق في جميع العمليات
   - اختبار شامل

✅ Day 4-6: إضافة دعم الضرائب (VAT)
   - تعديل Invoice model
   - تحديث FinancialService
   - تحديث واجهات المستخدم

✅ Day 7-10: نظام التذكيرات
   - إنشاء Reminder model
   - بناء ReminderService
   - إعداد Cron Jobs

✅ Day 11-14: Pagination
   - تعديل API endpoints
   - تحديث الصفحات
   - اختبار الأداء
```

---

### المرحلة 2: التحسينات المهمة (أسبوع 3-4)
```
الأولوية المتوسطة 🟡

✅ Week 3:
   - نظام الاستردادات
   - فواتير متعددة لاشتراك واحد
   - تقارير مالية أساسية

✅ Week 4:
   - إرسال الفواتير تلقائياً (WhatsApp)
   - إرسال الفواتير تلقائياً (Email)
   - تصدير PDF للفواتير
```

---

### المرحلة 3: الميزات الإضافية (أسبوع 5-6)
```
الأولوية المنخفضة 🟢

✅ Week 5:
   - تكامل بوابة الدفع (Moyasar)
   - روابط الدفع الإلكتروني
   - معالجة Callbacks

✅ Week 6:
   - Dashboard مالي متقدم
   - رسوم بيانية (Charts)
   - تصدير Excel للتقارير
```

---

### المرحلة 4: الاختبار والنشر (أسبوع 7)
```
✅ Week 7:
   - اختبار شامل لجميع الميزات
   - اختبار الأداء
   - اختبار الأمان
   - التوثيق النهائي
   - النشر التدريجي
```

---

## 🛡️ معايير الجودة والضمان {#معايير-الجودة}

### 1. الاختبارات (Testing)
```typescript
// اختبارات FinancialService
describe('FinancialService', () => {
  
  test('calculateDiscount: نسبة مئوية', () => {
    const result = FinancialService.calculateDiscount(1000, 'percentage', 15);
    expect(result.discount_value).toBe(150);
    expect(result.total_amount).toBe(850);
  });
  
  test('calculateDiscount: لا يسمح بخصم أكبر من 100%', () => {
    expect(() => {
      FinancialService.calculateDiscount(1000, 'percentage', 150);
    }).toThrow('Discount percentage cannot exceed 100%');
  });
  
  test('recordPayment: تحديث صحيح للاشتراك', async () => {
    const paymentId = await FinancialService.recordPayment({
      subscription_id: 'test_sub',
      amount: 500,
      payment_date: new Date()
    });
    
    const subscription = await SubscriptionAdminService.getById('test_sub');
    expect(subscription.paid_amount).toBeGreaterThan(0);
  });
});
```

---

### 2. التحققات (Validations)
```typescript
// قبل إنشاء فاتورة
function validateInvoiceData(data: Partial<Invoice>) {
  if (!data.subscription_id) {
    throw new Error('Subscription ID is required');
  }
  
  if (data.amount !== undefined && data.amount <= 0) {
    throw new Error('Amount must be greater than zero');
  }
  
  if (data.issued_date && data.due_date) {
    if (new Date(data.due_date) < new Date(data.issued_date)) {
      throw new Error('Due date must be after issued date');
    }
  }
}
```

---

### 3. الأمان (Security)
```typescript
// في جميع API endpoints
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 1. التحقق من التوكن
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // 2. التحقق من الصلاحيات
    const user = await verifyAdminToken(token);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // 3. Validate input
    const errors = validateInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
    
    // 4. تنفيذ العملية
    const result = await performOperation(req.body);
    
    // 5. تسجيل في Audit Log
    await AuditService.log({
      action: 'invoice_created',
      user_id: user.id,
      data: req.body
    });
    
    res.status(200).json(result);
    
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
```

---

### 4. الأداء (Performance)
```typescript
// استخدام Caching عند الحاجة
import { Redis } from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// في InvoiceAdminService
static async getById(id: string): Promise<Invoice | null> {
  // محاولة الحصول من Cache
  const cached = await redis.get(`invoice:${id}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // جلب من Firebase
  const invoice = await adminDb.collection('invoices').doc(id).get();
  if (!invoice.exists) return null;
  
  const data = { id: invoice.id, ...invoice.data() } as Invoice;
  
  // حفظ في Cache لمدة 5 دقائق
  await redis.setex(`invoice:${id}`, 300, JSON.stringify(data));
  
  return data;
}
```

---

## 📊 مؤشرات الأداء (KPIs)

### قبل التحسينات:
```
❌ لا يوجد audit trail
❌ الضرائب غير مدعومة
❌ لا توجد تذكيرات تلقائية
❌ صفحات الفواتير بطيئة (>3 ثوان)
❌ لا يمكن إرسال الفواتير تلقائياً
❌ التقارير المالية محدودة جداً
```

### بعد التحسينات:
```
✅ 100% من العمليات مسجلة في Audit Trail
✅ جميع الفواتير تحتوي على تفاصيل الضريبة
✅ إرسال 3 أنواع من التذكيرات تلقائياً
✅ تحميل الصفحات في <1 ثانية (مع Pagination)
✅ إرسال الفواتير عبر WhatsApp/Email بضغطة زر
✅ 10+ تقارير مالية متقدمة
✅ تكامل كامل مع بوابة الدفع
```

---

## 🎯 الخلاصة والتوصيات

### ✅ ما هو ممتاز حالياً:
1. **الهيكلية العامة**: منظمة ومنطقية جداً
2. **FinancialService**: قلب النظام قوي ودقيق
3. **الربط التلقائي**: بين الاشتراكات والفواتير والمدفوعات
4. **واجهات المستخدم**: حديثة وجذابة
5. **الصفحة المالية**: `/advertisers/[id]/financial` رائعة!

### ⚠️ ما يحتاج تحسين عاجل:
1. **Audit Trail**: ضروري للمساءلة
2. **الضرائب**: مطلوب قانونياً في السعودية
3. **التذكيرات**: لتقليل الفواتير المتأخرة
4. **Pagination**: لتحسين الأداء

### 🚀 الخطوات التالية المقترحة:
1. **ابدأ بالمرحلة 1** (الأساسيات الحرجة)
2. **اختبر كل ميزة** قبل الانتقال للتالية
3. **وثق كل شيء** للفريق
4. **احصل على feedback** من المستخدمين

---

## 📞 الدعم والمتابعة

هذا التقرير يمثل:
- ✅ مراجعة شاملة للنظام الحالي
- ✅ تحليل دقيق للثغرات
- ✅ حلول عملية وقابلة للتطبيق
- ✅ خطة تنفيذ واضحة ومرحلية

**النظام الحالي جيد جداً، والتحسينات المقترحة ستجعله احترافي بمعايير عالمية! 🌟**

---

**تم إعداد هذا التقرير بدقة ومهنية عالية**
**آخر تحديث: نوفمبر 2024**

