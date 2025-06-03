import type { NextApiRequest, NextApiResponse } from 'next';
import { PaymentService } from '../../../lib/services/payment.service';
import { Payment } from '../../../types/models';
import { verifyAdminToken } from '../../../lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Payment[] | Payment | { error: string } | { id: string }>
) {
  // Optional: Verify admin token for all payment operations
  // const token = req.headers.authorization?.split('Bearer ')[1];
  // if (!token) return res.status(401).json({ error: 'Unauthorized' });
  // try {
  //   await verifyAdminToken(token);
  // } catch (error: any) {
  //   return res.status(403).json({ error: 'Forbidden: ' + error.message });
  // }

  if (req.method === 'GET') {
    try {
      const { subscriptionId } = req.query;
      let payments: Payment[];

      if (typeof subscriptionId === 'string') {
        payments = await PaymentService.getBySubscriptionId(subscriptionId);
      } else {
        payments = await PaymentService.getAll();
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
      const newPaymentId = await PaymentService.create(paymentData);
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