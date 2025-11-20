import type { NextApiRequest, NextApiResponse } from 'next';
import { FinancialService } from '../../../lib/services/financial.service';

/**
 * API لإلغاء اشتراك
 * POST /api/financial/cancel-subscription
 * 
 * يقوم بـ:
 * - تغيير حالة الاشتراك إلى "cancelled"
 * - إلغاء الفواتير غير المدفوعة المرتبطة
 * - حساب مبلغ الاسترداد بناءً على الأيام المتبقية
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
    const { subscription_id, reason } = req.body;

    if (!subscription_id) {
      return res.status(400).json({
        error: 'Missing required field: subscription_id'
      });
    }

    // إلغاء الاشتراك
    const result = await FinancialService.cancelSubscription(
      subscription_id,
      reason
    );

    return res.status(200).json({
      success: true,
      message: result.message,
      refund_amount: result.refund_amount
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    return res.status(500).json({
      error: 'Failed to cancel subscription',
      details: error.message
    });
  }
}

