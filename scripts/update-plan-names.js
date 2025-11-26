#!/usr/bin/env node

/**
 * سكريبت لتحديث أسماء الباقات في Firebase
 * 
 * التحديثات:
 * - إضافة باقة "أسبوعية" (7 أيام) للمدن
 * - تحديث الأسماء لتكون موحدة
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

// الأسماء الجديدة للباقات حسب المدة
const NAME_UPDATES = {
  7: 'أسبوعية',
  14: 'أسبوعين',
  15: 'نصف الشهرية',
  30: 'شهر'
};

async function updatePlanNames() {
  console.log('\n🔄 بدء تحديث أسماء الباقات...\n');
  console.log('════════════════════════════════════════════════════════════\n');

  try {
    const plansSnapshot = await db.collection('plans').get();
    let updated = 0;
    let skipped = 0;

    for (const doc of plansSnapshot.docs) {
      const plan = doc.data();
      const planId = doc.id;
      
      // فقط باقات المدن
      if (plan.city && plan.sector) {
        const duration = plan.duration_days;
        const newSuffix = NAME_UPDATES[duration];
        
        if (newSuffix) {
          const sectorNames = {
            'movers': 'نقل العفش',
            'cleaning': 'النظافة',
            'water-leaks': 'كشف تسربات المياه',
            'pest-control': 'مكافحة الحشرات'
          };
          
          const cityNames = {
            'jeddah': 'جدة',
            'riyadh': 'الرياض',
            'dammam': 'الدمام'
          };
          
          const sectorName = sectorNames[plan.sector] || plan.sector;
          const cityName = cityNames[plan.city] || plan.city;
          const newName = `باقة ${sectorName} - ${cityName} ${newSuffix}`;
          
          if (plan.name !== newName) {
            await db.collection('plans').doc(planId).update({
              name: newName,
              updated_at: admin.firestore.FieldValue.serverTimestamp()
            });
            
            console.log(`✅ ${plan.name}`);
            console.log(`   → ${newName}\n`);
            updated++;
          } else {
            skipped++;
          }
        }
      }
    }
    
    console.log('════════════════════════════════════════════════════════════\n');
    console.log(`📊 النتائج:`);
    console.log(`   ✅ تم تحديث: ${updated} باقة`);
    console.log(`   ⏭️  تم تخطي: ${skipped} باقة (محدثة بالفعل)`);
    console.log('\n✨ اكتمل تحديث الأسماء بنجاح!\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ خطأ:', error);
    process.exit(1);
  }
}

// تشغيل
updatePlanNames();

