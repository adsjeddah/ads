#!/usr/bin/env node

/**
 * Clear All Business Data Script (Force Mode - No Confirmation)
 * 
 * ⚠️ تحذير: هذا السكريبت يحذف جميع البيانات التجارية مباشرة
 * 
 * الاستخدام:
 * node scripts/clear-all-data-force.js
 */

const admin = require('firebase-admin');

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
      
      if (snapshot.size > 0) {
        console.log(`   حذف ${snapshot.size} مستند من ${collectionName} (الإجمالي: ${deletedCount})`);
      }
    }
    
    if (deletedCount > 0) {
      console.log(`✅ تم حذف ${deletedCount} مستند من ${collectionName}`);
    }
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
  console.log('\n📊 ملخص البيانات قبل الحذف:\n');
  
  let totalDocs = 0;
  for (const collectionName of COLLECTIONS_TO_CLEAR) {
    try {
      const snapshot = await db.collection(collectionName).count().get();
      const count = snapshot.data().count;
      totalDocs += count;
      if (count > 0) {
        console.log(`   ${collectionName.padEnd(35)} ${count} مستند`);
      }
    } catch (error) {
      console.log(`   ${collectionName.padEnd(35)} (خطأ في القراءة)`);
    }
  }
  
  console.log(`\n   📌 إجمالي المستندات: ${totalDocs}\n`);
  return totalDocs;
}

/**
 * الدالة الرئيسية
 */
async function main() {
  console.log('\n🧹 تنظيف قاعدة البيانات - Clear All Data (Force Mode)\n');
  console.log('⚠️  سيتم حذف جميع البيانات التجارية...\n');
  
  // عرض ملخص البيانات
  const totalBefore = await showDataSummary();
  
  if (totalBefore === 0) {
    console.log('✅ قاعدة البيانات نظيفة بالفعل - لا توجد بيانات للحذف!\n');
    process.exit(0);
  }
  
  console.log('🚀 بدء عملية الحذف...\n');
  
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
  console.log('💡 الباقات والقطاعات والمدن وحسابات الأدمن محفوظة\n');
  
  process.exit(0);
}

// تشغيل السكريبت
main().catch((error) => {
  console.error('\n❌ خطأ فادح:', error);
  process.exit(1);
});

