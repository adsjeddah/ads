import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '../../../lib/firebase-admin';
import { COLLECTIONS } from '../../../lib/firebase';
import { Admin } from '../../../types/models';
import bcrypt from 'bcryptjs'; // If you store hashed passwords for admins in Firestore

// This API route is an example. Actual login flow will primarily use Firebase Client SDK.
// This route could be used to:
// 1. Verify a Firebase ID token from the client.
// 2. Check if the authenticated user is an admin (e.g., by checking a custom claim or a role in Firestore).
// 3. Create a session cookie (if using custom session management).

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ isAdmin?: boolean; message?: string; error?: string; token?: string }>
) {
  if (req.method === 'POST') {
    try {
      const { idToken, email, password } // idToken from Firebase client auth, or email/password for custom check
        = req.body;

      if (idToken) {
        // Option 1: Verify Firebase ID Token and check custom claims
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        if (decodedToken.admin === true) {
          // Optionally, create a session cookie here if not relying on client-side Firebase auth persistence
          // For now, just confirm admin status
          return res.status(200).json({ isAdmin: true, message: 'Admin verified' });
        } else {
          return res.status(403).json({ error: 'Forbidden: User is not an admin' });
        }
      } else if (email && password) {
        // Option 2: Custom email/password check against Firestore 'admins' collection
        // This is less secure than Firebase Auth but shown as an alternative if needed.
        // Assumes you have an 'admins' collection with email and hashed password.
        const adminQuery = await adminDb.collection(COLLECTIONS.ADMINS).where('email', '==', email).limit(1).get();
        if (adminQuery.empty) {
          return res.status(401).json({ error: 'Invalid admin credentials' });
        }
        const adminDoc = adminQuery.docs[0];
        const adminData = adminDoc.data() as Admin & { passwordHash?: string }; // Assuming passwordHash field

        // if (adminData.passwordHash && await bcrypt.compare(password, adminData.passwordHash)) {
        //   // Generate a custom token or session if needed
        //   const customToken = await adminAuth.createCustomToken(adminDoc.id);
        //   return res.status(200).json({ isAdmin: true, token: customToken, message: 'Admin login successful' });
        // } else {
        //   return res.status(401).json({ error: 'Invalid admin credentials' });
        // }
        return res.status(501).json({ error: 'Custom admin password check not fully implemented. Use Firebase Auth.' });

      } else {
        return res.status(400).json({ error: 'ID token or email/password required' });
      }

    } catch (error: any) {
      console.error('Admin login error:', error);
      if (error.code === 'auth/id-token-expired' || error.message.includes('Forbidden')) {
        return res.status(403).json({ error: 'Forbidden: ' + error.message });
      }
      return res.status(500).json({ error: 'Admin login failed: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}