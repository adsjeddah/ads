import type { NextApiRequest, NextApiResponse } from 'next';
import { StatisticsAdminService } from '../../../lib/services/statistics-admin.service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      // Use Admin Service - bypasses Firestore Security Rules
      const stats = await StatisticsAdminService.getDashboardStats();
      res.status(200).json(stats);
    } catch (error: any) {
      console.error('Error fetching dashboard statistics:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard statistics: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}