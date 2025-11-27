import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebase-admin';
import { verifyToken } from '../../../lib/utils/auth';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * API لجلب تقارير المكالمات المجمعة
 * GET /api/reports/calls?period=day|week|month|custom&start_date=xxx&end_date=xxx&city=xxx&sector=xxx
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
    // التحقق من التوكن
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { period = 'week', start_date, end_date, city, sector } = req.query;

    // حساب نطاق التواريخ
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (period === 'custom' && start_date && end_date) {
      startDate = new Date(start_date as string);
      endDate = new Date(end_date as string);
    } else {
      switch (period) {
        case 'day':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate = new Date(now);
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
      }
    }

    // جلب الإحصائيات من Firestore
    const statsRef = adminDb.collection('statistics');
    let statsQuery = statsRef
      .where('date', '>=', Timestamp.fromDate(startDate))
      .where('date', '<=', Timestamp.fromDate(endDate));

    const statsSnapshot = await statsQuery.get();

    // جلب جميع المعلنين
    const advertisersRef = adminDb.collection('advertisers');
    const advertisersSnapshot = await advertisersRef.get();
    
    const advertisersMap: Record<string, any> = {};
    advertisersSnapshot.docs.forEach(doc => {
      advertisersMap[doc.id] = { id: doc.id, ...doc.data() };
    });

    // تجميع البيانات
    const advertiserStats: Record<string, {
      advertiser_id: string;
      company_name: string;
      phone: string;
      city: string;
      sector: string;
      total_calls: number;
      total_views: number;
      total_clicks: number;
      call_details: any[];
      daily_calls: Record<string, number>;
      last_call_date: Date | null;
    }> = {};

    let totalCalls = 0;
    let totalViews = 0;
    let totalClicks = 0;
    const dailyTotals: Record<string, { calls: number; views: number; clicks: number }> = {};

    for (const doc of statsSnapshot.docs) {
      const data = doc.data();
      const advertiserId = data.advertiser_id;
      const advertiser = advertisersMap[advertiserId];

      if (!advertiser) continue;

      // فلترة حسب المدينة
      if (city && city !== 'all' && advertiser.city !== city) continue;

      // فلترة حسب القطاع
      if (sector && sector !== 'all' && advertiser.sector !== sector) continue;

      // إعداد بيانات المعلن
      if (!advertiserStats[advertiserId]) {
        advertiserStats[advertiserId] = {
          advertiser_id: advertiserId,
          company_name: advertiser.company_name || 'غير محدد',
          phone: advertiser.phone || '',
          city: advertiser.city || 'غير محدد',
          sector: advertiser.sector || 'غير محدد',
          total_calls: 0,
          total_views: 0,
          total_clicks: 0,
          call_details: [],
          daily_calls: {},
          last_call_date: null
        };
      }

      // تجميع الإحصائيات
      const calls = data.calls || 0;
      const views = data.views || 0;
      const clicks = data.clicks || 0;

      advertiserStats[advertiserId].total_calls += calls;
      advertiserStats[advertiserId].total_views += views;
      advertiserStats[advertiserId].total_clicks += clicks;

      // تفاصيل المكالمات
      if (data.call_details && Array.isArray(data.call_details)) {
        advertiserStats[advertiserId].call_details.push(...data.call_details.map((cd: any) => ({
          ...cd,
          timestamp: cd.timestamp?.toDate ? cd.timestamp.toDate().toISOString() : cd.timestamp
        })));

        // آخر مكالمة
        data.call_details.forEach((cd: any) => {
          const callDate = cd.timestamp?.toDate ? cd.timestamp.toDate() : new Date(cd.timestamp);
          if (!advertiserStats[advertiserId].last_call_date || 
              callDate > advertiserStats[advertiserId].last_call_date!) {
            advertiserStats[advertiserId].last_call_date = callDate;
          }
        });
      }

      // المكالمات اليومية
      const dateKey = data.date?.toDate ? 
        data.date.toDate().toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0];
      
      advertiserStats[advertiserId].daily_calls[dateKey] = 
        (advertiserStats[advertiserId].daily_calls[dateKey] || 0) + calls;

      // الإجماليات
      totalCalls += calls;
      totalViews += views;
      totalClicks += clicks;

      // الإجماليات اليومية
      if (!dailyTotals[dateKey]) {
        dailyTotals[dateKey] = { calls: 0, views: 0, clicks: 0 };
      }
      dailyTotals[dateKey].calls += calls;
      dailyTotals[dateKey].views += views;
      dailyTotals[dateKey].clicks += clicks;
    }

    // تحويل إلى مصفوفة وترتيب حسب المكالمات
    const advertisersArray = Object.values(advertiserStats)
      .sort((a, b) => b.total_calls - a.total_calls);

    // حساب المعدل اليومي
    const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const avgDailyCalls = Math.round(totalCalls / daysDiff);

    // ترتيب البيانات اليومية
    const chartData = Object.entries(dailyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        calls: data.calls,
        views: data.views,
        clicks: data.clicks
      }));

    // إحصائيات المدن
    const citiesStats: Record<string, number> = {};
    const sectorsStats: Record<string, number> = {};
    const devicesStats: Record<string, number> = {};
    const sourcesStats: Record<string, number> = {};

    advertisersArray.forEach(adv => {
      citiesStats[adv.city] = (citiesStats[adv.city] || 0) + adv.total_calls;
      sectorsStats[adv.sector] = (sectorsStats[adv.sector] || 0) + adv.total_calls;
      
      adv.call_details.forEach(cd => {
        if (cd.device_type) {
          devicesStats[cd.device_type] = (devicesStats[cd.device_type] || 0) + 1;
        }
        const source = cd.utm_source || 'direct';
        sourcesStats[source] = (sourcesStats[source] || 0) + 1;
      });
    });

    // المعلن الأكثر اتصالاً
    const topAdvertiser = advertisersArray[0] || null;
    // المعلن الأقل اتصالاً (من المعلنين الذين لديهم مكالمات)
    const leastAdvertiser = advertisersArray.length > 1 ? 
      advertisersArray[advertisersArray.length - 1] : null;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          total_calls: totalCalls,
          total_views: totalViews,
          total_clicks: totalClicks,
          avg_daily_calls: avgDailyCalls,
          total_advertisers: advertisersArray.length,
          period_days: daysDiff,
          top_advertiser: topAdvertiser ? {
            id: topAdvertiser.advertiser_id,
            name: topAdvertiser.company_name,
            calls: topAdvertiser.total_calls
          } : null,
          least_advertiser: leastAdvertiser ? {
            id: leastAdvertiser.advertiser_id,
            name: leastAdvertiser.company_name,
            calls: leastAdvertiser.total_calls
          } : null
        },
        chart_data: chartData,
        advertisers: advertisersArray.map(adv => ({
          ...adv,
          last_call_date: adv.last_call_date?.toISOString() || null,
          call_details: adv.call_details.slice(0, 50) // أول 50 مكالمة فقط
        })),
        breakdown: {
          cities: Object.entries(citiesStats).map(([name, count]) => ({ name, count })),
          sectors: Object.entries(sectorsStats).map(([name, count]) => ({ name, count })),
          devices: Object.entries(devicesStats).map(([name, count]) => ({ name, count })),
          sources: Object.entries(sourcesStats).map(([name, count]) => ({ name, count }))
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching call reports:', error);
    res.status(500).json({ error: 'Failed to fetch call reports: ' + error.message });
  }
}

