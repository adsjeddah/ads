import { NextApiRequest, NextApiResponse } from 'next';
import { RefundService } from '../../../lib/services/refund.service';
import { verifyAdminToken } from '../../../lib/firebase-admin';

/**
 * API للاستردادات
 * 
 * GET: جلب جميع الاستردادات
 * POST: إنشاء طلب استرداد جديد
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // التحقق من صلاحيات الأدمن (optional for GET)
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (req.method === 'GET') {
      // For GET requests, allow without token but return empty array if token is invalid
      try {
        if (token) {
          await verifyAdminToken(token);
        }
      } catch (tokenError) {
        console.log('Token verification failed for refunds GET, returning empty array');
        return res.status(200).json([]);
      }
      
      // جلب جميع الاستردادات أو حسب الحالة
      const { status } = req.query;
      
      let refunds;
      if (status === 'pending') {
        refunds = await RefundService.getPendingRefunds();
      } else {
        refunds = await RefundService.getAll();
      }
      
      return res.status(200).json(refunds);
      
    } else if (req.method === 'POST') {
      // POST requires valid token
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      await verifyAdminToken(token);
      
      // إنشاء طلب استرداد جديد
      const refundData = req.body;
      
      // التحقق من المدخلات
      if (!refundData.subscription_id || !refundData.refund_amount || !refundData.refund_reason) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const refundId = await RefundService.create(refundData);
      
      return res.status(201).json({
        success: true,
        refund_id: refundId
      });
      
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error: any) {
    console.error('Error in refunds API:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

