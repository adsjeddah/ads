/**
 * سكريبت لإصلاح coverage_type لجميع المعلنين
 * يتم تشغيله مباشرة بدون الحاجة للسيرفر
 */

const admin = require('firebase-admin');
const path = require('path');

// تحميل بيانات الاعتماد
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

// تهيئة Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixAdvertiserCoverage(advertiserId) {
  console.log(`🔄 معالجة المعلن: ${advertiserId}`);
  
  // 1. جلب جميع اشتراكات المعلن
  const subscriptionsSnapshot = await db
    .collection('subscriptions')
    .where('advertiser_id', '==', advertiserId)
    .get();
  
  // 2. فلترة الاشتراكات النشطة
  const activeSubscriptions = subscriptionsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(sub => 
      sub.status === 'active' || 
      sub.status === 'pending_payment' || 
      sub.status === 'paused'
    );
  
  if (activeSubscriptions.length === 0) {
    console.log(`   ℹ️ لا يوجد اشتراكات نشطة`);
    return { updated: false };
  }
  
  // 3. تحديد نوع التغطية
  let hasKingdomSubscription = false;
  let hasCitySubscription = false;
  const coverageCities = [];
  
  for (const sub of activeSubscriptions) {
    // جلب معلومات الباقة
    const planDoc = await db.collection('plans').doc(sub.plan_id).get();
    if (!planDoc.exists) continue;
    
    const plan = planDoc.data();
    const coverageArea = sub.coverage_area || plan.plan_type;
    
    if (coverageArea === 'kingdom') {
      hasKingdomSubscription = true;
      console.log(`   ✅ اشتراك مملكة: ${sub.id}`);
    } else if (coverageArea === 'city') {
      hasCitySubscription = true;
      const city = sub.city || plan.city;
      if (city && !coverageCities.includes(city)) {
        coverageCities.push(city);
        console.log(`   ✅ اشتراك مدينة (${city}): ${sub.id}`);
      }
    }
  }
  
  // 4. تحديد نوع التغطية النهائي
  let newCoverageType;
  if (hasKingdomSubscription && hasCitySubscription) {
    newCoverageType = 'both';
  } else if (hasKingdomSubscription) {
    newCoverageType = 'kingdom';
  } else if (hasCitySubscription) {
    newCoverageType = 'city';
  } else {
    console.log(`   ⚠️ لم يتم تحديد نوع التغطية`);
    return { updated: false };
  }
  
  // 5. تحديث المعلن
  const updateData = {
    coverage_type: newCoverageType,
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  };
  
  if (coverageCities.length > 0) {
    updateData.coverage_cities = coverageCities;
  }
  
  await db.collection('advertisers').doc(advertiserId).update(updateData);
  
  console.log(`   ✅ تم التحديث: coverage_type = ${newCoverageType}`);
  
  return { 
    updated: true, 
    new_coverage_type: newCoverageType,
    coverage_cities: coverageCities
  };
}

async function main() {
  console.log('🚀 بدء إصلاح coverage_type لجميع المعلنين...\n');
  
  // جلب جميع المعلنين النشطين
  const advertisersSnapshot = await db
    .collection('advertisers')
    .where('status', '==', 'active')
    .get();
  
  console.log(`📊 عدد المعلنين النشطين: ${advertisersSnapshot.docs.length}\n`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const doc of advertisersSnapshot.docs) {
    const advertiser = { id: doc.id, ...doc.data() };
    console.log(`\n📌 ${advertiser.company_name} (${advertiser.id})`);
    
    try {
      const result = await fixAdvertiserCoverage(advertiser.id);
      if (result.updated) {
        updatedCount++;
      }
    } catch (error) {
      errorCount++;
      console.log(`   ❌ خطأ: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ تم الانتهاء!`);
  console.log(`   - إجمالي المعلنين: ${advertisersSnapshot.docs.length}`);
  console.log(`   - تم تحديثهم: ${updatedCount}`);
  console.log(`   - أخطاء: ${errorCount}`);
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ خطأ عام:', error);
  process.exit(1);
});

