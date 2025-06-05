# دليل تحسين الأداء لإعلانات Google Ads

## التحسينات المطبقة حالياً

### 1. تكوين Next.js للأداء
- ✅ تفعيل `swcMinify` لضغط أفضل
- ✅ تفعيل `compress` لضغط HTTP
- ✅ إزالة `poweredByHeader` لتقليل حجم الاستجابة
- ✅ تحسين الصور مع `next/image`
- ✅ تقسيم الحزم (Code Splitting) مع webpack

### 2. Service Worker للتخزين المؤقت
- ✅ تخزين الأصول الثابتة (CSS, JS, الصور)
- ✅ استراتيجية Cache First للأصول
- ✅ Network First للـ API

### 3. تحسين الصور
- ✅ استخدام صيغ AVIF و WebP
- ✅ أحجام متعددة للأجهزة المختلفة
- ✅ Lazy Loading تلقائي
- ✅ تخزين مؤقت لمدة 60 ثانية

### 4. تحسين CSS
- ✅ Tailwind CSS مع PurgeCSS
- ✅ ضغط CSS تلقائي
- ✅ إزالة الأكواد غير المستخدمة

### 5. تحسينات أخرى
- ✅ Preconnect للنطاقات الخارجية
- ✅ Dynamic imports للمكونات الثقيلة
- ✅ تحميل الخطوط بشكل محسّن

## قياس الأداء

### استخدام Lighthouse
```bash
# في Chrome DevTools
1. افتح DevTools (F12)
2. اذهب إلى تبويب Lighthouse
3. اختر "Performance" و "Mobile"
4. اضغط "Generate report"
```

### المقاييس المستهدفة لـ Google Ads
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.8s
- Total Blocking Time (TBT): < 300ms
- Cumulative Layout Shift (CLS): < 0.1

## نصائح إضافية للإنتاج

### 1. استخدام CDN
```javascript
// في vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 2. تحسين Firebase
- استخدم Firebase Hosting CDN
- فعّل التخزين المؤقت للاستعلامات
- قلل عدد الاستعلامات في الصفحة الرئيسية

### 3. مراقبة الأداء
- استخدم Google Analytics 4
- راقب Core Web Vitals
- استخدم Vercel Analytics

## قائمة التحقق قبل الإطلاق

- [ ] تأكد من أن جميع الصور محسّنة
- [ ] تحقق من نتائج Lighthouse (Score > 90)
- [ ] اختبر على اتصال بطيء (3G)
- [ ] تأكد من عمل Service Worker
- [ ] راجع حجم الحزم (Bundle Size)
- [ ] تحقق من عدم وجود أخطاء في Console
- [ ] اختبر على أجهزة مختلفة

## أوامر مفيدة

```bash
# تحليل حجم الحزم
npm run analyze

# بناء للإنتاج
npm run build

# معاينة بناء الإنتاج
npm run start

# اختبار الأداء محلياً
npx lighthouse http://localhost:3000 --view