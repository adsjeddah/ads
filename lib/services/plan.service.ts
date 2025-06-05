import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';
import { Plan } from '../../types/models';

export class PlanService {
  // جلب جميع الخطط
  static async getAll() {
    const plansRef = collection(db, COLLECTIONS.PLANS);
    let snapshot;
    
    try {
      // Try with ordering by price
      const q = query(plansRef, orderBy('price', 'asc'));
      snapshot = await getDocs(q);
    } catch (error: any) {
      // If index is not ready, get all without ordering
      console.log('Plans index not ready, using fallback query');
      snapshot = await getDocs(plansRef);
    }
    
    const plans = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Plan));
    
    // Sort manually if we used the fallback
    plans.sort((a, b) => (a.price || 0) - (b.price || 0));
    
    return plans;
  }

  // جلب خطة واحدة
  static async getById(id: string) {
    const docRef = doc(db, COLLECTIONS.PLANS, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Plan;
    }
    return null;
  }

  // إنشاء خطة جديدة
  static async create(data: Omit<Plan, 'id' | 'created_at'>) {
    const planData = {
      ...data,
      created_at: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.PLANS), planData);
    return docRef.id;
  }

  // تحديث خطة
  static async update(id: string, data: Partial<Plan>) {
    const docRef = doc(db, COLLECTIONS.PLANS, id);
    await updateDoc(docRef, data);
  }

  // حذف خطة
  static async delete(id: string) {
    await deleteDoc(doc(db, COLLECTIONS.PLANS, id));
  }

  // إنشاء الخطط الافتراضية
  static async createDefaultPlans() {
    try {
      const existingPlans = await this.getAll();
      
      // إذا كانت هناك خطط موجودة، لا تفعل شيئًا
      if (existingPlans.length > 0) {
        return existingPlans;
      }
      
      // إرجاع الخطط الافتراضية بدون محاولة الكتابة
      // سيقوم المدير بإضافتها من خلال واجهة الإدارة
      const defaultPlans = [
        {
          id: 'temp-1',
          name: 'خطة أسبوعين',
          description: 'للتجربة والشركات الجديدة',
          price: 500,
          duration_days: 14,
          features: [
            'ظهور في دليل شركات نقل العفش',
            'عرض رقم الهاتف والواتساب',
            'إضافة وصف مختصر للخدمات',
            'ظهور في نتائج البحث المحلي',
            'دعم فني عبر الواتساب'
          ],
          is_active: true,
          created_at: new Date()
        },
        {
          id: 'temp-2',
          name: 'خطة شهر',
          description: 'الأكثر طلباً للشركات النشطة',
          price: 800,
          duration_days: 30,
          features: [
            'جميع مميزات خطة الأسبوعين',
            'أولوية في ترتيب الظهور',
            'إضافة شعار الشركة',
            'عرض صور لأعمال النقل السابقة',
            'إحصائيات عدد المشاهدات',
            'ظهور مميز بإطار ذهبي'
          ],
          is_active: true,
          created_at: new Date()
        },
        {
          id: 'temp-3',
          name: 'خطة شهرين',
          description: 'للشركات الرائدة في نقل العفش',
          price: 1400,
          duration_days: 60,
          features: [
            'جميع مميزات خطة الشهر',
            'ظهور في أعلى نتائج البحث',
            'صفحة خاصة بتفاصيل الشركة',
            'إمكانية إضافة عروض وخصومات',
            'شارة "شركة موثوقة" المميزة',
            'تقارير شهرية مفصلة',
            'دعم فني مخصص على مدار الساعة'
          ],
          is_active: true,
          created_at: new Date()
        }
      ];
      
      return defaultPlans;
    } catch (error) {
      console.log('عرض الخطط الافتراضية المؤقتة');
      // في حالة الخطأ، أرجع خطط افتراضية للعرض
      return [];
    }
  }
}