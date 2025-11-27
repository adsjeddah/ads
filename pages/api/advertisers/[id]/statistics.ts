import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminToken } from '../../../../lib/firebase-admin';
import { adminDb } from '../../../../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

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

    try {
      await verifyAdminToken(token);
    } catch (authError: any) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Invalid token', details: authError.message });
    }

    const { id } = req.query;
    const days = parseInt(req.query.days as string) || 30;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Advertiser ID is required' });
    }

    // التحقق من وجود المعلن أولاً
    const advertiserDoc = await adminDb.collection('advertisers').doc(id).get();
    if (!advertiserDoc.exists) {
      return res.status(404).json({ error: 'Advertiser not found' });
    }

    // حساب تاريخ البداية (بدون استيراد date utils لتجنب الأخطاء)
    const now = new Date();
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
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
              seconds: call.timestamp.seconds || call.timestamp._seconds || 0,
              nanoseconds: call.timestamp.nanoseconds || call.timestamp._nanoseconds || 0
            } : null
          }));
        }
        
        // تحويل click_details timestamps
        if (data.click_details && Array.isArray(data.click_details)) {
          data.click_details = data.click_details.map((click: any) => ({
            ...click,
            timestamp: click.timestamp ? {
              seconds: click.timestamp.seconds || click.timestamp._seconds || 0,
              nanoseconds: click.timestamp.nanoseconds || click.timestamp._nanoseconds || 0
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
        if (!statDate) return true; // إذا لم يكن هناك تاريخ، نضيف السجل
        const statSeconds = statDate.seconds || statDate._seconds || 0;
        return statSeconds >= startTimestamp.seconds;
      })
      .sort((a: any, b: any) => {
        // ترتيب تنازلي (الأحدث أولاً)
        const dateA = a.date?.seconds || a.date?._seconds || 0;
        const dateB = b.date?.seconds || b.date?._seconds || 0;
        return dateB - dateA;
      });

    return res.status(200).json(statistics);
  } catch (error: any) {
    console.error('Error fetching statistics:', error);
    return res.status(500).json({
      error: 'Failed to fetch statistics',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

