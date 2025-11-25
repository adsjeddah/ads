#!/usr/bin/env node

/**
 * سكريبت تحديث أسعار الباقات الإعلانية
 * 
 * السياسة الجديدة:
 * 
 * باقات المدن (city):
 * - أسبوع: 400 ريال
 * - أسبوعين: 800 ريال
 * - شهر: 1500 ريال
 * 
 * باقات المملكة (kingdom):
 * - أسبوع: 850 ريال
 * - أسبوعين: 1600 ريال
 * - شهر: 3000 ريال
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// تهيئة Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'jeddah-ads-46daa-firebase-adminsdk-key.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ خطأ: لم يتم العثور على ملف Firebase Admin SDK');
  console.error('📁 المسار المتوقع:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// السياسة الجديدة للأسعار
const NEW_PRICING = {
  city: {
    week: 400,
    two_weeks: 800,
    month: 1500
  },
  kingdom: {
    week: 850,
    two_weeks: 1600,
    month: 3000
  }
};

// القطاعات المتاحة
const SECTORS = ['movers', 'cleaning', 'water-leaks', 'pest-control'];

// المدن المتاحة
const CITIES = ['riyadh', 'jeddah', 'dammam'];

/**
 * تحديث أسعار الباقات
 */
async function updatePricing() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           🔄 بدء تحديث أسعار الباقات الإعلانية           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  let totalUpdated = 0;
  let errors = 0;

  try {
    // جلب جميع الباقات
    const plansSnapshot = await db.collection('plans').get();
    
    console.log(`📦 تم العثور على ${plansSnapshot.size} باقة\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    for (const doc of plansSnapshot.docs) {
      const plan = doc.data();
      const planId = doc.id;
      
      // تحديد السعر الجديد بناءً على نوع الباقة والمدة
      let newPrice = null;
      let coverageType = null;
      let duration = null;

      // تحديد نوع التغطية (city أو kingdom)
      if (plan.coverage_area === 'city' || plan.city) {
        coverageType = 'city';
      } else if (plan.coverage_area === 'kingdom') {
        coverageType = 'kingdom';
      }

      // تحديد المدة بناءً على عدد الأيام
      if (plan.duration_days === 7) {
        duration = 'week';
      } else if (plan.duration_days === 14) {
        duration = 'two_weeks';
      } else if (plan.duration_days === 30) {
        duration = 'month';
      }

      // الحصول على السعر الجديد
      if (coverageType && duration && NEW_PRICING[coverageType] && NEW_PRICING[coverageType][duration]) {
        newPrice = NEW_PRICING[coverageType][duration];
      }

      // عرض معلومات الباقة
      console.log(`📝 الباقة: ${planId}`);
      console.log(`   📛 الاسم: ${plan.name}`);
      console.log(`   🏷️  القطاع: ${plan.sector || 'غير محدد'}`);
      console.log(`   🌍 التغطية: ${plan.coverage_area || 'غير محدد'}`);
      console.log(`   🏙️  المدينة: ${plan.city || 'المملكة'}`);
      console.log(`   📅 المدة: ${plan.duration_days} يوم`);
      console.log(`   💰 السعر القديم: ${plan.price} ريال`);

      if (newPrice !== null) {
        console.log(`   ✨ السعر الجديد: ${newPrice} ريال`);
        
        try {
          // تحديث السعر في Firebase
          await db.collection('plans').doc(planId).update({
            price: newPrice,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`   ✅ تم التحديث بنجاح!\n`);
          totalUpdated++;
        } catch (error) {
          console.log(`   ❌ فشل التحديث: ${error.message}\n`);
          errors++;
        }
      } else {
        console.log(`   ⚠️  لم يتم العثور على سعر جديد مطابق\n`);
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // ملخص النتائج
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    📊 ملخص التحديثات                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`✅ تم تحديث ${totalUpdated} باقة بنجاح`);
    console.log(`❌ فشل تحديث ${errors} باقة`);
    console.log(`📦 إجمالي الباقات: ${plansSnapshot.size}\n`);

    // عرض السياسة الجديدة
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 السياسة الجديدة للأسعار:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🏙️  باقات المدن:');
    console.log(`   • أسبوع (7 أيام):     ${NEW_PRICING.city.week} ريال`);
    console.log(`   • أسبوعين (14 يوم):   ${NEW_PRICING.city.two_weeks} ريال`);
    console.log(`   • شهر (30 يوم):        ${NEW_PRICING.city.month} ريال`);
    console.log('\n🌍 باقات المملكة:');
    console.log(`   • أسبوع (7 أيام):     ${NEW_PRICING.kingdom.week} ريال`);
    console.log(`   • أسبوعين (14 يوم):   ${NEW_PRICING.kingdom.two_weeks} ريال`);
    console.log(`   • شهر (30 يوم):        ${NEW_PRICING.kingdom.month} ريال\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ اكتمل تحديث الأسعار بنجاح!\n');

  } catch (error) {
    console.error('\n❌ خطأ أثناء تحديث الأسعار:', error);
    process.exit(1);
  }
}

/**
 * عرض الباقات الحالية قبل التحديث
 */
async function displayCurrentPlans() {
  console.log('\n📋 عرض الباقات الحالية...\n');
  
  try {
    const plansSnapshot = await db.collection('plans').get();
    
    const plansBySector = {};
    
    plansSnapshot.forEach(doc => {
      const plan = doc.data();
      const sector = plan.sector || 'unknown';
      
      if (!plansBySector[sector]) {
        plansBySector[sector] = [];
      }
      
      plansBySector[sector].push({
        id: doc.id,
        name: plan.name,
        price: plan.price,
        duration: plan.duration_days,
        coverage: plan.coverage_area,
        city: plan.city
      });
    });

    for (const sector in plansBySector) {
      console.log(`\n🏷️  القطاع: ${sector}`);
      console.log('─'.repeat(60));
      
      plansBySector[sector].forEach(plan => {
        console.log(`   📦 ${plan.name}`);
        console.log(`      💰 السعر: ${plan.price} ريال | ⏱️  المدة: ${plan.duration} يوم`);
        console.log(`      🌍 التغطية: ${plan.coverage} | 🏙️  المدينة: ${plan.city || 'المملكة'}`);
      });
    }
    
    console.log('\n');
  } catch (error) {
    console.error('❌ خطأ في عرض الباقات:', error);
  }
}

// تشغيل السكريبت
(async () => {
  try {
    // عرض الباقات الحالية
    await displayCurrentPlans();
    
    // سؤال المستخدم للتأكيد
    console.log('⚠️  هل تريد المتابعة وتحديث الأسعار؟');
    console.log('   هذا سيحدث جميع الباقات في Firebase!\n');
    
    // تشغيل التحديث مباشرة (يمكنك إضافة تأكيد إذا أردت)
    await updatePricing();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
})();

