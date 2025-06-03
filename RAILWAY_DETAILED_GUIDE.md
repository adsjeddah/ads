# 🚂 Railway Backend Deployment - Ultra Detailed Guide

## Complete Step-by-Step with Every Click Explained

### 📋 Before You Start
- Have your GitHub account ready
- Make sure your code is pushed to GitHub
- Have 15-20 minutes available

---

## Step 1: Create Railway Account

### 1.1 Go to Railway
1. Open your browser
2. Type: `railway.app`
3. Press Enter

### 1.2 Sign Up
1. Click **"Start a New Project"** button (purple button)
2. Click **"Login with GitHub"**
3. Authorize Railway to access your GitHub
4. You'll be redirected to Railway dashboard

---

## Step 2: Create New Project

### 2.1 Start New Project
1. In Railway dashboard, click **"New Project"** button (top right)
2. You'll see several options

### 2.2 Choose Deployment Method
1. Click **"Deploy from GitHub repo"**
2. A popup will appear with your GitHub repositories

### 2.3 Select Your Repository
1. Find `adsjeddah/ads` in the list
2. Click on it
3. Railway will start analyzing your repository

---

## Step 3: Configure Deployment Settings (CRITICAL!)

### 3.1 Wait for Initial Setup
1. Railway will create a service automatically
2. Wait for the initial deployment to fail (this is normal!)
3. Click on the service card that appears

### 3.2 Configure Root Directory
1. Click **"Settings"** tab
2. Scroll down to **"Service"** section
3. Find **"Root Directory"** field
4. Type exactly: `server`
5. Press Enter to save

### 3.3 Configure Start Command
1. Still in Settings tab
2. Find **"Start Command"** field
3. Clear any existing command
4. Type exactly: `npm install && node index.js`
5. Press Enter to save

### 3.4 Trigger Redeploy
1. After changing settings, Railway should auto-redeploy
2. If not, click **"Deploy"** tab
3. Click **"Redeploy"** button

---

## Step 4: Add Persistent Volume (VERY IMPORTANT!)

### 4.1 Go to Volumes
1. While in your service, click **"Settings"** tab
2. Scroll down to find **"Volumes"** section
3. Click **"Add Volume"** button

### 4.2 Configure Volume
1. **Mount Path:** Type exactly: `/data`
2. **Size:** Leave as 1GB (default)
3. Click **"Add"** button
4. Wait for volume to be created (few seconds)

### 4.3 Verify Volume
1. You should see the volume listed
2. Status should be "Attached"
3. Mount path should show `/data`

---

## Step 5: Add Environment Variables

### 5.1 Go to Variables
1. Click **"Variables"** tab (next to Settings)
2. You'll see an empty variables section

### 5.2 Add Each Variable (Copy Exactly!)

#### Variable 1: PORT
1. Click **"New Variable"**
2. **Variable name:** `PORT`
3. **Value:** `5001`
4. Click **"Add"**

#### Variable 2: JWT_SECRET
1. Click **"New Variable"** again
2. **Variable name:** `JWT_SECRET`
3. **Value:** `jeddah-ads-secret-key-2024`
4. Click **"Add"**

#### Variable 3: DATABASE_PATH
1. Click **"New Variable"**
2. **Variable name:** `DATABASE_PATH`
3. **Value:** `/data/jeddah_ads.db`
4. Click **"Add"**

#### Variable 4: UPLOADS_DIR
1. Click **"New Variable"**
2. **Variable name:** `UPLOADS_DIR`
3. **Value:** `/data/uploads`
4. Click **"Add"**

#### Variable 5: NODE_ENV
1. Click **"New Variable"**
2. **Variable name:** `NODE_ENV`
3. **Value:** `production`
4. Click **"Add"**

#### Variable 6: FRONTEND_URL
1. Click **"New Variable"**
2. **Variable name:** `FRONTEND_URL`
3. **Value:** `http://localhost:3000` (temporary, will update later)
4. Click **"Add"**

### 5.3 Verify All Variables
1. You should see 6 variables listed
2. Double-check each name and value
3. Railway will auto-redeploy after adding variables

---

## Step 6: Get Your Backend URL

### 6.1 Generate Domain
1. Click **"Settings"** tab
2. Scroll to **"Domains"** section
3. Click **"Generate Domain"** button
4. Railway will create a URL like: `your-app-name.up.railway.app`

### 6.2 Copy Your URL
1. Click the copy icon next to your domain
2. Save this URL in a notepad - YOU NEED IT!
3. Your backend URL is: `https://your-app-name.up.railway.app`

---

## Step 7: Verify Backend is Working

### 7.1 Check Deployment Status
1. Click **"Deployments"** tab
2. Latest deployment should show "Success" (green)
3. If it shows "Failed" (red), check logs

### 7.2 Test Health Endpoint
1. Open a new browser tab
2. Go to: `https://your-app-name.up.railway.app/api/health`
3. You should see: **OK**
4. If you see error, check next section

### 7.3 Check Logs (If Needed)
1. Click **"Deployments"** tab
2. Click on the latest deployment
3. Click **"View Logs"**
4. Look for any error messages

---

## Step 8: Common Issues & Solutions

### Issue: "Cannot find module express"
**Solution:**
1. Check Start Command is: `npm install && node index.js`
2. Redeploy

### Issue: "ENOENT: no such file or directory"
**Solution:**
1. Verify Root Directory is set to: `server`
2. Check Volume is mounted at: `/data`

### Issue: "Port is already in use"
**Solution:**
1. Make sure PORT variable is set to: `5001`
2. Redeploy

### Issue: Build keeps failing
**Solution:**
1. Check **"Build Logs"** in Deployments
2. Make sure all files are pushed to GitHub
3. Try clicking **"Redeploy"** button

---

## Step 9: Final Checks

### 9.1 Service Health
1. Your service card should show "Active"
2. Memory usage should be visible
3. No error indicators

### 9.2 Test API Endpoints
Test these URLs in browser:
- `https://your-app.up.railway.app/api/health` → Should show "OK"
- `https://your-app.up.railway.app/api/advertisers` → Should show JSON data
- `https://your-app.up.railway.app/api/plans` → Should show plans

### 9.3 Monitor Usage
1. Click **"Usage"** tab
2. Check your credits (you have $5 free)
3. Current usage should be minimal

---

## Step 10: Important URLs to Save

Copy and save these:
```
Backend URL: https://your-app-name.up.railway.app
API Base URL: https://your-app-name.up.railway.app/api
Health Check: https://your-app-name.up.railway.app/api/health
```

---

## ✅ Railway Deployment Complete!

Your backend is now:
- ✅ Running 24/7
- ✅ Data persisted in volume
- ✅ Ready for frontend connection
- ✅ Accessible via HTTPS

### Next Steps:
1. Deploy frontend to Vercel
2. Update `FRONTEND_URL` in Railway after Vercel deployment
3. Test full application

### Need Help?
- Check deployment logs
- Verify all environment variables
- Ensure volume is attached
- Make sure GitHub repo is up to date

---

## 📊 Railway Dashboard Overview

### Key Sections:
- **Deployments:** See all deploys and logs
- **Settings:** Configure service settings
- **Variables:** Manage environment variables  
- **Volumes:** Manage persistent storage
- **Usage:** Monitor resource usage
- **Domains:** Manage URLs

### Tips:
- Railway auto-deploys on GitHub push
- You can rollback to previous deployments
- Logs are retained for debugging
- Volume backups are automatic

Your backend is production-ready! 🚀