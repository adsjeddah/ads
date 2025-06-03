import type { NextApiRequest, NextApiResponse } from 'next';
import { SubscriptionService } from '../../../lib/services/subscription.service';
import { Subscription } from '../../../types/models';
import { verifyAdminToken } from '../../../lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Subscription | { error: string } | { message: string }>
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid subscription ID' });
  }

  // Optional: Verify admin token for modifying or deleting subscriptions
  // const token = req.headers.authorization?.split('Bearer ')[1];
  // if (req.method === 'PUT' || req.method === 'DELETE') {
  //   if (!token) return res.status(401).json({ error: 'Unauthorized' });
  //   try {
  //     await verifyAdminToken(token);
  //   } catch (error: any) {
  //     return res.status(403).json({ error: 'Forbidden: ' + error.message });
  //   }
  // }

  if (req.method === 'GET') {
    try {
      const subscription = await SubscriptionService.getById(id);
      if (subscription) {
        res.status(200).json(subscription);
      } else {
        res.status(404).json({ error: 'Subscription not found' });
      }
    } catch (error: any) {
      console.error(`Error fetching subscription ${id}:`, error);
      res.status(500).json({ error: `Failed to fetch subscription: ${error.message}` });
    }
  } else if (req.method === 'PUT') {
    try {
      const subData = req.body as Partial<Subscription>;
      await SubscriptionService.update(id, subData);
      const updatedSubscription = await SubscriptionService.getById(id);
      if (updatedSubscription) {
        res.status(200).json(updatedSubscription);
      } else {
        res.status(404).json({ error: 'Subscription not found after update' });
      }
    } catch (error: any) {
      console.error(`Error updating subscription ${id}:`, error);
      res.status(500).json({ error: `Failed to update subscription: ${error.message}` });
    }
  } else if (req.method === 'DELETE') {
    try {
      await SubscriptionService.delete(id);
      res.status(200).json({ message: 'Subscription deleted successfully' });
    } catch (error: any) {
      console.error(`Error deleting subscription ${id}:`, error);
      res.status(500).json({ error: `Failed to delete subscription: ${error.message}` });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}