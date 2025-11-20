import type { NextApiRequest, NextApiResponse } from 'next';
import { FinancialService } from '../../../lib/services/financial.service';

/**
 * API لحساب الخصومات
 * POST /api/financial/calculate-discount
 * 
 * يحسب:
 * - قيمة الخصم الفعلية
 * - السعر النهائي بعد الخصم
 * - التحقق من صحة الخصم
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
    const { base_price, discount_type, discount_amount } = req.body;

    // التحقق من المدخلات
    if (base_price == null || !discount_type) {
      return res.status(400).json({
        error: 'Missing required fields: base_price, discount_type'
      });
    }

    // حساب الخصم
    const calculation = FinancialService.calculateDiscount(
      parseFloat(base_price),
      discount_type,
      parseFloat(discount_amount || '0')
    );

    return res.status(200).json({
      success: true,
      data: calculation
    });
  } catch (error: any) {
    console.error('Error calculating discount:', error);
    return res.status(400).json({
      error: 'Failed to calculate discount',
      details: error.message
    });
  }
}

