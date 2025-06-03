# Firebase Security Rules Deployment Guide

This guide explains how to deploy the Firestore and Storage security rules to your Firebase project.

## Prerequisites

1. Firebase CLI installed (you already have version 14.4.0)
2. You must be logged in to Firebase CLI with an account that has permissions to deploy to the project

## Steps to Deploy Security Rules

1. **Login to Firebase CLI** (if not already logged in):
   ```bash
   firebase login
   ```
   This will open a browser window for authentication.

2. **Deploy the security rules**:
   ```bash
   firebase deploy --only firestore:rules,storage:rules --project jeddah-ads-46daa
   ```

   Or if you want to deploy them separately:
   - For Firestore rules only:
     ```bash
     firebase deploy --only firestore:rules --project jeddah-ads-46daa
     ```
   - For Storage rules only:
     ```bash
     firebase deploy --only storage:rules --project jeddah-ads-46daa
     ```

## Alternative: Deploy via Firebase Console

If you prefer to deploy via the Firebase Console:

### Firestore Rules:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (jeddah-ads-46daa)
3. Navigate to Firestore Database → Rules
4. Copy the contents of `firestore.rules` and paste them in the editor
5. Click "Publish"

### Storage Rules:
1. In Firebase Console, navigate to Storage → Rules
2. Copy the contents of `storage.rules` and paste them in the editor
3. Click "Publish"

## Important Notes

- The security rules are essential for the application to work properly
- Without these rules, users (including admins) won't be able to access the database
- The rules ensure that only authenticated admins can modify data
- Public users can read advertiser information and create ad requests

## Current Security Rules Summary

### Firestore Rules:
- **Admins collection**: Only admins can read/write
- **Advertisers**: Public can read, only admins can write
- **Plans**: Public can read, only admins can write
- **Ad Requests**: Public can create, only admins can read/update/delete
- **Other collections**: Admin-only access

### Storage Rules:
- All files: Public can read, only admins can write
- Advertiser logos: Public can read, only admins can write