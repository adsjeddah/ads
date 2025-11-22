import type { NextApiRequest, NextApiResponse } from 'next';
import { FinancialService } from '../../../lib/services/financial.service';
import { verifyAdminToken } from '../../../lib/firebase-admin';
import { ModelValidator } from '../../../lib/utils/validation';

/**
 * API لإنشاء اشتراك جديد مع فاتورة تلقائياً (مع دعم VAT)
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
    // 1. التحقق من صلاحيات الأدمن
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const decodedToken = await verifyAdminToken(token);
    const userId = decodedToken.uid;
    
    // 2. استخراج البيانات
    const {
      advertiser_id,
      plan_id,
      start_date,
      discount_type,
      discount_amount,
      initial_payment,
      payment_method,
      notes,
      vat_percentage
    } = req.body;

    // 3. التحقق من المدخلات المطلوبة
    if (!advertiser_id || !plan_id || !start_date) {
      return res.status(400).json({
        error: 'Missing required fields: advertiser_id, plan_id, start_date'
      });
    }
    
    // 4. التحقق من صحة البيانات
    const validation = ModelValidator.validateSubscription(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // 5. الحصول على IP Address
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                      req.socket.remoteAddress || 
                      'unknown';

    // 6. إنشاء الاشتراك مع الفاتورة (مع VAT)
    const result = await FinancialService.createSubscriptionWithInvoice({
      advertiser_id,
      plan_id,
      start_date: new Date(start_date),
      discount_type: discount_type || 'amount',
      discount_amount: discount_amount || 0,
      initial_payment: initial_payment || 0,
      payment_method: payment_method || 'cash',
      notes: notes || '',
      vat_percentage: vat_percentage || 15,
      user_id: userId,
      ip_address: ipAddress
    });

    return res.status(201).json({
      success: true,
      message: 'Subscription created successfully with VAT',
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

