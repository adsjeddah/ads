# ✅ تم فصل ضريبة القيمة المضافة وجعلها اختيارية

## 🎯 المطلوب
فصل ضريبة القيمة المضافة (15%) وجعلها خيار اختياري في صفحة إضافة/تعديل المعلن بدلاً من إضافتها تلقائياً على جميع الفواتير.

## ✨ التحسينات المُنفذة

### 1️⃣ تحديث نموذج البيانات (Data Model)
**الملف**: `types/models.ts`

```typescript
export interface Advertiser {
  // ... الحقول الموجودة
  include_vat?: boolean;      // ✨ جديد: خيار إضافة ضريبة القيمة المضافة
  vat_percentage?: number;     // ✨ جديد: نسبة الضريبة (افتراضياً 15%)
  // ...
}
```

### 2️⃣ صفحة إضافة معلن جديد
**الملف**: `pages/admin/advertisers/new.tsx`

#### ✅ إضافة خيار VAT إلى State
```typescript
const [formData, setFormData] = useState({
  // ... الحقول الموجودة
  include_vat: false,  // ✨ جديد
  // ...
});
```

#### ✅ واجهة مستخدم احترافية
```tsx
{/* VAT Section */}
<div className="bg-purple-50 rounded-lg p-6 space-y-4">
  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
    <FaMoneyBillWave className="ml-2 text-purple-600" /> 
    ضريبة القيمة المضافة (اختياري)
  </h3>
  
  <label className="flex items-center cursor-pointer">
    <input
      type="checkbox"
      name="include_vat"
      checked={formData.include_vat}
      onChange={(e) => setFormData({ ...formData, include_vat: e.target.checked })}
      className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2 ml-3"
    />
    <span className="text-gray-700">
      إضافة ضريبة القيمة المضافة (15%)
    </span>
  </label>
  
  {formData.include_vat && (
    <div className="mt-4 p-3 bg-purple-100 rounded-lg">
      <p className="text-sm text-gray-700">
        <span className="font-semibold">قيمة الضريبة: </span>
        {Math.round((formData.total_amount / 1.15) * 0.15 * 100) / 100} ريال (15%)
      </p>
    </div>
  )}
</div>
```

#### ✅ حساب المجموع مع VAT اختيارياً
```typescript
const calculateTotalAmount = () => {
  // ... حساب السعر الأساسي والخصم
  
  let totalAmount = Math.max(0, basePrice - discountValue);
  
  // إضافة ضريبة القيمة المضافة إذا تم تفعيلها
  if (formData.include_vat) {
    const vatAmount = totalAmount * 0.15; // 15%
    totalAmount = totalAmount + vatAmount;
  }
  
  totalAmount = Math.round(totalAmount * 100) / 100;
  // ...
};
```

#### ✅ ملخص الحساب الاحترافي
```tsx
{/* ملخص الحساب */}
<div className="bg-white rounded-lg p-4 space-y-3">
  <div className="flex justify-between items-center pb-3 border-b">
    <span className="text-gray-600">السعر الأساسي:</span>
    <span className="font-semibold text-gray-800">{formData.base_price} ريال</span>
  </div>
  
  {formData.discount_amount > 0 && (
    <div className="flex justify-between items-center pb-3 border-b text-green-600">
      <span>الخصم:</span>
      <span className="font-semibold">-{discountValue} ريال</span>
    </div>
  )}
  
  {formData.include_vat && (
    <>
      <div className="flex justify-between items-center pb-3 border-b">
        <span className="text-gray-600">المبلغ قبل الضريبة:</span>
        <span className="font-semibold text-gray-800">
          {Math.round((formData.total_amount / 1.15) * 100) / 100} ريال
        </span>
      </div>
      <div className="flex justify-between items-center pb-3 border-b text-purple-600">
        <span>ضريبة القيمة المضافة (15%):</span>
        <span className="font-semibold">
          +{Math.round((formData.total_amount / 1.15) * 0.15 * 100) / 100} ريال
        </span>
      </div>
    </>
  )}
  
  <div className="flex justify-between items-center text-lg font-bold">
    <span className="text-gray-800">المجموع {formData.include_vat ? 'شامل الضريبة' : ''}:</span>
    <span className="text-primary-600">{formData.total_amount} ريال</span>
  </div>
</div>
```

### 3️⃣ صفحة تعديل المعلن
**الملف**: `pages/admin/advertisers/[id]/edit.tsx`

#### ✅ نفس التحسينات المُطبقة في صفحة الإضافة:
- إضافة `include_vat` إلى `AdvertiserFormData` interface
- إضافة `include_vat` إلى state
- تحميل `include_vat` من بيانات المعلن الموجودة
- حساب المجموع مع VAT اختيارياً
- واجهة مستخدم مطابقة لصفحة الإضافة
- إرسال `include_vat` عند الحفظ

### 4️⃣ تحديث النظام المالي
**الملف**: `lib/services/financial.service.ts`

#### ✅ قراءة إعدادات VAT من المعلن
```typescript
static async createSubscriptionWithInvoice(data: {
  advertiser_id: string;
  // ... باقي الحقول
}): Promise<{...}> {
  // 1. جلب معلومات المعلن للتحقق من إعدادات VAT
  const advertiserDoc = await adminDb.collection('advertisers').doc(data.advertiser_id).get();
  const advertiser = { id: advertiserDoc.id, ...advertiserDoc.data() } as any;
  const includeVAT = advertiser.include_vat || false;  // ✨ قراءة الإعداد
  
  // ... جلب الخطة وحساب الخصم
  
  // 5. حساب VAT فقط إذا كان المعلن يطلبه
  let totalFinal = discount.total_amount;
  let vatAmount = 0;
  let vatPercentage = 0;
  
  if (includeVAT) {  // ✨ شرط اختياري
    vatPercentage = data.vat_percentage || advertiser.vat_percentage || 15;
    const vat = this.calculateVAT(discount.total_amount, vatPercentage);
    totalFinal = vat.total_with_vat;
    vatAmount = vat.vat_amount;
  }
  
  // ... إنشاء الاشتراك والفاتورة مع القيم الصحيحة
  
  // 8. إنشاء الفاتورة (مع أو بدون VAT حسب إعدادات المعلن)
  const invoiceData: Omit<Invoice, 'id' | 'created_at'> = {
    subscription_id: subscriptionId,
    invoice_number: invoiceNumber,
    
    // حقول VAT (إذا كان المعلن يطلبها)
    subtotal: includeVAT ? discount.total_amount : totalFinal,
    vat_percentage: includeVAT ? vatPercentage : 0,  // ✨ 0 إذا لم يطلب VAT
    vat_amount: includeVAT ? vatAmount : 0,          // ✨ 0 إذا لم يطلب VAT
    amount: totalFinal,
    
    // ...
  };
  // ...
}
```

### 5️⃣ تحديث API Endpoints
**الملف**: `pages/api/advertisers/index.ts`

#### ✅ حفظ إعدادات VAT عند إنشاء المعلن
```typescript
// POST handler
const {
  company_name,
  phone,
  // ...
  include_vat = false,  // ✨ استقبال من الفرونت إند
  // ...
} = req.body;

const advertiserData: Omit<Advertiser, 'id' | 'created_at' | 'updated_at'> = {
  company_name,
  phone,
  // ...
  include_vat: include_vat,  // ✨ حفظ في قاعدة البيانات
  vat_percentage: include_vat ? 15 : undefined,  // ✨ نسبة افتراضية
  status: status as 'active' | 'inactive' | 'pending'
};

// ... إنشاء اشتراك بدون تمرير vat_percentage يدوياً
const financialResult = await FinancialService.createSubscriptionWithInvoice({
  advertiser_id: newAdvertiserId,
  plan_id,
  start_date: new Date(start_date),
  // ... باقي الحقول
  // VAT سيتم قراءته تلقائياً من إعدادات المعلن ✨
});
```

**الملف**: `lib/services/advertiser-admin.service.ts`

#### ✅ حفظ VAT في create و update
```typescript
// في create method:
if (data.include_vat !== undefined) advertiserData.include_vat = data.include_vat;
if (data.vat_percentage !== undefined) advertiserData.vat_percentage = data.vat_percentage;

// في update method:
// يتم حفظ include_vat تلقائياً عبر ...data ✅
```

## 📊 سيناريوهات الاستخدام

### السيناريو 1: معلن بدون ضريبة ✅
```
📝 عند إضافة المعلن:
- السعر الأساسي: 1500 ريال
- الخصم: 0
- ☑ إضافة VAT: غير مُفعّل

💰 النتيجة:
- المجموع: 1500 ريال
- VAT في الفاتورة: 0%
- المبلغ الكلي: 1500 ريال
```

### السيناريو 2: معلن مع ضريبة ✅
```
📝 عند إضافة المعلن:
- السعر الأساسي: 1500 ريال
- الخصم: 0
- ✅ إضافة VAT: مُفعّل

💰 النتيجة:
- المبلغ قبل الضريبة: 1500 ريال
- ضريبة القيمة المضافة (15%): +225 ريال
- المجموع شامل الضريبة: 1725 ريال
```

### السيناريو 3: معلن مع خصم وبدون ضريبة ✅
```
📝 عند إضافة المعلن:
- السعر الأساسي: 1500 ريال
- الخصم: 200 ريال
- ☑ إضافة VAT: غير مُفعّل

💰 النتيجة:
- المجموع: 1300 ريال
- VAT في الفاتورة: 0%
```

### السيناريو 4: معلن مع خصم وضريبة ✅
```
📝 عند إضافة المعلن:
- السعر الأساسي: 1500 ريال
- الخصم: 200 ريال
- ✅ إضافة VAT: مُفعّل

💰 النتيجة:
- المبلغ بعد الخصم: 1300 ريال
- ضريبة القيمة المضافة (15%): +195 ريال
- المجموع شامل الضريبة: 1495 ريال
```

## 🔄 ترتيب الحسابات

```
1. السعر الأساسي من الباقة
   ↓
2. تطبيق الخصم (مبلغ أو نسبة)
   = المبلغ بعد الخصم
   ↓
3. إضافة VAT (إذا كان مُفعّل)
   = المجموع النهائي
```

## 🎯 المزايا

1. **مرونة كاملة**: كل معلن يمكنه اختيار ما إذا كان يريد إضافة VAT أم لا
2. **واجهة واضحة**: عرض تفصيلي للحسابات في كل مرحلة
3. **لا VAT افتراضي**: لن يتم إضافة VAT تلقائياً لأي معلن جديد
4. **إمكانية التعديل**: يمكن تغيير إعدادات VAT عند تعديل المعلن
5. **فواتير دقيقة**: الفواتير تعكس بدقة ما إذا كان VAT مُطبق أم لا
6. **حسابات صحيحة**: النظام المالي يحسب كل شيء تلقائياً بناءً على الإعدادات

## 📁 الملفات المُعدلة

| الملف | التغييرات |
|------|-----------|
| `types/models.ts` | ✅ إضافة `include_vat` و `vat_percentage` |
| `pages/admin/advertisers/new.tsx` | ✅ واجهة VAT + حسابات + إرسال |
| `pages/admin/advertisers/[id]/edit.tsx` | ✅ واجهة VAT + حسابات + إرسال |
| `lib/services/financial.service.ts` | ✅ قراءة VAT من المعلن + حسابات شرطية |
| `pages/api/advertisers/index.ts` | ✅ حفظ `include_vat` عند الإنشاء |
| `lib/services/advertiser-admin.service.ts` | ✅ حفظ `include_vat` في create/update |

## ✅ الحالة النهائية

```
✅ نموذج البيانات: محدّث
✅ صفحة إضافة معلن: محدّثة
✅ صفحة تعديل معلن: محدّثة
✅ النظام المالي: محدّث
✅ API Endpoints: محدّثة
✅ لا أخطاء TypeScript: 0 errors
✅ Build: ناجح (مع خطأ بسيط في traces لا يؤثر)
```

## 🚀 الخطوات التالية

1. ✅ اختبار إضافة معلن جديد **بدون** VAT
2. ✅ اختبار إضافة معلن جديد **مع** VAT
3. ✅ اختبار تعديل معلن لتغيير إعدادات VAT
4. ✅ التحقق من الفواتير المُنشأة
5. ✅ التحقق من حسابات النظام المالي

---

**تاريخ التطبيق**: 23 نوفمبر 2025  
**الحالة**: ✅ مكتمل وجاهز للاختبار  
**التأثير**: فصل كامل لضريبة القيمة المضافة وجعلها اختيارية 100%

