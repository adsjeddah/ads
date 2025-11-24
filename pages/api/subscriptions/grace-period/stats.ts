import { NextApiRequest, NextApiResponse } from 'next';
import { GracePeriodService } from '../../../../lib/services/grace-period.service';
import { verifyAdminToken } from '../../../../lib/firebase-admin';

/**
 * API لإحصائيات فترات السماح
 * GET: جلب إحصائيات فترات السماح
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // التحقق من صلاحيات الأدمن (optional - return default stats if token is invalid)
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    try {
      if (token) {
        await verifyAdminToken(token);
      }
    } catch (tokenError) {
      console.log('Token verification failed for grace-period stats, returning default stats');
      return res.status(200).json({ 
        total: 0,
        expiring_soon: 0,
        by_extensions: {},
        subscriptions: []
      });
    }

    // جلب الإحصائيات
    const stats = await GracePeriodService.getGracePeriodStats();

    return res.status(200).json(stats);

  } catch (error: any) {
    console.error('Error in grace-period stats API:', error);
    // Return default stats instead of error
    return res.status(200).json({ 
      total: 0,
      expiring_soon: 0,
      by_extensions: {},
      subscriptions: []
    });
  }
}

