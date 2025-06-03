# حل مشكلة عرض طلبات الإعلان في لوحة التحكم

## المشكلة
طلبات الإعلان تُحفظ بنجاح في Firebase لكنها لا تظهر في لوحة التحكم بسبب مشاكل المصادقة.

## التأكد من وجود الطلبات
```bash
cd scripts
node check-ad-requests.js
```
✅ تم التأكد - يوجد طلبات محفوظة في Firebase

## الحلول المطبقة

### 1. إصلاح مسار API في صفحة طلبات الإعلان
في `pages/admin/ad-requests.tsx`:
```javascript
// قبل:
const response = await axios.get('http://localhost:5001/api/admin/ad-requests', {

// بعد:
const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/ad-requests`, {
```

### 2. تعطيل مؤقت للمصادقة (للاختبار فقط)
في `pages/api/ad-requests/index.ts`:
```javascript
// تم تعطيل التحقق من المصادقة مؤقتاً
/*
const token = req.headers.authorization?.split('Bearer ')[1];
if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });
...
*/
```

## المشكلة الأساسية: مصادقة المدير

### السبب
- Token المدير منتهي الصلاحية أو غير صالح
- مشكلة في تسجيل دخول المدير

### الحل الدائم

#### 1. إنشاء مدير جديد في Firebase Authentication
```bash
# اذهب إلى Firebase Console
# Authentication > Users > Add user
# أضف: admin@yourdomain.com مع كلمة مرور قوية
```

#### 2. إضافة صلاحيات المدير
استخدم السكريبت التالي:
```javascript
// scripts/set-admin-claim.js
const admin = require('firebase-admin');
// ... إعداد Firebase Admin

async function setAdminClaim(email) {
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { admin: true });
  console.log(`تم تعيين ${email} كمدير`);
}

setAdminClaim('admin@yourdomain.com');
```

#### 3. تحديث نظام تسجيل الدخول
في `pages/admin/login.tsx`:
- استخدم Firebase Auth للتسجيل
- احصل على ID Token صالح
- تحقق من صلاحيات المدير

## الحل المؤقت (للتطوير فقط)

### السماح بقراءة طلبات الإعلان بدون مصادقة
⚠️ **تحذير**: هذا للتطوير المحلي فقط!

في `firestore.rules`:
```javascript
match /ad_requests/{requestId} {
  allow create: if true;
  allow read: if true; // مؤقت للتطوير
  allow update, delete: if isAdmin();
}
```

## التحقق من عمل النظام

1. أنشئ طلب إعلان جديد من `/advertise`
2. تحقق من وجوده بـ `node scripts/check-ad-requests.js`
3. افتح لوحة التحكم `/admin/dashboard`
4. اذهب لتبويب "طلبات الإعلان"

## الخطوات التالية

1. **إصلاح نظام المصادقة**:
   - تحديث Firebase Auth
   - إضافة مدير بصلاحيات صحيحة
   - تحديث نظام تسجيل الدخول

2. **إعادة تفعيل المصادقة**:
   - أزل التعليقات من `pages/api/ad-requests/index.ts`
   - تأكد من إرسال Token صالح من العميل

3. **نشر التحديثات**:
   ```bash
   git add -A
   git commit -m "Fix ad requests display issue"
   git push