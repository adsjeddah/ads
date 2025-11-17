import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';
import { AdRequest } from '../../types/models';

export class AdRequestService {
  // جلب جميع طلبات الإعلان
  static async getAll(status?: string) {
    const requestsRef = collection(db, COLLECTIONS.AD_REQUESTS);
    let q = query(requestsRef, orderBy('created_at', 'desc'));
    
    if (status) {
      q = query(requestsRef, where('status', '==', status), orderBy('created_at', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AdRequest));
  }

  // جلب طلب واحد
  static async getById(id: string) {
    const docRef = doc(db, COLLECTIONS.AD_REQUESTS, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as AdRequest;
    }
    return null;
  }

  // إنشاء طلب جديد
  static async create(data: Omit<AdRequest, 'id' | 'created_at' | 'status'>) {
    const requestData = {
      ...data,
      status: 'pending', // Status is set here, so it's not needed in input `data`
      created_at: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.AD_REQUESTS), requestData);
    return docRef.id;
  }

  // تحديث طلب
  static async update(id: string, data: Partial<AdRequest>) {
    const docRef = doc(db, COLLECTIONS.AD_REQUESTS, id);
    await updateDoc(docRef, data);
  }

  // حذف طلب
  static async delete(id: string) {
    await deleteDoc(doc(db, COLLECTIONS.AD_REQUESTS, id));
  }

  // تحويل طلب إلى معلن
  static async convertToAdvertiser(requestId: string, advertiserData: any) {
    // تحديث حالة الطلب
    await this.update(requestId, { status: 'converted' });
    
    // إنشاء المعلن الجديد سيتم في صفحة التحويل
    return true;
  }

  // جلب إحصائيات الطلبات
  static async getStatistics() {
    const allRequests = await this.getAll();
    
    const stats = {
      total: allRequests.length,
      pending: allRequests.filter(r => r.status === 'pending').length,
      contacted: allRequests.filter(r => r.status === 'contacted').length,
      converted: allRequests.filter(r => r.status === 'converted').length,
      rejected: allRequests.filter(r => r.status === 'rejected').length
    };
    
    return stats;
  }
}