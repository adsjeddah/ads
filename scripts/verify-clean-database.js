#!/usr/bin/env node

/**
 * Verify Clean Database Script
 * 
 * التحقق من نظافة قاعدة البيانات
 * 
 * الاستخدام:
 * node scripts/verify-clean-database.js
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

// Collections to verify (should be empty)
const BUSINESS_COLLECTIONS = [
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

// Collections that should have data (system config)
const SYSTEM_COLLECTIONS = [
  'plans',
  'sectors', 
  'cities',
  'admins'
];

/**
 * الدالة الرئيسية
 */
async function main() {
  console.log('\n🔍 التحقق من نظافة قاعدة البيانات\n');
  console.log('════════════════════════════════════════\n');
  
  let totalBusinessDocs = 0;
  let totalSystemDocs = 0;
  let isClean = true;
  
  // التحقق من البيانات التجارية (يجب أن تكون فارغة)
  console.log('📊 البيانات التجارية (يجب أن تكون 0):\n');
  
  for (const collectionName of BUSINESS_COLLECTIONS) {
    try {
      const snapshot = await db.collection(collectionName).count().get();
      const count = snapshot.data().count;
      totalBusinessDocs += count;
      
      if (count > 0) {
        console.log(`   ⚠️  ${collectionName.padEnd(35)} ${count} مستند (غير نظيف!)`);
        isClean = false;
      } else {
        console.log(`   ✅ ${collectionName.padEnd(35)} ${count} مستند`);
      }
    } catch (error) {
      console.log(`   ❌ ${collectionName.padEnd(35)} (خطأ في القراءة)`);
    }
  }
  
  console.log('\n════════════════════════════════════════\n');
  
  // التحقق من بيانات النظام (يجب أن تحتوي على بيانات)
  console.log('🔒 إعدادات النظام (يجب أن تحتوي على بيانات):\n');
  
  for (const collectionName of SYSTEM_COLLECTIONS) {
    try {
      const snapshot = await db.collection(collectionName).count().get();
      const count = snapshot.data().count;
      totalSystemDocs += count;
      
      if (count > 0) {
        console.log(`   ✅ ${collectionName.padEnd(35)} ${count} مستند`);
      } else {
        console.log(`   ⚠️  ${collectionName.padEnd(35)} ${count} مستند (فارغ!)`);
      }
    } catch (error) {
      console.log(`   ❌ ${collectionName.padEnd(35)} (خطأ في القراءة)`);
    }
  }
  
  console.log('\n════════════════════════════════════════\n');
  
  // النتيجة النهائية
  if (isClean && totalBusinessDocs === 0) {
    console.log('✅ قاعدة البيانات نظيفة تماماً!');
    console.log(`✅ البيانات التجارية: ${totalBusinessDocs} مستند`);
    console.log(`✅ إعدادات النظام: ${totalSystemDocs} مستند`);
    console.log('\n💡 النظام جاهز لإضافة عملاء جدد\n');
  } else {
    console.log('⚠️  قاعدة البيانات غير نظيفة تماماً');
    console.log(`   البيانات التجارية المتبقية: ${totalBusinessDocs} مستند`);
    console.log(`   إعدادات النظام: ${totalSystemDocs} مستند`);
    console.log('\n💡 قد تحتاج إلى تشغيل سكريبت التنظيف مرة أخرى\n');
  }
  
  process.exit(isClean ? 0 : 1);
}

// تشغيل السكريبت
main().catch((error) => {
  console.error('\n❌ خطأ فادح:', error);
  process.exit(1);
});

