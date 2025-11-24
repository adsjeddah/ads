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
    // التحقق من صلاحيات الأدمن
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await verifyAdminToken(token);

    // جلب الإحصائيات
    const stats = await GracePeriodService.getGracePeriodStats();

    return res.status(200).json(stats);

  } catch (error: any) {
    console.error('Error in grace-period stats API:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}

