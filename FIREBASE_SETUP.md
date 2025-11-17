# إعداد Firebase - دليل الحل

## المشكلة التي تم إصلاحها

كانت هناك مشكلة في تكوين Firebase Admin SDK:
```
FirebaseAppError: Service account object must contain a string "project_id" property.
```

## الحلول المطبقة

### 1. إصلاح أسماء الخصائص في `lib/firebase-admin.ts`

تم تغيير أسماء الخصائص من `camelCase` إلى `snake_case` كما يتوقع Firebase Admin SDK:

- ✅ `projectId` → `project_id`
- ✅ `clientEmail` → `client_email`
- ✅ `privateKey` → `private_key`

### 2. إضافة التحقق من المتغيرات البيئية

تم إضافة التحقق من وجود جميع المتغيرات المطلوبة قبل التهيئة.

## خطوات الإعداد المطلوبة

### 1. إنشاء ملف `.env.local`

قم بنسخ محتوى ملف `.env.example` إلى ملف جديد باسم `.env.local`:

```bash
cp .env.example .env.local
```

### 2. الحصول على بيانات الاعتماد من Firebase

#### أ) بيانات Admin SDK:

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. اختر مشروعك
3. اذهب إلى **Project Settings** (⚙️) → **Service Accounts**
4. انقر على **Generate New Private Key**
5. سيتم تنزيل ملف JSON يحتوي على:
   - `project_id`
   - `client_email`
   - `private_key`

#### ب) بيانات Client SDK:

من نفس صفحة **Project Settings** → **General**:
- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

### 3. ملء ملف `.env.local`

افتح `.env.local` واستبدل القيم الافتراضية بالقيم الحقيقية من Firebase:

```env
FIREBASE_PROJECT_ID=your-actual-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Actual_Private_Key_Here\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### 4. إعادة تشغيل السيرفر

```bash
npm run dev
```

## ملاحظات مهمة

1. **Private Key**: تأكد من أن المفتاح الخاص محاط بعلامات اقتباس مزدوجة وأن `\n` موجودة في بداية ونهاية المفتاح
2. **لا تشارك ملف `.env.local`**: هذا الملف يحتوي على بيانات حساسة ويجب عدم رفعه إلى Git
3. **التأكد من الصلاحيات**: تأكد من أن Service Account لديه الصلاحيات المطلوبة في Firebase Console

## التحقق من نجاح الإعداد

بعد إعادة تشغيل السيرفر، يجب أن:
- ✅ لا تظهر أخطاء Firebase في التيرمينال
- ✅ يعمل API endpoint `/api/advertisers` بشكل صحيح
- ✅ تتم عمليات المصادقة والتخزين بنجاح

## المساعدة

إذا استمرت المشاكل، تحقق من:
1. صحة القيم في `.env.local`
2. أن المشروع في Firebase Console نشط
3. أن Service Account لديه الأذونات الكافية

