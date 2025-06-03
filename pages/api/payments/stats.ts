import type { NextApiRequest, NextApiResponse } from 'next';
import { PaymentService } from '../../../lib/services/payment.service';
import { verifyAdminToken } from '../../../lib/firebase-admin'; // For admin-only access

interface PaymentStats {
  totalAmount: number;
  paymentCount: number;
  averagePayment: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PaymentStats | { error: string }>
) {
  if (req.method === 'GET') {
    try {
      // Optional: Verify admin token
      // const token = req.headers.authorization?.split('Bearer ')[1];
      // if (!token) return res.status(401).json({ error: 'Unauthorized' });
      // await verifyAdminToken(token);

      const { startDate, endDate } = req.query;
      const stats = await PaymentService.getPaymentStatistics(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.status(200).json(stats);
    } catch (error: any) {
      console.error('Error fetching payment statistics:', error);
      res.status(500).json({ error: 'Failed to fetch payment statistics: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}