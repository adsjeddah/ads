import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebase-admin';
import { verifyAdminToken } from '../../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * API لمزامنة حالات المعلنين مع حالات اشتراكاتهم
 * POST /api/admin/sync-advertiser-status
 * 
 * يقوم بـ:
 * - التحقق من كل معلن
 * - إذا كان لديه اشتراك نشط → حالة المعلن = active
 * - إذا لم يكن لديه اشتراك نشط → حالة المعلن = inactive
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
    // التحقق من صلاحيات الأدمن
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    await verifyAdminToken(token);
    
    const { advertiser_id } = req.body;
    
    let advertisersToSync: any[] = [];
    
    if (advertiser_id) {
      // مزامنة معلن واحد فقط
      const advertiserDoc = await adminDb.collection('advertisers').doc(advertiser_id).get();
      if (advertiserDoc.exists) {
        advertisersToSync.push({ id: advertiserDoc.id, ...advertiserDoc.data() });
      } else {
        return res.status(404).json({ error: 'Advertiser not found' });
      }
    } else {
      // مزامنة جميع المعلنين
      const advertisersSnapshot = await adminDb.collection('advertisers').get();
      advertisersToSync = advertisersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    
    // جلب جميع الاشتراكات
    const subscriptionsSnapshot = await adminDb.collection('subscriptions').get();
    const subscriptions = subscriptionsSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as { id: string; advertiser_id: string; status: string; [key: string]: any }));
    
    const results = {
      total: advertisersToSync.length,
      updated: 0,
      unchanged: 0,
      details: [] as any[]
    };
    
    for (const advertiser of advertisersToSync) {
      // البحث عن اشتراكات هذا المعلن
      const advertiserSubscriptions = subscriptions.filter(sub => sub.advertiser_id === advertiser.id);
      
      // التحقق من وجود اشتراك نشط
      const hasActiveSubscription = advertiserSubscriptions.some(sub => sub.status === 'active');
      
      // تحديد الحالة الصحيحة
      const correctStatus = hasActiveSubscription ? 'active' : 'inactive';
      
      // إذا كانت الحالة الحالية مختلفة عن الصحيحة
      if (advertiser.status !== correctStatus) {
        await adminDb.collection('advertisers').doc(advertiser.id).update({
          status: correctStatus,
          updated_at: FieldValue.serverTimestamp()
        });
        
        results.updated++;
        results.details.push({
          id: advertiser.id,
          company_name: advertiser.company_name,
          old_status: advertiser.status,
          new_status: correctStatus,
          subscriptions_count: advertiserSubscriptions.length,
          active_subscriptions: advertiserSubscriptions.filter(s => s.status === 'active').length
        });
        
        console.log(`✅ تم تحديث ${advertiser.company_name}: ${advertiser.status} → ${correctStatus}`);
      } else {
        results.unchanged++;
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `تم مزامنة ${results.updated} معلن من أصل ${results.total}`,
      results
    });
    
  } catch (error: any) {
    console.error('Error syncing advertiser status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to sync advertiser status: ' + error.message
    });
  }
}

