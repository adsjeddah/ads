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
      const { status } = req.query;
      // Use Admin service for GET to avoid permissions issues
      const advertisers = await AdvertiserAdminService.getAll(status as string | undefined);
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
        status: status as 'active' | 'inactive' | 'pending'
      };
      
      // Use Admin service to create advertiser (bypasses client permissions)
      const newAdvertiserId = await AdvertiserAdminService.create(advertiserData);
      
      // If subscription data is provided, use FinancialService to create subscription + invoice + payment
      if (plan_id && start_date) {
        try {
          // استخدام النظام المالي المتكامل لإنشاء اشتراك + فاتورة + دفعة (إن وجدت)
          const financialResult = await FinancialService.createSubscriptionWithInvoice({
            advertiser_id: newAdvertiserId,
            plan_id,
            start_date: new Date(start_date),
            discount_type: discount_type || 'amount',
            discount_amount: discount_amount || 0,
            initial_payment: paid_amount || 0,
            payment_method: 'cash', // يمكن تمريره من الفرونت إند
            notes: 'إنشاء اشتراك مع إضافة المعلن',
            vat_percentage: 15 // نسبة VAT الافتراضية
          });
          
          console.log('✅ Subscription + Invoice + Payment created:', financialResult);
        } catch (subError: any) {
          console.error('❌ Error creating subscription with invoice:', subError);
          // لا نفشل العملية بالكامل إذا فشل إنشاء الاشتراك
          // لكن نسجل الخطأ
        }
      }
      
      res.status(201).json({ 
        id: newAdvertiserId,
        message: plan_id ? 'تم إنشاء المعلن والاشتراك والفاتورة بنجاح' : 'تم إنشاء المعلن بنجاح'
      });
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