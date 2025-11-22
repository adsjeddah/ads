import type { NextApiRequest, NextApiResponse } from 'next';
import { InvoiceAdminService } from '../../../lib/services/invoice-admin.service';
import { Invoice } from '../../../types/models';
import { verifyAdminToken, adminDb } from '../../../lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any | { error: string } | { message: string }>
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid invoice ID' });
  }

  // Using Admin SDK - no token verification needed (server-side only)

  if (req.method === 'GET') {
    try {
      const invoice = await InvoiceAdminService.getById(id);
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // Helper to convert dates to ISO strings for JSON serialization
      const toISOString = (date: any) => {
        if (!date) return null;
        try {
          const dateObj = date instanceof Date ? date : (date.toDate?.() || new Date(date));
          return dateObj.toISOString();
        } catch (error) {
          console.error('Error converting date:', error);
          return new Date().toISOString();
        }
      };

      // Enrich invoice with related data (advertiser, plan, subscription, payments)
      try {
        // Get subscription data
        const subscriptionDoc = await adminDb.collection('subscriptions').doc(invoice.subscription_id).get();
        if (!subscriptionDoc.exists) {
          return res.status(200).json({
            ...invoice,
            company_name: 'غير معروف',
            phone: '-',
            whatsapp: null,
            services: '-',
            plan_name: '-',
            duration_days: 0,
            subscription_total: invoice.amount || 0,
            subscription_paid: 0,
            subscription_remaining: invoice.amount || 0,
            discount_type: null,
            discount_amount: null,
            base_price: invoice.amount || 0,
            payments: [],
            issued_date: toISOString(invoice.issued_date) || new Date().toISOString(),
            due_date: toISOString(invoice.due_date) || new Date().toISOString(),
            paid_date: toISOString(invoice.paid_date),
          });
        }

        const subscription = subscriptionDoc.data();
        
        // Get advertiser data
        let advertiserName = 'غير معروف';
        let advertiserPhone = '-';
        let advertiserWhatsapp = null;
        let advertiserServices = '-';
        if (subscription?.advertiser_id) {
          const advertiserDoc = await adminDb.collection('advertisers').doc(subscription.advertiser_id).get();
          if (advertiserDoc.exists) {
            const advertiser = advertiserDoc.data();
            advertiserName = advertiser?.company_name || 'غير معروف';
            advertiserPhone = advertiser?.phone || '-';
            advertiserWhatsapp = advertiser?.whatsapp || null;
            advertiserServices = advertiser?.services || '-';
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

        // Get payments for this subscription (no orderBy to avoid index requirement)
        const paymentsSnapshot = await adminDb.collection('payments')
          .where('subscription_id', '==', invoice.subscription_id)
          .get();
        
        const payments = paymentsSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            payment_date: doc.data().payment_date ? (doc.data().payment_date as any).toDate?.() || doc.data().payment_date : new Date(),
          }))
          .sort((a, b) => {
            // Sort in memory by payment_date descending
            const dateA = new Date(a.payment_date).getTime();
            const dateB = new Date(b.payment_date).getTime();
            return dateB - dateA;
          });

        // Calculate duration in days
        const startDate = subscription?.start_date ? (subscription.start_date as any).toDate?.() || new Date(subscription.start_date) : new Date();
        const endDate = subscription?.end_date ? (subscription.end_date as any).toDate?.() || new Date(subscription.end_date) : new Date();
        const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        const enrichedInvoice = {
          ...invoice,
          company_name: advertiserName,
          phone: advertiserPhone,
          whatsapp: advertiserWhatsapp,
          services: advertiserServices,
          plan_name: planName,
          duration_days: durationDays > 0 ? durationDays : 0,
          subscription_total: subscription?.total_amount || invoice.amount || 0,
          subscription_paid: subscription?.paid_amount || 0,
          subscription_remaining: subscription?.remaining_amount || invoice.amount || 0,
          discount_type: subscription?.discount_type || null,
          discount_amount: subscription?.discount_amount || null,
          base_price: subscription?.base_price || subscription?.total_amount || invoice.amount || 0,
          payments: payments.map(p => ({
            ...p,
            payment_date: toISOString(p.payment_date),
          })),
          issued_date: toISOString(invoice.issued_date),
          due_date: toISOString(invoice.due_date),
          paid_date: invoice.paid_date ? toISOString(invoice.paid_date) : null,
        };

        res.status(200).json(enrichedInvoice);
      } catch (enrichError: any) {
        console.error('Error enriching invoice:', enrichError);
        // Return basic invoice if enrichment fails
        res.status(200).json({
          ...invoice,
          company_name: 'خطأ في التحميل',
          phone: '-',
          plan_name: '-',
          subscription_total: invoice.amount || 0,
          subscription_paid: 0,
          subscription_remaining: invoice.amount || 0,
          payments: [],
        });
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