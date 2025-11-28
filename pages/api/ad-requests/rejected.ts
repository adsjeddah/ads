import type { NextApiRequest, NextApiResponse } from 'next';
import { AdRequestAdminService } from '../../../lib/services/ad-request-admin.service';
import { AdRequest } from '../../../types/models';

/**
 * API endpoint to get rejected ad requests
 * GET /api/ad-requests/rejected
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdRequest[] | { error: string }>
) {
  if (req.method === 'GET') {
    try {
      const rejectedRequests = await AdRequestAdminService.getRejectedRequests();
      res.status(200).json(rejectedRequests);
    } catch (error: any) {
      console.error('Error fetching rejected ad requests:', error);
      res.status(500).json({ error: 'Failed to fetch rejected ad requests: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

















