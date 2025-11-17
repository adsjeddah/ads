import type { NextApiRequest, NextApiResponse } from 'next';
import { PaymentAdminService } from '../../../lib/services/payment-admin.service';
import { Payment } from '../../../types/models';
import { verifyAdminToken } from '../../../lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Payment[] | Payment | { error: string } | { id: string }>
) {
  // Using Admin SDK - no token verification needed (server-side only)

  if (req.method === 'GET') {
    try {
      const { subscriptionId } = req.query;
      let payments: Payment[];

      if (typeof subscriptionId === 'string') {
        payments = await PaymentAdminService.getBySubscriptionId(subscriptionId);
      } else {
        payments = await PaymentAdminService.getAll();
      }
      res.status(200).json(payments);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ error: 'Failed to fetch payments: ' + error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const paymentData = req.body as Omit<Payment, 'id' | 'created_at'>;
      if (!paymentData.subscription_id || paymentData.amount == null || !paymentData.payment_date) {
        return res.status(400).json({ error: 'Subscription ID, amount, and payment date are required' });
      }
      const newPaymentId = await PaymentAdminService.create(paymentData);
      res.status(201).json({ id: newPaymentId });
    } catch (error: any) {
      console.error('Error creating payment:', error);
      res.status(500).json({ error: 'Failed to create payment: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}