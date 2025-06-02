# حل سريع: ربط Backend مع Netlify

## المشكلة:
موقعك على Netlify يعمل لكن لا يظهر الإعلانات أو لوحة التحكم لأن الـ Backend غير متصل.

## الحل السريع: Railway.app للـ Backend (15 دقيقة)

### خطوات بسيطة:

### 1️⃣ نشر Backend على Railway:
1. اذهب إلى [railway.app](https://railway.app)
2. سجل دخول بـ GitHub
3. اضغط "New Project" → "Deploy from GitHub"
4. اختر مستودع `adsjeddah/ads`
5. **مهم جداً - في الإعدادات غيّر:**
   ```
   Root Directory: server
   Start Command: node index.js
   ```

### 2️⃣ أضف متغيرات البيئة في Railway:
اضغط على المشروع → Variables → أضف:
```
PORT=3000
JWT_SECRET=jeddah-ads-secret-key-2024
DATABASE_PATH=./data/jeddah_ads.db
UPLOADS_DIR=./data/uploads
FRONTEND_URL=https://your-site.netlify.app
NODE_ENV=production
```
**ملاحظة:** تأكد من أن `DATABASE_PATH` و `UPLOADS_DIR` يشيران إلى مجلد داخل `/app/data` إذا كنت ستستخدم Volume. إذا لم تستخدم Volume في البداية، يمكنك استخدام `./jeddah_ads.db` و `./uploads` ولكن البيانات ستكون مؤقتة.

### 3️⃣ (اختياري لكن موصى به) إضافة Volume للتخزين الدائم في Railway:
1. في لوحة تحكم Railway، اذهب إلى إعدادات الخدمة (Service settings).
2. اضغط "Add Volume".
3. Mount path: `/app/data` (أو أي مسار تختاره، لكن يجب أن يتطابق مع `DATABASE_PATH` و `UPLOADS_DIR` أعلاه).
4. Size: 1GB (أو حسب الحاجة).
5. إذا استخدمت Volume، عدّل متغيرات البيئة في Railway لتصبح مثلاً:
   ```
   DATABASE_PATH=/app/data/jeddah_ads.db
   UPLOADS_DIR=/app/data/uploads
   ```

### 4️⃣ احصل على رابط Backend:
بعد النشر، ستجد رابط مثل:
`https://your-app.up.railway.app`

### 5️⃣ حدّث Netlify:
1. في Netlify → Site settings → Environment variables
2. أضف أو حدّث:
   ```
   NEXT_PUBLIC_API_URL=https://your-app.up.railway.app/api
   ```
3. اضغط "Clear cache and deploy site"

### 6️⃣ انتظر دقيقتين... وانتهى! 🎉

## للتأكد من أن كل شيء يعمل:
1. افتح: `https://your-app.up.railway.app/api/health`
   - يجب أن ترى: OK
2. افتح موقعك على Netlify
   - يجب أن تظهر الإعلانات
3. جرب تسجيل الدخول كمدير:
   - Email: `admin@jeddah-ads.com`
   - Password: `admin123` (أو كلمة المرور التي عينتها)

## ملاحظات:
- Railway مجاني ($5 رصيد شهرياً) - كافي لمشروعك.
- البيانات ستُحفظ بشكل دائم باستخدام Volumes (تأكد من إضافتها في Railway إذا أردت ذلك!).
- هذا الحل يفصل الواجهة الأمامية عن الخلفية، وهو نمط شائع واحترافي.

بالتوفيق!