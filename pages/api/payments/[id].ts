import type { NextApiRequest, NextApiResponse } from 'next';
import { PaymentService } from '../../../lib/services/payment.service';
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

  // Optional: Verify admin token for all operations on a specific payment
  // const token = req.headers.authorization?.split('Bearer ')[1];
  // if (!token) return res.status(401).json({ error: 'Unauthorized' });
  // try {
  //   await verifyAdminToken(token);
  // } catch (error: any) {
  //   return res.status(403).json({ error: 'Forbidden: ' + error.message });
  // }

  if (req.method === 'GET') {
    try {
      const payment = await PaymentService.getById(id);
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
      await PaymentService.update(id, paymentData);
      const updatedPayment = await PaymentService.getById(id);
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
      await PaymentService.delete(id);
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