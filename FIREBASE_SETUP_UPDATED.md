# 🔥 إعداد Firebase - دليل محدث

## ✅ ما تم بالفعل

### 1. تكوين Firebase Client SDK
تم إعداد البيانات التالية بالفعل في `.env.example`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCXVdoybZAESnPFRWqCZjZS4gFgGRRO090
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=jeddah-ads-46daa.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=jeddah-ads-46daa
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=jeddah-ads-46daa.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=210776216129
NEXT_PUBLIC_FIREBASE_APP_ID=1:210776216129:web:8a911e71d3406771acecc0
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-1SD2RERKH0
```

### 2. معرف المشروع
- ✅ Project ID: `jeddah-ads-46daa`
- ✅ ملف `.firebaserc` محدث بالفعل

### 3. Admin User
- ✅ Email: senatorever@gmail.com
- ✅ UID: vFOqqnfpSjSJ4qzuPSJzpBvXhP12

---

## 🚀 الخطوات المطلوبة للإكمال

### الخطوة 1️⃣: الحصول على Service Account Key

1. افتح [Firebase Console](https://console.firebase.google.com/project/jeddah-ads-46daa/settings/serviceaccounts/adminsdk)
2. انقر على **Generate New Private Key**
3. سيتم تحميل ملف JSON

### الخطوة 2️⃣: إنشاء ملف `.env.local`

```bash
cp .env.example .env.local
```

### الخطوة 3️⃣: ملء Service Account في `.env.local`

افتح ملف JSON المحمل وانسخ القيم التالية:

```env
# من ملف JSON الذي تم تحميله:
FIREBASE_PROJECT_ID=jeddah-ads-46daa
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@jeddah-ads-46daa.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...المفتاح الكامل من ملف JSON...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=jeddah-ads-46daa.firebasestorage.app

# هذه جاهزة بالفعل (لا تحتاج تغيير):
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCXVdoybZAESnPFRWqCZjZS4gFgGRRO090
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=jeddah-ads-46daa.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=jeddah-ads-46daa
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=jeddah-ads-46daa.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=210776216129
NEXT_PUBLIC_FIREBASE_APP_ID=1:210776216129:web:8a911e71d3406771acecc0
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-1SD2RERKH0
```

### الخطوة 4️⃣: تعيين صلاحيات Admin

قم بتشغيل هذا السكريبت لتعيين المستخدم كمسؤول:

```bash
node scripts/ensure-admin.js senatorever@gmail.com
```

أو يمكنك استخدام Firebase Console:
1. اذهب إلى Authentication
2. اختر المستخدم senatorever@gmail.com
3. في Custom Claims أضف: `{"admin": true}`

### الخطوة 5️⃣: إعداد Firestore Security Rules

في Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // قراءة عامة للإعلانات النشطة فقط
    match /advertisers/{advertiserId} {
      allow read: if resource.data.status == 'active';
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // الإحصائيات - الكتابة للجميع، القراءة للمسؤولين
    match /statistics/{statId} {
      allow read: if request.auth != null && request.auth.token.admin == true;
      allow create, update: if true; // للسماح بتسجيل الإحصائيات من الموقع
    }
    
    // باقي المجموعات - للمسؤولين فقط
    match /{document=**} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

### الخطوة 6️⃣: إعداد Storage Rules

في Firebase Console → Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /advertiser-icons/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

### الخطوة 7️⃣: التحقق من الإعداد

```bash
# فحص المتغيرات البيئية
npm run check-env

# تشغيل التطبيق
npm run dev
```

---

## 📊 إنشاء Collections في Firestore

يمكنك إنشاء المجموعات يدوياً أو سيتم إنشاؤها تلقائياً عند أول استخدام:

### Collections المطلوبة:
1. ✅ `advertisers` - بيانات المعلنين
2. ✅ `ad_requests` - طلبات الإعلان
3. ✅ `admins` - المسؤولين
4. ✅ `statistics` - الإحصائيات
5. ✅ `subscriptions` - الاشتراكات
6. ✅ `plans` - الخطط

---

## 🔐 معلومات الدخول

### لوحة التحكم:
- **الرابط:** `http://localhost:3000/admin/login`
- **البريد:** senatorever@gmail.com
- **كلمة المرور:** (استخدم Firebase Authentication)

---

## ⚠️ ملاحظات مهمة

1. **Private Key Format:**
   - يجب أن يكون محاطاً بعلامات اقتباس `"`
   - يحتوي على `\n` للأسطر الجديدة
   - مثال: `"-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"`

2. **لا تشارك:**
   - ملف `.env.local`
   - ملف Service Account JSON
   - أي بيانات اعتماد

3. **للإنتاج:**
   - استخدم Environment Variables في Vercel
   - لا ترفع `.env.local` إلى Git
   - راجع `.gitignore`

---

## 🚀 التشغيل النهائي

```bash
# 1. التحقق
npm run check-env

# 2. التشغيل
npm run dev

# 3. فتح المتصفح
open http://localhost:3000
```

---

## ✅ Checklist

- [ ] تم الحصول على Service Account Key
- [ ] تم إنشاء `.env.local`
- [ ] تم ملء جميع المتغيرات
- [ ] تم تعيين صلاحيات Admin
- [ ] تم إعداد Firestore Rules
- [ ] تم إعداد Storage Rules
- [ ] تم اختبار `npm run check-env`
- [ ] تم تشغيل التطبيق بنجاح

---

**تاريخ التحديث:** $(date +"%Y-%m-%d")
**Project ID:** jeddah-ads-46daa
**Admin User:** senatorever@gmail.com
