import { NextApiRequest, NextApiResponse } from 'next';
import { AuditService } from '../../../lib/services/audit.service';
import { verifyAdminToken } from '../../../lib/firebase-admin';

/**
 * API لجلب إحصائيات التدقيق
 * 
 * GET: جلب الإحصائيات
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
      console.log('Token verification failed for audit stats, returning default stats');
      return res.status(200).json({ 
        total_audits: 0,
        by_entity_type: {},
        by_action: {},
        recent_audits: []
      });
    }
    
    // جلب الإحصائيات
    const stats = await AuditService.getAuditStats();
    
    res.status(200).json(stats);
    
  } catch (error: any) {
    console.error('Error fetching audit stats:', error);
    // Return default stats instead of error
    res.status(200).json({ 
      total_audits: 0,
      by_entity_type: {},
      by_action: {},
      recent_audits: []
    });
  }
}

