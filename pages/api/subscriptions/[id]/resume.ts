import type { NextApiRequest, NextApiResponse } from 'next';
import { SubscriptionStatusService } from '../../../../lib/services/subscription-status.service';
import { verifyAdminToken } from '../../../../lib/firebase-admin';

/**
 * API لإعادة تشغيل اشتراك بعد إيقاف مؤقت
 * POST /api/subscriptions/[id]/resume
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
    const { notes } = req.body;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid subscription ID' });
    }
    
    // الحصول على IP Address
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                      req.socket.remoteAddress || 
                      'unknown';
    
    // إعادة تشغيل الاشتراك
    const result = await SubscriptionStatusService.resumeSubscription({
      subscription_id: id,
      resumed_by: userId,
      notes,
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
    console.error('Error in resume API:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to resume subscription: ' + error.message
    });
  }
}





















