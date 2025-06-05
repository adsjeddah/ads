import type { NextApiRequest, NextApiResponse } from 'next';
import { AdvertiserService } from '../../../lib/services/advertiser.service';
import { AdvertiserAdminService } from '../../../lib/services/advertiser-admin.service';
import { Advertiser } from '../../../types/models';
import { verifyAdminToken } from '../../../lib/firebase-admin'; // Assuming admin-only access for POST

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Advertiser[] | Advertiser | { error: string } | { id: string }>
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
      
      // If subscription data is provided, create a subscription too
      if (plan_id && start_date && end_date) {
        try {
          const { SubscriptionAdminService } = await import('../../../lib/services/subscription-admin.service');
          await SubscriptionAdminService.create({
            advertiser_id: newAdvertiserId,
            plan_id,
            start_date: new Date(start_date),
            end_date: new Date(end_date),
            base_price: base_price || 0,
            discount_type: discount_type || 'amount',
            discount_amount: discount_amount || 0,
            total_amount: total_amount || 0,
            paid_amount: paid_amount || 0,
            remaining_amount: (total_amount || 0) - (paid_amount || 0),
            status: 'active',
            payment_status: paid_amount >= total_amount ? 'paid' : paid_amount > 0 ? 'partial' : 'pending'
          });
        } catch (subError) {
          console.error('Error creating subscription:', subError);
          // Continue even if subscription creation fails
        }
      }
      res.status(201).json({ id: newAdvertiserId });
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