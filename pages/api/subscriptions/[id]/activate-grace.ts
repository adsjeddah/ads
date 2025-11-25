import { NextApiRequest, NextApiResponse } from 'next';
import { GracePeriodService } from '../../../../lib/services/grace-period.service';
import { verifyAdminToken } from '../../../../lib/firebase-admin';

/**
 * API لتفعيل فترة سماح
 * POST: تفعيل فترة سماح جديدة (يدوي من الأدمن فقط)
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

    const decodedToken = await verifyAdminToken(token);
    const adminUid = decodedToken.uid;

    const { id } = req.query;
    const { days = 3, reason } = req.body;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid subscription ID' });
    }

    // التحقق من صحة عدد الأيام
    if (typeof days !== 'number' || days < 1 || days > 30) {
      return res.status(400).json({ error: 'عدد الأيام يجب أن يكون بين 1 و 30' });
    }

    // تفعيل فترة السماح
    const result = await GracePeriodService.activateGracePeriod(
      id,
      adminUid,
      days,
      reason
    );

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    });

  } catch (error: any) {
    console.error('Error in activate-grace API:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}


