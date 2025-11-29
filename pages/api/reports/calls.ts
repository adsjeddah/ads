import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb, verifyAdminToken } from '../../../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Saudi Arabia is UTC+3
const SAUDI_OFFSET_HOURS = 3;

/**
 * الحصول على تاريخ اليوم بتوقيت السعودية (بداية اليوم ونهايته) بـ UTC
 * هذه الطريقة تضمن حساب صحيح للتواريخ بغض النظر عن توقيت السيرفر
 */
function getSaudiDayRange(referenceDate: Date = new Date()): { start: Date; end: Date } {
  // الوقت الحالي بـ UTC
  const utcTime = referenceDate.getTime();
  
  // تحويل إلى توقيت السعودية بإضافة 3 ساعات
  const saudiTime = new Date(utcTime + (SAUDI_OFFSET_HOURS * 60 * 60 * 1000));
  
  // الحصول على التاريخ السعودي (السنة، الشهر، اليوم)
  const saudiYear = saudiTime.getUTCFullYear();
  const saudiMonth = saudiTime.getUTCMonth();
  const saudiDay = saudiTime.getUTCDate();
  
  // بداية اليوم السعودي بـ UTC (00:00 سعودي = 21:00 UTC اليوم السابق)
  const startUtc = new Date(Date.UTC(saudiYear, saudiMonth, saudiDay, 0, 0, 0, 0) - (SAUDI_OFFSET_HOURS * 60 * 60 * 1000));
  
  // نهاية اليوم السعودي بـ UTC (23:59:59 سعودي = 20:59:59 UTC)
  const endUtc = new Date(Date.UTC(saudiYear, saudiMonth, saudiDay, 23, 59, 59, 999) - (SAUDI_OFFSET_HOURS * 60 * 60 * 1000));
  
  return { start: startUtc, end: endUtc };
}

/**
 * الحصول على نطاق التواريخ حسب الفترة المحددة
 */
function getDateRange(period: string, customStart?: string, customEnd?: string): { start: Date; end: Date } {
  const now = new Date();
  
  if (period === 'custom' && customStart && customEnd) {
    const startDate = new Date(customStart);
    const endDate = new Date(customEnd);
    // إضافة يوم كامل للتاريخ النهائي
    endDate.setUTCHours(23, 59, 59, 999);
    return { start: startDate, end: endDate };
  }
  
  const todayRange = getSaudiDayRange(now);
  
  switch (period) {
    case 'day':
      return todayRange;
    
    case 'week': {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoRange = getSaudiDayRange(weekAgo);
      return { start: weekAgoRange.start, end: todayRange.end };
    }
    
    case 'month': {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const monthAgoRange = getSaudiDayRange(monthAgo);
      return { start: monthAgoRange.start, end: todayRange.end };
    }
    
    case 'year': {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      const yearAgoRange = getSaudiDayRange(yearAgo);
      return { start: yearAgoRange.start, end: todayRange.end };
    }
    
    default: {
      // افتراضي: آخر 7 أيام
      const defaultWeekAgo = new Date(now);
      defaultWeekAgo.setDate(defaultWeekAgo.getDate() - 7);
      const defaultRange = getSaudiDayRange(defaultWeekAgo);
      return { start: defaultRange.start, end: todayRange.end };
    }
  }
}

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
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    let decoded;
    try {
      decoded = await verifyAdminToken(token);
    } catch (authError: any) {
      console.error('Token verification failed:', authError.message);
      return res.status(401).json({ error: 'Invalid token: ' + authError.message });
    }

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token - decoded is null' });
    }

    const { period = 'week', start_date, end_date, city, sector } = req.query;

    // حساب نطاق التواريخ
    const { start: startDate, end: endDate } = getDateRange(
      period as string,
      start_date as string,
      end_date as string
    );

    // جلب جميع الإحصائيات ثم فلترة يدوياً
    let statsSnapshot;
    try {
      const statsRef = adminDb.collection('statistics');
      statsSnapshot = await statsRef.get();
    } catch (queryError: any) {
      console.error('Statistics query error:', queryError.message);
      return res.status(200).json({
        success: true,
        data: {
          summary: {
            total_calls: 0,
            total_views: 0,
            total_clicks: 0,
            avg_daily_calls: 0,
            total_advertisers: 0,
            period_days: 1,
            top_advertiser: null,
            least_advertiser: null
          },
          chart_data: [],
          advertisers: [],
          breakdown: { cities: [], sectors: [], devices: [], sources: [] }
        }
      });
    }

    // جلب جميع المعلنين
    let advertisersSnapshot;
    try {
    const advertisersRef = adminDb.collection('advertisers');
      advertisersSnapshot = await advertisersRef.get();
    } catch (advError: any) {
      console.error('Advertisers query error:', advError.message);
      return res.status(500).json({ error: 'Failed to fetch advertisers: ' + advError.message });
    }
    
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
      
      // الحصول على تاريخ المستند (دعم date_key الجديد و date القديم)
      let docDate: Date | null = null;
      const docDateKey: string | null = data.date_key || null;
      
      if (docDateKey) {
        // استخدام date_key إذا كان موجوداً (أكثر دقة)
        docDate = new Date(docDateKey + 'T00:00:00');
      } else if (data.date) {
        if (data.date.toDate && typeof data.date.toDate === 'function') {
          docDate = data.date.toDate();
        } else if (data.date.seconds) {
          docDate = new Date(data.date.seconds * 1000);
        } else if (data.date._seconds) {
          docDate = new Date(data.date._seconds * 1000);
        }
      }
      
      // فلترة حسب التاريخ
      if (docDate) {
        if (docDate < startDate || docDate > endDate) {
          continue;
        }
      }
      
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
      const dateKey = docDate ? 
        docDate.toISOString().split('T')[0] : 
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
