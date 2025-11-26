/**
 * سكريبت لمراجعة وإصلاح العمليات الحسابية للاشتراكات والدفعات
 * 
 * يقوم بـ:
 * 1. فحص جميع الاشتراكات
 * 2. حساب مجموع الدفعات الفعلي لكل اشتراك
 * 3. مقارنة مع paid_amount المسجل
 * 4. إصلاح أي تناقضات
 * 5. تحديث payment_status بناءً على القيم الصحيحة
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// ألوان للطباعة
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

async function auditAndFixPayments() {
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}        مراجعة وإصلاح العمليات الحسابية للمدفوعات${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}\n`);

  try {
    // 1. جلب جميع الاشتراكات
    console.log(`${colors.blue}📋 جلب جميع الاشتراكات...${colors.reset}`);
    const subscriptionsSnapshot = await db.collection('subscriptions').get();
    const subscriptions = [];
    
    subscriptionsSnapshot.forEach(doc => {
      subscriptions.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`${colors.green}✅ تم جلب ${subscriptions.length} اشتراك${colors.reset}\n`);

    // إحصائيات
    let totalChecked = 0;
    let totalFixed = 0;
    let totalErrors = 0;
    const issues = [];

    // 2. فحص كل اشتراك
    for (const subscription of subscriptions) {
      totalChecked++;
      
      console.log(`${colors.yellow}──────────────────────────────────────────────────────────────${colors.reset}`);
      console.log(`${colors.yellow}🔍 فحص الاشتراك: ${subscription.id}${colors.reset}`);
      console.log(`   المعلن: ${subscription.advertiser_id}`);
      console.log(`   الحالة: ${subscription.status}`);
      console.log(`   المبلغ الكلي: ${subscription.total_amount} ريال`);
      console.log(`   المدفوع المسجل: ${subscription.paid_amount || 0} ريال`);
      console.log(`   المتبقي المسجل: ${subscription.remaining_amount || subscription.total_amount} ريال`);
      
      // جلب جميع الدفعات لهذا الاشتراك
      const paymentsSnapshot = await db
        .collection('payments')
        .where('subscription_id', '==', subscription.id)
        .get();
      
      let actualPaidAmount = 0;
      const paymentsList = [];
      
      paymentsSnapshot.forEach(doc => {
        const payment = { id: doc.id, ...doc.data() };
        paymentsList.push(payment);
        actualPaidAmount += payment.amount || 0;
      });
      
      console.log(`   عدد الدفعات: ${paymentsList.length}`);
      console.log(`   ${colors.cyan}المدفوع الفعلي (حسب الدفعات): ${actualPaidAmount} ريال${colors.reset}`);
      
      // حساب القيم الصحيحة
      const correctRemainingAmount = subscription.total_amount - actualPaidAmount;
      
      // تحديد حالة الدفع الصحيحة
      let correctPaymentStatus;
      if (correctRemainingAmount <= 0.01) {
        correctPaymentStatus = 'paid';
      } else if (actualPaidAmount > 0) {
        correctPaymentStatus = 'partial';
      } else {
        correctPaymentStatus = 'pending';
      }
      
      // التحقق من وجود تناقضات
      const paidAmountDiff = Math.abs((subscription.paid_amount || 0) - actualPaidAmount);
      const remainingAmountDiff = Math.abs((subscription.remaining_amount || subscription.total_amount) - correctRemainingAmount);
      
      if (paidAmountDiff > 0.01 || remainingAmountDiff > 0.01 || subscription.payment_status !== correctPaymentStatus) {
        console.log(`   ${colors.red}❌ تم اكتشاف تناقضات:${colors.reset}`);
        
        if (paidAmountDiff > 0.01) {
          console.log(`      - المدفوع: المسجل ${subscription.paid_amount || 0} ≠ الفعلي ${actualPaidAmount} (فرق: ${paidAmountDiff})`);
        }
        
        if (remainingAmountDiff > 0.01) {
          console.log(`      - المتبقي: المسجل ${subscription.remaining_amount || subscription.total_amount} ≠ الصحيح ${correctRemainingAmount} (فرق: ${remainingAmountDiff})`);
        }
        
        if (subscription.payment_status !== correctPaymentStatus) {
          console.log(`      - حالة الدفع: المسجل "${subscription.payment_status}" ≠ الصحيح "${correctPaymentStatus}"`);
        }
        
        // إصلاح البيانات
        console.log(`   ${colors.magenta}🔧 إصلاح البيانات...${colors.reset}`);
        
        try {
          await db.collection('subscriptions').doc(subscription.id).update({
            paid_amount: actualPaidAmount,
            remaining_amount: Math.max(0, correctRemainingAmount),
            payment_status: correctPaymentStatus,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`   ${colors.green}✅ تم الإصلاح بنجاح${colors.reset}`);
          console.log(`      - المدفوع الجديد: ${actualPaidAmount} ريال`);
          console.log(`      - المتبقي الجديد: ${Math.max(0, correctRemainingAmount)} ريال`);
          console.log(`      - حالة الدفع الجديدة: ${correctPaymentStatus}`);
          
          totalFixed++;
          
          issues.push({
            subscription_id: subscription.id,
            advertiser_id: subscription.advertiser_id,
            old_paid: subscription.paid_amount || 0,
            new_paid: actualPaidAmount,
            old_remaining: subscription.remaining_amount || subscription.total_amount,
            new_remaining: correctRemainingAmount,
            old_status: subscription.payment_status,
            new_status: correctPaymentStatus,
            payments_count: paymentsList.length,
            fixed: true
          });
          
        } catch (error) {
          console.log(`   ${colors.red}❌ خطأ في الإصلاح: ${error.message}${colors.reset}`);
          totalErrors++;
          
          issues.push({
            subscription_id: subscription.id,
            advertiser_id: subscription.advertiser_id,
            error: error.message,
            fixed: false
          });
        }
        
      } else {
        console.log(`   ${colors.green}✅ البيانات صحيحة ومتسقة${colors.reset}`);
      }
    }

    // 3. عرض الملخص
    console.log(`\n${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}                         الملخص النهائي${colors.reset}`);
    console.log(`${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}\n`);
    
    console.log(`📊 الإحصائيات:`);
    console.log(`   - إجمالي الاشتراكات المفحوصة: ${totalChecked}`);
    console.log(`   - ${colors.green}تم الإصلاح: ${totalFixed}${colors.reset}`);
    console.log(`   - ${colors.red}أخطاء: ${totalErrors}${colors.reset}`);
    console.log(`   - ${colors.green}صحيحة: ${totalChecked - totalFixed - totalErrors}${colors.reset}\n`);
    
    if (issues.length > 0) {
      console.log(`${colors.yellow}📝 التفاصيل الكاملة:${colors.reset}`);
      issues.forEach((issue, index) => {
        console.log(`\n${index + 1}. الاشتراك: ${issue.subscription_id}`);
        console.log(`   المعلن: ${issue.advertiser_id}`);
        if (issue.fixed) {
          console.log(`   ${colors.green}✅ تم الإصلاح${colors.reset}`);
          console.log(`   - المدفوع: ${issue.old_paid} → ${issue.new_paid}`);
          console.log(`   - المتبقي: ${issue.old_remaining} → ${issue.new_remaining}`);
          console.log(`   - الحالة: ${issue.old_status} → ${issue.new_status}`);
          console.log(`   - عدد الدفعات: ${issue.payments_count}`);
        } else {
          console.log(`   ${colors.red}❌ فشل الإصلاح: ${issue.error}${colors.reset}`);
        }
      });
      
      // حفظ التقرير في ملف
      const reportPath = path.join(__dirname, 'payment-audit-report.json');
      fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
          total_checked: totalChecked,
          total_fixed: totalFixed,
          total_errors: totalErrors,
          total_correct: totalChecked - totalFixed - totalErrors
        },
        issues: issues
      }, null, 2));
      
      console.log(`\n${colors.cyan}📄 تم حفظ التقرير الكامل في: ${reportPath}${colors.reset}`);
    }
    
    console.log(`\n${colors.green}✨ اكتملت عملية المراجعة والإصلاح بنجاح${colors.reset}`);
    console.log(`${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}\n`);
    
  } catch (error) {
    console.error(`${colors.red}❌ خطأ في عملية المراجعة:${colors.reset}`, error);
    throw error;
  }
}

// تشغيل السكريبت
auditAndFixPayments()
  .then(() => {
    console.log(`${colors.green}✅ تم إنهاء السكريبت بنجاح${colors.reset}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`${colors.red}❌ خطأ فادح:${colors.reset}`, error);
    process.exit(1);
  });

