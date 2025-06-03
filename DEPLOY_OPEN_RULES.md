# Deploy Open Firestore Rules (بدون قيود)

## ⚠️ تحذير مهم / Important Warning
هذه القواعد تسمح لأي شخص بقراءة وكتابة البيانات في قاعدة البيانات الخاصة بك.
These rules allow ANYONE to read and write to your database.
**استخدمها فقط للتطوير والاختبار / Use ONLY for development and testing**

## الطريقة الأولى: Firebase Console (الأسهل)

### Firestore Rules:
1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. اختر مشروعك (jeddah-ads-46daa)
3. انتقل إلى Firestore Database → Rules
4. احذف كل المحتوى الموجود
5. انسخ والصق هذا:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

6. اضغط "Publish"

### Storage Rules:
1. في Firebase Console، انتقل إلى Storage → Rules
2. احذف كل المحتوى الموجود
3. انسخ والصق هذا:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

4. اضغط "Publish"

## الطريقة الثانية: Firebase CLI

```bash
# تسجيل الدخول
firebase login

# نشر القواعد المفتوحة
firebase deploy --only firestore:rules,storage:rules --project jeddah-ads-46daa
```

## بعد النشر

1. أعد تشغيل خادم التطوير:
   ```bash
   pkill -f "npm run dev" && npm run dev
   ```

2. جرب تسجيل الدخول مرة أخرى:
   - http://localhost:3000/admin/login
   - Email: admin@yourdomain.com
   - Password: admin123

## ملاحظة مهمة

بعد الانتهاء من التطوير، تأكد من تطبيق قواعد الأمان المناسبة:
- استخدم `firestore.rules` و `storage.rules` للإنتاج
- لا تترك القواعد مفتوحة في بيئة الإنتاج أبداً