import { NextApiRequest, NextApiResponse } from 'next';
import { RefundService } from '../../../lib/services/refund.service';
import { verifyAdminToken } from '../../../lib/firebase-admin';

/**
 * API لاسترداد محدد
 * 
 * GET: جلب استرداد محدد
 * PATCH: تحديث حالة الاسترداد
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // التحقق من صلاحيات الأدمن
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    await verifyAdminToken(token);
    
    const { id } = req.query;
    
    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid refund ID' });
    }
    
    if (req.method === 'GET') {
      // جلب استرداد محدد
      const refund = await RefundService.getById(id);
      
      if (!refund) {
        return res.status(404).json({ error: 'Refund not found' });
      }
      
      return res.status(200).json(refund);
      
    } else if (req.method === 'PATCH') {
      // تحديث حالة الاسترداد
      const { status, notes } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }
      
      await RefundService.updateStatus(id, status, notes);
      
      return res.status(200).json({
        success: true,
        message: 'Refund status updated'
      });
      
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error: any) {
    console.error('Error in refund API:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

