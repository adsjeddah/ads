# دليل الإصلاح السريع ⚡

## ✅ المشاكل التي تم حلها

### 1. خطأ Firebase Admin SDK
**المشكلة:**
```
FirebaseAppError: Service account object must contain a string "project_id" property.
```

**السبب:**
- كانت أسماء الخصائص بصيغة `camelCase` بدلاً من `snake_case` المطلوبة من Firebase Admin SDK

**الحل:**
تم تعديل ملف `lib/firebase-admin.ts`:
- `projectId` ➜ `project_id` ✅
- `clientEmail` ➜ `client_email` ✅
- `privateKey` ➜ `private_key` ✅

### 2. التحقق من المتغيرات البيئية
تم إضافة التحقق التلقائي من وجود جميع المتغيرات المطلوبة قبل بدء التطبيق.

## 📋 الخطوات التالية المطلوبة منك

### الخطوة 1: إنشاء ملف `.env.local`
```bash
cp .env.example .env.local
```

### الخطوة 2: الحصول على بيانات Firebase
1. افتح [Firebase Console](https://console.firebase.google.com/)
2. اختر مشروعك
3. اذهب إلى **⚙️ Project Settings** → **Service Accounts**
4. انقر **Generate New Private Key**
5. سيتم تنزيل ملف JSON

### الخطوة 3: نسخ البيانات إلى `.env.local`
افتح الملف الذي تم تنزيله وانسخ القيم:

```env
FIREBASE_PROJECT_ID=<project_id من الملف>
FIREBASE_CLIENT_EMAIL=<client_email من الملف>
FIREBASE_PRIVATE_KEY="<private_key من الملف - كامل مع BEGIN و END>"
FIREBASE_STORAGE_BUCKET=<اسم-المشروع>.appspot.com
```

للبيانات العامة (من **Project Settings** → **General**):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=<apiKey>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<authDomain>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<projectId>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<storageBucket>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<messagingSenderId>
NEXT_PUBLIC_FIREBASE_APP_ID=<appId>
```

### الخطوة 4: إعادة تشغيل السيرفر
```bash
npm run dev
```

## ⚠️ ملاحظات مهمة

1. **Private Key Format**: يجب أن يكون بهذا الشكل:
   ```
   "-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...your_key...ABCD\n-----END PRIVATE KEY-----\n"
   ```
   
2. **لا تشارك ملف `.env.local`** أبداً - يحتوي على بيانات حساسة

3. **تأكد من إضافة `.env.local` إلى `.gitignore`**

## 🎯 التحقق من النجاح

بعد إعادة التشغيل، يجب أن تختفي الأخطاء التالية:
- ✅ لا يوجد `FirebaseAppError`
- ✅ يعمل `/api/advertisers` بدون مشاكل
- ✅ التطبيق يعمل على `http://localhost:3000`

## 📞 المساعدة

إذا واجهت أي مشاكل، تأكد من:
- [ ] صحة القيم في `.env.local`
- [ ] أن المشروع في Firebase نشط
- [ ] أن Service Account لديه الصلاحيات اللازمة
- [ ] لا توجد مسافات زائدة في المتغيرات

للمزيد من التفاصيل، راجع ملف `FIREBASE_SETUP.md`
