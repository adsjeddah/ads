import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb, verifyAdminToken } from '../../../lib/firebase-admin';

/**
 * API للتشخيص - عرض جميع الإحصائيات المسجلة
 * GET /api/admin/debug-statistics
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    await verifyAdminToken(token);
    
    // الحصول على الوقت الحالي
    const now = new Date();
    const SAUDI_OFFSET = 3 * 60 * 60 * 1000;
    const saudiNow = new Date(now.getTime() + SAUDI_OFFSET);
    
    // جلب جميع الإحصائيات
    const statsSnapshot = await adminDb.collection('statistics').get();
    
    const allStats = statsSnapshot.docs.map(doc => {
      const data = doc.data();
      
      let dateInfo = 'N/A';
      let dateUTC = null;
      let dateSaudi = null;
      
      if (data.date) {
        if (data.date.toDate) {
          const d = data.date.toDate();
          dateUTC = d.toISOString();
          dateSaudi = new Date(d.getTime() + SAUDI_OFFSET).toISOString();
        } else if (data.date.seconds) {
          const d = new Date(data.date.seconds * 1000);
          dateUTC = d.toISOString();
          dateSaudi = new Date(d.getTime() + SAUDI_OFFSET).toISOString();
        }
      }
      
      return {
        id: doc.id,
        advertiser_id: data.advertiser_id,
        date_utc: dateUTC,
        date_saudi: dateSaudi,
        views: data.views || 0,
        clicks: data.clicks || 0,
        calls: data.calls || 0,
        call_details_count: data.call_details?.length || 0,
        click_details_count: data.click_details?.length || 0
      };
    });
    
    // ترتيب حسب التاريخ (الأحدث أولاً)
    allStats.sort((a, b) => {
      if (!a.date_utc) return 1;
      if (!b.date_utc) return -1;
      return b.date_utc.localeCompare(a.date_utc);
    });
    
    // إحصائيات اليوم
    const todayStr = saudiNow.toISOString().split('T')[0];
    const todayStats = allStats.filter(s => 
      s.date_saudi && s.date_saudi.startsWith(todayStr)
    );
    
    return res.status(200).json({
      success: true,
      server_time: {
        utc: now.toISOString(),
        saudi: saudiNow.toISOString(),
        saudi_date: todayStr
      },
      total_records: allStats.length,
      today_records: todayStats.length,
      today_stats: todayStats,
      all_stats: allStats.slice(0, 50), // أول 50 فقط
      summary: {
        total_views: allStats.reduce((sum, s) => sum + s.views, 0),
        total_clicks: allStats.reduce((sum, s) => sum + s.clicks, 0),
        total_calls: allStats.reduce((sum, s) => sum + s.calls, 0),
        today_views: todayStats.reduce((sum, s) => sum + s.views, 0),
        today_clicks: todayStats.reduce((sum, s) => sum + s.clicks, 0),
        today_calls: todayStats.reduce((sum, s) => sum + s.calls, 0)
      }
    });
    
  } catch (error: any) {
    console.error('Error in debug statistics:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

