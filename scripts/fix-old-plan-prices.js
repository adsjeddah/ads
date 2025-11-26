#!/usr/bin/env node

/**
 * إصلاح أو حذف الباقات القديمة ذات الأسعار الخاطئة
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

async function fixOldPlanPrices() {
  console.log('\n🔧 إصلاح الباقات القديمة...\n');
  console.log('════════════════════════════════════════════════════════════\n');

  try {
    const plansSnapshot = await db.collection('plans').get();
    let fixed = 0;
    let deleted = 0;

    for (const doc of plansSnapshot.docs) {
      const plan = doc.data();
      
      // إذا كانت الباقة ليس لها قطاع أو مدينة، احذفها (باقة قديمة)
      if (!plan.sector && !plan.city && (!plan.name || plan.name.includes('باقة أسبوعية') || plan.name.includes('باقة شهرية'))) {
        console.log(`🗑️  حذف باقة قديمة: ${plan.name || 'غير مسماة'}`);
        console.log(`   المدة: ${plan.duration_days} يوم | السعر: ${plan.price} ريال\n`);
        
        await doc.ref.delete();
        deleted++;
        continue;
      }
      
      // إصلاح الباقات التي لها قطاع أو مدينة ولكن السعر خاطئ
      const expectedPrices = {
        city: { 7: 400, 14: 800, 30: 1500 },
        kingdom: { 7: 850, 14: 1600, 30: 3000 }
      };
      
      const planType = plan.plan_type || (plan.city ? 'city' : 'kingdom');
      const duration = plan.duration_days;
      
      if (expectedPrices[planType] && expectedPrices[planType][duration]) {
        const expectedPrice = expectedPrices[planType][duration];
        
        if (plan.price !== expectedPrice) {
          console.log(`🔧 تحديث: ${plan.name}`);
          console.log(`   السعر القديم: ${plan.price} ريال → السعر الجديد: ${expectedPrice} ريال\n`);
          
          await doc.ref.update({
            price: expectedPrice
          });
          fixed++;
        }
      }
    }

    console.log('════════════════════════════════════════════════════════════\n');
    console.log(`📊 النتائج:`);
    console.log(`   🔧 تم تحديث: ${fixed} باقة`);
    console.log(`   🗑️  تم حذف: ${deleted} باقة قديمة`);
    console.log('\n✅ الإصلاح اكتمل بنجاح!\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ خطأ:', error);
    process.exit(1);
  }
}

// تشغيل
fixOldPlanPrices();

