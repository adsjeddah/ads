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
      // محاولة جلب الخطط من قاعدة البيانات
      let plans = await PlanService.getAll();
      
      // إذا لم توجد خطط، استخدم الخطط الافتراضية
      if (plans.length === 0) {
        plans = await PlanService.createDefaultPlans();
      }
      
      res.status(200).json(plans);
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      // في حالة الخطأ، أرجع الخطط الافتراضية
      const defaultPlans = await PlanService.createDefaultPlans();
      res.status(200).json(defaultPlans);
    }
  } else if (req.method === 'POST') {
    try {
      // Verify admin token for creating plans
      const token = req.headers.authorization?.split('Bearer ')[1];
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
      }
      await verifyAdminToken(token);

      const planData = req.body as Omit<Plan, 'id' | 'created_at'>;
      if (!planData.name || !planData.duration_days || planData.price == null) {
        return res.status(400).json({ error: 'Name, duration, and price are required for a plan' });
      }
      const newPlanId = await PlanService.create(planData);
      res.status(201).json({ id: newPlanId });
    } catch (error: any) {
      console.error('Error creating plan:', error);
      if (error.message.includes('Unauthorized') || error.message.includes('admin')) {
        return res.status(403).json({ error: 'Forbidden: ' + error.message });
      }
      res.status(500).json({ error: 'Failed to create plan: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}