import { NextApiRequest, NextApiResponse } from 'next';
import { NotificationService } from '../../../lib/services/notification.service';
import { verifyAdminToken } from '../../../lib/firebase-admin';

/**
 * API لمعالجة جميع التذكيرات المعلقة
 * 
 * Method: POST
 * Requires: Admin authentication
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // التحقق من صلاحيات الأدمن
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    await verifyAdminToken(token);
    
    // معالجة التذكيرات
    const result = await NotificationService.processPendingReminders();
    
    res.status(200).json({
      success: true,
      ...result
    });
    
  } catch (error: any) {
    console.error('Error processing reminders:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

