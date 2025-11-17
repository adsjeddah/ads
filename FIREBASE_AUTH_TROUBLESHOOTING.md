# Firebase Authentication Troubleshooting Guide

## Current Issue
The login is failing with "auth/invalid-credential" error even though the admin user exists in Firebase Auth.

## Possible Causes and Solutions

### 1. Email/Password Authentication Not Enabled

**Solution**: Enable Email/Password authentication in Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (jeddah-ads-46daa)
3. Navigate to Authentication → Sign-in method
4. Enable "Email/Password" provider
5. Save the changes

### 2. Firebase API Key Restrictions

**Solution**: Check API key restrictions
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to APIs & Services → Credentials
4. Click on your Web API key (AIzaSyCXVdoybZAESnPFRWqCZjZS4gFgGRRO090)
5. Check if there are any restrictions (HTTP referrers, IP addresses)
6. For local development, ensure localhost:3000 is allowed

### 3. Firebase Authentication Settings

**Solution**: Check authentication settings
1. In Firebase Console, go to Authentication → Settings
2. Ensure "User account linking" is properly configured
3. Check "Authorized domains" and ensure localhost is included

## Admin User Details

- **Email**: admin@yourdomain.com
- **Password**: admin123
- **UID**: huc6w7W9oQS7sHseNhePEcDSLhp1
- **Email Verified**: Yes (verified via script)

## Testing Authentication

Run the following script to test authentication:
```bash
node scripts/test-firebase-auth.js
```

## Manual Testing Steps

1. Open Firebase Console
2. Go to Authentication → Users
3. Verify the admin user exists
4. Try to manually sign in using the Firebase Console's test feature

## Common Error Messages

- **auth/invalid-credential**: Usually means wrong email/password or authentication method not enabled
- **auth/user-not-found**: User doesn't exist in Firebase Auth
- **auth/wrong-password**: Password is incorrect
- **permission-denied**: Firestore security rules blocking access

## Next Steps

1. Enable Email/Password authentication in Firebase Console
2. Deploy the security rules (see FIREBASE_SECURITY_RULES_DEPLOYMENT.md)
3. Restart the development server
4. Try logging in again