#!/usr/bin/env node

/**
 * تنظيف شامل: حذف جميع الباقات غير المطلوبة
 * الإبقاء فقط على: 7، 14، 30 يوم
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const ALLOWED_DURATIONS = [7, 14, 30]; // الإبقاء فقط على هذه المدد

async function cleanupOldPlans() {
  console.log('\n🧹 تنظيف شامل للباقات القديمة...\n');
  console.log('════════════════════════════════════════════════════════════\n');
  console.log('✅ سيتم الإبقاء على: 7، 14، 30 يوم فقط\n');
  console.log('🗑️  سيتم حذف: جميع المدد الأخرى\n');
  console.log('════════════════════════════════════════════════════════════\n');

  try {
    const plansSnapshot = await db.collection('plans').get();
    let deleted = 0;
    let kept = 0;

    for (const doc of plansSnapshot.docs) {
      const plan = doc.data();
      
      if (!ALLOWED_DURATIONS.includes(plan.duration_days)) {
        console.log(`🗑️  حذف: ${plan.name || 'باقة غير مسماة'}`);
        console.log(`   المدة: ${plan.duration_days} يوم`);
        console.log(`   السعر: ${plan.price} ريال`);
        console.log(`   القطاع: ${plan.sector || 'غير محدد'}\n`);
        
        await doc.ref.delete();
        deleted++;
      } else {
        kept++;
      }
    }

    console.log('════════════════════════════════════════════════════════════\n');
    console.log(`📊 النتائج:`);
    console.log(`   🗑️  تم حذف: ${deleted} باقة قديمة`);
    console.log(`   ✅ تم الإبقاء على: ${kept} باقة`);
    console.log('\n✨ الباقات المتبقية (فقط):');
    console.log('   • أسبوع (7 أيام)');
    console.log('   • أسبوعين (14 يوم)');
    console.log('   • شهر (30 يوم)');
    console.log('\n✅ التنظيف اكتمل بنجاح!\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ خطأ:', error);
    process.exit(1);
  }
}

// تشغيل
cleanupOldPlans();

