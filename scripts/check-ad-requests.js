const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// قراءة ملف .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim().replace(/^"(.*)"$/, '$1');
  }
});

// إعداد Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

async function checkAdRequests() {
  try {
    console.log('جاري البحث عن طلبات الإعلان...\n');
    
    const adRequestsRef = db.collection('ad_requests');
    const snapshot = await adRequestsRef.orderBy('created_at', 'desc').get();
    
    if (snapshot.empty) {
      console.log('❌ لم يتم العثور على أي طلبات إعلان!');
      return;
    }
    
    console.log(`✅ تم العثور على ${snapshot.size} طلبات إعلان:\n`);
    
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`--- طلب رقم ${index + 1} ---`);
      console.log(`ID: ${doc.id}`);
      console.log(`اسم الشركة: ${data.company_name}`);
      console.log(`اسم المسؤول: ${data.contact_name}`);
      console.log(`الهاتف: ${data.phone}`);
      console.log(`الواتساب: ${data.whatsapp || 'غير محدد'}`);
      console.log(`الحالة: ${data.status}`);
      console.log(`تاريخ الإنشاء: ${data.created_at?.toDate?.() || data.created_at}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ خطأ في جلب طلبات الإعلان:', error);
  }
}

// تشغيل الفحص
checkAdRequests().then(() => {
  console.log('✅ انتهى الفحص');
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ عام:', error);
  process.exit(1);
});