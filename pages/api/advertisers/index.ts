import type { NextApiRequest, NextApiResponse } from 'next';
import { AdvertiserService } from '../../../lib/services/advertiser.service';
import { AdvertiserAdminService } from '../../../lib/services/advertiser-admin.service';
import { FinancialService } from '../../../lib/services/financial.service';
import { GoogleSheetsService } from '../../../lib/services/google-sheets.service';
import { PlansAdminService } from '../../../lib/services/plans-admin.service';
import { SubscriptionAdminService } from '../../../lib/services/subscription-admin.service';
import { Advertiser } from '../../../types/models';
import { verifyAdminToken } from '../../../lib/firebase-admin'; // Assuming admin-only access for POST

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Advertiser[] | Advertiser | { error: string } | { id: string; message?: string }>
) {
  if (req.method === 'GET') {
    try {
      // Cache for 1 minute with stale-while-revalidate
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
      
      const { status, sector, city, include_subscriptions } = req.query;
      
      // Use Admin service for GET to avoid permissions issues
      let advertisers = await AdvertiserAdminService.getAll(status as string | undefined);
      
      // 🆕 فلترة حسب القطاع
      if (sector) {
        advertisers = advertisers.filter(adv => adv.sector === sector);
      }
      
      // 🆕 فلترة حسب المدينة
      if (city) {
        advertisers = advertisers.filter(adv => {
          // المعلنون الذين يغطون المملكة بالكامل
          if (adv.coverage_type === 'kingdom') return true;
          // المعلنون الذين يغطون المملكة والمدينة
          if (adv.coverage_type === 'both') return true;
          // المعلنون الذين يغطون هذه المدينة فقط
          if (adv.coverage_type === 'city' && adv.coverage_cities?.includes(city as string)) return true;
          return false;
        });
      }
      
      // 🆕 إضافة بيانات الاشتراكات للمعلنين
      if (include_subscriptions === 'true') {
        const allSubscriptions = await SubscriptionAdminService.getAll();
        const allPlans = await PlansAdminService.getAll();
        
        // Create a map of plans for quick lookup
        const plansMap = new Map(allPlans.map(plan => [plan.id, plan]));
        
        // Helper function to convert Firestore Timestamp to ISO string
        const toISOString = (timestamp: any): string | null => {
          if (!timestamp) return null;
          try {
            if (timestamp.toDate && typeof timestamp.toDate === 'function') {
              return timestamp.toDate().toISOString();
            }
            if (timestamp.seconds !== undefined) {
              return new Date(timestamp.seconds * 1000).toISOString();
            }
            if (timestamp._seconds !== undefined) {
              return new Date(timestamp._seconds * 1000).toISOString();
            }
            if (timestamp instanceof Date) {
              return timestamp.toISOString();
            }
            return new Date(timestamp).toISOString();
          } catch (e) {
            console.error('Error converting timestamp:', e);
            return null;
          }
        };
        
        // Enrich advertisers with subscription data
        advertisers = advertisers.map(adv => {
          const advSubscriptions = allSubscriptions.filter(sub => sub.advertiser_id === adv.id);
          
          // Get the most recent active subscription
          const activeSubscription = advSubscriptions.find(sub => 
            sub.status === 'active' || sub.status === 'paused'
          ) || advSubscriptions[0];
          
          if (activeSubscription) {
            const plan = plansMap.get(activeSubscription.plan_id);
            
            // Calculate total paid amount from all subscriptions
            const totalPaidAmount = advSubscriptions.reduce((sum, sub) => sum + (sub.paid_amount || 0), 0);
            
            return {
              ...adv,
              subscription_start_date: toISOString(activeSubscription.start_date),
              subscription_end_date: toISOString(activeSubscription.end_date),
              subscription_status: activeSubscription.status,
              plan_name: plan?.name || 'غير محدد',
              plan_type: plan?.plan_type || activeSubscription.coverage_area || 'kingdom',
              subscription_city: activeSubscription.city || plan?.city,
              total_paid_amount: totalPaidAmount,
              has_payments: totalPaidAmount > 0
            };
          }
          
          return {
            ...adv,
            subscription_start_date: null,
            subscription_end_date: null,
            subscription_status: null,
            plan_name: null,
            plan_type: null,
            subscription_city: null,
            total_paid_amount: 0,
            has_payments: false
          };
        });
      }
      
      res.status(200).json(advertisers);
    } catch (error: any) {
      console.error('Error fetching advertisers:', error);
      res.status(500).json({ error: 'Failed to fetch advertisers: ' + error.message });
    }
  } else if (req.method === 'POST') {
    try {
      // Optional: Verify admin token for creating advertisers
      // const token = req.headers.authorization?.split('Bearer ')[1];
      // if (!token) {
      //   return res.status(401).json({ error: 'Unauthorized: No token provided' });
      // }
      // await verifyAdminToken(token); // This will throw if not admin

      const {
        company_name,
        phone,
        whatsapp,
        services,
        selected_icon,
        status = 'active',
        include_vat = false,
        
        // 🆕 القطاع
        sector,
        
        // 🆕 النظام الجديد: التغطية الجغرافية
        coverage_type,
        coverage_cities,
        
        // 🆕 النظام الجديد: الباقات المتعددة
        packages = [], // array of package objects
        
        // 🆕 تصنيف العملاء
        customer_type,
        is_trusted,
        payment_terms_days,
        
        // القديم (backward compatibility)
        plan_id,
        start_date,
        end_date,
        base_price,
        discount_type,
        discount_amount,
        total_amount,
        paid_amount
      } = req.body;
      
      if (!company_name || !phone) {
        return res.status(400).json({ error: 'Company name and phone are required' });
      }
      
      // Create advertiser data with proper icon_url field
      const advertiserData: Omit<Advertiser, 'id' | 'created_at' | 'updated_at'> = {
        company_name,
        phone,
        whatsapp: whatsapp || undefined,
        services: services || undefined,
        icon_url: selected_icon || undefined, // Map selected_icon to icon_url
        include_vat: include_vat, // خيار ضريبة القيمة المضافة
        vat_percentage: include_vat ? 15 : undefined, // نسبة الضريبة الافتراضية
        status: status as 'active' | 'inactive' | 'pending',
        
        // 🆕 القطاع
        sector: sector as 'movers' | 'cleaning' | 'water-leaks' | 'pest-control' | undefined,
        
        // 🆕 التغطية الجغرافية
        coverage_type: coverage_type as 'kingdom' | 'city' | 'both' | undefined,
        coverage_cities: coverage_cities || undefined,
        
        // 🆕 تصنيف العملاء
        customer_type: customer_type as 'new' | 'trusted' | 'vip' | undefined,
        is_trusted: is_trusted || undefined,
        payment_terms_days: payment_terms_days || undefined
      };
      
      // Use Admin service to create advertiser (bypasses client permissions)
      const newAdvertiserId = await AdvertiserAdminService.create(advertiserData);
      
      // 🆕 إنشاء اشتراكات متعددة من الباقات المختارة
      const createdSubscriptions = [];
      const sheetsPackages = []; // للحفظ في Google Sheets
      
      if (packages && packages.length > 0) {
        // النظام الجديد: باقات متعددة
        console.log(`📦 إنشاء ${packages.length} اشتراك(ات) للمعلن ${newAdvertiserId}`);
        
        for (const pkg of packages) {
          try {
            const financialResult = await FinancialService.createSubscriptionWithInvoice({
              advertiser_id: newAdvertiserId,
              plan_id: pkg.plan_id,
              start_date: new Date(pkg.start_date),
              discount_type: pkg.discount_type || 'amount',
              discount_amount: pkg.discount_amount || 0,
              initial_payment: pkg.paid_amount || 0,
              payment_method: 'cash',
              notes: `إنشاء اشتراك ${pkg.coverage_type === 'kingdom' ? 'المملكة' : `مدينة ${pkg.city || ''}`}`,
              // إضافة معلومات التغطية للاشتراك
              coverage_area: pkg.coverage_type,
              city: pkg.city || undefined
            });
            
            createdSubscriptions.push({
              coverage_type: pkg.coverage_type,
              city: pkg.city,
              subscription_id: financialResult.subscription_id
            });
            
            // جلب معلومات الباقة للحفظ في Sheets
            try {
              const plan = await PlansAdminService.getById(pkg.plan_id);
              if (plan) {
                sheetsPackages.push({
                  plan_name: plan.name || `${plan.duration_days} يوم`,
                  start_date: pkg.start_date,
                  end_date: pkg.end_date,
                  total_amount: pkg.total_amount || 0,
                  paid_amount: pkg.paid_amount || 0
                });
              }
            } catch (planError) {
              console.error('خطأ في جلب معلومات الباقة:', planError);
            }
            
            console.log(`✅ اشتراك ${pkg.coverage_type} تم إنشاؤه بنجاح:`, financialResult.subscription_id);
          } catch (subError: any) {
            console.error(`❌ خطأ في إنشاء اشتراك ${pkg.coverage_type}:`, subError);
            // نستمر مع الباقات الأخرى حتى لو فشل واحد
          }
        }
      } else if (plan_id && start_date) {
        // النظام القديم: backward compatibility
        try {
          const financialResult = await FinancialService.createSubscriptionWithInvoice({
            advertiser_id: newAdvertiserId,
            plan_id,
            start_date: new Date(start_date),
            discount_type: discount_type || 'amount',
            discount_amount: discount_amount || 0,
            initial_payment: paid_amount || 0,
            payment_method: 'cash',
            notes: 'إنشاء اشتراك مع إضافة المعلن'
          });
          
          createdSubscriptions.push({
            coverage_type: 'legacy',
            subscription_id: financialResult.subscription_id
          });
          
          // جلب معلومات الباقة للحفظ في Sheets
          try {
            const plan = await PlansAdminService.getById(plan_id);
            if (plan) {
              sheetsPackages.push({
                plan_name: plan.name || `${plan.duration_days} يوم`,
                start_date: start_date,
                end_date: end_date || start_date,
                total_amount: total_amount || 0,
                paid_amount: paid_amount || 0
              });
            }
          } catch (planError) {
            console.error('خطأ في جلب معلومات الباقة:', planError);
          }
          
          console.log('✅ Subscription + Invoice + Payment created (legacy):', financialResult);
        } catch (subError: any) {
          console.error('❌ Error creating subscription with invoice:', subError);
        }
      }
      
      // 📊 حفظ المعلن في Google Sheets (للأرشفة فقط)
      try {
        await GoogleSheetsService.addAdvertiserToArchive({
          advertiser_id: newAdvertiserId,
          company_name,
          phone,
          sector: sector || 'غير محدد',
          coverage_type: coverage_type || 'kingdom',
          coverage_cities: coverage_cities,
          packages: sheetsPackages
        });
      } catch (sheetsError) {
        // نسجل الخطأ فقط ولا نوقف العملية
        console.error('⚠️ لم يتم حفظ المعلن في Google Sheets:', sheetsError);
      }
      
      // استجابة محسنة تشمل معلومات الاشتراكات
      const message = createdSubscriptions.length > 0
        ? `تم إنشاء المعلن بنجاح مع ${createdSubscriptions.length} اشتراك(ات)`
        : 'تم إنشاء المعلن بنجاح';
      
      res.status(201).json({ 
        id: newAdvertiserId,
        message: message,
        subscriptionsCount: createdSubscriptions.length
      } as any);
    } catch (error: any) {
      console.error('Error creating advertiser:', error);
      if (error.message.includes('Unauthorized') || error.message.includes('admin')) {
        return res.status(403).json({ error: 'Forbidden: ' + error.message });
      }
      res.status(500).json({ error: 'Failed to create advertiser: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}