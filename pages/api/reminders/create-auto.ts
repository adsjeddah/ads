import { NextApiRequest, NextApiResponse } from 'next';
import { ReminderService } from '../../../lib/services/reminder.service';
import { verifyAdminToken } from '../../../lib/firebase-admin';

/**
 * API لإنشاء التذكيرات التلقائية
 * 
 * Method: POST
 * Body: { type: 'due_soon' | 'overdue' | 'subscription_expiring' }
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
    
    const { type } = req.body;
    let count = 0;
    
    switch (type) {
      case 'due_soon':
        count = await ReminderService.createDueSoonReminders();
        break;
      case 'overdue':
        count = await ReminderService.createOverdueReminders();
        break;
      case 'subscription_expiring':
        count = await ReminderService.createSubscriptionExpiringReminders();
        break;
      default:
        return res.status(400).json({ error: 'Invalid type' });
    }
    
    res.status(200).json({
      success: true,
      type,
      created_count: count
    });
    
  } catch (error: any) {
    console.error('Error creating reminders:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

