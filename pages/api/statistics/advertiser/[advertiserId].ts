import type { NextApiRequest, NextApiResponse } from 'next';
import { StatisticsAdminService } from '../../../../lib/services/statistics-admin.service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { advertiserId } = req.query;
  const { startDate, endDate } = req.query;

  if (req.method === 'GET') {
    try {
      if (!advertiserId || typeof advertiserId !== 'string') {
        return res.status(400).json({ error: 'Advertiser ID is required' });
      }

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      // Use Admin Service - bypasses Firestore Security Rules
      const statistics = await StatisticsAdminService.getAdvertiserStats(advertiserId, start, end);
      
      return res.status(200).json(statistics);
    } catch (error: any) {
      console.error('Error fetching advertiser statistics:', error);
      return res.status(500).json({ error: 'Failed to fetch statistics: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
