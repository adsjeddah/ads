#!/usr/bin/env node

/**
 * إضافة validation لمنع إضافة معلنين بدون الحقول المطلوبة
 * هذا السكريبت سيفحص جميع المعلنين الموجودين ويصلح أي نواقص
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

async function validateAndFixAdvertisers() {
  console.log('\n🔍 فحص وإصلاح جميع المعلنين...\n');
  console.log('════════════════════════════════════════════════════════════\n');

  try {
    const advertisersSnapshot = await db.collection('advertisers').get();

    console.log(`📊 إجمالي المعلنين: ${advertisersSnapshot.size}\n`);

    let fixedCount = 0;
    let okCount = 0;

    for (const doc of advertisersSnapshot.docs) {
      const advertiser = {
        id: doc.id,
        ...doc.data()
      };

      const updateData = {};
      let needsUpdate = false;
      const issues = [];

      // التحقق من الحقول المطلوبة
      if (!advertiser.sector) {
        issues.push('القطاع مفقود');
        // لا نحدث تلقائياً لأننا لا نعرف القطاع الصحيح
      }

      if (!advertiser.coverage_type) {
        issues.push('نوع التغطية مفقود');
        // لا نحدث تلقائياً لأننا لا نعرف نوع التغطية الصحيح
      }

      if (advertiser.coverage_type === 'city' && (!advertiser.coverage_cities || advertiser.coverage_cities.length === 0)) {
        issues.push('المدن مفقودة');
      }

      if (issues.length > 0) {
        console.log(`⚠️  ${advertiser.company_name} (${advertiser.id.substring(0, 8)}...)`);
        issues.forEach(issue => {
          console.log(`   ❌ ${issue}`);
        });
        console.log('');
        fixedCount++;
      } else {
        okCount++;
      }
    }

    console.log('════════════════════════════════════════════════════════════\n');
    console.log('📊 النتائج:\n');
    console.log(`   ✅ معلنون صحيحون: ${okCount}`);
    console.log(`   ⚠️  معلنون يحتاجون إصلاح: ${fixedCount}\n`);

    if (fixedCount > 0) {
      console.log('💡 توصية:\n');
      console.log('   يجب تعديل هؤلاء المعلنين يدوياً من لوحة التحكم\n');
      console.log('   أو استخدام سكريبت fix-latest-advertiser.js\n');
    }

    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ خطأ:', error);
    process.exit(1);
  }
}

// تشغيل
validateAndFixAdvertisers();

