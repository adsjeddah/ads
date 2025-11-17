import type { NextApiRequest, NextApiResponse } from 'next';
import { StatisticsAdminService } from '../../../lib/services/statistics-admin.service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string } | { error: string }>
) {
  if (req.method === 'POST') {
    try {
      const { type, advertiserId, phone } = req.body;

      if (typeof advertiserId !== 'string' || !advertiserId) {
        return res.status(400).json({ error: 'Advertiser ID is required' });
      }

      // Use Admin Service - bypasses Firestore Security Rules
      if (type === 'view') {
        await StatisticsAdminService.recordView(advertiserId);
        res.status(200).json({ message: 'View recorded successfully' });
      } else if (type === 'click') {
        await StatisticsAdminService.recordClick(advertiserId);
        res.status(200).json({ message: 'Click recorded successfully' });
      } else if (type === 'call') {
        await StatisticsAdminService.recordCall(advertiserId, phone);
        res.status(200).json({ message: 'Call recorded successfully' });
      } else {
        res.status(400).json({ error: 'Invalid event type. Must be "view", "click", or "call".' });
      }
    } catch (error: any) {
      console.error('Error recording statistic:', error);
      res.status(500).json({ error: 'Failed to record statistic: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}