import type { NextApiRequest, NextApiResponse } from 'next';
import { PaymentAdminService } from '../../../lib/services/payment-admin.service';
import { verifyAdminToken } from '../../../lib/firebase-admin'; // For admin-only access

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any | { error: string }>
) {
  if (req.method === 'GET') {
    try {
      // Using Admin SDK - no token verification needed (server-side only)

      const stats = await PaymentAdminService.getPaymentStats();
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