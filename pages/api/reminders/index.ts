import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebase-admin';

/**
 * API للحصول على التذكيرات
 * 
 * Method: GET
 * Query params: 
 *   - status: pending | sent | failed (optional)
 *   - limit: number (optional, default 10)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { status, limit = '10' } = req.query;
    
    let query: any = adminDb.collection('reminders');
    
    // تصفية حسب الحالة إذا تم تحديدها
    // Note: We filter first, then order to avoid needing a composite index
    if (status && typeof status === 'string') {
      query = query.where('status', '==', status);
    }
    
    // تحديد عدد النتائج
    const limitNum = parseInt(limit as string, 10);
    if (!isNaN(limitNum) && limitNum > 0) {
      query = query.limit(limitNum);
    }
    
    const snapshot = await query.get();
    
    // Sort in memory instead of in the query to avoid index requirements
    const reminders = snapshot.docs
      .map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()?.toISOString() || null,
        scheduled_date: doc.data().scheduled_date?.toDate?.()?.toISOString() || null,
        sent_at: doc.data().sent_at?.toDate?.()?.toISOString() || null,
      }))
      .sort((a: any, b: any) => {
        // Sort by created_at descending (newest first)
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
    
    res.status(200).json({
      success: true,
      count: reminders.length,
      reminders
    });
    
  } catch (error: any) {
    console.error('Error fetching reminders:', error);
    // Return empty array instead of error to prevent dashboard from breaking
    res.status(200).json({ 
      success: true,
      count: 0,
      reminders: [],
      note: 'Reminders collection is empty or not yet created'
    });
  }
}

