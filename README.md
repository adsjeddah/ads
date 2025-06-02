# 🏢 نظام إعلانات نقل العفش - جدة

نظام إعلاني احترافي متكامل لشركات نقل العفش في جدة، يوفر منصة سهلة للشركات لعرض خدماتها وللعملاء للعثور على أفضل الخدمات.

## ✨ المميزات الرئيسية

### للزوار:
- 🏠 صفحة رئيسية جذابة مع عرض جميع الشركات المعلنة
- 📱 تصميم متجاوب يعمل على جميع الأجهزة
- 📞 اتصال مباشر أو واتساب مع الشركات
- 🔍 عرض تفاصيل الخدمات لكل شركة
- 📝 نموذج طلب إعلان سهل

### للإدارة:
- 👨‍💼 لوحة تحكم شاملة
- 👥 إدارة كاملة للمعلنين
- 💰 نظام اشتراكات وفواتير متقدم
- 📊 إحصائيات مفصلة
- 📋 إدارة طلبات الإعلان
- 🖼️ رفع وإدارة شعارات الشركات

## 🛠️ التقنيات المستخدمة

### Frontend:
- **Next.js 14** - إطار عمل React متقدم
- **TypeScript** - للكتابة الآمنة
- **Tailwind CSS** - للتصميم السريع
- **Framer Motion** - للحركات السلسة
- **React Icons** - مكتبة أيقونات شاملة
- **Recharts** - للرسوم البيانية

### Backend:
- **Express.js** - خادم Node.js
- **SQLite** - قاعدة بيانات خفيفة وقوية
- **JWT** - للمصادقة الآمنة
- **Multer** - لرفع الملفات
- **Bcrypt** - لتشفير كلمات المرور

## 🚀 التشغيل المحلي

### المتطلبات:
- Node.js 16+ 
- npm أو yarn

### خطوات التثبيت:

1. **استنساخ المشروع:**
```bash
git clone https://github.com/adsjeddah/ads.git
cd jeddah-ads
```

2. **تثبيت المكتبات:**
```bash
npm install
```

3. **إنشاء ملف `.env`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
JWT_SECRET=your-secret-key-here
```

4. **تشغيل المشروع:**
```bash
# تشغيل Frontend و Backend معاً
npm run dev:all

# أو تشغيلهما منفصلين:
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server
```

5. **فتح المشروع:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001/api

## 📁 هيكل المشروع

```
jeddah-ads/
├── pages/              # صفحات Next.js
│   ├── index.tsx       # الصفحة الرئيسية
│   ├── advertise.tsx   # صفحة طلب إعلان
│   └── admin/          # لوحة التحكم
├── server/             # Backend Express
│   ├── index.js        # نقطة البداية
│   ├── database.js     # إعداد قاعدة البيانات
│   └── uploads/        # مجلد الملفات المرفوعة
├── styles/             # ملفات CSS
├── public/             # الملفات العامة
└── components/         # مكونات React
```

## 🔐 بيانات الدخول الافتراضية

للوصول إلى لوحة التحكم:
- **الرابط:** `/admin/login`
- **البريد:** `admin@jeddah-ads.com`
- **كلمة المرور:** `admin123`

## 🌐 النشر

للحصول على دليل مفصل للنشر المجاني، راجع [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

### النشر الموصى به:
- **Frontend:** Vercel (مجاني)
- **Backend:** Railway ($5 رصيد مجاني شهرياً)

## 📊 قاعدة البيانات

المشروع يستخدم SQLite مع الجداول التالية:
- `advertisers` - المعلنين
- `plans` - خطط الاشتراك
- `subscriptions` - الاشتراكات
- `invoices` - الفواتير
- `ad_requests` - طلبات الإعلان

## 🤝 المساهمة

نرحب بالمساهمات! يرجى:
1. Fork المشروع
2. إنشاء فرع جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى الفرع (`git push origin feature/amazing-feature`)
5. فتح Pull Request

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

## 📞 الدعم

للمساعدة أو الاستفسارات:
- فتح Issue في GitHub
- التواصل عبر البريد الإلكتروني

---

صُنع بـ ❤️ لخدمة مجتمع جدة