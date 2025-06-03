import type { NextApiRequest, NextApiResponse } from 'next';
import { AdvertiserService } from '../../../lib/services/advertiser.service';
import { Advertiser } from '../../../types/models';
import { verifyAdminToken } from '../../../lib/firebase-admin'; // Assuming admin-only access for POST

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Advertiser[] | Advertiser | { error: string } | { id: string }>
) {
  if (req.method === 'GET') {
    try {
      const { status } = req.query;
      const advertisers = await AdvertiserService.getAll(status as string | undefined);
      res.status(200).json(advertisers);
    } catch (error: any) {
      console.error('Error fetching advertisers:', error);
      res.status(500).json({ error: 'Failed to fetch advertisers: ' + error.message });
    }
  } else if (req.method === 'POST') {
    try {
      // Optional: Verify admin token for creating advertisers
      // const token = req.headers.authorization?.split('Bearer ')[1];
      // if (!token) {
      //   return res.status(401).json({ error: 'Unauthorized: No token provided' });
      // }
      // await verifyAdminToken(token); // This will throw if not admin

      const advertiserData = req.body as Omit<Advertiser, 'id' | 'created_at' | 'updated_at'>;
      if (!advertiserData.company_name || !advertiserData.phone) {
        return res.status(400).json({ error: 'Company name and phone are required' });
      }
      const newAdvertiserId = await AdvertiserService.create(advertiserData);
      res.status(201).json({ id: newAdvertiserId });
    } catch (error: any) {
      console.error('Error creating advertiser:', error);
      if (error.message.includes('Unauthorized') || error.message.includes('admin')) {
        return res.status(403).json({ error: 'Forbidden: ' + error.message });
      }
      res.status(500).json({ error: 'Failed to create advertiser: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}