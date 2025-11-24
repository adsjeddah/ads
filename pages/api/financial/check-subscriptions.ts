import type { NextApiRequest, NextApiResponse } from 'next';
import { FinancialService } from '../../../lib/services/financial.service';
import { GracePeriodService } from '../../../lib/services/grace-period.service';

/**
 * API للتحقق من صلاحية الاشتراكات وتحديثها
 * POST /api/financial/check-subscriptions
 * 
 * يتحقق من جميع الاشتراكات النشطة ويحدث حالتها إلى "expired" إذا انتهى تاريخها
 * ويتحقق أيضاً من انتهاء فترات السماح
 * 
 * يُنصح بتشغيل هذا الـ API:
 * - يومياً عبر Cron Job
 * - أو عند تحميل Dashboard
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // التحقق وتحديث حالات الاشتراكات
    const result = await FinancialService.checkAndUpdateSubscriptionStatuses();

    // التحقق من انتهاء فترات السماح
    await GracePeriodService.checkExpiredGracePeriods();

    return res.status(200).json({
      success: true,
      message: `Updated ${result.updated} expired subscriptions and checked grace periods`,
      data: result
    });
  } catch (error: any) {
    console.error('Error checking subscriptions:', error);
    return res.status(500).json({
      error: 'Failed to check subscriptions',
      details: error.message
    });
  }
}

