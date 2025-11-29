import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb, verifyAdminToken } from '../../../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const SAUDI_OFFSET_HOURS = 3;

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
    const SAUDI_OFFSET = SAUDI_OFFSET_HOURS * 60 * 60 * 1000;
    const saudiNow = new Date(now.getTime() + SAUDI_OFFSET);
    
    // حساب بداية ونهاية اليوم السعودي بنفس طريقة calls.ts
    const saudiYear = saudiNow.getUTCFullYear();
    const saudiMonth = saudiNow.getUTCMonth();
    const saudiDay = saudiNow.getUTCDate();
    
    const todayStartUTC = new Date(Date.UTC(saudiYear, saudiMonth, saudiDay, 0, 0, 0, 0) - SAUDI_OFFSET);
    const todayEndUTC = new Date(Date.UTC(saudiYear, saudiMonth, saudiDay, 23, 59, 59, 999) - SAUDI_OFFSET);
    
    // جلب جميع الإحصائيات
    const statsSnapshot = await adminDb.collection('statistics').get();
    
    const allStats = statsSnapshot.docs.map(doc => {
      const data = doc.data();
      
      let dateUTC: Date | null = null;
      let dateTimestamp: number | null = null;
      
      if (data.date) {
        if (data.date.toDate) {
          dateUTC = data.date.toDate();
          dateTimestamp = data.date.seconds;
        } else if (data.date.seconds) {
          dateUTC = new Date(data.date.seconds * 1000);
          dateTimestamp = data.date.seconds;
        }
      }
      
      // هل التاريخ ضمن نطاق اليوم السعودي؟
      const isToday = dateUTC ? (dateUTC >= todayStartUTC && dateUTC <= todayEndUTC) : false;
      
      return {
        id: doc.id,
        advertiser_id: data.advertiser_id,
        date_utc: dateUTC?.toISOString() || null,
        date_timestamp: dateTimestamp,
        date_saudi: dateUTC ? new Date(dateUTC.getTime() + SAUDI_OFFSET).toISOString() : null,
        is_today: isToday,
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
    const todayStats = allStats.filter(s => s.is_today);
    
    return res.status(200).json({
      success: true,
      server_time: {
        utc: now.toISOString(),
        saudi: saudiNow.toISOString(),
        saudi_date: `${saudiYear}-${String(saudiMonth + 1).padStart(2, '0')}-${String(saudiDay).padStart(2, '0')}`
      },
      today_range: {
        start_utc: todayStartUTC.toISOString(),
        end_utc: todayEndUTC.toISOString(),
        start_timestamp: Math.floor(todayStartUTC.getTime() / 1000),
        end_timestamp: Math.floor(todayEndUTC.getTime() / 1000)
      },
      total_records: allStats.length,
      today_records: todayStats.length,
      today_stats: todayStats,
      all_stats: allStats.slice(0, 50),
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

