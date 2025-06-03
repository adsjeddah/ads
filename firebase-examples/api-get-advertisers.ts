// firebase-examples/api-get-advertisers.ts
// مثال على Next.js API Route لجلب المعلنين من Firestore

import type { NextApiRequest, NextApiResponse } from 'next';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db, COLLECTIONS } from './firebase-config'; // افتراض أن ملف الإعداد موجود هنا

// تعريف نوع المعلن (يمكنك نقله إلى ملف types.ts مشترك)
interface Advertiser {
  id: string; // Firestore IDs are strings
  company_name: string;
  phone: string;
  whatsapp?: string;
  services?: string;
  icon_url?: string;
  email?: string; // قد لا يكون موجودًا لكل معلن
  status: 'active' | 'inactive' | 'pending';
  created_at: any; // Timestamp or Date object
  // أضف أي حقول أخرى ضرورية
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Advertiser[] | { error: string }>
) {
  if (req.method === 'GET') {
    try {
      // استعلام لجلب المعلنين النشطين فقط، مرتبين حسب تاريخ الإنشاء تنازليًا
      const q = query(
        collection(db, COLLECTIONS.ADVERTISERS),
        where('status', '==', 'active'),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const advertisers = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          company_name: data.company_name,
          phone: data.phone,
          whatsapp: data.whatsapp,
          services: data.services,
          icon_url: data.icon_url,
          email: data.email,
          status: data.status,
          created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : data.created_at, // تحويل Timestamp إذا لزم الأمر
          // قم بتعيين باقي الحقول هنا
        } as Advertiser;
      });

      res.status(200).json(advertisers);
    } catch (error: any) {
      console.error('Error fetching advertisers from Firestore:', error);
      res.status(500).json({ error: 'Failed to fetch advertisers: ' + error.message });
    }
  } else {
    // التعامل مع الطلبات غير GET
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}