/**
 * 🔍 Script للتحقق من ظهور المعلنين في الصفحات الصحيحة
 * 
 * الاستخدام:
 * node scripts/test-filtering.js
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

async function testAdvertiserFiltering() {
  console.log('\n🔍 بدء فحص المعلنين والاشتراكات...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. جلب جميع المعلنين
    const advertisersSnapshot = await db.collection('advertisers').get();
    console.log(`📊 إجمالي المعلنين: ${advertisersSnapshot.size}\n`);

    for (const doc of advertisersSnapshot.docs) {
      const advertiser = doc.data();
      console.log(`\n📝 معلن: ${advertiser.company_name} (${doc.id})`);
      console.log(`   📱 الهاتف: ${advertiser.phone}`);
      console.log(`   🏷️  القطاع: ${advertiser.sector || 'غير محدد'}`);
      console.log(`   🌍 التغطية: ${advertiser.coverage_type || 'غير محدد'}`);
      console.log(`   🏙️  المدن: ${advertiser.coverage_cities ? advertiser.coverage_cities.join(', ') : 'لا توجد'}`);
      console.log(`   ✅ الحالة: ${advertiser.status || 'غير محدد'}`);

      // جلب الاشتراكات الخاصة بهذا المعلن
      const subscriptionsSnapshot = await db
        .collection('subscriptions')
        .where('advertiser_id', '==', doc.id)
        .get();

      console.log(`   📦 عدد الاشتراكات: ${subscriptionsSnapshot.size}`);

      if (subscriptionsSnapshot.size > 0) {
        for (const subDoc of subscriptionsSnapshot.docs) {
          const sub = subDoc.data();
          const startDate = sub.start_date?.toDate ? sub.start_date.toDate().toLocaleDateString('ar-SA') : 'غير محدد';
          const endDate = sub.end_date?.toDate ? sub.end_date.toDate().toLocaleDateString('ar-SA') : 'غير محدد';
          
          console.log(`      → اشتراك ${subDoc.id}:`);
          console.log(`         • الحالة: ${sub.status || 'غير محدد'}`);
          console.log(`         • البداية: ${startDate}`);
          console.log(`         • النهاية: ${endDate}`);
          console.log(`         • التغطية: ${sub.coverage_area || 'غير محدد'}`);
          console.log(`         • المدينة: ${sub.city || 'غير محدد'}`);
        }
      }

      // اختبار: هل سيظهر هذا المعلن في صفحة جدة؟
      const willShowInJeddah = checkIfShowsInCity(advertiser, 'jeddah', 'movers');
      const willShowInRiyadh = checkIfShowsInCity(advertiser, 'riyadh', 'movers');
      const willShowInKingdom = checkIfShowsInKingdom(advertiser, 'movers');

      console.log(`\n   🎯 سيظهر في:`);
      console.log(`      ${willShowInKingdom ? '✅' : '❌'} صفحة المملكة (/${advertiser.sector || 'movers'})`);
      console.log(`      ${willShowInJeddah ? '✅' : '❌'} صفحة جدة (/${advertiser.sector || 'movers'}/jeddah)`);
      console.log(`      ${willShowInRiyadh ? '✅' : '❌'} صفحة الرياض (/${advertiser.sector || 'movers'}/riyadh)`);

      console.log('\n' + '─'.repeat(50));
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ انتهى الفحص!\n');

  } catch (error) {
    console.error('❌ خطأ أثناء الفحص:', error);
    process.exit(1);
  }

  process.exit(0);
}

// دالة للتحقق من ظهور المعلن في مدينة معينة
function checkIfShowsInCity(advertiser, city, sector) {
  // تحقق من الحالة والقطاع
  if (advertiser.status !== 'active') return false;
  if (advertiser.sector !== sector) return false;

  // تحقق من التغطية
  if (advertiser.coverage_type === 'kingdom') return true;
  if (advertiser.coverage_type === 'both') return true;
  if (advertiser.coverage_type === 'city' && advertiser.coverage_cities?.includes(city)) return true;

  return false;
}

// دالة للتحقق من ظهور المعلن في صفحة المملكة
function checkIfShowsInKingdom(advertiser, sector) {
  // تحقق من الحالة والقطاع
  if (advertiser.status !== 'active') return false;
  if (advertiser.sector !== sector) return false;

  // في صفحة المملكة نعرض فقط من لديهم تغطية المملكة أو both
  if (advertiser.coverage_type === 'kingdom' || advertiser.coverage_type === 'both') {
    return true;
  }

  return false;
}

// تشغيل الفحص
testAdvertiserFiltering();


