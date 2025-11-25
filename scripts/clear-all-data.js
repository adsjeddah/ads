#!/usr/bin/env node

/**
 * Clear All Business Data Script
 * 
 * ⚠️ تحذير: هذا السكريبت يحذف جميع البيانات التجارية (المعلنين، الاشتراكات، الفواتير، إلخ)
 * يبقي على: الباقات، القطاعات، المدن، حسابات الأدمن
 * 
 * الاستخدام:
 * node scripts/clear-all-data.js
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Collections to clear (business data)
const COLLECTIONS_TO_CLEAR = [
  'advertisers',
  'subscriptions',
  'invoices',
  'payments',
  'ad-requests',
  'statistics',
  'invoice-audits',
  'reminders',
  'refunds',
  'notifications',
  'subscription-status-history'
];

// Collections to keep (system configuration)
const COLLECTIONS_TO_KEEP = [
  'plans',
  'sectors', 
  'cities',
  'admins'
];

/**
 * حذف جميع المستندات في مجموعة
 */
async function clearCollection(collectionName) {
  try {
    const collectionRef = db.collection(collectionName);
    const snapshot = await collectionRef.get();
    
    if (snapshot.empty) {
      console.log(`ℹ️  المجموعة ${collectionName} فارغة بالفعل`);
      return 0;
    }

    const batchSize = 100;
    let deletedCount = 0;
    
    // حذف بالدفعات
    while (true) {
      const snapshot = await collectionRef.limit(batchSize).get();
      
      if (snapshot.empty) {
        break;
      }
      
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      deletedCount += snapshot.size;
      
      console.log(`   حذف ${snapshot.size} مستند من ${collectionName} (الإجمالي: ${deletedCount})`);
    }
    
    console.log(`✅ تم حذف ${deletedCount} مستند من ${collectionName}`);
    return deletedCount;
    
  } catch (error) {
    console.error(`❌ خطأ في حذف ${collectionName}:`, error.message);
    return 0;
  }
}

/**
 * عرض ملخص البيانات الحالية
 */
async function showDataSummary() {
  console.log('\n📊 ملخص البيانات الحالية:\n');
  console.log('════════════════════════════════════════');
  
  for (const collectionName of COLLECTIONS_TO_CLEAR) {
    try {
      const snapshot = await db.collection(collectionName).count().get();
      const count = snapshot.data().count;
      console.log(`   ${collectionName.padEnd(35)} ${count} مستند`);
    } catch (error) {
      console.log(`   ${collectionName.padEnd(35)} (خطأ في القراءة)`);
    }
  }
  
  console.log('════════════════════════════════════════\n');
  
  console.log('🔒 البيانات التي سيتم الاحتفاظ بها:\n');
  for (const collectionName of COLLECTIONS_TO_KEEP) {
    try {
      const snapshot = await db.collection(collectionName).count().get();
      const count = snapshot.data().count;
      console.log(`   ${collectionName.padEnd(35)} ${count} مستند`);
    } catch (error) {
      console.log(`   ${collectionName.padEnd(35)} (خطأ في القراءة)`);
    }
  }
  console.log('\n');
}

/**
 * طلب تأكيد من المستخدم
 */
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * الدالة الرئيسية
 */
async function main() {
  console.log('\n🧹 تنظيف قاعدة البيانات - Clear All Data\n');
  console.log('⚠️  تحذير: هذا الإجراء سيحذف جميع البيانات التجارية!\n');
  
  // عرض ملخص البيانات
  await showDataSummary();
  
  // طلب التأكيد الأول
  console.log('⚠️  سيتم حذف جميع:');
  console.log('   • المعلنين (Advertisers)');
  console.log('   • الاشتراكات (Subscriptions)');
  console.log('   • الفواتير (Invoices)');
  console.log('   • المدفوعات (Payments)');
  console.log('   • طلبات الإعلان (Ad Requests)');
  console.log('   • الإحصائيات (Statistics)');
  console.log('   • السجلات والإشعارات (Audits, Reminders, Notifications)');
  console.log('   • الاستردادات (Refunds)');
  console.log('   • سجل حالات الاشتراك (Subscription Status History)\n');
  
  console.log('✅ سيتم الاحتفاظ بـ:');
  console.log('   • الباقات (Plans)');
  console.log('   • القطاعات (Sectors)');
  console.log('   • المدن (Cities)');
  console.log('   • حسابات الأدمن (Admins)\n');
  
  const confirmed = await askConfirmation('هل أنت متأكد من الحذف؟ اكتب "yes" للمتابعة: ');
  
  if (!confirmed) {
    console.log('\n❌ تم إلغاء العملية');
    process.exit(0);
  }
  
  // طلب التأكيد الثاني (أمان إضافي)
  const doubleConfirmed = await askConfirmation('\n⚠️  تأكيد نهائي: هذا الإجراء لا يمكن التراجع عنه. اكتب "yes" للحذف: ');
  
  if (!doubleConfirmed) {
    console.log('\n❌ تم إلغاء العملية');
    process.exit(0);
  }
  
  console.log('\n🚀 بدء عملية الحذف...\n');
  
  let totalDeleted = 0;
  
  // حذف كل مجموعة
  for (const collectionName of COLLECTIONS_TO_CLEAR) {
    const count = await clearCollection(collectionName);
    totalDeleted += count;
  }
  
  console.log('\n════════════════════════════════════════');
  console.log(`✅ اكتمل التنظيف بنجاح!`);
  console.log(`📊 إجمالي المستندات المحذوفة: ${totalDeleted}`);
  console.log('════════════════════════════════════════\n');
  
  console.log('💡 النظام الآن نظيف وجاهز لإضافة عملاء جدد');
  console.log('💡 الباقات والإعدادات محفوظة ويمكنك البدء مباشرة\n');
  
  process.exit(0);
}

// تشغيل السكريبت
main().catch((error) => {
  console.error('\n❌ خطأ فادح:', error);
  process.exit(1);
});

