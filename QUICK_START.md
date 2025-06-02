# 🚀 البداية السريعة - نشر المشروع

## الحل الأمثل: Railway + Vercel (مجاني 100%)

### 📋 الخطوات السريعة (20 دقيقة فقط):

## 1️⃣ نشر Backend على Railway:

1. **إنشاء حساب:** [railway.app](https://railway.app)
2. **نشر المشروع:**
   - New Project → Deploy from GitHub → اختر `adsjeddah/ads`
   - **في الإعدادات:**
     ```
     Root Directory: server
     Start Command: npm install && node index.js
     ```

3. **إضافة Volume (مهم جداً!):**
   - Settings → Volumes → Add Volume
   - Mount Path: `/data`

4. **متغيرات البيئة:**
   ```
   PORT=5001
   JWT_SECRET=jeddah-ads-secret-key-2024
   DATABASE_PATH=/data/jeddah_ads.db
   UPLOADS_DIR=/data/uploads
   NODE_ENV=production
   FRONTEND_URL=https://your-app.vercel.app
   ```

5. **احفظ رابط Backend:** مثل `https://your-backend.up.railway.app`

---

## 2️⃣ نشر Frontend على Vercel:

1. **إنشاء حساب:** [vercel.com](https://vercel.com)
2. **نشر المشروع:**
   - New Project → Import من GitHub → اختر `adsjeddah/ads`

3. **متغير بيئة واحد فقط:**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api
   ```
   (استخدم رابط Backend من Railway)

4. **Deploy!** 🎉

---

## ✅ التحقق:

1. **Backend:** `https://your-backend.up.railway.app/api/health` → يجب أن يظهر "OK"
2. **Frontend:** افتح موقعك على Vercel
3. **Admin:** `/admin/login` → `admin@jeddah-ads.com` / `admin123`

---

## 🎯 النتيجة:
- ✅ موقع سريع واحترافي
- ✅ قاعدة بيانات دائمة
- ✅ رفع ملفات دائم
- ✅ **مجاني 100%**

للتفاصيل الكاملة: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)