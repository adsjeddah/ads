import type { NextApiRequest, NextApiResponse } from 'next';
import { SubscriptionService } from '../../../lib/services/subscription.service';
import { Subscription } from '../../../types/models';
import { verifyAdminToken } from '../../../lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Subscription[] | Subscription | { error: string } | { id: string }>
) {
  if (req.method === 'GET') {
    try {
      const { advertiserId, status } = req.query;
      let subscriptions: Subscription[];

      if (typeof advertiserId === 'string') {
        subscriptions = await SubscriptionService.getByAdvertiserId(advertiserId);
      } else if (status === 'active') {
        subscriptions = await SubscriptionService.getActiveSubscriptions();
      } else {
        subscriptions = await SubscriptionService.getAll();
      }
      res.status(200).json(subscriptions);
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error);
      res.status(500).json({ error: 'Failed to fetch subscriptions: ' + error.message });
    }
  } else if (req.method === 'POST') {
    try {
      // Optional: Verify admin token
      // const token = req.headers.authorization?.split('Bearer ')[1];
      // if (!token) return res.status(401).json({ error: 'Unauthorized' });
      // await verifyAdminToken(token);

      const subData = req.body as Omit<Subscription, 'id' | 'created_at'>;
      // Basic validation
      if (!subData.advertiser_id || !subData.plan_id || !subData.start_date || !subData.end_date) {
        return res.status(400).json({ error: 'Missing required subscription data' });
      }
      const newSubscriptionId = await SubscriptionService.create(subData);
      res.status(201).json({ id: newSubscriptionId });
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ error: 'Failed to create subscription: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}