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
      // Get all subscriptions for this advertiser
      const subscriptionsSnapshot = await adminDb
        .collection('subscriptions')
        .where('advertiser_id', '==', id)
        .get();

      if (subscriptionsSnapshot.empty) {
        return res.status(200).json([]);
      }

      const subscriptions = subscriptionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at ? (doc.data().created_at as any).toDate?.() || doc.data().created_at : new Date(),
        start_date: doc.data().start_date ? (doc.data().start_date as any).toDate?.() || doc.data().start_date : new Date(),
        end_date: doc.data().end_date ? (doc.data().end_date as any).toDate?.() || doc.data().end_date : new Date(),
      }));

      // Sort by created_at descending in memory
      subscriptions.sort((a: any, b: any) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });

      res.status(200).json(subscriptions);
    } catch (error: any) {
      console.error(`Error fetching subscriptions for advertiser ${id}:`, error);
      res.status(500).json({ error: `Failed to fetch subscriptions: ${error.message}` });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

