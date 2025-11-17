// Script to add initial plans through admin API
// Run: node scripts/admin-add-plans.js

const axios = require('axios');

// Admin credentials
const ADMIN_EMAIL = 'admin@yourdomain.com';
const ADMIN_PASSWORD = 'admin123';
const API_URL = 'http://localhost:3001/api';

async function addPlans() {
  try {
    // 1. Login as admin
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // 2. Define plans
    const plans = [
      {
        name: 'خطة أسبوعين',
        description: 'للتجربة والشركات الجديدة',
        price: 500,
        duration_days: 14,
        features: [
          'ظهور في دليل شركات نقل العفش',
          'عرض رقم الهاتف والواتساب',
          'إضافة وصف مختصر للخدمات',
          'ظهور في نتائج البحث المحلي',
          'دعم فني عبر الواتساب'
        ],
        is_active: true
      },
      {
        name: 'خطة شهر',
        description: 'الأكثر طلباً للشركات النشطة',
        price: 800,
        duration_days: 30,
        features: [
          'جميع مميزات خطة الأسبوعين',
          'أولوية في ترتيب الظهور',
          'إضافة شعار الشركة',
          'عرض صور لأعمال النقل السابقة',
          'إحصائيات عدد المشاهدات',
          'ظهور مميز بإطار ذهبي'
        ],
        is_active: true
      },
      {
        name: 'خطة شهرين',
        description: 'للشركات الرائدة في نقل العفش',
        price: 1400,
        duration_days: 60,
        features: [
          'جميع مميزات خطة الشهر',
          'ظهور في أعلى نتائج البحث',
          'صفحة خاصة بتفاصيل الشركة',
          'إمكانية إضافة عروض وخصومات',
          'شارة "شركة موثوقة" المميزة',
          'تقارير شهرية مفصلة',
          'دعم فني مخصص على مدار الساعة'
        ],
        is_active: true
      }
    ];

    // 3. Add each plan
    for (const plan of plans) {
      try {
        console.log(`\n📝 Adding plan: ${plan.name}`);
        const response = await axios.post(`${API_URL}/plans`, plan, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log(`✅ Added successfully with ID: ${response.data.id}`);
      } catch (error) {
        console.error(`❌ Failed to add ${plan.name}:`, error.response?.data || error.message);
      }
    }

    console.log('\n🎉 All plans processed!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the script
addPlans();