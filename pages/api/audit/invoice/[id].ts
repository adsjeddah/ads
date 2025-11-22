import { NextApiRequest, NextApiResponse } from 'next';
import { AuditService } from '../../../../lib/services/audit.service';
import { verifyAdminToken } from '../../../../lib/firebase-admin';

/**
 * API لجلب سجل التدقيق لفاتورة معينة
 * 
 * GET: جلب سجل التدقيق
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
      return res.status(400).json({ error: 'Invalid invoice ID' });
    }
    
    // جلب سجل التدقيق
    const auditLog = await AuditService.getInvoiceAuditLog(id);
    
    res.status(200).json(auditLog);
    
  } catch (error: any) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

