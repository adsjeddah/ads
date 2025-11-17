# 🔐 دليل ملف .env.local - Environment Variables Guide

## 📝 كيف يجب أن يبدو الملف

### مثال كامل لملف `.env.local` صحيح:

```env
# ============================================
# Firebase Admin SDK Configuration
# ============================================
FIREBASE_PROJECT_ID=jeddah-ads-123456
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc123@jeddah-ads-123456.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj\nMzEfYyjiWA4R4/M+1BAM4mP4H8eEGVrZQKnrWd8X4C9Cy6F/Vx+0bjO0/+yN4UVs\n...\n(المفتاح الكامل هنا)\n...\nq1YV+EQ=\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=jeddah-ads-123456.appspot.com

# ============================================
# Firebase Client SDK Configuration (Public)
# ============================================
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyABC123def456GHI789jkl012MNO345pqr
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=jeddah-ads-123456.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=jeddah-ads-123456
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=jeddah-ads-123456.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123def456ghi789
```

---

## ✅ نقاط مهمة

### 1. FIREBASE_PRIVATE_KEY

#### ✅ صحيح:
```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"
```

**ملاحظات:**
- محاط بعلامات اقتباس مزدوجة `"`
- يبدأ بـ `-----BEGIN PRIVATE KEY-----\n`
- ينتهي بـ `\n-----END PRIVATE KEY-----\n`
- لا مسافات إضافية
- كل السطر في سطر واحد (مع `\n` للأسطر الجديدة)

#### ❌ خطأ:
```env
# بدون علامات اقتباس
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...

# بدون \n
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----MIIEvQI..."

# مقسوم على عدة أسطر
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBg...
-----END PRIVATE KEY-----"
```

---

### 2. PROJECT_ID

يجب أن يكون نفس القيمة في مكانين:

```env
FIREBASE_PROJECT_ID=jeddah-ads-123456
NEXT_PUBLIC_FIREBASE_PROJECT_ID=jeddah-ads-123456
```

---

### 3. STORAGE_BUCKET

عادة يكون بهذا الشكل:

```env
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

**ليس:**
- `gs://your-project-id.appspot.com` ❌
- `https://your-project-id.appspot.com` ❌

---

## 🔍 كيف تحصل على القيم الصحيحة؟

### للحصول على بيانات Admin SDK:

1. افتح [Firebase Console](https://console.firebase.google.com/)
2. اختر مشروعك
3. اذهب إلى ⚙️ **Project Settings**
4. تبويب **Service Accounts**
5. انقر **Generate New Private Key**
6. سيتم تحميل ملف JSON

**مثال على محتوى ملف JSON:**
```json
{
  "type": "service_account",
  "project_id": "jeddah-ads-123456",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQI...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-abc123@jeddah-ads-123456.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

**انسخ القيم:**
- `project_id` → `FIREBASE_PROJECT_ID`
- `client_email` → `FIREBASE_CLIENT_EMAIL`
- `private_key` → `FIREBASE_PRIVATE_KEY`

---

### للحصول على بيانات Client SDK:

1. في نفس صفحة **Project Settings**
2. تبويب **General**
3. اسحب لأسفل إلى "Your apps"
4. اختر تطبيق الويب (أو أنشئ واحد)

**ستجد:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyABC123...",
  authDomain: "jeddah-ads-123456.firebaseapp.com",
  projectId: "jeddah-ads-123456",
  storageBucket: "jeddah-ads-123456.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123..."
};
```

**انسخها إلى `.env.local`:**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyABC123...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=jeddah-ads-123456.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=jeddah-ads-123456
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=jeddah-ads-123456.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123...
```

---

## 🧪 التحقق من الملف

بعد إنشاء الملف، شغّل:

```bash
npm run check-env
```

### الناتج المتوقع إذا كان كل شيء صحيح:

```
🔍 فحص المتغيرات البيئية

📦 Firebase Admin SDK:
────────────────────────────────────
  ✓ FIREBASE_PROJECT_ID موجود / Found
    └─ jeddah-ads-123456
  ✓ FIREBASE_CLIENT_EMAIL موجود / Found
    └─ firebase-adminsdk-abc123@jedd...
  ✓ FIREBASE_PRIVATE_KEY موجود / Found
    └─ ****** (مخفي / Hidden)
  ✓ FIREBASE_STORAGE_BUCKET موجود / Found
    └─ jeddah-ads-123456.appspot.com

📦 Firebase Client SDK:
────────────────────────────────────
  ✓ NEXT_PUBLIC_FIREBASE_API_KEY موجود
    └─ AIzaSyABC123def456GHI789jkl01...
  ...

✅ رائع! جميع المتغيرات البيئية موجودة وصحيحة
```

---

## ⚠️ أخطاء شائعة

### 1. "Missing FIREBASE_PROJECT_ID"
**السبب:** الملف غير موجود أو المتغير غير معرف  
**الحل:** تأكد من:
- اسم الملف هو `.env.local` (وليس `env.local` أو `.env`)
- الملف في المجلد الرئيسي للمشروع
- المتغير مكتوب بشكل صحيح

### 2. "قيمة افتراضية / Placeholder value"
**السبب:** لم تستبدل القيم من `.env.example`  
**الحل:** احصل على القيم الحقيقية من Firebase Console

### 3. "Service account object must contain..."
**السبب:** المفتاح الخاص بصيغة خاطئة  
**الحل:** تأكد من:
- وجود علامات الاقتباس `"..."`
- وجود `\n` في البداية والنهاية
- نسخ المفتاح كاملاً من ملف JSON

---

## 🔒 الأمان

### ⚠️ لا تفعل:
- ❌ لا ترفع `.env.local` إلى Git
- ❌ لا تشارك المفتاح الخاص مع أحد
- ❌ لا تنشر الملف على الإنترنت
- ❌ لا تحفظ المفاتيح في الكود المصدري

### ✅ افعل:
- ✅ احتفظ بنسخة آمنة من ملف JSON
- ✅ استخدم متغيرات بيئية مختلفة للإنتاج
- ✅ راجع `.gitignore` بانتظام
- ✅ غيّر المفاتيح إذا تم تسريبها

---

## 📞 المساعدة

إذا ما زلت تواجه مشاكل:

1. راجع [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
2. راجع [QUICK_FIX_GUIDE.md](QUICK_FIX_GUIDE.md)
3. شغّل `npm run check-env` وراجع الأخطاء

---

**محدث في:** 15 نوفمبر 2025
