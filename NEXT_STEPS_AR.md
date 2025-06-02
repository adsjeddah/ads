# الخطوات التالية لإكمال النشر على Vercel + Supabase

## ✅ ما تم إنجازه حتى الآن:
1. ✅ إنشاء مشروع Supabase
2. ✅ إعداد ملفات التكوين (vercel.json, supabase-setup.sql)
3. ✅ تثبيت مكتبة @supabase/supabase-js
4. ✅ إنشاء ملف supabase-client.ts مع بيانات مشروعك

## 📋 الخطوات المتبقية:

### 1. إعداد قاعدة البيانات في Supabase:
1. اذهب إلى [Supabase Dashboard](https://app.supabase.com/project/faiyalnevtffqksrmxpt)
2. اذهب إلى SQL Editor
3. انسخ محتوى ملف `supabase-setup.sql`
4. الصقه في SQL Editor واضغط Run

### 2. إعداد Storage للصور:
1. في Supabase Dashboard، اذهب إلى Storage
2. اضغط "New bucket"
3. اسم الـ bucket: `advertiser-logos`
4. اختر "Public bucket" ✅
5. اضغط Create

### 3. الحصول على Service Role Key:
1. اذهب إلى Settings > API
2. انسخ `service_role` key (احتفظ به بأمان!)

### 4. النشر على Vercel:
1. اذهب إلى [vercel.com](https://vercel.com)
2. سجل دخول بحساب GitHub
3. اضغط "New Project"
4. اختر مستودع `adsjeddah/ads`
5. أضف متغيرات البيئة:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://faiyalnevtffqksrmxpt.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=[الـ service role key من الخطوة 3]
   ```
6. اضغط Deploy

### 5. تحديث كود المشروع (اختياري):
إذا أردت تحويل الكود بالكامل لاستخدام Supabase بدلاً من Express:
- استخدم الأمثلة في `lib/supabase-client.ts`
- حدث صفحات Admin لاستخدام Supabase
- احذف مجلد `server` (لن تحتاجه مع Supabase)

## 🎯 النتيجة النهائية:
- موقعك سيعمل على: `your-project.vercel.app`
- قاعدة البيانات والملفات محفوظة بشكل دائم
- أداء سريع جداً
- مجاني بالكامل!

## 💡 نصائح:
- احتفظ بنسخة احتياطية من Service Role Key
- فعّل Row Level Security في Supabase للأمان
- راقب استخدامك في Dashboards كلا الخدمتين

## 🆘 مساعدة:
- [وثائق Vercel](https://vercel.com/docs)
- [وثائق Supabase](https://supabase.com/docs)
- [مجتمع Next.js](https://github.com/vercel/next.js/discussions)