# دليل نشر Backend على Railway.app

## المشكلة:
- Netlify تستضيف الواجهة الأمامية فقط
- تحتاج استضافة منفصلة للـ Backend (Express.js)

## الحل: Railway.app للـ Backend

### 1. إنشاء حساب Railway:
1. اذهب إلى [railway.app](https://railway.app)
2. سجل بحساب GitHub
3. ستحصل على $5 رصيد مجاني شهرياً

### 2. نشر Backend:
1. اضغط "New Project"
2. اختر "Deploy from GitHub repo"
3. اختر مستودع `adsjeddah/ads`
4. **مهم:** في الإعدادات، غيّر:
   - Root Directory: `server`
   - Start Command: `node index.js`

### 3. إضافة متغيرات البيئة في Railway:
```
PORT=3000
JWT_SECRET=your-very-strong-secret-key-2024
DATABASE_PATH=/app/data/jeddah_ads.db
UPLOADS_DIR=/app/data/uploads
FRONTEND_URL=https://your-site.netlify.app
```

### 4. إضافة Volume للتخزين الدائم:
1. في Railway dashboard، اذهب إلى service settings
2. اضغط "Add Volume"
3. Mount path: `/app/data`
4. Size: 1GB

### 5. الحصول على رابط Backend:
1. بعد النشر، ستحصل على رابط مثل:
   `https://your-backend.up.railway.app`

### 6. تحديث Netlify:
1. في Netlify، اذهب إلى Environment variables
2. أضف:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api
   ```
3. أعد نشر الموقع

## النتيجة:
- Frontend على Netlify ✅
- Backend على Railway ✅
- قاعدة البيانات والملفات محفوظة ✅