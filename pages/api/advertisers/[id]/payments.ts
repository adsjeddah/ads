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

      // Get all payments for these subscriptions
      const paymentsPromises = subscriptionIds.map(async (subId) => {
        const paymentsSnapshot = await adminDb
          .collection('payments')
          .where('subscription_id', '==', subId)
          .get();
        
        return paymentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at ? (doc.data().created_at as any).toDate?.() || doc.data().created_at : new Date(),
          payment_date: doc.data().payment_date ? (doc.data().payment_date as any).toDate?.() || doc.data().payment_date : new Date(),
        }));
      });

      const paymentsArrays = await Promise.all(paymentsPromises);
      const payments = paymentsArrays.flat();

      // Sort by payment_date descending in memory
      payments.sort((a: any, b: any) => {
        const dateA = new Date(a.payment_date).getTime();
        const dateB = new Date(b.payment_date).getTime();
        return dateB - dateA;
      });

      res.status(200).json(payments);
    } catch (error: any) {
      console.error(`Error fetching payments for advertiser ${id}:`, error);
      res.status(500).json({ error: `Failed to fetch payments: ${error.message}` });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}










