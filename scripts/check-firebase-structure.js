/**
 * التحقق من بنية Firebase وإنشاء Collections المفقودة
 * 
 * الاستخدام:
 * node scripts/check-firebase-structure.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// قراءة Service Account من الملف
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ ملف serviceAccountKey.json غير موجود!');
  console.log('📝 يرجى نسخ محتوى Service Account إلى ملف serviceAccountKey.json');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// تهيئة Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id}.appspot.com`
  });
}

const db = admin.firestore();

// Collections المطلوبة للنظام
const REQUIRED_COLLECTIONS = {
  // Collections الأساسية (موجودة)
  'advertisers': {
    description: 'المعلنين - الشركات التي تشتري الإعلانات',
    required: true,
    sampleData: {
      company_name: 'شركة تجريبية',
      phone: '0500000000',
      whatsapp: '0500000000',
      email: 'test@example.com',
      services: 'خدمات تجريبية',
      status: 'pending',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    },
    relationships: ['subscriptions', 'statistics']
  },
  
  'plans': {
    description: 'الباقات الإعلانية - خطط الأسعار',
    required: true,
    sampleData: {
      name: 'باقة تجريبية',
      description: 'باقة لمدة 15 يوم',
      duration_days: 15,
      price: 500,
      features: ['ميزة 1', 'ميزة 2'],
      is_active: true,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    },
    relationships: ['subscriptions']
  },
  
  'subscriptions': {
    description: 'الاشتراكات - ربط المعلن بالباقة',
    required: true,
    sampleData: {
      advertiser_id: 'ADVERTISER_ID',
      plan_id: 'PLAN_ID',
      start_date: admin.firestore.FieldValue.serverTimestamp(),
      end_date: admin.firestore.FieldValue.serverTimestamp(),
      base_price: 500,
      discount_type: 'amount',
      discount_amount: 0,
      total_amount: 500,
      paid_amount: 0,
      remaining_amount: 500,
      status: 'active',
      payment_status: 'pending',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    },
    relationships: ['advertisers', 'plans', 'invoices', 'payments']
  },
  
  'invoices': {
    description: 'الفواتير - مستندات الدفع',
    required: true,
    sampleData: {
      subscription_id: 'SUBSCRIPTION_ID',
      invoice_number: 'INV-202411-0001',
      subtotal: 500,
      vat_percentage: 15,
      vat_amount: 75,
      amount: 575,
      status: 'unpaid',
      issued_date: admin.firestore.FieldValue.serverTimestamp(),
      due_date: admin.firestore.FieldValue.serverTimestamp(),
      sent_to_customer: false,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    },
    relationships: ['subscriptions', 'payments', 'invoice_audits']
  },
  
  'payments': {
    description: 'المدفوعات - سجل الدفعات المالية',
    required: true,
    sampleData: {
      subscription_id: 'SUBSCRIPTION_ID',
      invoice_id: 'INVOICE_ID',
      amount: 500,
      payment_date: admin.firestore.FieldValue.serverTimestamp(),
      payment_method: 'cash',
      transaction_id: null,
      notes: '',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    },
    relationships: ['subscriptions', 'invoices']
  },
  
  'ad_requests': {
    description: 'طلبات الإعلان - طلبات من العملاء المحتملين',
    required: true,
    sampleData: {
      company_name: 'شركة محتملة',
      contact_name: 'محمد أحمد',
      phone: '0500000000',
      whatsapp: '0500000000',
      email: 'contact@example.com',
      plan_id: null,
      message: 'أريد الإعلان',
      status: 'pending',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    },
    relationships: ['plans']
  },
  
  'statistics': {
    description: 'الإحصائيات - المشاهدات والنقرات',
    required: true,
    sampleData: {
      advertiser_id: 'ADVERTISER_ID',
      date: admin.firestore.FieldValue.serverTimestamp(),
      views: 0,
      clicks: 0
    },
    relationships: ['advertisers']
  },
  
  'admins': {
    description: 'المسؤولين - مستخدمي لوحة التحكم',
    required: true,
    sampleData: {
      email: 'admin@jeddah-ads.com',
      name: 'المسؤول',
      role: 'super_admin',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    },
    relationships: []
  },
  
  // Collections جديدة (للتحسينات)
  'invoice_audits': {
    description: 'سجل التدقيق - تتبع تعديلات الفواتير',
    required: false,
    sampleData: {
      invoice_id: 'INVOICE_ID',
      action: 'created',
      changed_fields: null,
      performed_by: 'ADMIN_UID',
      performed_at: admin.firestore.FieldValue.serverTimestamp(),
      ip_address: null,
      user_agent: null,
      notes: null,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    },
    relationships: ['invoices']
  },
  
  'reminders': {
    description: 'التذكيرات - إشعارات تلقائية للعملاء',
    required: false,
    sampleData: {
      invoice_id: 'INVOICE_ID',
      subscription_id: 'SUBSCRIPTION_ID',
      advertiser_id: 'ADVERTISER_ID',
      reminder_type: 'due_soon',
      scheduled_date: admin.firestore.FieldValue.serverTimestamp(),
      sent_date: null,
      status: 'pending',
      delivery_method: 'whatsapp',
      message: 'تذكير بالفاتورة',
      error_message: null,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    },
    relationships: ['invoices', 'subscriptions', 'advertisers']
  },
  
  'refunds': {
    description: 'الاستردادات - معالجة المبالغ المستردة',
    required: false,
    sampleData: {
      subscription_id: 'SUBSCRIPTION_ID',
      invoice_id: 'INVOICE_ID',
      payment_id: 'PAYMENT_ID',
      original_amount: 500,
      refund_amount: 200,
      refund_reason: 'إلغاء الاشتراك',
      refund_method: 'bank_transfer',
      refund_date: admin.firestore.FieldValue.serverTimestamp(),
      processed_by: 'ADMIN_UID',
      status: 'pending',
      bank_details: null,
      notes: null,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      completed_at: null
    },
    relationships: ['subscriptions', 'invoices', 'payments']
  },
  
  'notifications': {
    description: 'الإشعارات - سجل الرسائل المرسلة',
    required: false,
    sampleData: {
      type: 'invoice_whatsapp',
      invoice_id: 'INVOICE_ID',
      advertiser_id: 'ADVERTISER_ID',
      recipient: '0500000000',
      message: 'رسالة الإشعار',
      status: 'sent',
      sent_at: admin.firestore.FieldValue.serverTimestamp(),
      error: null,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    },
    relationships: ['invoices', 'advertisers']
  }
};

/**
 * التحقق من وجود Collection في Firebase
 */
async function checkCollectionExists(collectionName) {
  try {
    const snapshot = await db.collection(collectionName).limit(1).get();
    return {
      exists: true,
      count: snapshot.size,
      hasData: !snapshot.empty
    };
  } catch (error) {
    return {
      exists: false,
      count: 0,
      hasData: false,
      error: error.message
    };
  }
}

/**
 * إنشاء Collection مع بيانات تجريبية
 */
async function createCollection(collectionName, config) {
  try {
    console.log(`\n📝 إنشاء Collection: ${collectionName}`);
    console.log(`   الوصف: ${config.description}`);
    
    // إنشاء وثيقة تجريبية
    const docRef = await db.collection(collectionName).add({
      ...config.sampleData,
      _is_sample: true,
      _created_by_script: true,
      _note: 'هذه بيانات تجريبية - يمكن حذفها'
    });
    
    console.log(`   ✅ تم الإنشاء بنجاح! ID: ${docRef.id}`);
    return true;
  } catch (error) {
    console.error(`   ❌ فشل الإنشاء: ${error.message}`);
    return false;
  }
}

/**
 * عرض العلاقات بين Collections
 */
function displayRelationships() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 علاقات البيانات (Data Relationships)');
  console.log('='.repeat(80));
  
  const relationships = {
    'advertisers': {
      '→ subscriptions': 'المعلن يمتلك عدة اشتراكات',
      '→ statistics': 'المعلن له إحصائيات يومية',
      '→ reminders': 'المعلن يستقبل تذكيرات'
    },
    'plans': {
      '→ subscriptions': 'الباقة تُستخدم في عدة اشتراكات'
    },
    'subscriptions': {
      '← advertisers': 'الاشتراك ينتمي لمعلن واحد',
      '← plans': 'الاشتراك يستخدم باقة واحدة',
      '→ invoices': 'الاشتراك له فاتورة واحدة أو أكثر',
      '→ payments': 'الاشتراك له عدة دفعات',
      '→ refunds': 'الاشتراك قد يكون له استرداد'
    },
    'invoices': {
      '← subscriptions': 'الفاتورة تنتمي لاشتراك واحد',
      '→ payments': 'الفاتورة لها عدة دفعات',
      '→ invoice_audits': 'الفاتورة لها سجل تدقيق',
      '→ reminders': 'الفاتورة تولد تذكيرات',
      '→ notifications': 'الفاتورة تولد إشعارات'
    },
    'payments': {
      '← subscriptions': 'الدفعة تنتمي لاشتراك',
      '← invoices': 'الدفعة قد تكون مربوطة بفاتورة'
    }
  };
  
  for (const [collection, rels] of Object.entries(relationships)) {
    console.log(`\n${collection}:`);
    for (const [rel, desc] of Object.entries(rels)) {
      console.log(`   ${rel} ${desc}`);
    }
  }
}

/**
 * الدالة الرئيسية
 */
async function main() {
  console.log('🔍 بدء فحص بنية Firebase...\n');
  console.log('Project ID:', serviceAccount.project_id);
  console.log('='.repeat(80));
  
  const results = {
    existing: [],
    missing: [],
    errors: []
  };
  
  // فحص جميع Collections
  for (const [collectionName, config] of Object.entries(REQUIRED_COLLECTIONS)) {
    process.stdout.write(`\n📦 فحص: ${collectionName}...`);
    
    const status = await checkCollectionExists(collectionName);
    
    if (status.exists) {
      if (status.hasData) {
        console.log(` ✅ موجود (${status.count} وثائق)`);
        results.existing.push({
          name: collectionName,
          count: status.count,
          required: config.required,
          description: config.description
        });
      } else {
        console.log(` ⚠️  موجود ولكن فارغ`);
        results.missing.push({
          name: collectionName,
          reason: 'فارغ',
          required: config.required,
          description: config.description
        });
      }
    } else {
      console.log(` ❌ غير موجود`);
      results.missing.push({
        name: collectionName,
        reason: 'غير موجود',
        required: config.required,
        description: config.description
      });
    }
  }
  
  // عرض النتائج
  console.log('\n' + '='.repeat(80));
  console.log('📊 ملخص النتائج');
  console.log('='.repeat(80));
  
  console.log(`\n✅ Collections موجودة: ${results.existing.length}`);
  results.existing.forEach(item => {
    console.log(`   • ${item.name} (${item.count} وثائق) - ${item.description}`);
  });
  
  if (results.missing.length > 0) {
    console.log(`\n❌ Collections مفقودة أو فارغة: ${results.missing.length}`);
    results.missing.forEach(item => {
      const status = item.required ? '🔴 مطلوب' : '🟡 اختياري';
      console.log(`   ${status} ${item.name} (${item.reason}) - ${item.description}`);
    });
    
    // السؤال عن الإنشاء
    console.log('\n' + '='.repeat(80));
    console.log('💡 هل تريد إنشاء Collections المفقودة؟');
    console.log('='.repeat(80));
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('\nالإجابة (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        console.log('\n🚀 بدء إنشاء Collections المفقودة...\n');
        
        for (const item of results.missing) {
          const config = REQUIRED_COLLECTIONS[item.name];
          await createCollection(item.name, config);
        }
        
        console.log('\n✅ اكتمل إنشاء Collections!');
      } else {
        console.log('\n⏭️  تم التخطي. لم يتم إنشاء أي Collections.');
      }
      
      // عرض العلاقات
      displayRelationships();
      
      console.log('\n' + '='.repeat(80));
      console.log('✅ اكتمل الفحص!');
      console.log('='.repeat(80));
      
      readline.close();
      process.exit(0);
    });
  } else {
    console.log('\n✅ جميع Collections موجودة!');
    
    // عرض العلاقات
    displayRelationships();
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ اكتمل الفحص!');
    console.log('='.repeat(80));
    
    process.exit(0);
  }
}

// تشغيل السكريبت
main().catch(error => {
  console.error('\n❌ خطأ فادح:', error);
  process.exit(1);
});

