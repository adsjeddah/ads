# 🔥 دليل نشر المشروع باستخدام Firebase + Vercel

## نعم! Firebase + Vercel خيار رائع ومجاني 100%

### لماذا Firebase + Vercel؟

#### مميزات Firebase:
- ✅ **Firestore Database** - قاعدة بيانات NoSQL سريعة جداً
- ✅ **Firebase Storage** - تخزين ملفات مجاني (5GB)
- ✅ **Firebase Functions** - لتشغيل Backend APIs
- ✅ **Authentication** - نظام مصادقة جاهز
- ✅ **مجاني** - الخطة المجانية كافية جداً

#### مميزات Vercel:
- ✅ محسّن لـ Next.js
- ✅ أداء فائق مع CDN عالمي
- ✅ SSL مجاني
- ✅ نشر تلقائي

---

## 📋 خطة التحويل من SQLite إلى Firebase

### 1. إعداد Firebase:

#### إنشاء مشروع Firebase:
1. اذهب إلى [console.firebase.google.com](https://console.firebase.google.com)
2. أنشئ مشروع جديد "jeddah-ads"
3. فعّل الخدمات التالية:
   - Firestore Database
   - Storage
   - Functions (اختياري)

#### هيكل Firestore:
```javascript
// Collections:
advertisers/
  - {id}
    - company_name
    - phone
    - whatsapp
    - services
    - icon_url
    - email
    - password (hashed)
    - status
    - created_at
    - updated_at

plans/
  - {id}
    - name
    - duration_days
    - price
    - features

subscriptions/
  - {id}
    - advertiser_id
    - plan_id
    - start_date
    - end_date
    - base_price
    - discount_type
    - discount_amount
    - total_amount
    - paid_amount
    - status
    - payment_status

invoices/
  - {id}
    - subscription_id
    - invoice_number
    - amount
    - status
    - issued_date
    - due_date
    - paid_date

ad_requests/
  - {id}
    - company_name
    - contact_name
    - phone
    - whatsapp
    - email
    - plan_id
    - message
    - status
    - created_at
```

---

## 🛠️ التعديلات المطلوبة في الكود

### 1. تثبيت Firebase SDK:
```bash
npm install firebase firebase-admin
```

### 2. إنشاء ملف Firebase Config:
```typescript
// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
```

### 3. تحويل API Endpoints:

#### مثال - جلب المعلنين:
```typescript
// pages/api/advertisers.ts
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const q = query(
        collection(db, 'advertisers'),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      const advertisers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      res.status(200).json(advertisers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

#### مثال - رفع الصور:
```typescript
// pages/api/upload.ts
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const file = req.body.file; // Base64 or File
      const storageRef = ref(storage, `logos/${Date.now()}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      res.status(200).json({ url: downloadURL });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

---

## 🚀 خطوات النشر

### 1. إعداد Firebase:
1. أنشئ مشروع Firebase
2. احصل على Firebase Config
3. فعّل Firestore و Storage

### 2. تحديث الكود:
1. استبدل Express APIs بـ Next.js API Routes
2. استبدل SQLite queries بـ Firestore queries
3. استبدل multer بـ Firebase Storage

### 3. نشر على Vercel:
1. أضف متغيرات البيئة:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```
2. Deploy!

---

## 📊 مقارنة الحلول:

| الميزة | Railway + Vercel | Firebase + Vercel |
|--------|-----------------|-------------------|
| قاعدة البيانات | SQLite (علائقية) | Firestore (NoSQL) |
| التخزين | 1GB | 5GB |
| سهولة التحويل | لا يحتاج تعديل | يحتاج تعديل الكود |
| الأداء | ممتاز | ممتاز جداً |
| التكلفة | $5 رصيد شهري | مجاني 100% |
| Scalability | محدود | ممتاز |

---

## 🤔 أيهما أفضل لك؟

### استخدم Railway + Vercel إذا:
- ✅ تريد البدء فوراً دون تعديل الكود
- ✅ تفضل SQL وقواعد البيانات العلائقية
- ✅ المشروع صغير إلى متوسط

### استخدم Firebase + Vercel إذا:
- ✅ مستعد لتعديل الكود
- ✅ تريد مجانية 100% طويلة المدى
- ✅ تتوقع نمو كبير في المستقبل
- ✅ تريد مميزات إضافية (Real-time, Push Notifications)

---

## 📝 الخلاصة:

**كلا الحلين ممتازين!**
- **للبدء السريع:** Railway + Vercel (بدون تعديل كود)
- **للمستقبل:** Firebase + Vercel (يحتاج تعديل لكن أفضل على المدى الطويل)

هل تريد المساعدة في تحويل الكود لـ Firebase؟