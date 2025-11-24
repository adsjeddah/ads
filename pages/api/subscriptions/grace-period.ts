import { NextApiRequest, NextApiResponse } from 'next';
import { GracePeriodService } from '../../../lib/services/grace-period.service';
import { verifyAdminToken } from '../../../lib/firebase-admin';

/**
 * API لجلب جميع الاشتراكات في فترة سماح
 * GET: جلب قائمة الاشتراكات في فترة سماح
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // التحقق من صلاحيات الأدمن
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await verifyAdminToken(token);

    // جلب جميع الاشتراكات في فترة سماح
    const subscriptions = await GracePeriodService.getAllGracePeriodSubscriptions();

    return res.status(200).json(subscriptions);

  } catch (error: any) {
    console.error('Error in grace-period API:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}

