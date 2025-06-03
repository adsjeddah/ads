# Local Development Setup Guide

This guide will help you set up the Jeddah Ads application for local development with Firebase.

## Prerequisites

1. Node.js installed (v14 or higher)
2. Firebase CLI installed (`npm install -g firebase-tools`)
3. A Firebase project created (jeddah-ads-46daa)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

The `.env.local` file is already configured with your Firebase credentials.

### 3. Deploy Security Rules

**IMPORTANT**: You must deploy the security rules to Firebase for the application to work properly.

#### Option A: Using Firebase CLI (Recommended)

1. Login to Firebase:
   ```bash
   firebase login
   ```

2. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules,storage:rules --project jeddah-ads-46daa
   ```

#### Option B: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (jeddah-ads-46daa)

**For Firestore:**
- Navigate to Firestore Database → Rules
- Copy the contents of `firestore.rules` and paste in the editor
- Click "Publish"

**For Storage:**
- Navigate to Storage → Rules
- Copy the contents of `storage.rules` and paste in the editor
- Click "Publish"

### 4. Create Admin User

The admin user has already been created with:
- Email: admin@yourdomain.com
- Password: admin123
- UID: huc6w7W9oQS7sHseNhePEcDSLhp1

If you need to create additional admin users, use the script:
```bash
node scripts/add-admin-to-firestore.js
```

### 5. Run the Development Server

```bash
npm run dev
```

The application will be available at http://localhost:3000

### 6. Access Admin Panel

1. Navigate to http://localhost:3000/admin/login
2. Login with:
   - Email: admin@yourdomain.com
   - Password: admin123

## Troubleshooting

### "Missing or insufficient permissions" Error

This error occurs when the security rules haven't been deployed. Make sure to deploy the rules as described in step 3.

### "Failed to get document because the client is offline" Error

This usually means the Firebase configuration is incorrect. Check that all environment variables in `.env.local` are correct.

### Login Issues

1. Ensure the admin user exists in Firestore (check the `admins` collection)
2. Verify the email and password are correct
3. Check the browser console for specific error messages

## Temporary Development Rules

If you need to test without proper authentication (NOT recommended for production):

1. Create a file `firestore-temp.rules` with permissive rules
2. Deploy it: `firebase deploy --only firestore:rules --project jeddah-ads-46daa`
3. **Remember to deploy the proper rules before going to production!**

## Project Structure

- `/pages` - Next.js pages
- `/pages/api` - API routes
- `/pages/admin` - Admin panel pages
- `/lib` - Utility functions and Firebase configuration
- `/lib/services` - Service layer for database operations
- `/types` - TypeScript type definitions
- `/styles` - CSS files

## Key Features

- Public landing page for ad requests
- Admin dashboard for managing advertisers
- Invoice management system
- Payment tracking
- Statistics and analytics