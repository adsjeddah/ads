/**
 * 🎯 Script لإعداد القطاعات والباقات بشكل شامل
 * 
 * البنية:
 * ========
 * 1. إنشاء القطاعات الأربعة الرئيسية
 * 2. إنشاء باقات لكل قطاع (مملكة + مدن)
 * 3. ربط الباقات بالقطاعات والمدن
 * 
 * القطاعات:
 * - movers (نقل العفش)
 * - cleaning (النظافة)
 * - water-leaks (كشف تسربات المياه)
 * - pest-control (مكافحة الحشرات)
 * 
 * المدن:
 * - jeddah (جدة)
 * - riyadh (الرياض)
 * - dammam (الدمام)
 * 
 * Usage: node scripts/setup-sectors-and-plans.js
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

// ============ البيانات الأساسية ============

const SECTORS = [
  {
    id: 'movers',
    name_ar: 'نقل العفش',
    name_en: 'Moving Services',
    description_ar: 'خدمات نقل العفش والأثاث المنزلي والمكتبي',
    description_en: 'Furniture and home/office moving services',
    icon: '🚛',
    slug: 'movers',
    is_active: true,
    order: 1
  },
  {
    id: 'cleaning',
    name_ar: 'النظافة',
    name_en: 'Cleaning Services',
    description_ar: 'خدمات التنظيف المنزلي والتجاري',
    description_en: 'Residential and commercial cleaning services',
    icon: '🧹',
    slug: 'cleaning',
    is_active: true,
    order: 2
  },
  {
    id: 'water-leaks',
    name_ar: 'كشف تسربات المياه',
    name_en: 'Water Leak Detection',
    description_ar: 'خدمات كشف وإصلاح تسربات المياه',
    description_en: 'Water leak detection and repair services',
    icon: '💧',
    slug: 'water-leaks',
    is_active: true,
    order: 3
  },
  {
    id: 'pest-control',
    name_ar: 'مكافحة الحشرات',
    name_en: 'Pest Control',
    description_ar: 'خدمات مكافحة الحشرات والقوارض',
    description_en: 'Pest and rodent control services',
    icon: '🪲',
    slug: 'pest-control',
    is_active: true,
    order: 4
  }
];

const CITIES = [
  {
    id: 'jeddah',
    name_ar: 'جدة',
    name_en: 'Jeddah',
    slug: 'jeddah',
    emoji: '🏙️',
    order: 1
  },
  {
    id: 'riyadh',
    name_ar: 'الرياض',
    name_en: 'Riyadh',
    slug: 'riyadh',
    emoji: '🌆',
    order: 2
  },
  {
    id: 'dammam',
    name_ar: 'الدمام',
    name_en: 'Dammam',
    slug: 'dammam',
    emoji: '🏖️',
    order: 3
  }
];

// باقات المملكة (موحدة لجميع القطاعات)
const KINGDOM_PLAN_TEMPLATES = [
  {
    duration_days: 7,
    price: 850,
    name_suffix: 'الأسبوعية',
    features: [
      'ظهور في الصفحة الرئيسية',
      'تغطية شاملة لجميع مناطق المملكة',
      'أولوية في نتائج البحث',
      'دعم فني متواصل',
      'تقارير أسبوعية'
    ]
  },
  {
    duration_days: 15,
    price: 1600,
    name_suffix: 'نصف الشهرية',
    features: [
      'ظهور في الصفحة الرئيسية',
      'تغطية شاملة لجميع مناطق المملكة',
      'أولوية عالية في نتائج البحث',
      'دعم فني مخصص 24/7',
      'تقارير أسبوعية مفصلة',
      'خصم 5% على التجديد'
    ]
  },
  {
    duration_days: 30,
    price: 3000,
    name_suffix: 'الشهرية',
    features: [
      'ظهور في الصفحة الرئيسية',
      'تغطية شاملة لجميع مناطق المملكة',
      'أولوية قصوى في نتائج البحث',
      'دعم فني VIP 24/7',
      'تقارير يومية مفصلة',
      'خصم 10% على التجديد',
      'تحليلات متقدمة للأداء',
      'استشارة تسويقية مجانية'
    ]
  }
];

// باقات المدن (موحدة لجميع القطاعات والمدن حالياً)
const CITY_PLAN_TEMPLATES = [
  {
    duration_days: 14,
    price: 500,
    name_suffix: 'أسبوعين',
    features: [
      'ظهور في صفحة المدينة',
      'تغطية محلية مركزة',
      'أولوية في نتائج المدينة',
      'دعم فني متواصل'
    ]
  },
  {
    duration_days: 30,
    price: 800,
    name_suffix: 'شهر',
    features: [
      'ظهور في صفحة المدينة',
      'تغطية محلية مركزة',
      'أولوية عالية في نتائج المدينة',
      'دعم فني 24/7',
      'تقارير أسبوعية'
    ]
  },
  {
    duration_days: 90,
    price: 1800,
    name_suffix: '3 أشهر',
    features: [
      'ظهور في صفحة المدينة',
      'تغطية محلية مركزة',
      'أولوية قصوى في نتائج المدينة',
      'دعم فني VIP 24/7',
      'تقارير أسبوعية مفصلة',
      'خصم 10% على التجديد'
    ]
  }
];

// ============ الدوال المساعدة ============

function generatePlanName(sector, planType, template, city = null) {
  const sectorName = SECTORS.find(s => s.id === sector).name_ar;
  
  if (planType === 'kingdom') {
    return `باقة ${sectorName} - المملكة ${template.name_suffix}`;
  } else {
    const cityName = CITIES.find(c => c.id === city).name_ar;
    return `باقة ${sectorName} - ${cityName} ${template.name_suffix}`;
  }
}

function generatePlanDescription(sector, planType, city = null) {
  const sectorName = SECTORS.find(s => s.id === sector).name_ar;
  
  if (planType === 'kingdom') {
    return `إعلان شامل لخدمات ${sectorName} في جميع أنحاء المملكة`;
  } else {
    const cityName = CITIES.find(c => c.id === city).name_ar;
    return `إعلان محلي لخدمات ${sectorName} في مدينة ${cityName}`;
  }
}

// ============ التنفيذ ============

async function setupSectorsAndPlans() {
  console.log('🚀 بدء إعداد القطاعات والباقات الشامل...\n');
  
  try {
    // ========== 1. إنشاء/تحديث القطاعات ==========
    console.log('📂 Step 1: إنشاء القطاعات...');
    const sectorPromises = SECTORS.map(async (sector) => {
      const sectorRef = db.collection('sectors').doc(sector.id);
      await sectorRef.set({
        ...sector,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`   ✅ ${sector.icon} ${sector.name_ar} (${sector.id})`);
    });
    await Promise.all(sectorPromises);
    console.log('');
    
    // ========== 2. إنشاء/تحديث المدن ==========
    console.log('🏙️ Step 2: إنشاء المدن...');
    const cityPromises = CITIES.map(async (city) => {
      const cityRef = db.collection('cities').doc(city.id);
      await cityRef.set({
        ...city,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`   ✅ ${city.emoji} ${city.name_ar} (${city.id})`);
    });
    await Promise.all(cityPromises);
    console.log('');
    
    // ========== 3. إنشاء الباقات ==========
    console.log('📦 Step 3: إنشاء الباقات لجميع القطاعات...\n');
    
    let totalPlansCreated = 0;
    
    for (const sector of SECTORS) {
      console.log(`   🎯 القطاع: ${sector.icon} ${sector.name_ar}`);
      
      // باقات المملكة لهذا القطاع
      console.log('      📍 باقات المملكة:');
      for (const template of KINGDOM_PLAN_TEMPLATES) {
        const planData = {
          name: generatePlanName(sector.id, 'kingdom', template),
          description: generatePlanDescription(sector.id, 'kingdom'),
          duration_days: template.duration_days,
          price: template.price,
          features: template.features,
          is_active: true,
          
          // التصنيف
          sector: sector.id,
          plan_type: 'kingdom',
          city: null,
          
          created_at: admin.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection('plans').add(planData);
        console.log(`         ✅ ${template.name_suffix} - ${template.price} ر.س (${docRef.id})`);
        totalPlansCreated++;
      }
      
      // باقات المدن لهذا القطاع
      console.log('      📍 باقات المدن:');
      for (const city of CITIES) {
        for (const template of CITY_PLAN_TEMPLATES) {
          const planData = {
            name: generatePlanName(sector.id, 'city', template, city.id),
            description: generatePlanDescription(sector.id, 'city', city.id),
            duration_days: template.duration_days,
            price: template.price,
            features: template.features,
            is_active: true,
            
            // التصنيف
            sector: sector.id,
            plan_type: 'city',
            city: city.id,
            
            created_at: admin.firestore.FieldValue.serverTimestamp()
          };
          
          const docRef = await db.collection('plans').add(planData);
          console.log(`         ✅ ${city.name_ar} ${template.name_suffix} - ${template.price} ر.س`);
          totalPlansCreated++;
        }
      }
      console.log('');
    }
    
    // ========== ملخص النتائج ==========
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 اكتمل الإعداد بنجاح!\n');
    
    console.log('📊 الملخص:');
    console.log(`   • القطاعات: ${SECTORS.length}`);
    console.log(`   • المدن: ${CITIES.length}`);
    console.log(`   • إجمالي الباقات: ${totalPlansCreated}`);
    console.log('');
    
    console.log('📦 توزيع الباقات:');
    console.log(`   • باقات المملكة لكل قطاع: ${KINGDOM_PLAN_TEMPLATES.length}`);
    console.log(`   • باقات المدن لكل قطاع: ${CITY_PLAN_TEMPLATES.length * CITIES.length}`);
    console.log(`   • إجمالي الباقات لكل قطاع: ${KINGDOM_PLAN_TEMPLATES.length + (CITY_PLAN_TEMPLATES.length * CITIES.length)}`);
    console.log('');
    
    console.log('🌐 الصفحات المتاحة:');
    console.log('   • prokr.net (نقل العفش - المملكة)');
    CITIES.forEach(city => {
      SECTORS.forEach(sector => {
        console.log(`   • prokr.net/${city.slug}/${sector.slug}`);
      });
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ في الإعداد:', error);
    process.exit(1);
  }
}

// تشغيل السكريبت
setupSectorsAndPlans();

