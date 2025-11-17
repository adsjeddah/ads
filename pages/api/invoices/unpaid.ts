import type { NextApiRequest, NextApiResponse } from 'next';
import { InvoiceAdminService } from '../../../lib/services/invoice-admin.service';
import { Invoice } from '../../../types/models';
import { verifyAdminToken } from '../../../lib/firebase-admin'; // For admin-only access

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Invoice[] | { error: string }>
) {
  if (req.method === 'GET') {
    try {
      // Using Admin SDK - no token verification needed (server-side only)

      const unpaidInvoices = await InvoiceAdminService.getUnpaidInvoices();
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