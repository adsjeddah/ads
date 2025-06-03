import type { NextApiRequest, NextApiResponse } from 'next';
import { StatisticsService } from '../../../../lib/services/statistics.service';
import { Statistics } from '../../../../types/models';
import { verifyAdminToken } from '../../../../lib/firebase-admin'; // For admin-only access

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Statistics[] | { error: string }>
) {
  const { advertiserId, startDate, endDate } = req.query;

  if (typeof advertiserId !== 'string') {
    return res.status(400).json({ error: 'Invalid advertiser ID' });
  }
  if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
    return res.status(400).json({ error: 'Start date and end date are required query parameters' });
  }

  if (req.method === 'GET') {
    try {
      // Optional: Verify admin token
      // const token = req.headers.authorization?.split('Bearer ')[1];
      // if (!token) return res.status(401).json({ error: 'Unauthorized' });
      // await verifyAdminToken(token);

      const stats = await StatisticsService.getAdvertiserStats(
        advertiserId,
        new Date(startDate),
        new Date(endDate)
      );
      res.status(200).json(stats);
    } catch (error: any) {
      console.error(`Error fetching stats for advertiser ${advertiserId}:`, error);
      res.status(500).json({ error: `Failed to fetch stats: ${error.message}` });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}