import type { NextApiRequest, NextApiResponse } from 'next';
import { AdRequestService } from '../../../lib/services/ad-request.service';
import { AdRequest } from '../../../types/models';
import { verifyAdminToken } from '../../../lib/firebase-admin'; // For admin-only operations

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdRequest | { error: string } | { message: string }>
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ad request ID' });
  }

  // Optional: Verify admin token for all operations on a specific ad request
  // const token = req.headers.authorization?.split('Bearer ')[1];
  // if (!token) return res.status(401).json({ error: 'Unauthorized' });
  // try {
  //   await verifyAdminToken(token);
  // } catch (error: any) {
  //   return res.status(403).json({ error: 'Forbidden: ' + error.message });
  // }

  if (req.method === 'GET') {
    try {
      const adRequest = await AdRequestService.getById(id);
      if (adRequest) {
        res.status(200).json(adRequest);
      } else {
        res.status(404).json({ error: 'Ad request not found' });
      }
    } catch (error: any) {
      console.error(`Error fetching ad request ${id}:`, error);
      res.status(500).json({ error: `Failed to fetch ad request: ${error.message}` });
    }
  } else if (req.method === 'PUT') {
    try {
      const adRequestData = req.body as Partial<AdRequest>;
      await AdRequestService.update(id, adRequestData);
      const updatedAdRequest = await AdRequestService.getById(id);
      if (updatedAdRequest) {
        res.status(200).json(updatedAdRequest);
      } else {
        res.status(404).json({ error: 'Ad request not found after update' });
      }
    } catch (error: any) {
      console.error(`Error updating ad request ${id}:`, error);
      res.status(500).json({ error: `Failed to update ad request: ${error.message}` });
    }
  } else if (req.method === 'DELETE') {
    try {
      await AdRequestService.delete(id);
      res.status(200).json({ message: 'Ad request deleted successfully' });
    } catch (error: any) {
      console.error(`Error deleting ad request ${id}:`, error);
      res.status(500).json({ error: `Failed to delete ad request: ${error.message}` });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}