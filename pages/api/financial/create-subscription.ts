import type { NextApiRequest, NextApiResponse } from 'next';
import { FinancialService } from '../../../lib/services/financial.service';

/**
 * API لإنشاء اشتراك جديد مع فاتورة تلقائياً
 * POST /api/financial/create-subscription
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
    const {
      advertiser_id,
      plan_id,
      start_date,
      discount_type,
      discount_amount,
      initial_payment,
      payment_method,
      notes
    } = req.body;

    // التحقق من المدخلات المطلوبة
    if (!advertiser_id || !plan_id || !start_date) {
      return res.status(400).json({
        error: 'Missing required fields: advertiser_id, plan_id, start_date'
      });
    }

    // إنشاء الاشتراك مع الفاتورة
    const result = await FinancialService.createSubscriptionWithInvoice({
      advertiser_id,
      plan_id,
      start_date: new Date(start_date),
      discount_type: discount_type || 'amount',
      discount_amount: discount_amount || 0,
      initial_payment: initial_payment || 0,
      payment_method: payment_method || 'cash',
      notes: notes || ''
    });

    return res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    return res.status(500).json({
      error: 'Failed to create subscription',
      details: error.message
    });
  }
}

