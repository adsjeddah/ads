import type { NextApiRequest, NextApiResponse } from 'next';
import { StatisticsService } from '../../../lib/services/statistics.service';
import { verifyAdminToken } from '../../../lib/firebase-admin'; // For admin-only access

// Define a more specific type for dashboard stats if needed, or use 'any' for now
interface DashboardStats {
  totalAdvertisers: number;
  activeSubscriptions: number;
  totalRevenue: {
    total: number;
  };
  pendingRequests: {
    count: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardStats | { error: string }>
) {
  if (req.method === 'GET') {
    try {
      // Verify admin token
      const token = req.headers.authorization?.split('Bearer ')[1];
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      await verifyAdminToken(token);

      const stats = await StatisticsService.getDashboardStatistics();
      // Transform the stats to match the expected format
      const formattedStats: DashboardStats = {
        totalAdvertisers: stats.totalAdvertisers,
        activeSubscriptions: stats.activeSubscriptions,
        totalRevenue: {
          total: stats.totalRevenue
        },
        pendingRequests: {
          count: 0 // Default to 0 since AdRequestService might not be integrated
        }
      };
      res.status(200).json(formattedStats);
    } catch (error: any) {
      console.error('Error fetching dashboard statistics:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard statistics: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}