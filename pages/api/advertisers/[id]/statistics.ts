import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminToken } from '../../../../lib/firebase-admin';
import { adminDb } from '../../../../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { getSaudiNow, addDays } from '../../../../lib/utils/date';

/**
 * API لجلب إحصائيات المعلن مع التفاصيل الكاملة
 * GET /api/advertisers/[id]/statistics?days=30
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
    // التحقق من صلاحيات الأدمن
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await verifyAdminToken(token);

    const { id } = req.query;
    const days = parseInt(req.query.days as string) || 30;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Advertiser ID is required' });
    }

    // حساب تاريخ البداية
    const now = getSaudiNow();
    const startDate = addDays(now, -days);
    const startTimestamp = Timestamp.fromDate(startDate);

    // جلب الإحصائيات (استعلام بسيط بدون composite index)
    const statsSnapshot = await adminDb
      .collection('statistics')
      .where('advertiser_id', '==', id)
      .get();

    // فلترة وترتيب النتائج في الذاكرة
    const statistics = statsSnapshot.docs
      .map(doc => {
        const data = doc.data();
        
        // تحويل call_details timestamps إلى صيغة قابلة للقراءة
        if (data.call_details && Array.isArray(data.call_details)) {
          data.call_details = data.call_details.map((call: any) => ({
            ...call,
            // تحويل Firestore Timestamp إلى object بسيط
            timestamp: call.timestamp ? {
              seconds: call.timestamp.seconds || call.timestamp._seconds,
              nanoseconds: call.timestamp.nanoseconds || call.timestamp._nanoseconds
            } : null
          }));
        }
        
        return {
          id: doc.id,
          ...data
        };
      })
      .filter((stat: any) => {
        // فلترة حسب التاريخ
        const statDate = stat.date;
        if (!statDate || !statDate.seconds) return false;
        return statDate.seconds >= startTimestamp.seconds;
      })
      .sort((a: any, b: any) => {
        // ترتيب تنازلي (الأحدث أولاً)
        const dateA = a.date?.seconds || 0;
        const dateB = b.date?.seconds || 0;
        return dateB - dateA;
      });

    return res.status(200).json(statistics);
  } catch (error: any) {
    console.error('Error fetching statistics:', error);
    return res.status(500).json({
      error: 'Failed to fetch statistics',
      details: error.message
    });
  }
}

