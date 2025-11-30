import type { NextApiRequest, NextApiResponse } from 'next';
import { StatisticsAdminService } from '../../../lib/services/statistics-admin.service';
import { collectTrackingData } from '../../../lib/utils/tracking';

/**
 * API لتسجيل الإحصائيات مع بيانات التتبع المتقدمة
 * POST /api/statistics/record
 * 
 * يدعم:
 * - طلبات axios/fetch العادية
 * - طلبات sendBeacon (للتتبع الموثوق عند التنقل)
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
  // إضافة CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET request للتحقق من عمل الـ API
  if (req.method === 'GET') {
    return res.status(200).json({ message: 'Statistics API is working' });
  }

  // تسجيل وقت بداية الطلب للتتبع
  const startTime = Date.now();
  
  if (req.method === 'POST') {
    try {
      // التعامل مع الجسم سواء كان JSON أو نص (sendBeacon قد يرسل كنص)
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          console.error('Failed to parse request body:', e);
          return res.status(400).json({ error: 'Invalid JSON body' });
        }
      }

      const { type, advertiserId, phone, timestamp, ...clientData } = body;

      if (typeof advertiserId !== 'string' || !advertiserId) {
        console.error('❌ Missing advertiserId in request');
        return res.status(400).json({ error: 'Advertiser ID is required' });
      }

      // جمع بيانات التتبع المتقدمة
      const trackingData = collectTrackingData(req, clientData);

      console.log(`📊 Recording ${type} for advertiser: ${advertiserId} at ${new Date().toISOString()}`);

      // Use Admin Service - bypasses Firestore Security Rules
      if (type === 'view') {
        await StatisticsAdminService.recordView(advertiserId, trackingData);
        console.log(`✅ View recorded for ${advertiserId} in ${Date.now() - startTime}ms`);
        res.status(200).json({ 
          message: 'View recorded successfully',
          session_id: trackingData.session_id 
        });
      } else if (type === 'click') {
        await StatisticsAdminService.recordClick(advertiserId, trackingData);
        console.log(`✅ Click recorded for ${advertiserId} in ${Date.now() - startTime}ms`);
        res.status(200).json({ 
          message: 'Click recorded successfully',
          session_id: trackingData.session_id 
        });
      } else if (type === 'call') {
        await StatisticsAdminService.recordCall(advertiserId, phone, trackingData);
        console.log(`✅ Call recorded for ${advertiserId} (phone: ${phone}) in ${Date.now() - startTime}ms`);
        res.status(200).json({ 
          message: 'Call recorded successfully',
          session_id: trackingData.session_id 
        });
      } else {
        console.error(`❌ Invalid event type: ${type}`);
        res.status(400).json({ error: 'Invalid event type. Must be "view", "click", or "call".' });
      }
    } catch (error: any) {
      console.error('❌ Error recording statistic:', error);
      res.status(500).json({ error: 'Failed to record statistic: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}