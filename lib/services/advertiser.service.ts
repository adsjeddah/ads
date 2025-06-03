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
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, COLLECTIONS } from '../firebase';
import { Advertiser } from '../../types/models';
import bcrypt from 'bcryptjs';

export class AdvertiserService {
  // جلب جميع المعلنين
  static async getAll(status?: string) {
    const advertisersRef = collection(db, COLLECTIONS.ADVERTISERS);
    let q = query(advertisersRef, orderBy('created_at', 'desc'));
    
    if (status) {
      q = query(advertisersRef, where('status', '==', status), orderBy('created_at', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Advertiser));
  }

  // جلب معلن واحد
  static async getById(id: string) {
    const docRef = doc(db, COLLECTIONS.ADVERTISERS, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Advertiser;
    }
    return null;
  }

  // إنشاء معلن جديد
  static async create(data: Omit<Advertiser, 'id' | 'created_at' | 'updated_at'>) {
    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : undefined;
    
    const advertiserData = {
      ...data,
      password: hashedPassword,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.ADVERTISERS), advertiserData);
    return docRef.id;
  }

  // تحديث معلن
  static async update(id: string, data: Partial<Advertiser>) {
    const docRef = doc(db, COLLECTIONS.ADVERTISERS, id);
    
    const updateData: any = {
      ...data,
      updated_at: Timestamp.now()
    };
    
    // تشفير كلمة المرور إذا تم تغييرها
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    
    await updateDoc(docRef, updateData);
  }

  // حذف معلن
  static async delete(id: string) {
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