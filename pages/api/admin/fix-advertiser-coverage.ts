import type { NextApiRequest, NextApiResponse } from 'next';
import { FinancialService } from '../../../lib/services/financial.service';
import { AdvertiserAdminService } from '../../../lib/services/advertiser-admin.service';
import { verifyAdminToken } from '../../../lib/firebase-admin';

/**
 * 🔧 API لإصلاح coverage_type لجميع المعلنين بناءً على اشتراكاتهم النشطة
 * 
 * يستخدم هذا الـ endpoint لإصلاح المعلنين الموجودين الذين قد تكون لديهم
 * قيمة coverage_type خاطئة لا تعكس اشتراكاتهم الفعلية.
 * 
 * POST /api/admin/fix-advertiser-coverage
 * - لإصلاح معلن واحد: { advertiser_id: "..." }
 * - لإصلاح جميع المعلنين: { fix_all: true }
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
    // 1. التحقق من صلاحيات الأدمن
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    
    await verifyAdminToken(token);
    
    const { advertiser_id, fix_all } = req.body;
    
    // 2. إصلاح معلن واحد
    if (advertiser_id && !fix_all) {
      console.log(`🔧 إصلاح coverage_type للمعلن: ${advertiser_id}`);
      
      const result = await FinancialService.updateAdvertiserCoverageFromSubscriptions(advertiser_id);
      
      return res.status(200).json({
        success: true,
        message: result.updated 
          ? `تم تحديث coverage_type إلى ${result.new_coverage_type}`
          : 'لا يوجد اشتراكات نشطة للتحديث',
        data: result
      });
    }
    
    // 3. إصلاح جميع المعلنين
    if (fix_all) {
      console.log('🔧 إصلاح coverage_type لجميع المعلنين...');
      
      const advertisers = await AdvertiserAdminService.getAll('active');
      const results: any[] = [];
      let updatedCount = 0;
      let errorCount = 0;
      
      for (const advertiser of advertisers) {
        if (!advertiser.id) continue;
        
        try {
          const result = await FinancialService.updateAdvertiserCoverageFromSubscriptions(advertiser.id);
          
          if (result.updated) {
            updatedCount++;
            results.push({
              advertiser_id: advertiser.id,
              company_name: advertiser.company_name,
              new_coverage_type: result.new_coverage_type,
              coverage_cities: result.coverage_cities,
              status: 'updated'
            });
          } else {
            results.push({
              advertiser_id: advertiser.id,
              company_name: advertiser.company_name,
              status: 'no_active_subscriptions'
            });
          }
        } catch (error: any) {
          errorCount++;
          results.push({
            advertiser_id: advertiser.id,
            company_name: advertiser.company_name,
            status: 'error',
            error: error.message
          });
        }
      }
      
      return res.status(200).json({
        success: true,
        message: `تم فحص ${advertisers.length} معلن، تحديث ${updatedCount}، أخطاء ${errorCount}`,
        summary: {
          total_checked: advertisers.length,
          updated: updatedCount,
          errors: errorCount
        },
        details: results
      });
    }
    
    return res.status(400).json({
      error: 'يرجى تحديد advertiser_id أو fix_all: true'
    });
    
  } catch (error: any) {
    console.error('❌ خطأ في إصلاح coverage_type:', error);
    
    if (error.message?.includes('Unauthorized') || error.message?.includes('admin')) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    
    return res.status(500).json({
      error: 'Failed to fix coverage types',
      details: error.message
    });
  }
}

