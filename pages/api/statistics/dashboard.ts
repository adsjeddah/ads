import type { NextApiRequest, NextApiResponse } from 'next';
import { StatisticsService } from '../../../lib/services/statistics.service';
import { verifyAdminToken } from '../../../lib/firebase-admin'; // For admin-only access

// Define a more specific type for dashboard stats if needed, or use 'any' for now
interface DashboardStats {
  totalAdvertisers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  // pendingRequests: number; // Add if AdRequestService is integrated
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardStats | { error: string }>
) {
  if (req.method === 'GET') {
    try {
      // Optional: Verify admin token
      // const token = req.headers.authorization?.split('Bearer ')[1];
      // if (!token) return res.status(401).json({ error: 'Unauthorized' });
      // await verifyAdminToken(token);

      const stats = await StatisticsService.getDashboardStatistics();
      res.status(200).json(stats as DashboardStats); // Cast to defined type
    } catch (error: any) {
      console.error('Error fetching dashboard statistics:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard statistics: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}