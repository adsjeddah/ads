import type { NextApiRequest, NextApiResponse } from 'next';
import { StatisticsAdminService } from '../../../lib/services/statistics-admin.service';
import { collectTrackingData } from '../../../lib/utils/tracking';

/**
 * API لتسجيل الإحصائيات مع بيانات التتبع المتقدمة
 * POST /api/statistics/record
 * 
 * Body:
 * - type: 'view' | 'click' | 'call'
 * - advertiserId: string (required)
 * - phone: string (optional, for calls)
 * - page_url: string (optional)
 * - screen_resolution: string (optional)
 * - session_id: string (optional)
 * - time_on_page: number (optional)
 * - is_returning_visitor: boolean (optional)
 * - previous_visits: number (optional)
 * - utm_source, utm_medium, utm_campaign, utm_term, utm_content (optional)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string; session_id?: string } | { error: string }>
) {
  if (req.method === 'POST') {
    try {
      const { type, advertiserId, phone, ...clientData } = req.body;

      if (typeof advertiserId !== 'string' || !advertiserId) {
        return res.status(400).json({ error: 'Advertiser ID is required' });
      }

      // جمع بيانات التتبع المتقدمة
      const trackingData = collectTrackingData(req, clientData);

      // Use Admin Service - bypasses Firestore Security Rules
      if (type === 'view') {
        await StatisticsAdminService.recordView(advertiserId, trackingData);
        res.status(200).json({ 
          message: 'View recorded successfully',
          session_id: trackingData.session_id 
        });
      } else if (type === 'click') {
        await StatisticsAdminService.recordClick(advertiserId, trackingData);
        res.status(200).json({ 
          message: 'Click recorded successfully',
          session_id: trackingData.session_id 
        });
      } else if (type === 'call') {
        await StatisticsAdminService.recordCall(advertiserId, phone, trackingData);
        res.status(200).json({ 
          message: 'Call recorded successfully',
          session_id: trackingData.session_id 
        });
      } else {
        res.status(400).json({ error: 'Invalid event type. Must be "view", "click", or "call".' });
      }
    } catch (error: any) {
      console.error('Error recording statistic:', error);
      res.status(500).json({ error: 'Failed to record statistic: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}