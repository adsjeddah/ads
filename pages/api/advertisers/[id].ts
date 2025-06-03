import type { NextApiRequest, NextApiResponse } from 'next';
import { AdvertiserService } from '../../../lib/services/advertiser.service';
import { Advertiser } from '../../../types/models';
import { verifyAdminToken } from '../../../lib/firebase-admin'; // Assuming admin-only access for PUT/DELETE

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Advertiser | { error: string } | { message: string }>
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid advertiser ID' });
  }

  // Optional: Verify admin token for modifying or deleting advertisers
  // const token = req.headers.authorization?.split('Bearer ')[1];
  // if (req.method === 'PUT' || req.method === 'DELETE') {
  //   if (!token) {
  //     return res.status(401).json({ error: 'Unauthorized: No token provided' });
  //   }
  //   try {
  //     await verifyAdminToken(token);
  //   } catch (error: any) {
  //     return res.status(403).json({ error: 'Forbidden: ' + error.message });
  //   }
  // }

  if (req.method === 'GET') {
    try {
      const advertiser = await AdvertiserService.getById(id);
      if (advertiser) {
        res.status(200).json(advertiser);
      } else {
        res.status(404).json({ error: 'Advertiser not found' });
      }
    } catch (error: any) {
      console.error(`Error fetching advertiser ${id}:`, error);
      res.status(500).json({ error: `Failed to fetch advertiser: ${error.message}` });
    }
  } else if (req.method === 'PUT') {
    try {
      const advertiserData = req.body as Partial<Advertiser>;
      await AdvertiserService.update(id, advertiserData);
      // Fetch the updated advertiser to return it
      const updatedAdvertiser = await AdvertiserService.getById(id);
      if (updatedAdvertiser) {
        res.status(200).json(updatedAdvertiser);
      } else {
        // Should not happen if update was successful and ID is correct
        res.status(404).json({ error: 'Advertiser not found after update' });
      }
    } catch (error: any) {
      console.error(`Error updating advertiser ${id}:`, error);
      res.status(500).json({ error: `Failed to update advertiser: ${error.message}` });
    }
  } else if (req.method === 'DELETE') {
    try {
      await AdvertiserService.delete(id);
      res.status(200).json({ message: 'Advertiser deleted successfully' });
    } catch (error: any) {
      console.error(`Error deleting advertiser ${id}:`, error);
      res.status(500).json({ error: `Failed to delete advertiser: ${error.message}` });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}