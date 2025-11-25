/**
 * Script لإضافة باقات المملكة الجديدة
 * 
 * الباقات:
 * 1. أسبوعية: 850 ريال (7 أيام)
 * 2. نصف شهرية: 1600 ريال (15 يوم)
 * 3. شهرية: 3000 ريال (30 يوم)
 * 
 * Usage: node scripts/add-kingdom-plans.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const kingdomPlans = [
  {
    name: 'باقة المملكة الأسبوعية',
    description: 'إعلان شامل في جميع أنحاء المملكة لمدة أسبوع',
    duration_days: 7,
    price: 850,
    features: [
      'ظهور في الصفحة الرئيسية (prokr.net)',
      'تغطية شاملة لجميع مناطق المملكة',
      'أولوية في نتائج البحث',
      'دعم فني متواصل',
      'تقارير أسبوعية'
    ],
    is_active: true,
    plan_type: 'kingdom',
    city: null,
    created_at: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    name: 'باقة المملكة نصف الشهرية',
    description: 'إعلان شامل في جميع أنحاء المملكة لمدة 15 يوم',
    duration_days: 15,
    price: 1600,
    features: [
      'ظهور في الصفحة الرئيسية (prokr.net)',
      'تغطية شاملة لجميع مناطق المملكة',
      'أولوية عالية في نتائج البحث',
      'دعم فني مخصص 24/7',
      'تقارير أسبوعية مفصلة',
      'خصم 5% على التجديد'
    ],
    is_active: true,
    plan_type: 'kingdom',
    city: null,
    created_at: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    name: 'باقة المملكة الشهرية',
    description: 'إعلان شامل في جميع أنحاء المملكة لمدة شهر كامل',
    duration_days: 30,
    price: 3000,
    features: [
      'ظهور في الصفحة الرئيسية (prokr.net)',
      'تغطية شاملة لجميع مناطق المملكة',
      'أولوية قصوى في نتائج البحث',
      'دعم فني VIP 24/7',
      'تقارير يومية مفصلة',
      'خصم 10% على التجديد',
      'تحليلات متقدمة للأداء',
      'استشارة تسويقية مجانية'
    ],
    is_active: true,
    plan_type: 'kingdom',
    city: null,
    created_at: admin.firestore.FieldValue.serverTimestamp()
  }
];

async function addKingdomPlans() {
  console.log('🚀 بدء إضافة باقات المملكة...\n');
  
  try {
    // التحقق من عدم وجود الباقات مسبقاً
    const existingPlans = await db.collection('plans')
      .where('plan_type', '==', 'kingdom')
      .get();
    
    if (!existingPlans.empty) {
      console.log('⚠️  تحذير: يوجد باقات مملكة موجودة مسبقاً.');
      console.log(`   عدد الباقات الموجودة: ${existingPlans.size}`);
      console.log('   هل تريد الاستمرار؟ (سيتم إضافة باقات جديدة)\n');
    }
    
    // إضافة الباقات
    for (const plan of kingdomPlans) {
      const docRef = await db.collection('plans').add(plan);
      console.log(`✅ تم إضافة: ${plan.name}`);
      console.log(`   ID: ${docRef.id}`);
      console.log(`   السعر: ${plan.price} ريال`);
      console.log(`   المدة: ${plan.duration_days} يوم`);
      console.log('');
    }
    
    console.log('🎉 تم إضافة جميع الباقات بنجاح!\n');
    
    // عرض ملخص
    console.log('📊 ملخص الباقات المضافة:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    kingdomPlans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name}`);
      console.log(`   💰 ${plan.price} ريال | ⏱️  ${plan.duration_days} يوم`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ في إضافة الباقات:', error);
    process.exit(1);
  }
}

// تشغيل السكريبت
addKingdomPlans();




