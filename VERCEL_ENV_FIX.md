# Urgent: Fix Vercel Environment Variables

## The Problem
Your Vercel deployment is using an incorrect environment variable:
```
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

This is causing the malformed URL:
```
https://ads-chi-vert.vercel.app/%22http:/localhost:3000/api%22/advertisers/active
```

## Immediate Fix Required

### Step 1: Update Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your `jeddah-ads` project
3. Go to **Settings** → **Environment Variables**
4. Find `NEXT_PUBLIC_API_URL`
5. Click the three dots → **Edit**
6. Change the value to exactly: `/api` (NO quotes, NO http://, just `/api`)
7. Click **Save**

### Step 2: Add Missing Firebase Variables (if not already set)

Add these environment variables in Vercel:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCXVdoybZAESnPFRWqCZjZS4gFgGRRO090
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=jeddah-ads-46daa.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=jeddah-ads-46daa
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=jeddah-ads-46daa.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=210776216129
NEXT_PUBLIC_FIREBASE_APP_ID=1:210776216129:web:8a911e71d3406771acecc0

FIREBASE_PROJECT_ID=jeddah-ads-46daa
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@jeddah-ads-46daa.iam.gserviceaccount.com
```

For `FIREBASE_PRIVATE_KEY`, you need to add the entire private key (the long string starting with `-----BEGIN PRIVATE KEY-----`).

### Step 3: Redeploy

1. Go to the **Deployments** tab
2. Find the latest deployment
3. Click the three dots → **Redeploy**
4. Wait for deployment to complete

### Step 4: Verify

After redeployment, the API calls should go to:
- `https://ads-chi-vert.vercel.app/api/advertisers/active` ✅
- NOT `https://ads-chi-vert.vercel.app/%22http:/localhost:3000/api%22/advertisers/active` ❌

## Alternative: Force Redeploy from GitHub

If the above doesn't work:

1. Make a small change to trigger a new deployment:
   ```bash
   echo "# Deploy trigger $(date)" >> README.md
   git add README.md
   git commit -m "Trigger Vercel deployment"
   git push
   ```

2. This will automatically trigger a new deployment with the updated environment variables.

## Important Notes

- NEVER use quotes in Vercel environment variable values
- Always use relative paths for API URLs (`/api` not `http://localhost:3000/api`)
- The code is already fixed to handle this correctly
- You just need to update the Vercel environment variables