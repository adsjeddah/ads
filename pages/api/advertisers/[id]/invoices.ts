import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '../../../../lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid advertiser ID' });
  }

  if (req.method === 'GET') {
    try {
      // First, get all subscriptions for this advertiser
      const subscriptionsSnapshot = await adminDb
        .collection('subscriptions')
        .where('advertiser_id', '==', id)
        .get();

      if (subscriptionsSnapshot.empty) {
        return res.status(200).json([]);
      }

      const subscriptionIds = subscriptionsSnapshot.docs.map(doc => doc.id);

      // Get all invoices for these subscriptions
      const invoicesPromises = subscriptionIds.map(async (subId) => {
        const invoicesSnapshot = await adminDb
          .collection('invoices')
          .where('subscription_id', '==', subId)
          .get();
        
        return invoicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at ? (doc.data().created_at as any).toDate?.() || doc.data().created_at : new Date(),
          issued_date: doc.data().issued_date ? (doc.data().issued_date as any).toDate?.() || doc.data().issued_date : new Date(),
          due_date: doc.data().due_date ? (doc.data().due_date as any).toDate?.() || doc.data().due_date : new Date(),
          paid_date: doc.data().paid_date ? (doc.data().paid_date as any).toDate?.() || doc.data().paid_date : null,
        }));
      });

      const invoicesArrays = await Promise.all(invoicesPromises);
      const invoices = invoicesArrays.flat();

      // Sort by issued_date descending in memory
      invoices.sort((a: any, b: any) => {
        const dateA = new Date(a.issued_date).getTime();
        const dateB = new Date(b.issued_date).getTime();
        return dateB - dateA;
      });

      res.status(200).json(invoices);
    } catch (error: any) {
      console.error(`Error fetching invoices for advertiser ${id}:`, error);
      res.status(500).json({ error: `Failed to fetch invoices: ${error.message}` });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

