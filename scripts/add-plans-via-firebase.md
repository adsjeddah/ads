# إضافة خطط الأسعار عبر Firebase Console

## الخطوات:

1. افتح Firebase Console:
   https://console.firebase.google.com/u/0/project/jeddah-ads-46daa/firestore/data/~2Fplans

2. اضغط على "Start collection" إذا لم تكن المجموعة موجودة
3. أدخل "plans" كاسم المجموعة
4. أضف المستندات التالية:

### الخطة الأساسية:
```
Document ID: Auto-ID
Fields:
- name (string): "الخطة الأساسية"
- description (string): "مناسبة للشركات الناشئة"
- price (number): 500
- duration_days (number): 30
- features (array): 
  - "ظهور في قائمة الشركات"
  - "معلومات الاتصال الأساسية"
  - "دعم عبر البريد الإلكتروني"
- is_active (boolean): true
- created_at (timestamp): Now
```

### الخطة المتقدمة:
```
Document ID: Auto-ID
Fields:
- name (string): "الخطة المتقدمة"
- description (string): "للشركات المتوسطة"
- price (number): 1000
- duration_days (number): 30
- features (array):
  - "ظهور مميز في القائمة"
  - "شعار الشركة"
  - "وصف تفصيلي للخدمات"
  - "أولوية في الترتيب"
  - "دعم عبر الهاتف"
- is_active (boolean): true
- created_at (timestamp): Now
```

### الخطة الاحترافية:
```
Document ID: Auto-ID
Fields:
- name (string): "الخطة الاحترافية"
- description (string): "للشركات الكبرى"
- price (number): 2000
- duration_days (number): 30
- features (array):
  - "ظهور في أعلى القائمة"
  - "شعار مميز وبارز"
  - "صفحة مخصصة للشركة"
  - "إحصائيات مفصلة"
  - "دعم مخصص 24/7"
  - "إعلانات مميزة"
- is_active (boolean): true
- created_at (timestamp): Now
```

## للتحقق من الإضافة:
1. افتح http://localhost:3001/advertise
2. يجب أن تظهر الخطط الثلاث