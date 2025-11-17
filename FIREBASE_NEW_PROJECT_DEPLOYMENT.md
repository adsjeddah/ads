# Firebase New Project Deployment Guide

Since Firebase CLI login requires interactive mode, here's how to deploy to a new Firebase project:

## Option 1: Manual Login and Deploy (Recommended)

### Step 1: Login to Firebase CLI
Open your terminal and run:
```bash
firebase login
```
This will open a browser window for authentication.

### Step 2: Create New Firebase Project (if needed)
```bash
firebase projects:create your-new-project-id
```

### Step 3: Initialize Firebase in Project
```bash
firebase init
```
Select:
- Firestore
- Storage
- Choose existing project or create new one

### Step 4: Deploy Rules
```bash
firebase deploy --only firestore:rules,storage:rules
```

## Option 2: Deploy via Firebase Console

### Create New Firebase Project:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name
4. Follow setup steps

### Deploy Firestore Rules:
1. Go to Firestore Database → Rules
2. Copy content from `firestore.rules` file
3. Paste and publish

### Deploy Storage Rules:
1. Go to Storage → Rules  
2. Copy content from `storage.rules` file
3. Paste and publish

### Enable Authentication:
1. Go to Authentication → Sign-in method
2. Enable Email/Password

## Option 3: Use Firebase CI Token

### Generate CI Token:
```bash
firebase login:ci
```
This generates a token for non-interactive environments.

### Use Token:
```bash
FIREBASE_TOKEN="your-token-here" firebase deploy --only firestore:rules,storage:rules --project your-project-id
```

## Update Environment Variables

After creating new project, update `.env.local`:

```env
# Update these with your new project details
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-new-project-id
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-new-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-new-project-id.firebasestorage.app

FIREBASE_PROJECT_ID=your-new-project-id
FIREBASE_STORAGE_BUCKET=your-new-project-id.firebasestorage.app
```

## Create Admin Users in New Project

Run the admin creation script:
```bash
node scripts/create-admin-auth.js
```

## Files Ready for Deployment:
- `firestore.rules` - Secure Firestore rules
- `storage.rules` - Secure Storage rules  
- `firebase.json` - Firebase configuration
- Admin creation scripts in `scripts/` folder

## Next Steps:
1. Login to Firebase CLI manually in your terminal
2. Create/select your Firebase project
3. Deploy the rules
4. Update environment variables
5. Create admin users
6. Test the application