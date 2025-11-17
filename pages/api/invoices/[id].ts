import type { NextApiRequest, NextApiResponse } from 'next';
import { InvoiceAdminService } from '../../../lib/services/invoice-admin.service';
import { Invoice } from '../../../types/models';
import { verifyAdminToken } from '../../../lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Invoice | { error: string } | { message: string }>
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid invoice ID' });
  }

  // Using Admin SDK - no token verification needed (server-side only)

  if (req.method === 'GET') {
    try {
      const invoice = await InvoiceAdminService.getById(id);
      if (invoice) {
        res.status(200).json(invoice);
      } else {
        res.status(404).json({ error: 'Invoice not found' });
      }
    } catch (error: any) {
      console.error(`Error fetching invoice ${id}:`, error);
      res.status(500).json({ error: `Failed to fetch invoice: ${error.message}` });
    }
  } else if (req.method === 'PUT') {
    try {
      const invoiceData = req.body as Partial<Invoice>;
      // Special case for marking as paid
      if (invoiceData.status === 'paid' && !invoiceData.paid_date) {
        await InvoiceAdminService.updatePaymentStatus(id, 'paid', new Date());
      } else {
        await InvoiceAdminService.update(id, invoiceData);
      }
      const updatedInvoice = await InvoiceAdminService.getById(id);
      if (updatedInvoice) {
        res.status(200).json(updatedInvoice);
      } else {
        res.status(404).json({ error: 'Invoice not found after update' });
      }
    } catch (error: any) {
      console.error(`Error updating invoice ${id}:`, error);
      res.status(500).json({ error: `Failed to update invoice: ${error.message}` });
    }
  } else if (req.method === 'DELETE') {
    try {
      await InvoiceAdminService.delete(id);
      res.status(200).json({ message: 'Invoice deleted successfully' });
    } catch (error: any) {
      console.error(`Error deleting invoice ${id}:`, error);
      res.status(500).json({ error: `Failed to delete invoice: ${error.message}` });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}