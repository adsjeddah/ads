import type { NextApiRequest, NextApiResponse } from 'next';
import { FinancialService } from '../../../../lib/services/financial.service';

/**
 * API للحصول على الملخص المالي لمعلن محدد
 * GET /api/financial/advertiser-summary/:id
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
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Advertiser ID is required' });
    }

    // استخدام FinancialService للحصول على الملخص المالي
    const summary = await FinancialService.getAdvertiserFinancialSummary(id);

    return res.status(200).json(summary);
  } catch (error: any) {
    console.error('Error fetching advertiser financial summary:', error);
    return res.status(500).json({
      error: 'Failed to fetch financial summary',
      details: error.message
    });
  }
}






