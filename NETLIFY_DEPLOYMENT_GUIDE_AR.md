# دليل النشر على Netlify + Supabase

## نعم! يمكنك استخدام Netlify بدلاً من Vercel

### لماذا Netlify + Supabase؟

**Netlify:**
- ✅ مجاني 100% (100GB bandwidth شهرياً)
- ✅ ممتاز مع Next.js
- ✅ نشر تلقائي من GitHub
- ✅ SSL مجاني
- ✅ أسهل في الإعداد من Vercel

**Supabase:** (نفس المميزات)
- ✅ قاعدة بيانات PostgreSQL مجانية
- ✅ تخزين ملفات مجاني
- ✅ API جاهز

## خطوات النشر على Netlify:

### 1. إنشاء حساب Netlify:
1. اذهب إلى [netlify.com](https://netlify.com)
2. سجل بحساب GitHub

### 2. نشر المشروع:
1. اضغط "Add new site" → "Import an existing project"
2. اختر GitHub
3. اختر مستودع `adsjeddah/ads`
4. **الإعدادات ستكون تلقائية** (Netlify سيكتشف Next.js)

### 3. إضافة متغيرات البيئة:
1. اذهب إلى Site settings → Environment variables
2. أضف المتغيرات التالية:

```
NEXT_PUBLIC_SUPABASE_URL
https://faiyalnevtffqksrmxpt.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaXlhbG5ldnRmZnFrc3JteHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4ODA1MTksImV4cCI6MjA2NDQ1NjUxOX0.zUV_T64w8NCJoawMRQ_cabmAdlK8VSk_qEQKMYUQ88A

SUPABASE_SERVICE_ROLE_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaXlhbG5ldnRmZnFrc3JteHB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODg4MDUxOSwiZXhwIjoyMDY0NDU2NTE5fQ.ydqu8wFEsHW3yS3vfz-cnrQtJMjn5GHTA07vij6_SvM
```

### 4. النشر:
1. اضغط "Deploy site"
2. انتظر 2-3 دقائق
3. موقعك جاهز! 🎉

## مقارنة سريعة:

| الميزة | Netlify | Vercel |
|--------|---------|--------|
| السهولة | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| السرعة | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| الحد المجاني | 100GB | 100GB |
| Next.js | ممتاز | ممتاز |
| الواجهة | أبسط | أكثر تقدماً |

## الخلاصة:
**Netlify أسهل وأبسط** - مناسب جداً لمشروعك!

## ملاحظة:
- ملف `netlify.toml` جاهز في مشروعك
- نفس إعدادات Supabase تعمل مع Netlify
- لا تحتاج أي تغييرات في الكود!