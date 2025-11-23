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
    await adminDb.collection('advertisers').doc(id).delete();
  }
}