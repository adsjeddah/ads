import type { NextApiRequest, NextApiResponse } from 'next';
import { SubscriptionStatusService } from '../../../../lib/services/subscription-status.service';
import { verifyAdminToken } from '../../../../lib/firebase-admin';
import { SubscriptionStatusHistory } from '../../../../types/models';

/**
 * API للحصول على تاريخ حالات الاشتراك
 * GET /api/subscriptions/[id]/status-history
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubscriptionStatusHistory[] | { error: string }>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // التحقق من صلاحيات الأدمن
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    await verifyAdminToken(token);
    
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid subscription ID' });
    }
    
    // الحصول على تاريخ الحالات
    const history = await SubscriptionStatusService.getStatusHistory(id);
    
    return res.status(200).json(history);
    
  } catch (error: any) {
    console.error('Error getting status history:', error);
    return res.status(500).json({
      error: 'Failed to get status history: ' + error.message
    });
  }
}










