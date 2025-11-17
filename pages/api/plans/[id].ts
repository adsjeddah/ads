import type { NextApiRequest, NextApiResponse } from 'next';
import { PlansAdminService } from '../../../lib/services/plans-admin.service';
import { Plan } from '../../../types/models';
import { verifyAdminToken } from '../../../lib/firebase-admin'; // Assuming admin-only access for PUT/DELETE

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Plan | { error: string } | { message: string }>
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid plan ID' });
  }

  // Verify admin token for modifying or deleting plans
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (req.method === 'PUT' || req.method === 'DELETE') {
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    try {
      await verifyAdminToken(token);
    } catch (error: any) {
      return res.status(403).json({ error: 'Forbidden: ' + error.message });
    }
  }

  if (req.method === 'GET') {
    try {
      // Use Admin Service to bypass Firestore security rules
      const plan = await PlansAdminService.getById(id);
      if (plan) {
        res.status(200).json(plan);
      } else {
        res.status(404).json({ error: 'Plan not found' });
      }
    } catch (error: any) {
      console.error(`Error fetching plan ${id}:`, error);
      res.status(500).json({ error: `Failed to fetch plan: ${error.message}` });
    }
  } else if (req.method === 'PUT') {
    try {
      const planData = req.body as Partial<Plan>;
      // Use Admin Service to update plan
      await PlansAdminService.update(id, planData);
      const updatedPlan = await PlansAdminService.getById(id); // Fetch updated to return
      if (updatedPlan) {
        res.status(200).json(updatedPlan);
      } else {
        res.status(404).json({ error: 'Plan not found after update' });
      }
    } catch (error: any) {
      console.error(`Error updating plan ${id}:`, error);
      res.status(500).json({ error: `Failed to update plan: ${error.message}` });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Use Admin Service to delete (soft delete) plan
      await PlansAdminService.delete(id);
      res.status(200).json({ message: 'Plan deleted successfully' });
    } catch (error: any) {
      console.error(`Error deleting plan ${id}:`, error);
      res.status(500).json({ error: `Failed to delete plan: ${error.message}` });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}