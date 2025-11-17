# URGENT: Fix Vercel Environment Variable

## The Problem

Your `NEXT_PUBLIC_API_URL` on Vercel is currently set to:
```
/api/advertisers/active
```

This is causing the URL to become:
```
https://ads-chi-vert.vercel.app/api/advertisers/active/advertisers/?status=active
```

## The Solution

You MUST change it to just:
```
/api
```

## Step-by-Step Fix:

1. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard

2. **Select your project** (jeddah-ads)

3. **Go to Settings → Environment Variables**

4. **Find `NEXT_PUBLIC_API_URL`**

5. **Edit it to be EXACTLY**: `/api`
   - NOT `/api/`
   - NOT `"/api"`
   - NOT `/api/advertisers/active`
   - Just: `/api`

6. **Save the change**

7. **Redeploy**:
   - Go to Deployments tab
   - Click the three dots on the latest deployment
   - Select "Redeploy"

## Verification

After redeployment, the API call should be:
```
https://ads-chi-vert.vercel.app/api/advertisers?status=active
```

NOT:
```
https://ads-chi-vert.vercel.app/api/advertisers/active/advertisers/?status=active
```

## Important

The code is already fixed. You just need to update the environment variable on Vercel.