/**
 * سكريبت إصلاح الفواتير التي لديها دفعات لكن لم تُحدّث حالتها
 * 
 * الاستخدام:
 * node scripts/fix-invoice-payments.js
 */

const admin = require('firebase-admin');
const path = require('path');

// تهيئة Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath))
  });
}

const db = admin.firestore();

async function fixInvoicePayments() {
  console.log('🔧 بدء إصلاح حالات الفواتير...\n');
  
  try {
    // 1. جلب جميع الفواتير
    const invoicesSnapshot = await db.collection('invoices').get();
    console.log(`📄 عدد الفواتير: ${invoicesSnapshot.size}`);
    
    let fixedCount = 0;
    let alreadyCorrect = 0;
    let errors = 0;
    
    for (const invoiceDoc of invoicesSnapshot.docs) {
      const invoice = { id: invoiceDoc.id, ...invoiceDoc.data() };
      
      try {
        // 2. جلب الدفعات المرتبطة بهذه الفاتورة
        const paymentsSnapshot = await db.collection('payments')
          .where('invoice_id', '==', invoice.id)
          .get();
        
        const totalPaid = paymentsSnapshot.docs.reduce((sum, doc) => {
          return sum + (doc.data().amount || 0);
        }, 0);
        
        // 3. جلب الدفعات من الاشتراك المرتبط (إذا لم تكن مرتبطة مباشرة بالفاتورة)
        let subscriptionPaid = 0;
        if (invoice.subscription_id) {
          const subPaymentsSnapshot = await db.collection('payments')
            .where('subscription_id', '==', invoice.subscription_id)
            .get();
          
          subscriptionPaid = subPaymentsSnapshot.docs.reduce((sum, doc) => {
            return sum + (doc.data().amount || 0);
          }, 0);
        }
        
        // استخدام الأعلى بين الدفعات المباشرة ودفعات الاشتراك
        const effectivePaid = Math.max(totalPaid, subscriptionPaid);
        
        // 4. تحديد الحالة الصحيحة
        let correctStatus = 'unpaid';
        if (effectivePaid >= invoice.amount) {
          correctStatus = 'paid';
        } else if (effectivePaid > 0) {
          correctStatus = 'partial';
        }
        
        // 5. التحقق من الحاجة للتحديث
        const currentStatus = invoice.status || 'unpaid';
        const currentPaidAmount = invoice.paid_amount || 0;
        
        if (currentStatus !== correctStatus || currentPaidAmount !== effectivePaid) {
          console.log(`\n📝 فاتورة: ${invoice.invoice_number || invoice.id}`);
          console.log(`   - المبلغ الكلي: ${invoice.amount} ريال`);
          console.log(`   - الدفعات المسجلة: ${effectivePaid} ريال`);
          console.log(`   - الحالة الحالية: ${currentStatus}`);
          console.log(`   - الحالة الصحيحة: ${correctStatus}`);
          
          // 6. تحديث الفاتورة
          await db.collection('invoices').doc(invoice.id).update({
            status: correctStatus,
            paid_amount: effectivePaid,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`   ✅ تم الإصلاح!`);
          fixedCount++;
        } else {
          alreadyCorrect++;
        }
        
      } catch (invoiceError) {
        console.error(`   ❌ خطأ في فاتورة ${invoice.id}:`, invoiceError.message);
        errors++;
      }
    }
    
    console.log('\n========================================');
    console.log('📊 ملخص الإصلاح:');
    console.log(`   - فواتير تم إصلاحها: ${fixedCount}`);
    console.log(`   - فواتير صحيحة بالفعل: ${alreadyCorrect}`);
    console.log(`   - أخطاء: ${errors}`);
    console.log('========================================\n');
    
    // 7. تحديث الاشتراكات أيضاً
    console.log('🔧 التحقق من الاشتراكات...\n');
    
    const subscriptionsSnapshot = await db.collection('subscriptions').get();
    let subFixedCount = 0;
    
    for (const subDoc of subscriptionsSnapshot.docs) {
      const subscription = { id: subDoc.id, ...subDoc.data() };
      
      try {
        // جلب الدفعات للاشتراك
        const paymentsSnapshot = await db.collection('payments')
          .where('subscription_id', '==', subscription.id)
          .get();
        
        const totalPaid = paymentsSnapshot.docs.reduce((sum, doc) => {
          return sum + (doc.data().amount || 0);
        }, 0);
        
        const currentPaid = subscription.paid_amount || 0;
        
        if (Math.abs(currentPaid - totalPaid) > 0.01) {
          const remaining = Math.max(0, (subscription.total_amount || 0) - totalPaid);
          let paymentStatus = 'pending';
          if (remaining <= 0.01) {
            paymentStatus = 'paid';
          } else if (totalPaid > 0) {
            paymentStatus = 'partial';
          }
          
          console.log(`📝 اشتراك: ${subscription.id}`);
          console.log(`   - المدفوع الحالي: ${currentPaid} → ${totalPaid}`);
          console.log(`   - المتبقي: ${remaining}`);
          
          await db.collection('subscriptions').doc(subscription.id).update({
            paid_amount: totalPaid,
            remaining_amount: remaining,
            payment_status: paymentStatus,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`   ✅ تم الإصلاح!`);
          subFixedCount++;
        }
      } catch (subError) {
        console.error(`   ❌ خطأ في اشتراك ${subscription.id}:`, subError.message);
      }
    }
    
    console.log(`\n✅ تم إصلاح ${subFixedCount} اشتراك`);
    console.log('\n🎉 اكتمل الإصلاح بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
  
  process.exit(0);
}

// تشغيل السكريبت
fixInvoicePayments();

