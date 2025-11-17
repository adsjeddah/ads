# How to Add Initial Plans to Firebase

Since the plans collection is empty, you need to add some initial pricing plans. Here's the easiest way:

## Option 1: Via Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/u/0/project/jeddah-ads-46daa/firestore/data/~2Fplans)
2. Click on "plans" collection
3. Click "Add document"
4. Add the following documents:

### Plan 1: Basic Plan
```
Document ID: Auto-generate
Fields:
- name: "الخطة الأساسية"
- description: "مناسبة للشركات الناشئة"
- price: 500
- duration_days: 30
- features: ["ظهور في قائمة الشركات", "معلومات الاتصال الأساسية", "دعم عبر البريد الإلكتروني"]
- is_active: true
- created_at: Current timestamp
```

### Plan 2: Advanced Plan
```
Document ID: Auto-generate
Fields:
- name: "الخطة المتقدمة"
- description: "للشركات المتوسطة"
- price: 1000
- duration_days: 30
- features: ["ظهور مميز في القائمة", "شعار الشركة", "وصف تفصيلي للخدمات", "أولوية في الترتيب", "دعم عبر الهاتف"]
- is_active: true
- created_at: Current timestamp
```

### Plan 3: Professional Plan
```
Document ID: Auto-generate
Fields:
- name: "الخطة الاحترافية"
- description: "للشركات الكبرى"
- price: 2000
- duration_days: 30
- features: ["ظهور في أعلى القائمة", "شعار مميز وبارز", "صفحة مخصصة للشركة", "إحصائيات مفصلة", "دعم مخصص 24/7", "إعلانات مميزة"]
- is_active: true
- created_at: Current timestamp
```

## Option 2: Via Admin Panel

Once you log into the admin panel:
1. Go to `/admin/dashboard`
2. Navigate to Plans section
3. Add new plans through the UI

## After Adding Plans

Once you've added the plans, refresh the advertise page at http://localhost:3001/advertise and the plans should appear.