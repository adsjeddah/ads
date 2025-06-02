# دليل نشر مشروع إعلانات نقل العفش - جدة

## الخطة المجانية الموصى بها: Vercel + Supabase

### لماذا هذا الحل هو الأفضل؟

1. **Vercel** - للواجهة الأمامية (Next.js)
   - مجاني 100% للمشاريع الشخصية
   - محسّن خصيصاً لـ Next.js
   - نشر تلقائي من GitHub
   - أداء ممتاز وسرعة عالية
   - SSL مجاني

2. **Supabase** - للخلفية وقاعدة البيانات
   - قاعدة بيانات PostgreSQL مجانية (500MB)
   - تخزين ملفات مجاني (1GB) 
   - API جاهز (لا حاجة لخادم Express منفصل)
   - Authentication مدمج
   - Realtime subscriptions

## خطوات النشر التفصيلية

### الخطوة 1: إعداد Supabase

1. **إنشاء حساب على Supabase**
   - اذهب إلى [supabase.com](https://supabase.com)
   - أنشئ حساب مجاني
   - أنشئ مشروع جديد

2. **إعداد قاعدة البيانات**
   - اذهب إلى SQL Editor في Supabase
   - انسخ والصق محتوى ملف `supabase-setup.sql`
   - اضغط Run

3. **إعداد Storage للصور**
   - اذهب إلى Storage
   - أنشئ bucket جديد باسم "advertiser-logos"
   - اجعله public

4. **احصل على مفاتيح API**
   - اذهب إلى Settings > API
   - انسخ:
     - Project URL
     - anon/public key
     - service_role key

### الخطوة 2: تحديث الكود للعمل مع Supabase

1. **تثبيت مكتبة Supabase**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **إنشاء ملف للاتصال بـ Supabase**
   أنشئ ملف `lib/supabase.ts`:
   ```typescript
   import { createClient } from '@supabase/supabase-js'

   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
   const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

   export const supabase = createClient(supabaseUrl, supabaseAnonKey)
   ```

3. **تحديث API calls**
   بدلاً من استخدام axios للاتصال بخادم Express، استخدم Supabase مباشرة:
   
   مثال - جلب المعلنين:
   ```typescript
   const { data, error } = await supabase
     .from('advertisers')
     .select('*')
     .eq('status', 'active')
   ```

### الخطوة 3: نشر على Vercel

1. **إنشاء حساب على Vercel**
   - اذهب إلى [vercel.com](https://vercel.com)
   - سجل دخول بحساب GitHub

2. **استيراد المشروع**
   - اضغط "New Project"
   - اختر مستودع GitHub الخاص بك
   - Vercel سيكتشف أنه مشروع Next.js تلقائياً

3. **إضافة متغيرات البيئة**
   أضف هذه المتغيرات في إعدادات المشروع:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   ```

4. **النشر**
   - اضغط Deploy
   - انتظر حتى يكتمل البناء

### الخطوة 4: تحديث الروابط

1. **تحديث CORS في Supabase**
   - اذهب إلى Authentication > URL Configuration
   - أضف رابط موقعك من Vercel

2. **اختبار الموقع**
   - زر الرابط الذي يوفره Vercel
   - جرب جميع الوظائف

## مميزات هذا الحل

1. **مجاني بالكامل** للاستخدام الشخصي والمشاريع الصغيرة
2. **سريع جداً** - Vercel Edge Network + Supabase CDN
3. **آمن** - SSL مجاني + Row Level Security في Supabase
4. **سهل الصيانة** - نشر تلقائي من GitHub
5. **قابل للتوسع** - يمكن الترقية للخطط المدفوعة عند الحاجة

## ملاحظات مهمة

- **الحدود المجانية كافية جداً** لمشروعك:
  - Vercel: 100GB bandwidth شهرياً
  - Supabase: 500MB database + 1GB storage + 2GB bandwidth
  
- **لا حاجة لخادم Express منفصل** - Supabase يوفر API جاهز

- **الأداء ممتاز** - كلا الخدمتين لديهما CDN عالمي

## الدعم والمساعدة

- وثائق Vercel: [vercel.com/docs](https://vercel.com/docs)
- وثائق Supabase: [supabase.com/docs](https://supabase.com/docs)
- مجتمع Next.js: [nextjs.org/learn](https://nextjs.org/learn)