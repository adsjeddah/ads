import type { NextApiRequest, NextApiResponse } from 'next';
import { InvoiceAdminService } from '../../../lib/services/invoice-admin.service';
import { Invoice } from '../../../types/models';
import { verifyAdminToken, adminDb } from '../../../lib/firebase-admin';

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
  res: NextApiResponse<any[] | Invoice | { error: string } | { id: string }>
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
      
      // Enrich invoices with related data (advertiser, plan, subscription)
      const enrichedInvoices = await Promise.all(
        invoices.map(async (invoice) => {
          try {
            // Get subscription data
            const subscriptionDoc = await adminDb.collection('subscriptions').doc(invoice.subscription_id).get();
            if (!subscriptionDoc.exists) {
              return { ...invoice, company_name: 'غير معروف', phone: '-', plan_name: '-', subscription_total: invoice.amount, subscription_paid: 0, subscription_remaining: invoice.amount };
            }
            
            const subscription = subscriptionDoc.data();
            
            // Get advertiser data
            let advertiserName = 'غير معروف';
            let advertiserPhone = '-';
            if (subscription?.advertiser_id) {
              const advertiserDoc = await adminDb.collection('advertisers').doc(subscription.advertiser_id).get();
              if (advertiserDoc.exists) {
                const advertiser = advertiserDoc.data();
                advertiserName = advertiser?.company_name || 'غير معروف';
                advertiserPhone = advertiser?.phone || '-';
              }
            }
            
            // Get plan data
            let planName = '-';
            if (subscription?.plan_id) {
              const planDoc = await adminDb.collection('plans').doc(subscription.plan_id).get();
              if (planDoc.exists) {
                planName = planDoc.data()?.name || '-';
              }
            }
            
            return {
              ...invoice,
              company_name: advertiserName,
              phone: advertiserPhone,
              plan_name: planName,
              subscription_total: subscription?.total_amount || invoice.amount,
              subscription_paid: subscription?.paid_amount || 0,
              subscription_remaining: subscription?.remaining_amount || invoice.amount,
              issued_date: invoice.issued_date ? (invoice.issued_date as any).toDate?.() || invoice.issued_date : new Date(),
              due_date: invoice.due_date ? (invoice.due_date as any).toDate?.() || invoice.due_date : new Date(),
              paid_date: invoice.paid_date ? (invoice.paid_date as any).toDate?.() || invoice.paid_date : null,
            };
          } catch (err) {
            console.error('Error enriching invoice:', err);
            return { ...invoice, company_name: 'خطأ', phone: '-', plan_name: '-', subscription_total: invoice.amount, subscription_paid: 0, subscription_remaining: invoice.amount };
          }
        })
      );
      
      res.status(200).json(enrichedInvoices);
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