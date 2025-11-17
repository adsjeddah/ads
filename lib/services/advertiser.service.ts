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
  Timestamp,
  limit,
  serverTimestamp,
  CollectionReference
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, COLLECTIONS } from '../firebase';
import { Advertiser } from '../../types/models';
import bcrypt from 'bcryptjs';

// Simple in-memory cache to reduce Firestore reads
const cache = {
  advertisers: null as Advertiser[] | null,
  lastFetch: 0,
  cacheDuration: 5 * 60 * 1000, // 5 minutes
  invalidate: () => {
    cache.advertisers = null;
  }
};

export class AdvertiserService {
  // جلب جميع المعلنين
  static async getAll(status?: string): Promise<Advertiser[]> {
    // Check cache first
    const now = Date.now();
    if (cache.advertisers && (now - cache.lastFetch < cache.cacheDuration) && !status) {
      console.log('Using cached advertisers data');
      return cache.advertisers;
    }

    const advertisersRef = collection(db, COLLECTIONS.ADVERTISERS);
    let snapshot;
    
    try {
      // Try with the optimized query first
      let q;
      if (status) {
        q = query(advertisersRef, where('status', '==', status), orderBy('created_at', 'desc'));
      } else {
        q = query(advertisersRef, orderBy('created_at', 'desc'));
      }
      snapshot = await getDocs(q);
    } catch (error: any) {
      // If index is not ready, fall back to simpler query
      console.log('Index not ready, using fallback query');
      if (status) {
        // Just filter by status without ordering
        const q = query(advertisersRef, where('status', '==', status));
        snapshot = await getDocs(q);
      } else {
        // Get all documents without ordering
        snapshot = await getDocs(advertisersRef);
      }
    }
    
    let advertisers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Advertiser[];
    
    // Sort manually if we used the fallback query
    advertisers.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA; // Descending order
    });
    
    // Update cache if this was a full fetch
    if (!status) {
      cache.advertisers = advertisers;
      cache.lastFetch = now;
    }
    
    return advertisers;
  }

  // جلب معلن واحد
  static async getById(id: string): Promise<Advertiser | null> {
    // Try to find in cache first
    if (cache.advertisers) {
      const cachedAdvertiser = cache.advertisers.find(a => a.id === id);
      if (cachedAdvertiser) {
        console.log('Using cached advertiser data for ID:', id);
        return cachedAdvertiser;
      }
    }
    
    const docRef = doc(db, COLLECTIONS.ADVERTISERS, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Advertiser;
    }
    
    return null;
  }

  // إنشاء معلن جديد
  static async create(data: Omit<Advertiser, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    // إعداد بيانات المعلن مع استبعاد القيم undefined
    const advertiserData: any = {
      company_name: data.company_name,
      phone: data.phone,
      status: data.status || 'active',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };
    
    // إضافة الحقول الاختيارية فقط إذا كانت موجودة
    if (data.whatsapp) advertiserData.whatsapp = data.whatsapp;
    if (data.services) advertiserData.services = data.services;
    if (data.icon_url) advertiserData.icon_url = data.icon_url;
    if (data.email) advertiserData.email = data.email;
    
    // تشفير كلمة المرور إذا كانت موجودة
    if (data.password) {
      advertiserData.password = await bcrypt.hash(data.password, 10);
    }
    
    const docRef = await addDoc(collection(db, COLLECTIONS.ADVERTISERS), advertiserData);
    
    // Invalidate cache
    cache.invalidate();
    
    return docRef.id;
  }

  // تحديث معلن
  static async update(id: string, data: Partial<Advertiser>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.ADVERTISERS, id);
    
    const updateData: any = {
      ...data,
      updated_at: serverTimestamp()
    };
    
    // تشفير كلمة المرور إذا تم تغييرها
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    
    await updateDoc(docRef, updateData);
    
    // Invalidate cache
    cache.invalidate();
  }

  // حذف معلن
  static async delete(id: string): Promise<void> {
    const advertiser = await this.getById(id);
    
    // حذف الشعار من Storage إذا كان موجوداً
    if (advertiser?.icon_url) {
      try {
        const storageRef = ref(storage, advertiser.icon_url);
        await deleteObject(storageRef);
      } catch (error) {
        console.error('Error deleting logo:', error);
      }
    }
    
    await deleteDoc(doc(db, COLLECTIONS.ADVERTISERS, id));
    
    // Invalidate cache
    cache.invalidate();
  }

  // رفع شعار الشركة
  static async uploadLogo(file: File, advertiserId: string): Promise<string> {
    const fileName = `logos/${advertiserId}_${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  }

  // التحقق من بيانات الدخول
  static async authenticate(email: string, password: string) {
    const q = query(collection(db, COLLECTIONS.ADVERTISERS), where('email', '==', email));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const advertiser = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Advertiser;
    
    if (advertiser.password && await bcrypt.compare(password, advertiser.password)) {
      return advertiser;
    }
    
    return null;
  }
}