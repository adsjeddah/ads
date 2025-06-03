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
    const q = query(plansRef, orderBy('price', 'asc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Plan));
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
    const defaultPlans = [
      { name: 'خطة أسبوعين', duration_days: 14, price: 500, features: 'ظهور في جميع الصفحات, دعم فني' },
      { name: 'خطة شهر', duration_days: 30, price: 800, features: 'ظهور في جميع الصفحات, دعم فني, أولوية في الترتيب' },
      { name: 'خطة شهرين', duration_days: 60, price: 1400, features: 'ظهور في جميع الصفحات, دعم فني, أولوية في الترتيب, تقارير شهرية' },
      { name: 'خطة 3 أشهر', duration_days: 90, price: 1800, features: 'ظهور في جميع الصفحات, دعم فني, أولوية في الترتيب, تقارير شهرية, شعار مميز' }
    ];

    const existingPlans = await this.getAll();
    
    if (existingPlans.length === 0) {
      for (const plan of defaultPlans) {
        await this.create(plan);
      }
    }
  }
}