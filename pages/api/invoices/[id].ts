import type { NextApiRequest, NextApiResponse } from 'next';
import { InvoiceService } from '../../../lib/services/invoice.service';
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

  // Optional: Verify admin token for all operations on a specific invoice
  // const token = req.headers.authorization?.split('Bearer ')[1];
  // if (!token) return res.status(401).json({ error: 'Unauthorized' });
  // try {
  //   await verifyAdminToken(token);
  // } catch (error: any) {
  //   return res.status(403).json({ error: 'Forbidden: ' + error.message });
  // }

  if (req.method === 'GET') {
    try {
      const invoice = await InvoiceService.getById(id);
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
        await InvoiceService.markAsPaid(id);
      } else {
        await InvoiceService.update(id, invoiceData);
      }
      const updatedInvoice = await InvoiceService.getById(id);
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
      await InvoiceService.delete(id);
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