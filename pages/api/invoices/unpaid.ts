import type { NextApiRequest, NextApiResponse } from 'next';
import { InvoiceService } from '../../../lib/services/invoice.service';
import { Invoice } from '../../../types/models';
import { verifyAdminToken } from '../../../lib/firebase-admin'; // For admin-only access

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Invoice[] | { error: string }>
) {
  if (req.method === 'GET') {
    try {
      // Optional: Verify admin token
      // const token = req.headers.authorization?.split('Bearer ')[1];
      // if (!token) return res.status(401).json({ error: 'Unauthorized' });
      // await verifyAdminToken(token);

      const unpaidInvoices = await InvoiceService.getUnpaidInvoices();
      res.status(200).json(unpaidInvoices);
    } catch (error: any) {
      console.error('Error fetching unpaid invoices:', error);
      res.status(500).json({ error: 'Failed to fetch unpaid invoices: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}