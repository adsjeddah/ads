import type { NextApiRequest, NextApiResponse } from 'next';
import { StatisticsService } from '../../../lib/services/statistics.service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string } | { error: string }>
) {
  if (req.method === 'POST') {
    try {
      const { type, advertiserId } = req.body;

      if (typeof advertiserId !== 'string' || !advertiserId) {
        return res.status(400).json({ error: 'Advertiser ID is required' });
      }

      if (type === 'view') {
        await StatisticsService.recordView(advertiserId);
        res.status(200).json({ message: 'View recorded successfully' });
      } else if (type === 'click') {
        await StatisticsService.recordClick(advertiserId);
        res.status(200).json({ message: 'Click recorded successfully' });
      } else {
        res.status(400).json({ error: 'Invalid event type. Must be "view" or "click".' });
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