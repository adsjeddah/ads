import type { NextApiRequest, NextApiResponse } from 'next';
import { InvoiceService } from '../../../lib/services/invoice.service';
import { Invoice } from '../../../types/models';
import { verifyAdminToken } from '../../../lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Invoice[] | Invoice | { error: string } | { id: string }>
) {
  // Optional: Verify admin token for all invoice operations
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
      let invoices: Invoice[];

      if (typeof subscriptionId === 'string') {
        invoices = await InvoiceService.getBySubscriptionId(subscriptionId);
      } else {
        invoices = await InvoiceService.getAll();
      }
      res.status(200).json(invoices);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({ error: 'Failed to fetch invoices: ' + error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const invoiceData = req.body as Omit<Invoice, 'id' | 'created_at' | 'invoice_number'>;
      if (!invoiceData.subscription_id || !invoiceData.amount || !invoiceData.issued_date) {
        return res.status(400).json({ error: 'Subscription ID, amount, and issued date are required' });
      }
      
      const invoice_number = await InvoiceService.generateInvoiceNumber();
      const fullInvoiceData = { ...invoiceData, invoice_number };
      
      const newInvoiceId = await InvoiceService.create(fullInvoiceData as Omit<Invoice, 'id' | 'created_at'>);
      res.status(201).json({ id: newInvoiceId });
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      res.status(500).json({ error: 'Failed to create invoice: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}