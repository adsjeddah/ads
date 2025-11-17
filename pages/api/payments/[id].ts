import type { NextApiRequest, NextApiResponse } from 'next';
import { PaymentAdminService } from '../../../lib/services/payment-admin.service';
import { Payment } from '../../../types/models';
import { verifyAdminToken } from '../../../lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Payment | { error: string } | { message: string }>
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid payment ID' });
  }

  // Using Admin SDK - no token verification needed (server-side only)

  if (req.method === 'GET') {
    try {
      const payment = await PaymentAdminService.getById(id);
      if (payment) {
        res.status(200).json(payment);
      } else {
        res.status(404).json({ error: 'Payment not found' });
      }
    } catch (error: any) {
      console.error(`Error fetching payment ${id}:`, error);
      res.status(500).json({ error: `Failed to fetch payment: ${error.message}` });
    }
  } else if (req.method === 'PUT') {
    try {
      const paymentData = req.body as Partial<Payment>;
      await PaymentAdminService.update(id, paymentData);
      const updatedPayment = await PaymentAdminService.getById(id);
      if (updatedPayment) {
        res.status(200).json(updatedPayment);
      } else {
        res.status(404).json({ error: 'Payment not found after update' });
      }
    } catch (error: any) {
      console.error(`Error updating payment ${id}:`, error);
      res.status(500).json({ error: `Failed to update payment: ${error.message}` });
    }
  } else if (req.method === 'DELETE') {
    try {
      await PaymentAdminService.delete(id);
      res.status(200).json({ message: 'Payment deleted successfully' });
    } catch (error: any) {
      console.error(`Error deleting payment ${id}:`, error);
      res.status(500).json({ error: `Failed to delete payment: ${error.message}` });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}