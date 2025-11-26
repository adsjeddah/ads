import { 
  Timestamp,
  FieldValue
} from 'firebase-admin/firestore';
import { adminDb, adminStorage } from '../firebase-admin';
import { Advertiser } from '../../types/models';
import bcrypt from 'bcryptjs';

export class AdvertiserAdminService {
  // إنشاء معلن جديد (للاستخدام من API فقط)
  static async create(data: Omit<Advertiser, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    // إعداد بيانات المعلن مع استبعاد القيم undefined
    const advertiserData: any = {
      company_name: data.company_name,
      phone: data.phone,
      status: data.status || 'active',
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp()
    };
    
    // إضافة الحقول الاختيارية فقط إذا كانت موجودة
    if (data.whatsapp) advertiserData.whatsapp = data.whatsapp;
    if (data.services) advertiserData.services = data.services;
    if (data.icon_url) advertiserData.icon_url = data.icon_url;
    if (data.email) advertiserData.email = data.email;
    if (data.include_vat !== undefined) advertiserData.include_vat = data.include_vat;
    if (data.vat_percentage !== undefined) advertiserData.vat_percentage = data.vat_percentage;
    
    // 🆕 حقول القطاع والتغطية الجغرافية (مهمة جداً!)
    if ((data as any).sector) advertiserData.sector = (data as any).sector;
    if ((data as any).coverage_type) advertiserData.coverage_type = (data as any).coverage_type;
    if ((data as any).coverage_cities) advertiserData.coverage_cities = (data as any).coverage_cities;
    
    // 🆕 حقول تصنيف العملاء
    if ((data as any).customer_type) advertiserData.customer_type = (data as any).customer_type;
    if ((data as any).is_trusted !== undefined) advertiserData.is_trusted = (data as any).is_trusted;
    if ((data as any).payment_terms_days !== undefined) advertiserData.payment_terms_days = (data as any).payment_terms_days;
    
    // تشفير كلمة المرور إذا كانت موجودة
    if (data.password) {
      advertiserData.password = await bcrypt.hash(data.password, 10);
    }
    
    const docRef = await adminDb.collection('advertisers').add(advertiserData);
    
    return docRef.id;
  }

  // جلب جميع المعلنين
  static async getAll(status?: string): Promise<Advertiser[]> {
    let query = adminDb.collection('advertisers').orderBy('created_at', 'desc');
    
    if (status) {
      query = query.where('status', '==', status) as any;
    }
    
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Advertiser[];
  }

  // جلب معلن واحد
  static async getById(id: string): Promise<Advertiser | null> {
    const doc = await adminDb.collection('advertisers').doc(id).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return { id: doc.id, ...doc.data() } as Advertiser;
  }

  // تحديث معلن
  static async update(id: string, data: Partial<Advertiser>): Promise<void> {
    const updateData: any = {
      ...data,
      updated_at: FieldValue.serverTimestamp()
    };
    
    // تشفير كلمة المرور إذا تم تغييرها
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    
    await adminDb.collection('advertisers').doc(id).update(updateData);
  }

  // حذف معلن
  static async delete(id: string): Promise<void> {
    // حذف جميع الفواتير المرتبطة بالمعلن
    const invoicesSnapshot = await adminDb.collection('invoices')
      .where('advertiser_id', '==', id)
      .get();
    
    const invoiceDeletions = invoicesSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(invoiceDeletions);
    
    console.log(`✅ تم حذف ${invoicesSnapshot.docs.length} فاتورة مرتبطة بالمعلن`);
    
    // حذف جميع الاشتراكات المرتبطة بالمعلن
    const subscriptionsSnapshot = await adminDb.collection('subscriptions')
      .where('advertiser_id', '==', id)
      .get();
    
    const subscriptionDeletions = subscriptionsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(subscriptionDeletions);
    
    console.log(`✅ تم حذف ${subscriptionsSnapshot.docs.length} اشتراك مرتبط بالمعلن`);
    
    // حذف جميع الدفعات المرتبطة بالمعلن
    const paymentsSnapshot = await adminDb.collection('payments')
      .where('advertiser_id', '==', id)
      .get();
    
    const paymentDeletions = paymentsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(paymentDeletions);
    
    console.log(`✅ تم حذف ${paymentsSnapshot.docs.length} دفعة مرتبطة بالمعلن`);
    
    // حذف المعلن نفسه
    await adminDb.collection('advertisers').doc(id).delete();
    
    console.log(`✅ تم حذف المعلن ${id} وجميع بياناته المرتبطة بنجاح`);
  }
}