/**
 * إضافة الباقات الإعلانية الستة إلى Firebase
 * 
 * الاستخدام:
 * node scripts/add-plans.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// قراءة Service Account
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ ملف serviceAccountKey.json غير موجود!');
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

// الباقات الإعلانية السبعة - الأسعار الجديدة 2025
// أسبوع = 400 ريال | شهر = 1500 ريال
// مع خصومات تدريجية للفترات الأطول
const plans = [
  {
    name: 'باقة أسبوعية',
    description: 'إعلان لمدة أسبوع - مثالي للحملات القصيرة',
    duration_days: 7,
    price: 400,
    features: [
      'ظهور يومي في الصفحة الرئيسية',
      'إحصائيات أساسية',
      'دعم فني'
    ],
    is_active: true,
    created_at: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    name: 'باقة أسبوعين',
    description: 'إعلان لمدة أسبوعين - خصم 6%',
    duration_days: 15,
    price: 750,
    features: [
      'ظهور يومي في الصفحة الرئيسية',
      'إحصائيات مفصلة',
      'دعم فني',
      'تقرير أسبوعي'
    ],
    is_active: true,
    created_at: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    name: 'باقة شهرية',
    description: 'إعلان لمدة شهر كامل - الأكثر شعبية (خصم 12%)',
    duration_days: 30,
    price: 1500,
    features: [
      'ظهور يومي في الصفحة الرئيسية',
      'إحصائيات مفصلة',
      'أولوية في العرض',
      'دعم فني متميز',
      'تقرير شهري مفصل'
    ],
    is_active: true,
    created_at: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    name: 'باقة شهرين',
    description: 'إعلان لمدة شهرين - خصم 7%',
    duration_days: 60,
    price: 2800,
    features: [
      'ظهور يومي في الصفحة الرئيسية',
      'إحصائيات مفصلة',
      'أولوية عالية في العرض',
      'تقارير أسبوعية',
      'دعم فني متميز',
      'استشارة مجانية'
    ],
    is_active: true,
    created_at: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    name: 'باقة 3 أشهر',
    description: 'إعلان لمدة ثلاثة أشهر - خصم 11%',
    duration_days: 90,
    price: 4000,
    features: [
      'ظهور يومي في الصفحة الرئيسية',
      'إحصائيات متقدمة',
      'أولوية عالية جداً',
      'تقارير أسبوعية مفصلة',
      'استشارة تسويقية مجانية',
      'دعم فني VIP',
      'تحليل شهري للأداء'
    ],
    is_active: true,
    created_at: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    name: 'باقة 6 أشهر',
    description: 'إعلان لمدة نصف سنة - خصم 17%',
    duration_days: 180,
    price: 7500,
    features: [
      'ظهور يومي مميز',
      'إحصائيات متقدمة + AI',
      'أولوية قصوى',
      'تقارير أسبوعية + شهرية',
      'استشارتين تسويقيتين',
      'مراجعة شهرية للأداء',
      'دعم فني VIP 24/7',
      'حملة تسويقية مجانية'
    ],
    is_active: true,
    created_at: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    name: 'باقة سنوية',
    description: 'إعلان لمدة سنة كاملة - أفضل قيمة (خصم 23%)',
    duration_days: 365,
    price: 14000,
    features: [
      'ظهور يومي مميز جداً',
      'إحصائيات متقدمة + AI + تحليلات',
      'الأولوية المطلقة',
      'تقارير شاملة',
      'استشارات تسويقية غير محدودة',
      'مراجعة أسبوعية للأداء',
      'اجتماع شهري مع الفريق',
      'دعم فني VIP 24/7',
      'ضمان استرداد جزئي',
      '3 حملات تسويقية مجانية'
    ],
    is_active: true,
    created_at: admin.firestore.FieldValue.serverTimestamp()
  }
];

async function addPlans() {
  console.log('🚀 بدء إضافة الباقات الإعلانية...\n');
  console.log('Project ID:', serviceAccount.project_id);
  console.log('='.repeat(80));
  
  try {
    // التحقق من الباقات الموجودة
    const existingPlans = await db.collection('plans').get();
    
    if (!existingPlans.empty) {
      console.log(`\n⚠️  يوجد ${existingPlans.size} باقات موجودة بالفعل!`);
      console.log('\nالباقات الموجودة:');
      existingPlans.forEach(doc => {
        const data = doc.data();
        console.log(`  • ${data.name} (${data.duration_days} يوم) - ${data.price} ريال`);
      });
      
      // السؤال عن المتابعة
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('\nهل تريد حذف الباقات القديمة وإضافة الجديدة؟ (y/n): ', resolve);
      });
      
      readline.close();
      
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('\n⏭️  تم الإلغاء. لم يتم تغيير أي شيء.');
        process.exit(0);
      }
      
      // حذف الباقات القديمة
      console.log('\n🗑️  جاري حذف الباقات القديمة...');
      const batch = db.batch();
      existingPlans.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log('✅ تم حذف الباقات القديمة');
    }
    
    // إضافة الباقات الجديدة
    console.log('\n📦 جاري إضافة الباقات الجديدة...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < plans.length; i++) {
      const plan = plans[i];
      try {
        const docRef = await db.collection('plans').add(plan);
        console.log(`✅ ${i + 1}. ${plan.name}`);
        console.log(`   المدة: ${plan.duration_days} يوم`);
        console.log(`   السعر: ${plan.price} ريال`);
        console.log(`   ID: ${docRef.id}`);
        console.log('');
        successCount++;
      } catch (error) {
        console.error(`❌ ${i + 1}. فشل إضافة ${plan.name}:`, error.message);
        console.log('');
        errorCount++;
      }
    }
    
    // النتيجة النهائية
    console.log('='.repeat(80));
    console.log('📊 ملخص العملية:');
    console.log('='.repeat(80));
    console.log(`✅ تمت الإضافة بنجاح: ${successCount} باقات`);
    if (errorCount > 0) {
      console.log(`❌ فشلت: ${errorCount} باقات`);
    }
    console.log('');
    
    // عرض جميع الباقات الحالية
    console.log('📋 الباقات المتاحة الآن:');
    console.log('='.repeat(80));
    
    const allPlans = await db.collection('plans').get();
    
    // ترتيب حسب المدة
    const sortedPlans = [];
    allPlans.forEach(doc => {
      sortedPlans.push({ id: doc.id, ...doc.data() });
    });
    sortedPlans.sort((a, b) => a.duration_days - b.duration_days);
    
    // عرض في جدول
    console.log('');
    console.log('┌──────────────────────┬─────────────┬─────────────┬──────────────┐');
    console.log('│ الباقة               │ المدة (يوم) │ السعر (ريال) │ الحالة       │');
    console.log('├──────────────────────┼─────────────┼─────────────┼──────────────┤');
    
    sortedPlans.forEach(plan => {
      const name = plan.name.padEnd(20);
      const duration = plan.duration_days.toString().padStart(11);
      const price = plan.price.toString().padStart(11);
      const status = (plan.is_active ? '✅ نشط' : '❌ غير نشط').padEnd(12);
      console.log(`│ ${name} │ ${duration} │ ${price} │ ${status} │`);
    });
    
    console.log('└──────────────────────┴─────────────┴─────────────┴──────────────┘');
    console.log('');
    
    // حساب الإجمالي
    const totalRevenue = sortedPlans.reduce((sum, plan) => sum + plan.price, 0);
    console.log(`💰 إجمالي قيمة جميع الباقات: ${totalRevenue.toLocaleString('ar-SA')} ريال`);
    console.log('');
    
    console.log('='.repeat(80));
    console.log('✅ اكتملت عملية إضافة الباقات بنجاح!');
    console.log('='.repeat(80));
    console.log('');
    console.log('🎯 الخطوة التالية:');
    console.log('   • يمكنك الآن إنشاء اشتراكات جديدة من لوحة التحكم');
    console.log('   • افتح: http://localhost:3000/admin/dashboard');
    console.log('   • اختر معلن → أنشئ اشتراك جديد');
    console.log('');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ خطأ فادح:', error);
    console.error('التفاصيل:', error.message);
    process.exit(1);
  }
}

// تشغيل
addPlans();

