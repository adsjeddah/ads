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
import { Invoice } from '../../types/models';

export class InvoiceService {
  // جلب جميع الفواتير
  static async getAll() {
    const invoicesRef = collection(db, COLLECTIONS.INVOICES);
    const q = query(invoicesRef, orderBy('created_at', 'desc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Invoice));
  }

  // جلب فواتير اشتراك معين
  static async getBySubscriptionId(subscriptionId: string) {
    const q = query(
      collection(db, COLLECTIONS.INVOICES),
      where('subscription_id', '==', subscriptionId),
      orderBy('created_at', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Invoice));
  }

  // جلب فاتورة واحدة
  static async getById(id: string) {
    const docRef = doc(db, COLLECTIONS.INVOICES, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Invoice;
    }
    return null;
  }

  // إنشاء فاتورة جديدة
  static async create(data: Omit<Invoice, 'id' | 'created_at'>) {
    const invoiceData = {
      ...data,
      issued_date: Timestamp.fromDate(new Date(data.issued_date)),
      due_date: data.due_date ? Timestamp.fromDate(new Date(data.due_date)) : null,
      paid_date: data.paid_date ? Timestamp.fromDate(new Date(data.paid_date)) : null,
      created_at: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.INVOICES), invoiceData);
    return docRef.id;
  }

  // تحديث فاتورة
  static async update(id: string, data: Partial<Invoice>) {
    const docRef = doc(db, COLLECTIONS.INVOICES, id);
    
    const updateData: any = { ...data };
    
    if (data.issued_date) {
      updateData.issued_date = Timestamp.fromDate(new Date(data.issued_date));
    }
    if (data.due_date) {
      updateData.due_date = Timestamp.fromDate(new Date(data.due_date));
    }
    if (data.paid_date) {
      updateData.paid_date = Timestamp.fromDate(new Date(data.paid_date));
    }
    
    await updateDoc(docRef, updateData);
  }

  // حذف فاتورة
  static async delete(id: string) {
    await deleteDoc(doc(db, COLLECTIONS.INVOICES, id));
  }

  // توليد رقم فاتورة فريد
  static async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // جلب آخر فاتورة لهذا الشهر
    const startOfMonth = new Date(year, new Date().getMonth(), 1);
    const endOfMonth = new Date(year, new Date().getMonth() + 1, 0);
    
    const q = query(
      collection(db, COLLECTIONS.INVOICES),
      where('issued_date', '>=', Timestamp.fromDate(startOfMonth)),
      where('issued_date', '<=', Timestamp.fromDate(endOfMonth)),
      orderBy('issued_date', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const count = snapshot.size + 1;
    
    return `INV-${year}${month}-${String(count).padStart(4, '0')}`;
  }

  // دفع فاتورة
  static async markAsPaid(id: string) {
    await this.update(id, {
      status: 'paid',
      paid_date: new Date()
    });
  }

  // جلب الفواتير غير المدفوعة
  static async getUnpaidInvoices() {
    const q = query(
      collection(db, COLLECTIONS.INVOICES),
      where('status', '==', 'unpaid'),
      orderBy('due_date', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Invoice));
  }
}