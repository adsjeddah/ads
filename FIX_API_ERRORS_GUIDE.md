# Fix API Errors Guide

## Issues Found and Fixed

### 1. **Missing pattern.svg file**
- **Error**: `GET https://ads-chi-vert.vercel.app/pattern.svg 404 (Not Found)`
- **Fix**: Created `public/pattern.svg` file

### 2. **Malformed API URL**
- **Error**: `GET https://ads-chi-vert.vercel.app/%22http:/localhost:3000/api%22/advertisers/active 404`
- **Issue**: The `NEXT_PUBLIC_API_URL` environment variable contains quotes and incorrect URL
- **Fix**: Updated to use relative path `/api` instead of full URL

### 3. **Hardcoded localhost URLs**
- **Error**: `GET http://localhost:5001/api/plans net::ERR_CONNECTION_REFUSED`
- **Fix**: Replaced all hardcoded URLs with `process.env.NEXT_PUBLIC_API_URL || '/api'`

## Steps to Deploy the Fixes

### 1. Update Vercel Environment Variables

Go to your Vercel project settings and update the environment variables:

```
NEXT_PUBLIC_API_URL=/api
```

**Important**: Do NOT include quotes around the value. Just use `/api`

### 2. Remove Old Environment Variables

If you have any of these variables set, remove them:
- Any variable with `localhost` in the value
- Any variable with quotes around the value

### 3. Redeploy

After updating the environment variables:
1. Go to your Vercel dashboard
2. Click on your project
3. Go to the "Deployments" tab
4. Click on the three dots next to the latest deployment
5. Select "Redeploy"

### 4. Verify the Fix

After redeployment, check:
1. The pattern.svg should load without 404 error
2. API calls should go to `/api/advertisers/active` (relative path)
3. No more localhost:5001 errors

## Local Development

For local development, the `.env.local` file should contain:
```
NEXT_PUBLIC_API_URL=/api
```

This will automatically resolve to `http://localhost:3000/api` in development and `https://your-domain.vercel.app/api` in production.

## Files Modified

1. `public/pattern.svg` - Created missing asset
2. `pages/admin/advertisers/new.tsx` - Fixed hardcoded API URLs
3. `.env.local` - Created with correct configuration
4. `.env.local.example` - Updated documentation

## Additional Notes

- Always use relative API paths (`/api`) instead of absolute URLs
- This approach works seamlessly in both development and production
- No need to change code when deploying to different environments