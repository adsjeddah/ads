# إصلاح أخطاء الإنتاج على Vercel

## الأخطاء الحالية:
1. `GET /api/statistics/dashboard/ 500`
2. `GET /api/ad-requests/ 500`

## السبب المحتمل:
عدم تحديث متغيرات البيئة في Vercel

## الحل الفوري:

### 1. تحديث متغيرات البيئة في Vercel:

افتح: https://vercel.com/adsjeddah/ads/settings/environment-variables

أضف/حدث المتغيرات التالية:

```
NEXT_PUBLIC_API_URL=/api

FIREBASE_PROJECT_ID=jeddah-ads-46daa
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-cllmo@jeddah-ads-46daa.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCqvyAzE8zPdbj3\ndg4jxIYPK/aB3/l4h28OsIn6km4svLL4uhg71+QB5F0p9i1P9Pw1E4QjsO+zUApH\nb9EvL46Axv1bgFKqMd3wEoe6YGe+hOHIxtwpBd7DWTUfRJ1zK9LsfAGkImp1vf7w\nVyMsAUffivt+FNGXM4rQfbmATH24wbr76LZciLeY9qmUpEaVimmaonltsjecjANL\nK22y0AQ25dhfQc6M3nCiL7nh9gd9EKKYkjEslXJYXMtV0Jgz+DiRlEs7UwyAbxLX\njzrDvREBd/Ibb1uAHIG+htfgi9U/lvvfsryb26gscepm2S+xGQuilol6jMe3Vwym\nj2SLiBorAgMBAAECggEAGi+zvYGk4JBabMFTS9MBCGSiqqpx9TU4KBWVI7O/Z+cM\nv66ytsLWeh/O1femXWPiJjW3B05EhMiauvgAKe9uOHvMMXNNukJpmj8NR90vK/3v\nLr6o1zXKQ0V0KzZ3u0kWUSR3j/ejQimAZtXGVCJiJnuHNH/24OyLtowBnhadFW+I\nhj3koyFm7w9Zyh6MGKHiRDXk3m0nGKCA03Aa2XbOu/nplbktMOhFC2vsbARaUMYI\n2g1G/RZN5V7unhtQDkUScBteg6U9/bhjwsMGlKQYDazswJoKl5VBwuWeg+d1+B3Y\nm+TPuwYiNyzDlatDNvxyX4BNuIGcbKxyA1SqfzxTOQKBgQDdDMauQaPX1iDa62HA\ngi7TNwLUTjBi0p7bjCOjaqOxJFmX19OlGL5AzPu0m5+K4wuDFaBao4w2eIXAA9pj\nhimAGt03EzeVvf7jVKLJI6OTukKFoI2a0WgUVKBUK3wrEp/LBrCqG9cnkTSjY2fj\nQ4yml+9ia+k4MZf4wxpj849ZBwKBgQDFvkVJDZ+EcGGXTXuFNH6wFgmfxCU1ZwlD\nQWNfkrudPzS49gCKcQ69tYtwH5P9EdKMi/u4Kmg84EB9oQXQl5GgDw6G+buAdu9l\ngRHZx/fz+YaCeQccxDSVjPaM1nP+pTBt2u7gm7uGQL6e5lWKAh/H8X8oqqkJ2R0E\n9/5+i7mgvQKBgE1cY0wo/MZU0jrLlfJhnTGeVwcmNhjfzWjYqsBOWets5U4W4qMs\n/aiAFLcon7VjsGu37d7Kzg9iLqz8rDmYgn2q6TCVMSbez42P2Ui7iEvzK8TIY8aC\n8wHqfBH5BgOtCO9s7/cYtzvJvbpQ19LZmSfUlJrFWWGpOZ596YaBfvGRAoGBAKKX\ni6LAx9v/B89/z0O84TpqNGmgvzOE0DHzzwDjxs5KDVDUPaeXxJYqc0ezP1zDzcrw\nwv4wKFt9zKkaJXI2nYZQMm+pGOUEHcX48iw8T1y8afqhS1z6dD7AcaIdqLJYiCg1\n1w0TZvgGJZilS/mLJm3eOXCrfcsQ8sL+jEYeJm0dAoGBALvkpwM6C8u5EZvJFKyR\nBBhtcRgUb3hZcOuU0FzJtD9/j5Uj4rV5D3YrbqnJQM2aJ0fZ0F8s2/AsBJn7g3zB\nPcJoiTdCVKuH9I8J8FX5Ek2MfaJJYLNyMuJUcb6VRArcBwGEX5N4E4K8ccFp7Dzg\n+vkJ8L/bnS8yR/2X4G6Hw6/j\n-----END PRIVATE KEY-----"

NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCXVdoybZAESnPFRWqCZjZS4gFgGRRO090
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=jeddah-ads-46daa.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=jeddah-ads-46daa
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=jeddah-ads-46daa.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=210776216129
NEXT_PUBLIC_FIREBASE_APP_ID=1:210776216129:web:8a911e71d3406771acecc0
```

### 2. إعادة النشر:
بعد تحديث المتغيرات، اضغط على "Redeploy" في Vercel

### 3. التحقق من النشر:
- انتظر 2-3 دقائق حتى يكتمل النشر
- تحقق من الموقع: https://ads-chi-vert.vercel.app

## ملاحظة مهمة:
الأخطاء المعروضة **ليست** مرتبطة بنظام خطط الأسعار، بل بـ:
- statistics API (لوحة التحكم)
- ad-requests API (طلبات الإعلان)

نظام خطط الأسعار يعمل بشكل مستقل وسليم.