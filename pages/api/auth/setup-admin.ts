import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb, setAdminClaim } from '../../../lib/firebase-admin';
import { COLLECTIONS } from '../../../lib/firebase';
import { Admin } from '../../../types/models';
import bcrypt from 'bcryptjs'; // If storing a fallback hashed password
import { Timestamp } from 'firebase-admin/firestore';

// WARNING: This endpoint should be protected or removed after initial setup.
// It allows creating an admin user and setting custom claims.

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string; uid?: string; error?: string }>
) {
  if (req.method === 'POST') {
    // Add a secret key to protect this endpoint in production if not removed
    // const { secret, email, password, name } = req.body;
    // if (secret !== process.env.ADMIN_SETUP_SECRET) {
    //   return res.status(403).json({ error: 'Forbidden: Invalid secret' });
    // }
    
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Validation error', error: 'Email, password, and name are required' });
    }

    try {
      // Check if an admin already exists to prevent multiple super admins from being created easily
      const adminQuery = await adminDb.collection(COLLECTIONS.ADMINS).where('role', '==', 'super_admin').limit(1).get();
      if (!adminQuery.empty && process.env.NODE_ENV === 'production') { // Allow in dev for easier testing
         // Comment out this block if you need to create multiple admins or reset
        // return res.status(403).json({ error: 'Super admin already exists. This endpoint is for initial setup only.' });
      }

      // Create user in Firebase Authentication
      const userRecord = await adminAuth.createUser({
        email: email,
        password: password,
        displayName: name,
        emailVerified: true, // Or send verification email
      });

      // Set custom admin claim
      await setAdminClaim(userRecord.uid);

      // Store admin details in Firestore (optional, but good for roles/details)
      const adminData: Admin = {
        email: userRecord.email!,
        name: userRecord.displayName!,
        role: 'super_admin', // First admin is super_admin
        created_at: Timestamp.now().toDate(),
      };
      await adminDb.collection(COLLECTIONS.ADMINS).doc(userRecord.uid).set(adminData);
      
      // Optionally, store a hashed password in Firestore as a fallback or for other systems
      // const hashedPassword = await bcrypt.hash(password, 10);
      // await adminDb.collection(COLLECTIONS.ADMINS).doc(userRecord.uid).update({ passwordHash: hashedPassword });


      res.status(201).json({ message: 'Admin user created successfully and custom claim set.', uid: userRecord.uid });
    } catch (error: any) {
      console.error('Error setting up admin user:', error);
      if (error.code === 'auth/email-already-exists') {
        return res.status(409).json({ message: 'Conflict', error: 'Email already exists. Try logging in or use a different email.' });
      }
      res.status(500).json({ message: 'Internal server error', error: 'Failed to set up admin user: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}