import type { NextApiRequest, NextApiResponse } from 'next';
import { FinancialService } from '../../../lib/services/financial.service';

/**
 * API لتسجيل دفعة جديدة
 * POST /api/financial/record-payment
 * 
 * يقوم تلقائياً بـ:
 * - تحديث حالة الاشتراك (paid_amount, remaining_amount, payment_status)
 * - تحديث حالة الفاتورة (status, paid_date)
 * - إنشاء سجل الدفعة في قاعدة البيانات
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
      subscription_id,
      invoice_id,
      amount,
      payment_date,
      payment_method,
      transaction_id,
      notes
    } = req.body;

    // التحقق من المدخلات المطلوبة
    if (!subscription_id || !amount) {
      return res.status(400).json({
        error: 'Missing required fields: subscription_id, amount'
      });
    }

    // التحقق من صحة المبلغ
    if (amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be greater than zero'
      });
    }

    // تسجيل الدفعة
    const paymentId = await FinancialService.recordPayment({
      subscription_id,
      invoice_id,
      amount: parseFloat(amount),
      payment_date: payment_date ? new Date(payment_date) : new Date(),
      payment_method: payment_method || 'cash',
      transaction_id,
      notes
    });

    return res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      payment_id: paymentId
    });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return res.status(500).json({
      error: 'Failed to record payment',
      details: error.message
    });
  }
}

