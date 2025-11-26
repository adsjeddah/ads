#!/usr/bin/env node

/**
 * تشخيص شامل لظهور المعلنين على صفحات المدن
 * التأكد من الفلترة الصحيحة حسب القطاع والمدينة
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

async function diagnoseAdvertiserDisplay() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║          🔍 تشخيص شامل لظهور المعلنين 🔍                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. جلب جميع المعلنين النشطين
    console.log('1️⃣  جلب جميع المعلنين النشطين...\n');
    const advertisersSnapshot = await db.collection('advertisers')
      .where('status', '==', 'active')
      .get();

    console.log(`📊 إجمالي المعلنين النشطين: ${advertisersSnapshot.size}\n`);

    // 2. فلترة المعلنين حسب القطاع
    const sectorStats = {};
    advertisersSnapshot.forEach(doc => {
      const advertiser = doc.data();
      const sector = advertiser.sector || 'غير محدد';
      if (!sectorStats[sector]) {
        sectorStats[sector] = 0;
      }
      sectorStats[sector]++;
    });

    console.log('2️⃣  المعلنين حسب القطاع:\n');
    Object.entries(sectorStats).forEach(([sector, count]) => {
      const sectorNames = {
        'movers': 'نقل العفش',
        'cleaning': 'النظافة',
        'water-leaks': 'كشف تسربات المياه',
        'pest-control': 'مكافحة الحشرات'
      };
      console.log(`   ✅ ${sectorNames[sector] || sector}: ${count} معلن`);
    });

    // 3. فحص معلني نقل العفش في جدة بالتحديد
    console.log('\n\n3️⃣  معلني نقل العفش الذين يجب أن يظهروا في جدة:\n');
    console.log('════════════════════════════════════════════════════════════\n');

    let jeddahMoversCount = 0;
    const jeddahMoversDetails = [];

    advertisersSnapshot.forEach(doc => {
      const advertiser = {
        id: doc.id,
        ...doc.data()
      };

      // تطبيق نفس الفلترة المستخدمة في API والصفحة
      if (advertiser.sector === 'movers') {
        const shouldShowInJeddah = (
          advertiser.coverage_type === 'kingdom' ||
          advertiser.coverage_type === 'both' ||
          (advertiser.coverage_type === 'city' && advertiser.coverage_cities?.includes('jeddah'))
        );

        if (shouldShowInJeddah) {
          jeddahMoversCount++;
          jeddahMoversDetails.push({
            id: advertiser.id,
            name: advertiser.company_name,
            phone: advertiser.phone,
            sector: advertiser.sector,
            coverage_type: advertiser.coverage_type,
            coverage_cities: advertiser.coverage_cities,
            status: advertiser.status,
            created_at: advertiser.created_at
          });
        }
      }
    });

    console.log(`📍 عدد المعلنين الذين يجب أن يظهروا في جدة: ${jeddahMoversCount}\n`);

    if (jeddahMoversDetails.length === 0) {
      console.log('❌ لا يوجد معلنون يظهرون في جدة!\n');
      console.log('⚠️  السبب المحتمل: لم يتم إضافة معلنين بالشروط الصحيحة\n');
    } else {
      console.log('📋 تفاصيل المعلنين:\n');
      jeddahMoversDetails.forEach((adv, index) => {
        console.log(`   ${index + 1}. ${adv.name}`);
        console.log(`      📱 الهاتف: ${adv.phone}`);
        console.log(`      🏢 القطاع: ${adv.sector}`);
        console.log(`      🌍 نوع التغطية: ${adv.coverage_type}`);
        if (adv.coverage_cities) {
          console.log(`      🏙️  المدن: ${adv.coverage_cities.join(', ')}`);
        }
        console.log(`      📊 الحالة: ${adv.status}`);
        console.log(`      🆔 المعرف: ${adv.id}\n`);
      });
    }

    // 4. فحص آخر معلن تم إضافته
    console.log('4️⃣  آخر معلن تم إضافته:\n');
    console.log('════════════════════════════════════════════════════════════\n');

    const latestAdvertiserSnapshot = await db.collection('advertisers')
      .orderBy('created_at', 'desc')
      .limit(1)
      .get();

    if (!latestAdvertiserSnapshot.empty) {
      const latest = {
        id: latestAdvertiserSnapshot.docs[0].id,
        ...latestAdvertiserSnapshot.docs[0].data()
      };

      console.log(`   📋 اسم الشركة: ${latest.company_name}`);
      console.log(`   📱 الهاتف: ${latest.phone}`);
      console.log(`   🏢 القطاع: ${latest.sector || '❌ غير محدد'}`);
      console.log(`   🌍 نوع التغطية: ${latest.coverage_type || '❌ غير محدد'}`);
      if (latest.coverage_cities) {
        console.log(`   🏙️  المدن: ${latest.coverage_cities.join(', ')}`);
      } else {
        console.log(`   🏙️  المدن: ❌ غير محدد`);
      }
      console.log(`   📊 الحالة: ${latest.status}`);
      console.log(`   🆔 المعرف: ${latest.id}`);

      // التحقق من شروط الظهور
      console.log('\n   🔍 التحقق من شروط الظهور في جدة:\n');

      const checks = {
        'الحالة نشطة (active)': latest.status === 'active',
        'القطاع نقل العفش (movers)': latest.sector === 'movers',
        'نوع التغطية محدد': !!latest.coverage_type,
        'المدينة محددة بشكل صحيح': (
          latest.coverage_type === 'kingdom' ||
          latest.coverage_type === 'both' ||
          (latest.coverage_type === 'city' && latest.coverage_cities?.includes('jeddah'))
        )
      };

      let allChecksPassed = true;
      Object.entries(checks).forEach(([check, passed]) => {
        console.log(`   ${passed ? '✅' : '❌'} ${check}`);
        if (!passed) allChecksPassed = false;
      });

      console.log('');
      if (allChecksPassed) {
        console.log('   ✨ المعلن يجب أن يظهر في صفحة جدة! ✨\n');
      } else {
        console.log('   ⚠️  المعلن لن يظهر في صفحة جدة!\n');
        console.log('   📝 الإجراءات المطلوبة:\n');
        
        if (!checks['الحالة نشطة (active)']) {
          console.log('      • غيّر الحالة إلى "active"');
        }
        if (!checks['القطاع نقل العفش (movers)']) {
          console.log('      • اضبط القطاع إلى "movers"');
        }
        if (!checks['نوع التغطية محدد']) {
          console.log('      • حدد نوع التغطية (city أو kingdom أو both)');
        }
        if (!checks['المدينة محددة بشكل صحيح']) {
          console.log('      • إذا كان city: أضف "jeddah" إلى coverage_cities');
          console.log('      • أو غيّر إلى kingdom/both');
        }
        console.log('');
      }

      // 5. التحقق من الاشتراكات
      console.log('   🔍 التحقق من الاشتراكات:\n');
      const subsSnapshot = await db.collection('subscriptions')
        .where('advertiser_id', '==', latest.id)
        .get();

      if (subsSnapshot.empty) {
        console.log('   ⚠️  لا توجد اشتراكات لهذا المعلن\n');
      } else {
        console.log(`   ✅ يوجد ${subsSnapshot.size} اشتراك(ات)\n`);
        
        subsSnapshot.forEach((doc, index) => {
          const sub = doc.data();
          const startDate = sub.start_date ? new Date(sub.start_date.toDate()) : new Date();
          const endDate = sub.end_date ? new Date(sub.end_date.toDate()) : new Date();
          const isActive = sub.status === 'active' && endDate > new Date();
          
          console.log(`      ${index + 1}. الاشتراك ${doc.id.substring(0, 8)}...`);
          console.log(`         الحالة: ${sub.status} ${isActive ? '✅' : '⚠️'}`);
          console.log(`         البداية: ${startDate.toISOString().split('T')[0]}`);
          console.log(`         النهاية: ${endDate.toISOString().split('T')[0]}`);
          console.log(`         التغطية: ${sub.coverage_area || 'غير محدد'}`);
          if (sub.city) {
            console.log(`         المدينة: ${sub.city}`);
          }
          console.log('');
        });
      }
    } else {
      console.log('   ❌ لا يوجد معلنون في النظام!\n');
    }

    // 6. النصائح والتوصيات
    console.log('\n════════════════════════════════════════════════════════════\n');
    console.log('💡 نصائح وتوصيات:\n');
    console.log('════════════════════════════════════════════════════════════\n');
    console.log('   1. تأكد من أن المعلن له الخصائص التالية:');
    console.log('      • status: "active"');
    console.log('      • sector: "movers"');
    console.log('      • coverage_type: "city" | "kingdom" | "both"');
    console.log('      • coverage_cities: ["jeddah"] (إذا كان city أو both)\n');
    console.log('   2. تأكد من وجود اشتراك نشط للمعلن\n');
    console.log('   3. تحقق من أن تاريخ نهاية الاشتراك لم ينتهِ بعد\n');
    console.log('   4. في حالة عدم الظهور، جرب تحديث الصفحة (Ctrl+F5)\n');
    console.log('');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ خطأ:', error);
    process.exit(1);
  }
}

// تشغيل
diagnoseAdvertiserDisplay();

