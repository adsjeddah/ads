/**
 * Ad Request Admin Service - Uses Firebase Admin SDK
 * For server-side operations with full permissions
 */

import { adminDb } from '../firebase-admin';
import { AdRequest } from '../../types/models';

export class AdRequestAdminService {
  private static collection = 'ad_requests';

  /**
   * Get all ad requests
   */
  static async getAll(status?: string): Promise<AdRequest[]> {
    try {
      let query = adminDb.collection(this.collection).orderBy('created_at', 'desc');
      
      if (status) {
        query = query.where('status', '==', status);
      }
      
      const snapshot = await query.get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AdRequest));
    } catch (error) {
      console.error('Error getting ad requests:', error);
      throw error;
    }
  }

  /**
   * Get ad request by ID
   */
  static async getById(id: string): Promise<AdRequest | null> {
    try {
      const doc = await adminDb.collection(this.collection).doc(id).get();
      
      if (!doc.exists) {
        return null;
      }
      
      return {
        id: doc.id,
        ...doc.data()
      } as AdRequest;
    } catch (error) {
      console.error(`Error getting ad request ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new ad request
   */
  static async create(data: Omit<AdRequest, 'id' | 'created_at' | 'status'>): Promise<string> {
    try {
      const requestData = {
        ...data,
        status: 'pending',
        created_at: new Date()
      };
      
      const docRef = await adminDb.collection(this.collection).add(requestData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating ad request:', error);
      throw error;
    }
  }

  /**
   * Update ad request
   */
  static async update(id: string, data: Partial<AdRequest>): Promise<void> {
    try {
      await adminDb.collection(this.collection).doc(id).update(data);
    } catch (error) {
      console.error(`Error updating ad request ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete ad request
   */
  static async delete(id: string): Promise<void> {
    try {
      await adminDb.collection(this.collection).doc(id).delete();
    } catch (error) {
      console.error(`Error deleting ad request ${id}:`, error);
      throw error;
    }
  }

  /**
   * Convert ad request to advertiser
   */
  static async convertToAdvertiser(requestId: string): Promise<boolean> {
    try {
      await this.update(requestId, { status: 'converted' });
      return true;
    } catch (error) {
      console.error(`Error converting ad request ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Get ad requests statistics
   */
  static async getStatistics() {
    try {
      const allRequests = await this.getAll();
      
      const stats = {
        total: allRequests.length,
        pending: allRequests.filter(r => r.status === 'pending').length,
        contacted: allRequests.filter(r => r.status === 'contacted').length,
        converted: allRequests.filter(r => r.status === 'converted').length,
        rejected: allRequests.filter(r => r.status === 'rejected').length
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting ad request statistics:', error);
      throw error;
    }
  }

  /**
   * Update multiple ad requests at once
   */
  static async batchUpdate(updates: { id: string; data: Partial<AdRequest> }[]): Promise<void> {
    try {
      const batch = adminDb.batch();
      
      updates.forEach(({ id, data }) => {
        const docRef = adminDb.collection(this.collection).doc(id);
        batch.update(docRef, data);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error batch updating ad requests:', error);
      throw error;
    }
  }
}
