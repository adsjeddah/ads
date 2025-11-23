import type { NextApiRequest, NextApiResponse } from 'next';
import { AdRequestAdminService } from '../../../lib/services/ad-request-admin.service';
import { verifyAdminToken } from '../../../lib/firebase-admin';

interface AdRequestStats {
  total: number;
  pending: number;
  contacted: number;
  converted: number;
  rejected: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdRequestStats | { error: string }>
) {
  if (req.method === 'GET') {
    try {
      // Optional: Verify admin token
      // const token = req.headers.authorization?.split('Bearer ')[1];
      // if (!token) return res.status(401).json({ error: 'Unauthorized' });
      // await verifyAdminToken(token);

      const stats = await AdRequestAdminService.getStatistics();
      res.status(200).json(stats);
    } catch (error: any) {
      console.error('Error fetching ad request statistics:', error);
      res.status(500).json({ error: 'Failed to fetch ad request statistics: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}