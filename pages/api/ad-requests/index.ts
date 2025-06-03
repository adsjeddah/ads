import type { NextApiRequest, NextApiResponse } from 'next';
import { AdRequestService } from '../../../lib/services/ad-request.service';
import { AdRequest } from '../../../types/models';
import { verifyAdminToken } from '../../../lib/firebase-admin'; // For admin-only GET

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdRequest[] | AdRequest | { error: string } | { id: string }>
) {
  if (req.method === 'GET') {
    try {
      // Optional: Verify admin token if all ad-requests are admin-only view
      // const token = req.headers.authorization?.split('Bearer ')[1];
      // if (!token) return res.status(401).json({ error: 'Unauthorized' });
      // await verifyAdminToken(token);

      const { status } = req.query;
      const adRequests = await AdRequestService.getAll(status as string | undefined);
      res.status(200).json(adRequests);
    } catch (error: any) {
      console.error('Error fetching ad requests:', error);
      res.status(500).json({ error: 'Failed to fetch ad requests: ' + error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const adRequestData = req.body as Omit<AdRequest, 'id' | 'created_at' | 'status'>;
      if (!adRequestData.company_name || !adRequestData.contact_name || !adRequestData.phone) {
        return res.status(400).json({ error: 'Company name, contact name, and phone are required' });
      }
      const newAdRequestId = await AdRequestService.create(adRequestData);
      res.status(201).json({ id: newAdRequestId });
    } catch (error: any) {
      console.error('Error creating ad request:', error);
      res.status(500).json({ error: 'Failed to create ad request: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}