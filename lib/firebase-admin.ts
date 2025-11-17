import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// Validate required environment variables
if (!process.env.FIREBASE_PROJECT_ID) {
  throw new Error('Missing FIREBASE_PROJECT_ID environment variable');
}
if (!process.env.FIREBASE_CLIENT_EMAIL) {
  throw new Error('Missing FIREBASE_CLIENT_EMAIL environment variable');
}
if (!process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error('Missing FIREBASE_PRIVATE_KEY environment variable');
}

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  } as any),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
};

// Initialize admin app
const adminApp = !getApps().length 
  ? initializeApp(firebaseAdminConfig, 'admin')
  : getApps()[0];

// Admin services
export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
export const adminStorage = getStorage(adminApp);

// Helper to verify admin token
export async function verifyAdminToken(token: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    // Check if user has admin claim
    if (decodedToken.admin === true) {
      return decodedToken;
    }
    throw new Error('User is not an admin');
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Set admin claim
export async function setAdminClaim(uid: string) {
  await adminAuth.setCustomUserClaims(uid, { admin: true });
}