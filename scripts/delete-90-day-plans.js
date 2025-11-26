#!/usr/bin/env node

/**
 * حذف باقات 3 أشهر (90 يوم) من Firebase
 * نبقي فقط على: أسبوع (7)، أسبوعين (14)، شهر (30)
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

async function delete90DayPlans() {
  console.log('\n🗑️  حذف باقات 3 أشهر (90 يوم)...\n');
  console.log('════════════════════════════════════════════════════════════\n');

  try {
    // جلب جميع الباقات
    const plansSnapshot = await db.collection('plans').get();
    let deleted = 0;
    let kept = 0;

    console.log(`📦 إجمالي الباقات: ${plansSnapshot.size}\n`);

    for (const doc of plansSnapshot.docs) {
      const plan = doc.data();
      
      if (plan.duration_days === 90) {
        console.log(`🗑️  حذف: ${plan.name}`);
        console.log(`   القطاع: ${plan.sector || 'غير محدد'}`);
        console.log(`   المدة: ${plan.duration_days} يوم`);
        console.log(`   السعر: ${plan.price} ريال\n`);
        
        await doc.ref.delete();
        deleted++;
      } else {
        kept++;
      }
    }

    console.log('════════════════════════════════════════════════════════════\n');
    console.log(`📊 النتائج:`);
    console.log(`   🗑️  تم حذف: ${deleted} باقة (90 يوم)`);
    console.log(`   ✅ تم الإبقاء على: ${kept} باقة`);
    console.log('\n✨ الباقات المتبقية:');
    console.log('   • أسبوع (7 أيام)');
    console.log('   • أسبوعين (14 يوم)');
    console.log('   • شهر (30 يوم)');
    console.log('\n✅ اكتمل الحذف بنجاح!\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ خطأ:', error);
    process.exit(1);
  }
}

// تشغيل
delete90DayPlans();

