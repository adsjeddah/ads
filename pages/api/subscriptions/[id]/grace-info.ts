import { NextApiRequest, NextApiResponse } from 'next';
import { GracePeriodService } from '../../../../lib/services/grace-period.service';
import { verifyAdminToken } from '../../../../lib/firebase-admin';

/**
 * API للحصول على معلومات فترة السماح
 * GET: جلب معلومات فترة السماح لاشتراك محدد
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

    const { id } = req.query;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid subscription ID' });
    }

    // الحصول على معلومات فترة السماح
    const info = await GracePeriodService.getGracePeriodInfo(id);

    if (!info) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    return res.status(200).json(info);

  } catch (error: any) {
    console.error('Error in grace-info API:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}

