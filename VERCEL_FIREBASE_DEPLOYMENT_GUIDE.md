# 🔥 Professional Deployment Guide: Vercel + Firebase

This guide assumes your Next.js project has been refactored to use Firebase for its backend (Firestore, Firebase Storage, Firebase Authentication) via Next.js API Routes.

## Prerequisites:
- Firebase Project created and configured.
- Vercel Account linked to your GitHub repository.
- All necessary Firebase SDKs installed (`firebase`, `firebase-admin`).
- Frontend pages updated to use new API routes or Firebase Client SDK.

---

## Part 1: Firebase Project Setup (Recap)

Ensure your Firebase project has the following enabled and configured:

### 1.1 Authentication:
- Enable desired sign-in methods (e.g., Email/Password).
- Note your Web API Key and Auth Domain.

### 1.2 Firestore Database:
- Set up Firestore in Native mode.
- Define security rules for your collections (e.g., `advertisers`, `plans`, etc.).
  Example basic rules (restrict write access to authenticated users, allow public reads for some collections):
  ```firestore.rules
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      // Allow public read for advertisers and plans
      match /advertisers/{advertiserId} {
        allow read: if true;
        allow write: if request.auth != null && request.auth.token.admin == true; // Admin only
      }
      match /plans/{planId} {
        allow read: if true;
        allow write: if request.auth != null && request.auth.token.admin == true; // Admin only
      }
      // Restrict other collections to authenticated users or admins
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.token.admin == true; // Admin only for others
      }
    }
  }
  ```
- Create initial data if needed (e.g., default plans, first admin user via `setup-admin` API).

### 1.3 Firebase Storage:
- Set up Firebase Storage.
- Define security rules for file uploads (e.g., allow authenticated users to write to specific paths).
  Example basic rules:
  ```storage.rules
  rules_version = '2';
  service firebase.storage {
    match /b/{bucket}/o {
      // Allow public read for logos
      match /logos/{allPaths=**} {
        allow read: if true;
        allow write: if request.auth != null; // Or admin only: request.auth.token.admin == true
      }
      // Restrict other paths
      match /{allPaths=**} {
        allow read, write: if request.auth != null && request.auth.token.admin == true;
      }
    }
  }
  ```

### 1.4 Firebase Admin SDK Setup (for API Routes):
- Generate a private key JSON file for your service account from Firebase Project Settings > Service accounts.
- Store the necessary credentials (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) securely as environment variables for Vercel.

---

## Part 2: Vercel Deployment

### 2.1 Connect Your GitHub Repository:
- If not already done, go to your Vercel dashboard.
- Click "Add New..." > "Project".
- Import your Git repository (e.g., `adsjeddah/ads`).
- Vercel should automatically detect it as a Next.js project.

### 2.2 Configure Environment Variables on Vercel:
Navigate to your Project Settings > Environment Variables on Vercel. Add the following:

**Client-side Firebase Configuration (for `lib/firebase.ts`):**
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Your Firebase Web API Key.
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Your Firebase Auth Domain (e.g., `your-project-id.firebaseapp.com`).
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Your Firebase Project ID.
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Your Firebase Storage Bucket URL (e.g., `your-project-id.appspot.com`).
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase Messaging Sender ID.
- `NEXT_PUBLIC_FIREBASE_APP_ID`: Your Firebase App ID.

**Server-side Firebase Admin SDK Configuration (for `lib/firebase-admin.ts`):**
- `FIREBASE_PROJECT_ID`: Your Firebase Project ID.
- `FIREBASE_CLIENT_EMAIL`: Service account client email.
- `FIREBASE_PRIVATE_KEY`: Service account private key (ensure newlines `\n` are correctly formatted or use Base64 encoding if Vercel has issues with multiline variables).
- `FIREBASE_STORAGE_BUCKET`: Your Firebase Storage Bucket URL (same as `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`).

**(Optional) Admin Setup Secret:**
- `ADMIN_SETUP_SECRET`: A secret key if you protected the `pages/api/auth/setup-admin.ts` endpoint.

### 2.3 Build and Deploy Settings:
- Vercel usually auto-detects Next.js settings correctly.
- **Build Command**: `npm run build` (or `yarn build`)
- **Output Directory**: `.next`
- **Install Command**: `npm install` (or `yarn install`)

### 2.4 Deploy:
- Click the "Deploy" button on Vercel.
- Monitor the build logs for any errors.

---

## Part 3: Post-Deployment Steps

### 3.1 Initial Admin Setup:
- If you haven't created an admin user yet, call the `POST /api/auth/setup-admin` endpoint once (e.g., using Postman or a simple script) with the required email, password, and name.
  - **Important**: Protect or remove this endpoint after the initial setup, especially in production.

### 3.2 Test Authentication:
- Go to your admin login page (`/admin/login`).
- Try logging in with the admin credentials you set up.
- Ensure admin pages are protected and accessible only to authenticated admins.

### 3.3 Test Core Functionalities:
- **Public Pages**:
  - Homepage: Advertisers and plans load correctly.
  - Ad Request Form: Submissions work.
- **Admin Dashboard**:
  - All data displays correctly (advertisers, subscriptions, invoices, etc.).
  - CRUD operations (Create, Read, Update, Delete) for all entities work.
  - File uploads (e.g., advertiser logos) to Firebase Storage work.
  - Statistics are recorded and displayed.

### 3.4 Check Firestore and Storage Rules:
- Review your Firestore and Firebase Storage security rules to ensure they are appropriate for production (not too permissive, not too restrictive).
- Test access patterns to confirm rules are working as expected.

### 3.5 Custom Domain (Optional):
- In Vercel, go to Project Settings > Domains.
- Add your custom domain and follow the DNS configuration instructions.

---

## Part 4: Troubleshooting Common Issues

### 4.1 Firebase API Key Errors / Permission Denied (Client-side):
- **Cause**: Incorrect `NEXT_PUBLIC_FIREBASE_...` environment variables on Vercel.
- **Solution**: Double-check all `NEXT_PUBLIC_` variables in Vercel settings against your Firebase project's web app configuration. Ensure your Firestore/Storage rules allow access.

### 4.2 Firebase Admin SDK Errors (Server-side / API Routes):
- **Cause**: Incorrect `FIREBASE_...` (non-public) environment variables, especially `FIREBASE_PRIVATE_KEY`.
- **Solution**:
  - Verify service account credentials.
  - Ensure `FIREBASE_PRIVATE_KEY` is correctly formatted (newlines `\n` must be preserved). Some platforms require Base64 encoding for multiline secrets. If so, encode the key to Base64 and decode it in `lib/firebase-admin.ts`.
  - Check IAM permissions for the service account in Google Cloud Console.

### 4.3 CORS Issues:
- **Cause**: Next.js API routes generally handle CORS well, but if you encounter issues, it might be related to how Firebase Functions (if you were to use them directly) or other services are configured. For Next.js API routes, Vercel handles this.
- **Solution**: Usually not an issue with Vercel + Next.js API routes. If calling external APIs, ensure they have proper CORS headers.

### 4.4 File Uploads Failing:
- **Cause**: Incorrect Firebase Storage bucket configuration or restrictive Storage rules.
- **Solution**:
  - Verify `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` and `FIREBASE_STORAGE_BUCKET` environment variables.
  - Check Firebase Storage rules to allow writes to the target paths for authenticated users (or admins).

### 4.5 Admin Authentication / Authorization Failing:
- **Cause**: Custom claims not set correctly, ID token verification issues, or incorrect logic in `verifyAdminToken`.
- **Solution**:
  - Ensure the `setAdminClaim` function was successfully called for the admin user.
  - Verify that ID tokens are being passed correctly from the client to API routes needing admin access.
  - Debug the `verifyAdminToken` function.

---

## Congratulations!
Your Jeddah Ads platform should now be professionally deployed on Vercel, using Firebase as its backend.
Remember to monitor your Firebase project usage (Firestore reads/writes, Storage, Authentication) and Vercel analytics.