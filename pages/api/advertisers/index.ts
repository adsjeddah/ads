import type { NextApiRequest, NextApiResponse } from 'next';
import { AdvertiserService } from '../../../lib/services/advertiser.service';
import { AdvertiserAdminService } from '../../../lib/services/advertiser-admin.service';
import { FinancialService } from '../../../lib/services/financial.service';
import { Advertiser } from '../../../types/models';
import { verifyAdminToken } from '../../../lib/firebase-admin'; // Assuming admin-only access for POST

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Advertiser[] | Advertiser | { error: string } | { id: string; message?: string }>
) {
  if (req.method === 'GET') {
    try {
      const { status, sector, city } = req.query;
      
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
          
          console.log('✅ Subscription + Invoice + Payment created (legacy):', financialResult);
        } catch (subError: any) {
          console.error('❌ Error creating subscription with invoice:', subError);
        }
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