import type { NextApiRequest, NextApiResponse } from 'next';
import { PlanService } from '../../../lib/services/plan.service';
import { Plan } from '../../../types/models';
import { verifyAdminToken } from '../../../lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Plan[] | Plan | { error: string } | { id: string }>
) {
  if (req.method === 'GET') {
    try {
      // Create default plans if they don't exist
      await PlanService.createDefaultPlans();
      const plans = await PlanService.getAll();
      res.status(200).json(plans);
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      res.status(500).json({ error: 'Failed to fetch plans: ' + error.message });
    }
  } else if (req.method === 'POST') {
    try {
      // Optional: Verify admin token for creating plans
      // const token = req.headers.authorization?.split('Bearer ')[1];
      // if (!token) {
      //   return res.status(401).json({ error: 'Unauthorized: No token provided' });
      // }
      // await verifyAdminToken(token);

      const planData = req.body as Omit<Plan, 'id' | 'created_at'>;
      if (!planData.name || !planData.duration_days || planData.price == null) {
        return res.status(400).json({ error: 'Name, duration, and price are required for a plan' });
      }
      const newPlanId = await PlanService.create(planData);
      res.status(201).json({ id: newPlanId });
    } catch (error: any) {
      console.error('Error creating plan:', error);
      // if (error.message.includes('Unauthorized') || error.message.includes('admin')) {
      //   return res.status(403).json({ error: 'Forbidden: ' + error.message });
      // }
      res.status(500).json({ error: 'Failed to create plan: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}