import type { NextApiRequest, NextApiResponse } from 'next';
import { AdRequestAdminService } from '../../../lib/services/ad-request-admin.service';
import { AdRequestService } from '../../../lib/services/ad-request.service';
import { AdRequest } from '../../../types/models';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdRequest[] | AdRequest | { error: string } | { id: string }>
) {
  if (req.method === 'GET') {
    try {
      // Use Admin Service - bypasses Firestore Security Rules
      const { status } = req.query;
      const adRequests = await AdRequestAdminService.getAll(status as string | undefined);
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
      // Use regular service for creation (public endpoint)
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