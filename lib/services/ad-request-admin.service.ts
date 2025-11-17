import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../firebase-admin';
import { AdRequest } from '../../types/models';

export class AdRequestAdminService {
  // Get all ad requests
  static async getAll(status?: string): Promise<AdRequest[]> {
    try {
      let query = adminDb.collection('ad_requests').orderBy('created_at', 'desc');

      if (status) {
        query = query.where('status', '==', status) as any;
      }

      const snapshot = await query.get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdRequest[];
    } catch (error) {
      console.error('Error fetching ad requests:', error);
      throw error;
    }
  }

  // Get single ad request by ID
  static async getById(id: string): Promise<AdRequest | null> {
    try {
      const doc = await adminDb.collection('ad_requests').doc(id).get();

      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data()
      } as AdRequest;
    } catch (error) {
      console.error('Error fetching ad request:', error);
      throw error;
    }
  }

  // Update ad request
  static async update(id: string, data: Partial<AdRequest>): Promise<void> {
    try {
      const updateData: any = {
        ...data,
        updated_at: FieldValue.serverTimestamp()
      };

      await adminDb.collection('ad_requests').doc(id).update(updateData);
    } catch (error) {
      console.error('Error updating ad request:', error);
      throw error;
    }
  }

  // Delete ad request
  static async delete(id: string): Promise<void> {
    try {
      await adminDb.collection('ad_requests').doc(id).delete();
    } catch (error) {
      console.error('Error deleting ad request:', error);
      throw error;
    }
  }

  // Get statistics about ad requests
  static async getStats() {
    try {
      const snapshot = await adminDb.collection('ad_requests').get();
      
      const stats = {
        total: snapshot.size,
        pending: 0,
        approved: 0,
        rejected: 0
      };

      snapshot.docs.forEach(doc => {
        const status = doc.data().status;
        if (status === 'pending') stats.pending++;
        else if (status === 'approved') stats.approved++;
        else if (status === 'rejected') stats.rejected++;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching ad request stats:', error);
      throw error;
    }
  }
}

