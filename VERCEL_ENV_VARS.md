# متغيرات البيئة لـ Vercel

## عند النشر على Vercel، أضف هذه المتغيرات في إعدادات المشروع:

### 1. في Vercel Dashboard:
- اذهب إلى Project Settings
- اختر Environment Variables
- أضف المتغيرات التالية:

### 2. المتغيرات المطلوبة:

```
NEXT_PUBLIC_SUPABASE_URL
https://faiyalnevtffqksrmxpt.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaXlhbG5ldnRmZnFrc3JteHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4ODA1MTksImV4cCI6MjA2NDQ1NjUxOX0.zUV_T64w8NCJoawMRQ_cabmAdlK8VSk_qEQKMYUQ88A

SUPABASE_SERVICE_ROLE_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaXlhbG5ldnRmZnFrc3JteHB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODg4MDUxOSwiZXhwIjoyMDY0NDU2NTE5fQ.ydqu8wFEsHW3yS3vfz-cnrQtJMjn5GHTA07vij6_SvM
```

### 3. ملاحظات مهمة:
- ✅ المتغيرات التي تبدأ بـ `NEXT_PUBLIC_` ستكون متاحة في المتصفح
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` سري جداً - استخدمه فقط في server-side
- 🔒 لا تشارك هذه المفاتيح علناً أبداً

### 4. بعد إضافة المتغيرات:
- اضغط Save
- Vercel سيعيد بناء المشروع تلقائياً
- موقعك سيكون جاهزاً!