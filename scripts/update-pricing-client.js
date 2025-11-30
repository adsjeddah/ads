#!/usr/bin/env node

/**
 * سكريبت تحديث أسعار الباقات الإعلانية (Client SDK)
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

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, serverTimestamp } = require('firebase/firestore');

// تهيئة Firebase (ستحتاج إلى إدخال إعداداتك هنا)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// قراءة المتغيرات من .env.local
require('dotenv').config({ path: '.env.local' });

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
    const plansRef = collection(db, 'plans');
    const plansSnapshot = await getDocs(plansRef);
    
    console.log(`📦 تم العثور على ${plansSnapshot.size} باقة\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    for (const docSnapshot of plansSnapshot.docs) {
      const plan = docSnapshot.data();
      const planId = docSnapshot.id;
      
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

      if (newPrice !== null && newPrice !== plan.price) {
        console.log(`   ✨ السعر الجديد: ${newPrice} ريال`);
        
        try {
          // تحديث السعر في Firebase
          const planRef = doc(db, 'plans', planId);
          await updateDoc(planRef, {
            price: newPrice,
            updated_at: serverTimestamp()
          });
          
          console.log(`   ✅ تم التحديث بنجاح!\n`);
          totalUpdated++;
        } catch (error) {
          console.log(`   ❌ فشل التحديث: ${error.message}\n`);
          errors++;
        }
      } else if (newPrice === plan.price) {
        console.log(`   ℹ️  السعر مطابق للسعر الحالي (لا حاجة للتحديث)\n`);
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

// تشغيل السكريبت
(async () => {
  try {
    await updatePricing();
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
})();


















