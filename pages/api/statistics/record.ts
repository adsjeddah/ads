import type { NextApiRequest, NextApiResponse } from 'next';
import { StatisticsAdminService } from '../../../lib/services/statistics-admin.service';
import { collectTrackingData } from '../../../lib/utils/tracking';

/**
 * تكوين الـ API - مهم لـ Vercel Pages Router
 */
export const config = {
  api: {
    // السماح بـ body parsing لجميع أنواع الـ content
    bodyParser: true,
    // إخبار Next.js أن هناك resolver خارجي
    externalResolver: true,
    // زيادة حد حجم الاستجابة
    responseLimit: false,
  },
};

/**
 * API لتسجيل الإحصائيات مع بيانات التتبع المتقدمة
 * POST /api/statistics/record
 * 
 * يدعم:
 * - طلبات axios/fetch العادية
 * - طلبات sendBeacon (للتتبع الموثوق عند التنقل)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string; session_id?: string } | { error: string }>
) {
  // ⚠️ مهم جداً: CORS headers في البداية
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // منع الـ caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  // ⚠️ معالجة OPTIONS أولاً (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET request للتحقق من عمل الـ API
  if (req.method === 'GET') {
    return res.status(200).json({ message: 'Statistics API is working - v2' });
  }

  // تسجيل وقت بداية الطلب للتتبع
  const startTime = Date.now();
  
  // ⚠️ معالجة POST
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