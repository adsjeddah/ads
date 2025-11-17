import { 
  Timestamp,
  FieldValue
} from 'firebase-admin/firestore';
import { adminDb } from '../firebase-admin';
import { Plan } from '../../types/models';

export class PlansAdminService {
  // إنشاء خطة جديدة
  static async create(data: Omit<Plan, 'id' | 'created_at'>): Promise<string> {
    const planData: any = {
      name: data.name,
      duration_days: data.duration_days,
      price: data.price,
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: FieldValue.serverTimestamp()
    };
    
    // إضافة الحقول الاختيارية فقط إذا كانت موجودة
    if (data.description) planData.description = data.description;
    if (data.features) planData.features = data.features;
    
    const docRef = await adminDb.collection('plans').add(planData);
    
    return docRef.id;
  }

  // جلب جميع الخطط
  static async getAll(activeOnly?: boolean): Promise<Plan[]> {
    let query = adminDb.collection('plans').orderBy('price', 'asc');
    
    if (activeOnly) {
      query = query.where('is_active', '==', true) as any;
    }
    
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Plan[];
  }

  // جلب خطة واحدة
  static async getById(id: string): Promise<Plan | null> {
    const doc = await adminDb.collection('plans').doc(id).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return { id: doc.id, ...doc.data() } as Plan;
  }

  // تحديث خطة
  static async update(id: string, data: Partial<Plan>): Promise<void> {
    const updateData: any = { ...data };
    
    // إزالة الحقول التي لا يجب تحديثها
    delete updateData.id;
    delete updateData.created_at;
    
    await adminDb.collection('plans').doc(id).update(updateData);
  }

  // حذف خطة (soft delete - تعطيل فقط)
  static async delete(id: string): Promise<void> {
    await adminDb.collection('plans').doc(id).update({
      is_active: false
    });
  }

  // حذف دائم (استخدم بحذر!)
  static async permanentDelete(id: string): Promise<void> {
    await adminDb.collection('plans').doc(id).delete();
  }

  // تفعيل خطة
  static async activate(id: string): Promise<void> {
    await adminDb.collection('plans').doc(id).update({
      is_active: true
    });
  }
}

