/**
 * 🔧 Script لإصلاح بيانات المعلن "احمد"
 * 
 * الاستخدام:
 * node scripts/fix-advertiser-data.js
 */

const admin = require('firebase-admin');
const path = require('path');

// تهيئة Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixAdvertiserData() {
  console.log('\n🔧 بدء إصلاح بيانات المعلن...\n');

  try {
    // معرف المعلن من نتائج الفحص
    const advertiserId = '7jHhwsjMOM6fZBSp1b6X';
    
    console.log(`📝 تحديث بيانات المعلن: ${advertiserId}`);
    
    // تحديث بيانات المعلن
    await db.collection('advertisers').doc(advertiserId).update({
      sector: 'movers',
      coverage_type: 'city',
      coverage_cities: ['jeddah'],
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ تم تحديث بيانات المعلن بنجاح!');
    
    // تحديث بيانات الاشتراك أيضاً
    const subscriptionId = 'UyP4K6TOTVRjcemsTHkq';
    
    console.log(`📦 تحديث بيانات الاشتراك: ${subscriptionId}`);
    
    await db.collection('subscriptions').doc(subscriptionId).update({
      coverage_area: 'city',
      city: 'jeddah',
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ تم تحديث بيانات الاشتراك بنجاح!');
    
    // التحقق من التحديث
    console.log('\n📊 التحقق من البيانات المحدثة:\n');
    
    const advertiserDoc = await db.collection('advertisers').doc(advertiserId).get();
    const advertiser = advertiserDoc.data();
    
    console.log(`   🏷️  القطاع: ${advertiser.sector}`);
    console.log(`   🌍 التغطية: ${advertiser.coverage_type}`);
    console.log(`   🏙️  المدن: ${advertiser.coverage_cities.join(', ')}`);
    
    console.log('\n✅ الآن سيظهر المعلن في:');
    console.log('   → صفحة جدة: /movers/jeddah');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ تم الإصلاح بنجاح!\n');

  } catch (error) {
    console.error('❌ خطأ أثناء الإصلاح:', error);
    process.exit(1);
  }

  process.exit(0);
}

// تشغيل الإصلاح
fixAdvertiserData();


