const functions = require('firebase-functions');
const { https } = require('firebase-functions');
const next = require('next');
const express = require('express');
const admin = require('firebase-admin');

// تهيئة Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const app = express();
const nextjsApp = next({
  dev: false,
  conf: {
    distDir: '.next',
  },
});
const handle = nextjsApp.getRequestHandler();

app.all('*', (req, res) => {
  return handle(req, res);
});

exports.nextServer = https.onRequest(async (req, res) => {
  await nextjsApp.prepare();
  return app(req, res);
});

// ====================== Cloud Functions الجديدة ======================

/**
 * تشغيل يومي للتذكيرات التلقائية
 * يعمل كل يوم الساعة 9 صباحاً
 */
exports.dailyReminders = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('Asia/Riyadh')
  .onRun(async (context) => {
    const db = admin.firestore();
    
    try {
      console.log('Starting daily reminders...');
      
      // 1. إنشاء تذكيرات للفواتير المستحقة قريباً
      const dueSoonCount = await createDueSoonReminders(db);
      console.log(`Created ${dueSoonCount} due soon reminders`);
      
      // 2. إنشاء تذكيرات للفواتير المتأخرة
      const overdueCount = await createOverdueReminders(db);
      console.log(`Created ${overdueCount} overdue reminders`);
      
      // 3. إنشاء تذكيرات للاشتراكات القريبة من الانتهاء
      const expiringCount = await createSubscriptionExpiringReminders(db);
      console.log(`Created ${expiringCount} subscription expiring reminders`);
      
      console.log('Daily reminders completed successfully');
      
      return {
        success: true,
        due_soon: dueSoonCount,
        overdue: overdueCount,
        expiring: expiringCount
      };
      
    } catch (error) {
      console.error('Error in daily reminders:', error);
      return { success: false, error: error.message };
    }
  });

/**
 * معالجة التذكيرات المعلقة كل ساعة
 */
exports.processReminders = functions.pubsub
  .schedule('every 1 hours')
  .timeZone('Asia/Riyadh')
  .onRun(async (context) => {
    const db = admin.firestore();
    
    try {
      console.log('Processing pending reminders...');
      
      const now = admin.firestore.Timestamp.now();
      
      // جلب التذكيرات المعلقة
      const remindersSnapshot = await db
        .collection('reminders')
        .where('status', '==', 'pending')
        .where('scheduled_date', '<=', now)
        .limit(50)
        .get();
      
      console.log(`Found ${remindersSnapshot.size} pending reminders`);
      
      let sent = 0;
      let failed = 0;
      
      for (const doc of remindersSnapshot.docs) {
        const reminder = doc.data();
        
        try {
          // هنا يجب إضافة كود الإرسال الفعلي (WhatsApp/Email/SMS)
          // مؤقتاً نسجل فقط
          console.log(`Would send: ${reminder.message} to ${reminder.advertiser_id}`);
          
          // تحديث الحالة
          await doc.ref.update({
            status: 'sent',
            sent_date: admin.firestore.FieldValue.serverTimestamp()
          });
          
          sent++;
        } catch (error) {
          console.error(`Failed to send reminder ${doc.id}:`, error);
          
          await doc.ref.update({
            status: 'failed',
            error_message: error.message
          });
          
          failed++;
        }
      }
      
      console.log(`Reminders processed: ${sent} sent, ${failed} failed`);
      
      return { success: true, sent, failed };
      
    } catch (error) {
      console.error('Error processing reminders:', error);
      return { success: false, error: error.message };
    }
  });

/**
 * تحديث حالات الاشتراكات يومياً
 */
exports.updateSubscriptionStatuses = functions.pubsub
  .schedule('0 1 * * *')
  .timeZone('Asia/Riyadh')
  .onRun(async (context) => {
    const db = admin.firestore();
    
    try {
      console.log('Updating subscription statuses...');
      
      const today = admin.firestore.Timestamp.now();
      
      // جلب الاشتراكات النشطة المنتهية
      const expiredSnapshot = await db
        .collection('subscriptions')
        .where('status', '==', 'active')
        .where('end_date', '<', today)
        .get();
      
      console.log(`Found ${expiredSnapshot.size} expired subscriptions`);
      
      let updated = 0;
      
      for (const doc of expiredSnapshot.docs) {
        await doc.ref.update({
          status: 'expired',
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        updated++;
      }
      
      console.log(`Updated ${updated} subscription statuses`);
      
      return { success: true, updated };
      
    } catch (error) {
      console.error('Error updating subscriptions:', error);
      return { success: false, error: error.message };
    }
  });

// ====================== Helper Functions ======================

async function createDueSoonReminders(db) {
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  
  const invoicesSnapshot = await db
    .collection('invoices')
    .where('status', '==', 'unpaid')
    .where('due_date', '<=', admin.firestore.Timestamp.fromDate(threeDaysFromNow))
    .get();
  
  let count = 0;
  
  for (const invoiceDoc of invoicesSnapshot.docs) {
    const invoice = invoiceDoc.data();
    
    // التحقق من عدم وجود تذكير سابق
    const existing = await db
      .collection('reminders')
      .where('invoice_id', '==', invoiceDoc.id)
      .where('reminder_type', '==', 'due_soon')
      .where('status', 'in', ['pending', 'sent'])
      .limit(1)
      .get();
    
    if (!existing.empty) continue;
    
    const subscription = await db.collection('subscriptions').doc(invoice.subscription_id).get();
    if (!subscription.exists) continue;
    
    const subData = subscription.data();
    
    await db.collection('reminders').add({
      invoice_id: invoiceDoc.id,
      subscription_id: invoice.subscription_id,
      advertiser_id: subData.advertiser_id,
      reminder_type: 'due_soon',
      scheduled_date: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
      delivery_method: 'whatsapp',
      message: `تذكير: فاتورتك رقم ${invoice.invoice_number} مستحقة خلال 3 أيام. المبلغ: ${invoice.amount} ريال.`,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    count++;
  }
  
  return count;
}

async function createOverdueReminders(db) {
  const today = new Date();
  
  const invoicesSnapshot = await db
    .collection('invoices')
    .where('status', '==', 'unpaid')
    .where('due_date', '<', admin.firestore.Timestamp.fromDate(today))
    .get();
  
  let count = 0;
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  
  for (const invoiceDoc of invoicesSnapshot.docs) {
    const invoice = invoiceDoc.data();
    
    // التحقق من عدم وجود تذكير اليوم
    const existing = await db
      .collection('reminders')
      .where('invoice_id', '==', invoiceDoc.id)
      .where('reminder_type', '==', 'overdue')
      .where('created_at', '>=', admin.firestore.Timestamp.fromDate(todayStart))
      .limit(1)
      .get();
    
    if (!existing.empty) continue;
    
    const subscription = await db.collection('subscriptions').doc(invoice.subscription_id).get();
    if (!subscription.exists) continue;
    
    const subData = subscription.data();
    
    await db.collection('reminders').add({
      invoice_id: invoiceDoc.id,
      subscription_id: invoice.subscription_id,
      advertiser_id: subData.advertiser_id,
      reminder_type: 'overdue',
      scheduled_date: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
      delivery_method: 'whatsapp',
      message: `تنبيه هام: فاتورتك رقم ${invoice.invoice_number} متأخرة. المبلغ المستحق: ${invoice.amount} ريال. يرجى السداد في أقرب وقت.`,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    count++;
  }
  
  return count;
}

async function createSubscriptionExpiringReminders(db) {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  
  const subscriptionsSnapshot = await db
    .collection('subscriptions')
    .where('status', '==', 'active')
    .where('end_date', '<=', admin.firestore.Timestamp.fromDate(sevenDaysFromNow))
    .get();
  
  let count = 0;
  
  for (const subDoc of subscriptionsSnapshot.docs) {
    const subscription = subDoc.data();
    
    // التحقق من عدم وجود تذكير سابق
    const existing = await db
      .collection('reminders')
      .where('subscription_id', '==', subDoc.id)
      .where('reminder_type', '==', 'subscription_expiring')
      .where('status', 'in', ['pending', 'sent'])
      .limit(1)
      .get();
    
    if (!existing.empty) continue;
    
    await db.collection('reminders').add({
      subscription_id: subDoc.id,
      advertiser_id: subscription.advertiser_id,
      reminder_type: 'subscription_expiring',
      scheduled_date: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
      delivery_method: 'whatsapp',
      message: `تنبيه: سينتهي اشتراكك خلال 7 أيام. هل تود تجديد الاشتراك والاستمرار في الإعلان؟`,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    count++;
  }
  
  return count;
} 