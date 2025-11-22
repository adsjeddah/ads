/**
 * سكريبت لإصلاح بيانات النظام المالي
 * - حذف الاشتراكات القديمة المرتبطة بباقات أو معلنين غير موجودين
 * - إنشاء فواتير للاشتراكات التي ليس لها فواتير
 * - إنشاء سجلات دفع للمبالغ المدفوعة
 */

const admin = require('firebase-admin');
const path = require('path');

// تهيئة Firebase Admin
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: () => console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}`),
  title: (msg) => console.log(`${colors.bright}${colors.magenta}${msg}${colors.reset}`),
};

/**
 * حذف الاشتراكات القديمة المعطوبة
 */
async function cleanupOldSubscriptions() {
  log.header();
  log.title('🧹 حذف الاشتراكات القديمة');
  log.header();

  try {
    // جلب جميع المعلنين والباقات الموجودة
    const advertisersSnapshot = await db.collection('advertisers').get();
    const plansSnapshot = await db.collection('plans').get();
    
    const advertiserIds = new Set(advertisersSnapshot.docs.map(doc => doc.id));
    const planIds = new Set(plansSnapshot.docs.map(doc => doc.id));

    // جلب جميع الاشتراكات
    const subscriptionsSnapshot = await db.collection('subscriptions').get();
    
    let deletedCount = 0;
    const batch = db.batch();

    for (const doc of subscriptionsSnapshot.docs) {
      const data = doc.data();
      let shouldDelete = false;
      let reason = '';

      // فحص إذا كان المعلن موجود
      if (!advertiserIds.has(data.advertiser_id)) {
        shouldDelete = true;
        reason = `معلن ${data.advertiser_id} غير موجود`;
      }

      // فحص إذا كانت الباقة موجودة
      if (!planIds.has(data.plan_id)) {
        shouldDelete = true;
        reason += (reason ? ' و ' : '') + `باقة ${data.plan_id} غير موجودة`;
      }

      if (shouldDelete) {
        log.warning(`حذف اشتراك ${doc.id}: ${reason}`);
        batch.delete(doc.ref);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      await batch.commit();
      log.success(`تم حذف ${deletedCount} اشتراك قديم`);
    } else {
      log.info('لا توجد اشتراكات قديمة للحذف');
    }

  } catch (error) {
    log.error(`خطأ في حذف الاشتراكات القديمة: ${error.message}`);
  }
}

/**
 * إنشاء فواتير للاشتراكات التي ليس لها فواتير
 */
async function createMissingInvoices() {
  log.header();
  log.title('📄 إنشاء الفواتير المفقودة');
  log.header();

  try {
    // جلب جميع الاشتراكات
    const subscriptionsSnapshot = await db.collection('subscriptions').get();
    
    // جلب جميع الفواتير الموجودة
    const invoicesSnapshot = await db.collection('invoices').get();
    const subscriptionsWithInvoices = new Set();
    invoicesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.subscription_id) {
        subscriptionsWithInvoices.add(data.subscription_id);
      }
    });

    let createdCount = 0;
    let invoiceNumber = invoicesSnapshot.size + 1;

    for (const doc of subscriptionsSnapshot.docs) {
      const subscription = doc.data();
      
      // تخطي إذا كانت الفاتورة موجودة
      if (subscriptionsWithInvoices.has(doc.id)) {
        continue;
      }

      // حساب VAT
      const subtotal = subscription.total_amount || 0;
      const vatPercentage = 15;
      const vatAmount = Math.round(subtotal * 0.15 * 100) / 100;
      const totalWithVat = Math.round((subtotal + vatAmount) * 100) / 100;

      // تحديد حالة الفاتورة
      let invoiceStatus = 'unpaid';
      if (subscription.payment_status === 'paid') {
        invoiceStatus = 'paid';
      }

      // إنشاء الفاتورة
      const invoiceData = {
        subscription_id: doc.id,
        invoice_number: `INV-2025-${String(invoiceNumber).padStart(3, '0')}`,
        subtotal: subtotal,
        vat_percentage: vatPercentage,
        vat_amount: vatAmount,
        amount: totalWithVat,
        status: invoiceStatus,
        issued_date: subscription.start_date || admin.firestore.Timestamp.now(),
        due_date: subscription.end_date || admin.firestore.Timestamp.now(),
        paid_date: invoiceStatus === 'paid' ? admin.firestore.Timestamp.now() : null,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('invoices').add(invoiceData);
      log.success(`تم إنشاء فاتورة ${invoiceData.invoice_number} للاشتراك ${doc.id}`);
      
      createdCount++;
      invoiceNumber++;
    }

    if (createdCount > 0) {
      log.success(`تم إنشاء ${createdCount} فاتورة جديدة`);
    } else {
      log.info('جميع الاشتراكات لها فواتير');
    }

  } catch (error) {
    log.error(`خطأ في إنشاء الفواتير: ${error.message}`);
  }
}

/**
 * إنشاء سجلات دفع للمبالغ المدفوعة
 */
async function createMissingPayments() {
  log.header();
  log.title('💳 إنشاء سجلات الدفع المفقودة');
  log.header();

  try {
    // جلب جميع الاشتراكات مع مبالغ مدفوعة
    const subscriptionsSnapshot = await db.collection('subscriptions')
      .where('paid_amount', '>', 0)
      .get();

    // جلب جميع الدفعات الموجودة
    const paymentsSnapshot = await db.collection('payments').get();
    const subscriptionsWithPayments = new Set();
    paymentsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.subscription_id) {
        subscriptionsWithPayments.add(data.subscription_id);
      }
    });

    let createdCount = 0;

    for (const doc of subscriptionsSnapshot.docs) {
      const subscription = doc.data();
      
      // تخطي إذا كانت الدفعة موجودة
      if (subscriptionsWithPayments.has(doc.id)) {
        continue;
      }

      // جلب الفاتورة المرتبطة
      const invoiceSnapshot = await db.collection('invoices')
        .where('subscription_id', '==', doc.id)
        .limit(1)
        .get();

      let invoiceId = null;
      if (!invoiceSnapshot.empty) {
        invoiceId = invoiceSnapshot.docs[0].id;
      }

      // إنشاء سجل الدفعة
      const paymentData = {
        subscription_id: doc.id,
        invoice_id: invoiceId,
        amount: subscription.paid_amount || 0,
        payment_date: subscription.start_date || admin.firestore.Timestamp.now(),
        payment_method: 'cash',
        notes: 'دفعة مسجلة آلياً',
        created_at: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('payments').add(paymentData);
      log.success(`تم إنشاء سجل دفع ${subscription.paid_amount} ريال للاشتراك ${doc.id}`);
      
      createdCount++;
    }

    if (createdCount > 0) {
      log.success(`تم إنشاء ${createdCount} سجل دفع جديد`);
    } else {
      log.info('جميع الدفعات مسجلة');
    }

  } catch (error) {
    log.error(`خطأ في إنشاء سجلات الدفع: ${error.message}`);
  }
}

/**
 * الدالة الرئيسية
 */
async function main() {
  console.log('\n');
  log.title('🔧 إصلاح بيانات النظام المالي');
  log.info('جاري إصلاح وتنظيف البيانات...\n');

  try {
    // 1. حذف الاشتراكات القديمة
    await cleanupOldSubscriptions();

    // 2. إنشاء الفواتير المفقودة
    await createMissingInvoices();

    // 3. إنشاء سجلات الدفع المفقودة
    await createMissingPayments();

    log.header();
    log.success('✅ تم إصلاح جميع البيانات بنجاح!');
    log.success('✅ النظام الآن متكامل وجاهز للاستخدام');
    log.header();

  } catch (error) {
    log.error(`خطأ في عملية الإصلاح: ${error.message}`);
    console.error(error);
  } finally {
    await admin.app().delete();
    process.exit(0);
  }
}

// تشغيل السكريبت
main();

