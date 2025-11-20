import type { NextApiRequest, NextApiResponse } from 'next';
import { FinancialService } from '../../../lib/services/financial.service';

/**
 * API للحصول على ملخص مالي شامل للمعلن
 * GET /api/financial/advertiser-summary?advertiser_id=xxx
 * 
 * يعرض:
 * - إجمالي الاشتراكات
 * - الاشتراكات النشطة والمنتهية
 * - إجمالي المبلغ المدفوع والمستحق
 * - سجل المدفوعات الكامل
 * - الفواتير غير المدفوعة
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { advertiser_id } = req.query;

    if (!advertiser_id || typeof advertiser_id !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid advertiser_id parameter'
      });
    }

    // جلب الملخص المالي
    const summary = await FinancialService.getAdvertiserFinancialSummary(advertiser_id);

    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error: any) {
    console.error('Error fetching financial summary:', error);
    return res.status(500).json({
      error: 'Failed to fetch financial summary',
      details: error.message
    });
  }
}

