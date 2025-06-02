# 🚀 دليل نشر مشروع إعلانات نقل العفش - جدة

## الحل الأمثل: Railway (Backend) + Vercel (Frontend)

### لماذا هذا الحل؟
- ✅ **مجاني بالكامل** (Railway $5 رصيد شهري + Vercel مجاني)
- ✅ **تخزين دائم** لقاعدة البيانات والملفات
- ✅ **أداء ممتاز** وسرعة عالية
- ✅ **سهل الإعداد** (20 دقيقة فقط)

---

## 📋 الخطوات التفصيلية:

### الجزء الأول: نشر Backend على Railway

#### 1. إنشاء حساب Railway:
- اذهب إلى [railway.app](https://railway.app)
- سجل دخول بحساب GitHub
- ستحصل على $5 رصيد مجاني شهرياً

#### 2. نشر Backend:
1. اضغط **"New Project"**
2. اختر **"Deploy from GitHub repo"**
3. اختر مستودع `adsjeddah/ads`
4. **مهم جداً** - في الإعدادات:
   ```
   Root Directory: server
   Start Command: npm install && node index.js
   ```

#### 3. إضافة Volume للتخزين الدائم:
1. في لوحة تحكم المشروع، اضغط على الخدمة
2. اذهب إلى **Settings** → **Volumes**
3. اضغط **"Add Volume"**
4. الإعدادات:
   ```
   Name: data
   Mount Path: /data
   Size: 1GB
   ```

#### 4. إضافة متغيرات البيئة:
في Railway dashboard → Variables، أضف:
```
PORT=5001
JWT_SECRET=jeddah-ads-secret-key-2024
DATABASE_PATH=/data/jeddah_ads.db
UPLOADS_DIR=/data/uploads
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
```

#### 5. احصل على رابط Backend:
بعد النشر، ستحصل على رابط مثل:
```
https://jeddah-ads-backend.up.railway.app
```

---

### الجزء الثاني: نشر Frontend على Vercel

#### 1. إنشاء حساب Vercel:
- اذهب إلى [vercel.com](https://vercel.com)
- سجل دخول بحساب GitHub

#### 2. نشر Frontend:
1. اضغط **"New Project"**
2. اختر مستودع `adsjeddah/ads`
3. Vercel سيكتشف أنه مشروع Next.js تلقائياً

#### 3. إضافة متغيرات البيئة:
أضف متغير واحد فقط:
```
NEXT_PUBLIC_API_URL=https://jeddah-ads-backend.up.railway.app/api
```
(استخدم رابط Backend الذي حصلت عليه من Railway)

#### 4. النشر:
- اضغط **"Deploy"**
- انتظر 2-3 دقائق
- موقعك جاهز! 🎉

---

## ✅ التحقق من نجاح النشر:

### 1. اختبر Backend:
افتح في المتصفح:
```
https://your-backend.up.railway.app/api/health
```
يجب أن ترى: **OK**

### 2. اختبر Frontend:
- افتح موقعك على Vercel
- يجب أن تظهر الصفحة الرئيسية
- جرب صفحة "أعلن معنا"

### 3. اختبر لوحة التحكم:
- اذهب إلى `/admin/login`
- بيانات الدخول الافتراضية:
  ```
  Email: admin@jeddah-ads.com
  Password: admin123
  ```

---

## 🔧 إعدادات إضافية مهمة:

### تحديث CORS في Railway:
تأكد من أن متغير `FRONTEND_URL` في Railway يشير إلى رابط موقعك على Vercel.

### النسخ الاحتياطي:
Railway يوفر نسخ احتياطية تلقائية للـ Volumes. يمكنك أيضاً تنزيل قاعدة البيانات يدوياً.

---

## 📊 الموارد المتاحة:

### Railway (الخطة المجانية):
- 💾 500 ساعة تشغيل شهرياً
- 📦 1GB تخزين دائم
- 🌐 عرض نطاق غير محدود
- ⚡ أداء ممتاز

### Vercel (الخطة المجانية):
- 🌐 100GB bandwidth شهرياً
- ⚡ Edge Network عالمي
- 🔒 SSL مجاني
- 🚀 نشر غير محدود

---

## 🆘 حل المشاكل الشائعة:

### إذا لم تظهر البيانات في الموقع:
1. تأكد من أن `NEXT_PUBLIC_API_URL` صحيح
2. تأكد من أن Backend يعمل
3. افحص Console في المتصفح

### إذا فشل رفع الصور:
1. تأكد من أن Volume مُضاف في Railway
2. تأكد من أن `UPLOADS_DIR=/data/uploads`

---

## 🎯 النتيجة النهائية:

بعد إتمام هذه الخطوات، سيكون لديك:
- ✅ موقع احترافي سريع على Vercel
- ✅ API قوي على Railway
- ✅ قاعدة بيانات دائمة
- ✅ تخزين دائم للملفات
- ✅ نظام كامل يعمل 24/7
- ✅ **مجاناً بالكامل!**

---

## 📞 للمساعدة:
- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

بالتوفيق! 🚀