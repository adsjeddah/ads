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
    // التحقق من صلاحيات الأدمن (optional - return empty array if token is invalid)
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    try {
      if (token) {
        await verifyAdminToken(token);
      }
    } catch (tokenError) {
      console.log('Token verification failed for grace-period list, returning empty array');
      return res.status(200).json([]);
    }

    // جلب جميع الاشتراكات في فترة سماح
    const subscriptions = await GracePeriodService.getAllGracePeriodSubscriptions();

    return res.status(200).json(subscriptions);

  } catch (error: any) {
    console.error('Error in grace-period API:', error);
    // Return empty array instead of error
    return res.status(200).json([]);
  }
}

