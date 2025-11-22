# 🧪 دليل الاختبار الشامل للنظام

> آخر تحديث: 22 نوفمبر 2025

## 📑 جدول المحتويات

1. [البيئة والإعداد](#البيئة-والإعداد)
2. [اختبار الباقات](#اختبار-الباقات)
3. [اختبار الاشتراكات والفواتير](#اختبار-الاشتراكات-والفواتير)
4. [اختبار VAT](#اختبار-vat)
5. [اختبار Audit Trail](#اختبار-audit-trail)
6. [اختبار التذكيرات](#اختبار-التذكيرات)
7. [اختبار الاستردادات](#اختبار-الاستردادات)
8. [اختبار Cloud Functions](#اختبار-cloud-functions)
9. [اختبار API Endpoints](#اختبار-api-endpoints)
10. [الاختبار النهائي End-to-End](#الاختبار-النهائي-end-to-end)

---

## 🔧 البيئة والإعداد

### 1. التحقق من ملف `.env.local`

```bash
# التحقق من وجود المتغيرات المطلوبة
cat .env.local
```

يجب أن يحتوي على:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=jeddah-ads-46daa
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...

# Server-side
FIREBASE_PROJECT_ID=jeddah-ads-46daa
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@jeddah-ads-46daa.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 2. التحقق من serviceAccountKey.json

```bash
node scripts/check-env.js
```

### 3. تشغيل المشروع

```bash
npm run dev
```

يجب أن يعمل على: `http://localhost:3000`

---

## 📦 اختبار الباقات

### ✅ 1. التحقق من إضافة الباقات

```bash
node scripts/add-plans.js
```

**النتيجة المتوقعة:**
- ✅ تم إضافة 6 باقات بنجاح
- عرض جدول الباقات مع الأسعار

### ✅ 2. التحقق من عرض الباقات في Dashboard

```bash
# فتح متصفح
open http://localhost:3000/admin/dashboard
```

**خطوات الاختبار:**
1. تسجيل دخول كأدمن
2. الانتقال إلى صفحة "Plans"
3. التأكد من ظهور 6 باقات
4. التحقق من الأسعار والمدد

**النتيجة المتوقعة:**
- ظهور جميع الباقات بشكل صحيح
- عرض السعر والمدة لكل باقة

---

## 🔄 اختبار الاشتراكات والفواتير

### ✅ 1. إنشاء اشتراك جديد

**الخطوات:**
1. اذهب إلى `/admin/advertisers`
2. اختر معلن
3. اذهب إلى "Financial" Tab
4. انقر "Create Subscription"
5. املأ البيانات:
   - اختر الباقة
   - تاريخ البدء
   - خصم (اختياري)
   - الدفعة الأولى

**النتيجة المتوقعة:**
- ✅ إنشاء اشتراك جديد
- ✅ إنشاء فاتورة تلقائياً
- ✅ تسجيل الدفعة الأولى
- ✅ حساب الضريبة (VAT) تلقائياً
- ✅ حساب الخصم بدقة

### ✅ 2. التحقق من الفاتورة

**الخطوات:**
1. اذهب إلى `/admin/invoices`
2. افتح الفاتورة الجديدة
3. تحقق من البيانات

**النتيجة المتوقعة:**
- رقم الفاتورة: `INV-YYYYMM-XXXX`
- المبلغ قبل الضريبة (Subtotal)
- مبلغ الضريبة (VAT Amount)
- الإجمالي (Total with VAT)
- حالة الفاتورة صحيحة

### ✅ 3. تسجيل دفعة جديدة

**الخطوات:**
1. اذهب إلى صفحة المعلن المالية
2. قسم "Record Payment"
3. املأ البيانات:
   - المبلغ
   - طريقة الدفع
   - الملاحظات

**النتيجة المتوقعة:**
- ✅ تسجيل الدفعة
- ✅ تحديث حالة الفاتورة
- ✅ تحديث حالة الاشتراك
- ✅ تحديث الملخص المالي

---

## 💰 اختبار VAT

### ✅ 1. التحقق من حساب VAT بشكل صحيح

**حالة اختبار 1: باقة 900 ريال**
```javascript
// يجب أن يكون:
Subtotal: 900 SAR
VAT (15%): 135 SAR
Total: 1035 SAR
```

**حالة اختبار 2: مع خصم 10%**
```javascript
// يجب أن يكون:
Original: 900 SAR
Discount (10%): -90 SAR
Subtotal: 810 SAR
VAT (15%): 121.5 SAR
Total: 931.5 SAR
```

### ✅ 2. التحقق من عرض VAT في الفاتورة

**الخطوات:**
1. افتح فاتورة
2. تحقق من وجود:
   - Subtotal
   - VAT Percentage
   - VAT Amount
   - Total Amount

---

## 📝 اختبار Audit Trail

### ✅ 1. التحقق من تسجيل الإجراءات

**الخطوات:**
1. إنشاء فاتورة جديدة
2. تحديث الفاتورة
3. تسجيل دفعة
4. الغاء فاتورة

**التحقق من Firestore:**
```bash
# فتح Firebase Console
# انتقل إلى collection: invoice_audits
# يجب أن يكون هناك سجلات لكل عملية
```

### ✅ 2. جلب Audit Log عبر API

```bash
# اختبار API
curl -X GET \
  'http://localhost:3000/api/audit/invoice/INVOICE_ID' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'
```

**النتيجة المتوقعة:**
```json
[
  {
    "id": "...",
    "invoice_id": "...",
    "action": "created",
    "performed_by": "admin_user_id",
    "performed_at": "...",
    "notes": "Invoice created with amount ..."
  },
  {
    "id": "...",
    "invoice_id": "...",
    "action": "updated",
    "changed_fields": {
      "status": {
        "old": "unpaid",
        "new": "paid"
      }
    },
    "performed_by": "admin_user_id",
    "performed_at": "..."
  }
]
```

---

## 🔔 اختبار التذكيرات

### ✅ 1. إنشاء تذكير يدوياً

```bash
# عبر API
curl -X POST \
  'http://localhost:3000/api/reminders/create-auto' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"type": "due_soon"}'
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "type": "due_soon",
  "created_count": 3
}
```

### ✅ 2. معالجة التذكيرات المعلقة

```bash
curl -X POST \
  'http://localhost:3000/api/reminders/process' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "total": 5,
  "sent": 4,
  "failed": 1
}
```

### ✅ 3. التحقق من Firestore

افتح Firebase Console وتحقق من:
- Collection: `reminders`
- Collection: `notifications`

---

## 💵 اختبار الاستردادات

### ✅ 1. إنشاء طلب استرداد

```bash
curl -X POST \
  'http://localhost:3000/api/refunds' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "subscription_id": "SUB_ID",
    "original_amount": 1035,
    "refund_amount": 500,
    "refund_reason": "Partial cancellation",
    "refund_method": "bank_transfer",
    "refund_date": "2025-11-22",
    "processed_by": "admin_user_id",
    "bank_details": "IBAN: SA..."
  }'
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "refund_id": "..."
}
```

### ✅ 2. تحديث حالة الاسترداد

```bash
curl -X PATCH \
  'http://localhost:3000/api/refunds/REFUND_ID' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "status": "completed",
    "notes": "Refund processed successfully"
  }'
```

---

## ☁️ اختبار Cloud Functions

### ✅ 1. اختبار محلي (Firebase Emulators)

```bash
# تثبيت Emulators
npm install -g firebase-tools
firebase login

# تشغيل Emulators
firebase emulators:start
```

### ✅ 2. اختبار Cloud Functions على الإنتاج

```bash
# نشر Functions
firebase deploy --only functions
```

**Functions المتوفرة:**
- `dailyReminders`: يعمل يومياً الساعة 9 صباحاً
- `processReminders`: يعمل كل ساعة
- `updateSubscriptionStatuses`: يعمل يومياً الساعة 1 صباحاً

### ✅ 3. مراقبة Logs

```bash
# عرض logs
firebase functions:log
```

---

## 🌐 اختبار API Endpoints

### ملخص الـ API Endpoints الجديدة:

| Endpoint | Method | الوصف |
|----------|--------|-------|
| `/api/reminders/create-auto` | POST | إنشاء تذكيرات تلقائية |
| `/api/reminders/process` | POST | معالجة التذكيرات المعلقة |
| `/api/refunds` | GET/POST | جلب أو إنشاء استردادات |
| `/api/refunds/[id]` | GET/PATCH | جلب أو تحديث استرداد |
| `/api/audit/invoice/[id]` | GET | جلب Audit Log لفاتورة |
| `/api/audit/stats` | GET | إحصائيات Audit |

### ✅ اختبار Postman Collection

أنشئ Collection في Postman واختبر جميع الـ Endpoints.

---

## 🎯 الاختبار النهائي End-to-End

### سيناريو كامل:

#### 1️⃣ إنشاء معلن جديد
```
- اذهب إلى /admin/advertisers/new
- املأ البيانات
- احفظ
```

#### 2️⃣ إنشاء اشتراك
```
- اختر المعلن
- Financial Tab
- Create Subscription
  - الباقة: شهرية (900 ريال)
  - خصم: 10%
  - الدفعة الأولى: 500 ريال
```

#### 3️⃣ التحقق من الحسابات
```
Subtotal: 810 SAR (900 - 10%)
VAT: 121.5 SAR
Total: 931.5 SAR
Paid: 500 SAR
Remaining: 431.5 SAR
```

#### 4️⃣ تسجيل دفعة ثانية
```
- Record Payment: 431.5 SAR
- الحالة: Paid
```

#### 5️⃣ التحقق من Audit Trail
```
- افتح API: /api/audit/invoice/INVOICE_ID
- يجب أن يظهر:
  - Created
  - Payment recorded (x2)
  - Status updated to paid
```

#### 6️⃣ إنشاء تذكيرات
```
- انتظر حتى 3 أيام قبل due_date
- شغل: /api/reminders/create-auto (type: due_soon)
- تحقق من إنشاء التذكير
```

#### 7️⃣ إلغاء جزئي واسترداد
```
- أنشئ طلب استرداد: 200 SAR
- غير الحالة: approved → completed
- تحقق من Firestore
```

---

## ✅ قائمة التحقق النهائية

### البنية الأساسية
- [ ] ✅ Firebase متصل ويعمل
- [ ] ✅ جميع الباقات مضافة (6 باقات)
- [ ] ✅ Models محدثة بـ VAT والإضافات
- [ ] ✅ Services جديدة منشأة

### الوظائف الأساسية
- [ ] ✅ إنشاء اشتراك جديد
- [ ] ✅ إنشاء فاتورة تلقائياً
- [ ] ✅ حساب VAT بدقة
- [ ] ✅ حساب الخصومات بدقة
- [ ] ✅ تسجيل الدفعات
- [ ] ✅ تحديث الحالات تلقائياً

### الميزات الجديدة
- [ ] ✅ Audit Trail يسجل جميع الإجراءات
- [ ] ✅ Reminders تُنشأ تلقائياً
- [ ] ✅ Notifications تُرسل (في Dev mode تُسجل فقط)
- [ ] ✅ Refunds يمكن إنشاؤها وإدارتها
- [ ] ✅ Cloud Functions تعمل

### API Endpoints
- [ ] ✅ جميع الـ Endpoints تعمل
- [ ] ✅ Authentication صحيح
- [ ] ✅ Error Handling موجود

### UI/UX
- [ ] ✅ Dashboard يعرض البيانات بشكل صحيح
- [ ] ✅ Forms تعمل بدون أخطاء
- [ ] ✅ Tables تعرض البيانات
- [ ] ✅ Financial Summary دقيق

---

## 🐛 حل المشاكل الشائعة

### Problem: Firebase Admin لا يتصل

**الحل:**
```bash
# تحقق من serviceAccountKey.json
cat serviceAccountKey.json | jq .project_id

# تحقق من .env.local
grep FIREBASE_PROJECT_ID .env.local
```

### Problem: VAT غير محسوب

**الحل:**
- تحقق من أن `financial.service.ts` محدث
- تحقق من استدعاء `calculateVAT()` في `createSubscriptionWithInvoice`

### Problem: Audit Trail لا يسجل

**الحل:**
- تحقق من أن `audit.service.ts` موجود
- تحقق من استيراده في `invoice-admin.service.ts`
- تحقق من Firestore Rules

### Problem: Cloud Functions لا تعمل

**الحل:**
```bash
# تحقق من الـ Logs
firebase functions:log

# أعد النشر
firebase deploy --only functions
```

---

## 📊 الإحصائيات المتوقعة

بعد الاختبار الكامل، يجب أن يكون لديك في Firestore:

| Collection | الحد الأدنى |
|-----------|-------------|
| plans | 6 |
| advertisers | 1+ |
| subscriptions | 1+ |
| invoices | 1+ |
| payments | 2+ |
| invoice_audits | 5+ |
| reminders | 1+ |
| notifications | 0+ |
| refunds | 0+ |

---

## 🎉 خلاصة

إذا نجحت جميع الاختبارات أعلاه، فهذا يعني:

✅ **النظام المالي يعمل بشكل كامل**  
✅ **VAT محسوب بدقة**  
✅ **Audit Trail يسجل جميع الإجراءات**  
✅ **التذكيرات تعمل تلقائياً**  
✅ **الاستردادات يمكن إدارتها**  
✅ **Cloud Functions تعمل في الخلفية**  

---

## 🚀 الخطوات التالية

1. **التكامل مع بوابة الدفع**: إضافة Moyasar أو PayTabs
2. **تكامل WhatsApp Business API**: لإرسال التذكيرات الفعلية
3. **Email Service**: لإرسال الفواتير عبر البريد
4. **Reports & Analytics**: تقارير مالية شاملة
5. **Mobile App**: تطبيق للمعلنين

---

**تم إعداد هذا الدليل بواسطة: AI Assistant**  
**التاريخ: 22 نوفمبر 2025**  
**النسخة: 1.0**

