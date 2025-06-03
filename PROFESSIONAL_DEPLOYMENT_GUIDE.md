# 🚀 Professional Deployment Guide - Railway + Vercel

## Complete Step-by-Step Guide for Production-Ready Deployment

### Prerequisites
- GitHub account with your repository
- Railway account (free)
- Vercel account (free)
- 30 minutes of your time

---

## Part 1: Backend Deployment on Railway

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. You'll get $5 free credits monthly

### Step 2: Deploy Backend Service
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository: `adsjeddah/ads`
4. **IMPORTANT - Configure deployment settings:**
   ```
   Root Directory: server
   Start Command: npm install && node index.js
   ```

### Step 3: Add Persistent Storage (CRITICAL!)
1. Click on your deployed service
2. Go to **Settings** tab
3. Click **"Add Volume"**
4. Configure:
   ```
   Mount Path: /data
   Size: 1GB
   ```
5. Click **"Add"**

### Step 4: Configure Environment Variables
1. Go to **Variables** tab
2. Add these variables (copy exactly):
   ```
   PORT=5001
   JWT_SECRET=jeddah-ads-secret-key-2024
   DATABASE_PATH=/data/jeddah_ads.db
   UPLOADS_DIR=/data/uploads
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
3. Click **"Add"** after each variable

### Step 5: Get Your Backend URL
1. Go to **Settings** tab
2. Find **"Domains"** section
3. Copy your URL (example: `https://jeddah-ads-backend.up.railway.app`)
4. **SAVE THIS URL - YOU'LL NEED IT!**

### Step 6: Verify Backend is Working
1. Open: `https://your-backend.up.railway.app/api/health`
2. You should see: **OK**
3. If not, check Railway logs for errors

---

## Part 2: Frontend Deployment on Vercel

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Authorize Vercel to access your repositories

### Step 2: Import and Deploy
1. Click **"Add New Project"**
2. Click **"Import Git Repository"**
3. Select your repository: `adsjeddah/ads`
4. Vercel will auto-detect Next.js

### Step 3: Configure Environment Variables
1. Before clicking Deploy, add this variable:
   ```
   Name: NEXT_PUBLIC_API_URL
   Value: https://your-backend.up.railway.app/api
   ```
   (Use YOUR actual Railway backend URL from Part 1, Step 5)
2. Click **"Add"**

### Step 4: Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. You'll get your frontend URL (example: `https://jeddah-ads.vercel.app`)

### Step 5: Update Railway CORS Settings
1. Go back to Railway
2. Update the `FRONTEND_URL` variable:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
   (Use YOUR actual Vercel URL)
3. Railway will automatically redeploy

---

## Part 3: Verification & Testing

### 1. Test Frontend Homepage
- Open your Vercel URL
- Homepage should load
- Check browser console for errors (F12)

### 2. Test API Connection
- On homepage, advertisers should load
- If not, check:
  - Is `NEXT_PUBLIC_API_URL` correct?
  - Does it end with `/api`?
  - Is backend running?

### 3. Test Admin Dashboard
1. Go to: `https://your-app.vercel.app/admin/login`
2. Login with:
   ```
   Email: admin@jeddah-ads.com
   Password: admin123
   ```
3. Dashboard should load with statistics

### 4. Test Core Features
- ✅ View advertisers on homepage
- ✅ Submit ad request form
- ✅ Admin login
- ✅ Add new advertiser
- ✅ Upload company logo
- ✅ Create subscription
- ✅ Generate invoice

---

## Part 4: Troubleshooting Guide

### Issue: No advertisers showing on homepage
**Solution:**
1. Check browser console (F12)
2. Verify `NEXT_PUBLIC_API_URL` is correct
3. Test backend directly: `https://your-backend.up.railway.app/api/advertisers`

### Issue: Cannot upload images
**Solution:**
1. Ensure Volume is mounted in Railway
2. Check `UPLOADS_DIR=/data/uploads` is set
3. Verify Railway logs for errors

### Issue: Admin login not working
**Solution:**
1. Check if backend is running
2. Verify JWT_SECRET is set in Railway
3. Try resetting admin password via database

### Issue: CORS errors
**Solution:**
1. Update `FRONTEND_URL` in Railway to match Vercel URL
2. Wait for Railway to redeploy
3. Clear browser cache

---

## Part 5: Production Checklist

### Security
- [x] Change `JWT_SECRET` to a strong random string
- [x] Update admin password after first login
- [x] Enable HTTPS (automatic on both platforms)

### Performance
- [x] Images are optimized (Next.js does this)
- [x] Database queries are efficient
- [x] Static assets are cached

### Monitoring
- [x] Check Railway dashboard for usage
- [x] Monitor Vercel analytics
- [x] Set up error alerts (optional)

---

## Part 6: Maintenance Tips

### Daily
- Check if services are running
- Monitor error logs

### Weekly
- Review Railway credits usage
- Check database size
- Backup database (download from Railway)

### Monthly
- Update dependencies
- Review and optimize performance
- Clean old data if needed

---

## 🎉 Congratulations!

Your professional ads platform is now live with:
- ✅ Scalable backend on Railway
- ✅ Fast frontend on Vercel
- ✅ Persistent data storage
- ✅ Professional admin dashboard
- ✅ Secure authentication
- ✅ File upload capability

### Important URLs to Save:
```
Frontend: https://your-app.vercel.app
Backend API: https://your-backend.up.railway.app/api
Admin Panel: https://your-app.vercel.app/admin
Health Check: https://your-backend.up.railway.app/api/health
```

### Support Resources:
- Railway Dashboard: https://railway.app/dashboard
- Vercel Dashboard: https://vercel.com/dashboard
- GitHub Repo: https://github.com/adsjeddah/ads

---

## Need Help?
1. Check Railway logs for backend errors
2. Check Vercel logs for frontend errors
3. Use browser DevTools for debugging
4. Review environment variables

Your platform is now production-ready! 🚀