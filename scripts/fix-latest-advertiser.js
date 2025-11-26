#!/usr/bin/env node

/**
 * إصلاح آخر معلن تم إضافته
 * إضافة البيانات الضرورية للظهور في صفحة جدة
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

async function fixLatestAdvertiser() {
  console.log('\n🔧 إصلاح آخر معلن تم إضافته...\n');
  console.log('════════════════════════════════════════════════════════════\n');

  try {
    // جلب آخر معلن
    const latestAdvertiserSnapshot = await db.collection('advertisers')
      .orderBy('created_at', 'desc')
      .limit(1)
      .get();

    if (latestAdvertiserSnapshot.empty) {
      console.log('❌ لا يوجد معلنون في النظام!\n');
      process.exit(1);
    }

    const advertiserDoc = latestAdvertiserSnapshot.docs[0];
    const advertiser = {
      id: advertiserDoc.id,
      ...advertiserDoc.data()
    };

    console.log('📋 المعلن الحالي:\n');
    console.log(`   اسم الشركة: ${advertiser.company_name}`);
    console.log(`   الهاتف: ${advertiser.phone}`);
    console.log(`   القطاع: ${advertiser.sector || '❌ غير محدد'}`);
    console.log(`   نوع التغطية: ${advertiser.coverage_type || '❌ غير محدد'}`);
    console.log(`   الحالة: ${advertiser.status}\n`);

    // تحديث بيانات المعلن
    console.log('🔧 تحديث بيانات المعلن...\n');

    const updateData = {};
    let needsUpdate = false;

    if (!advertiser.sector) {
      updateData.sector = 'movers';
      needsUpdate = true;
      console.log('   ✅ إضافة القطاع: movers');
    }

    if (!advertiser.coverage_type) {
      updateData.coverage_type = 'city';
      needsUpdate = true;
      console.log('   ✅ إضافة نوع التغطية: city');
    }

    if (!advertiser.coverage_cities || !advertiser.coverage_cities.includes('jeddah')) {
      updateData.coverage_cities = ['jeddah'];
      needsUpdate = true;
      console.log('   ✅ إضافة المدينة: jeddah');
    }

    if (needsUpdate) {
      await db.collection('advertisers').doc(advertiser.id).update(updateData);
      console.log('\n✅ تم تحديث المعلن بنجاح!\n');
    } else {
      console.log('\n✅ المعلن محدّث مسبقاً، لا حاجة للتحديث\n');
    }

    // تحديث حالة الاشتراك
    console.log('🔧 التحقق من حالة الاشتراك...\n');

    const subsSnapshot = await db.collection('subscriptions')
      .where('advertiser_id', '==', advertiser.id)
      .get();

    if (subsSnapshot.empty) {
      console.log('   ⚠️  لا توجد اشتراكات لهذا المعلن\n');
    } else {
      for (const subDoc of subsSnapshot.docs) {
        const sub = subDoc.data();
        const subUpdateData = {};
        let subNeedsUpdate = false;

        if (sub.status === 'pending_payment') {
          subUpdateData.status = 'active';
          subNeedsUpdate = true;
          console.log(`   ✅ تغيير حالة الاشتراك من pending_payment إلى active`);
        }

        if (!sub.coverage_area) {
          subUpdateData.coverage_area = 'city';
          subNeedsUpdate = true;
          console.log(`   ✅ إضافة نوع التغطية للاشتراك: city`);
        }

        if (!sub.city) {
          subUpdateData.city = 'jeddah';
          subNeedsUpdate = true;
          console.log(`   ✅ إضافة المدينة للاشتراك: jeddah`);
        }

        if (subNeedsUpdate) {
          await db.collection('subscriptions').doc(subDoc.id).update(subUpdateData);
        }
      }
      console.log('\n✅ تم تحديث الاشتراك(ات) بنجاح!\n');
    }

    // التحقق النهائي
    console.log('════════════════════════════════════════════════════════════\n');
    console.log('🔍 التحقق النهائي:\n');

    const updatedAdvertiser = await db.collection('advertisers').doc(advertiser.id).get();
    const updated = updatedAdvertiser.data();

    const checks = {
      'الحالة نشطة (active)': updated.status === 'active',
      'القطاع نقل العفش (movers)': updated.sector === 'movers',
      'نوع التغطية محدد': !!updated.coverage_type,
      'المدينة جدة محددة': (
        updated.coverage_type === 'kingdom' ||
        updated.coverage_type === 'both' ||
        (updated.coverage_type === 'city' && updated.coverage_cities?.includes('jeddah'))
      )
    };

    let allChecksPassed = true;
    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${check}`);
      if (!passed) allChecksPassed = false;
    });

    console.log('\n');
    if (allChecksPassed) {
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║          ✨ تم الإصلاح بنجاح! ✨                          ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');
      console.log('🎉 المعلن الآن سيظهر في صفحة جدة لنقل العفش!\n');
      console.log('🔗 تحقق من الصفحة: https://prokr.net/movers/jeddah\n');
    } else {
      console.log('⚠️  لم يتم إصلاح جميع المشاكل، يرجى التحقق يدوياً\n');
    }

    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ خطأ:', error);
    process.exit(1);
  }
}

// تشغيل
fixLatestAdvertiser();

