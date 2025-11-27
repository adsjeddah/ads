import type { NextApiRequest, NextApiResponse } from 'next';
import { SubscriptionStatusService } from '../../../../lib/services/subscription-status.service';
import { verifyAdminToken } from '../../../../lib/firebase-admin';

/**
 * API لإيقاف اشتراك مؤقتاً
 * POST /api/subscriptions/[id]/pause
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // التحقق من صلاحيات الأدمن
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const decodedToken = await verifyAdminToken(token);
    const userId = decodedToken.uid;
    
    const { id } = req.query;
    const { reason } = req.body;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid subscription ID' });
    }
    
    // الحصول على IP Address
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                      req.socket.remoteAddress || 
                      'unknown';
    
    // إيقاف الاشتراك مؤقتاً
    const result = await SubscriptionStatusService.pauseSubscription({
      subscription_id: id,
      reason,
      paused_by: userId,
      ip_address: ipAddress
    });
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.message
      });
    }
    
  } catch (error: any) {
    console.error('Error in pause API:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to pause subscription: ' + error.message
    });
  }
}














