import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb, verifyAdminToken } from '../../../lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

const SAUDI_OFFSET_HOURS = 3;

/**
 * API لاختبار تسجيل إحصائية يدوياً
 * POST /api/admin/test-record
 * Body: { advertiser_id: string, type: 'view' | 'click' | 'call' }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    await verifyAdminToken(token);
    
    const { advertiser_id, type = 'view' } = req.body;
    
    if (!advertiser_id) {
      return res.status(400).json({ error: 'advertiser_id is required' });
    }
    
    // حساب التاريخ بنفس طريقة statistics-admin.service.ts
    const now = new Date();
    const SAUDI_OFFSET = SAUDI_OFFSET_HOURS * 60 * 60 * 1000;
    const saudiTime = new Date(now.getTime() + SAUDI_OFFSET);
    
    const saudiYear = saudiTime.getUTCFullYear();
    const saudiMonth = saudiTime.getUTCMonth();
    const saudiDay = saudiTime.getUTCDate();
    
    // بداية اليوم السعودي بـ UTC
    const todayStartUTC = new Date(Date.UTC(saudiYear, saudiMonth, saudiDay, 0, 0, 0, 0) - SAUDI_OFFSET);
    const todayTimestamp = Timestamp.fromDate(todayStartUTC);
    
    // البحث عن سجل موجود لهذا اليوم
    const statsRef = adminDb.collection('statistics');
    const snapshot = await statsRef
      .where('advertiser_id', '==', advertiser_id)
      .where('date', '==', todayTimestamp)
      .get();
    
    let docId: string;
    let action: string;
    
    if (snapshot.empty) {
      // إنشاء سجل جديد
      const newDoc = await statsRef.add({
        advertiser_id,
        date: todayTimestamp,
        views: type === 'view' ? 1 : 0,
        clicks: type === 'click' ? 1 : 0,
        calls: type === 'call' ? 1 : 0,
        click_details: [],
        call_details: [],
        created_at: Timestamp.now()
      });
      docId = newDoc.id;
      action = 'created';
    } else {
      // تحديث السجل الموجود
      const docRef = snapshot.docs[0].ref;
      docId = docRef.id;
      
      const updateField = type === 'view' ? 'views' : type === 'click' ? 'clicks' : 'calls';
      await docRef.update({
        [updateField]: FieldValue.increment(1),
        updated_at: Timestamp.now()
      });
      action = 'updated';
    }
    
    // جلب السجل المحدث
    const updatedDoc = await statsRef.doc(docId).get();
    const data = updatedDoc.data();
    
    return res.status(200).json({
      success: true,
      action,
      document_id: docId,
      recorded_date: {
        timestamp: todayTimestamp.toDate().toISOString(),
        seconds: todayTimestamp.seconds,
        saudi_date: `${saudiYear}-${String(saudiMonth + 1).padStart(2, '0')}-${String(saudiDay).padStart(2, '0')}`
      },
      current_stats: {
        views: data?.views || 0,
        clicks: data?.clicks || 0,
        calls: data?.calls || 0
      },
      debug: {
        server_utc: now.toISOString(),
        saudi_time: saudiTime.toISOString(),
        today_start_utc: todayStartUTC.toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('Error in test record:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

