import type { NextApiRequest, NextApiResponse } from 'next';
import { InvoiceAdminService } from '../../../lib/services/invoice-admin.service';
import { Invoice } from '../../../types/models';
import { verifyAdminToken } from '../../../lib/firebase-admin';

// Helper to generate invoice number (will move to AdminService later)
async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}-${randomNum}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Invoice[] | Invoice | { error: string } | { id: string }>
) {
  // Using Admin SDK - no token verification needed (server-side only)

  if (req.method === 'GET') {
    try {
      const { subscriptionId } = req.query;
      let invoices: Invoice[];

      if (typeof subscriptionId === 'string') {
        invoices = await InvoiceAdminService.getBySubscriptionId(subscriptionId);
      } else {
        invoices = await InvoiceAdminService.getAll();
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
      
      const invoice_number = await generateInvoiceNumber();
      const fullInvoiceData = { ...invoiceData, invoice_number };
      
      const newInvoiceId = await InvoiceAdminService.create(fullInvoiceData as Omit<Invoice, 'id' | 'created_at'>);
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