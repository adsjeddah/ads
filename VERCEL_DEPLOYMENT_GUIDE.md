# Vercel Deployment Guide for Jeddah Ads

## Pre-Deployment Checklist

### 1. Firebase Setup ✅
- [x] Firebase project created (jeddah-ads-46daa)
- [x] Admin users created in Firebase Auth
- [x] Firestore and Storage rules prepared
- [ ] Email/Password authentication enabled in Firebase Console
- [ ] Security rules deployed to Firebase

### 2. Environment Variables
You'll need to add these to Vercel:

```env
# Firebase Client SDK (Public)
NEXT_PUBLIC_API_URL=https://your-vercel-domain.vercel.app/api
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCXVdoybZAESnPFRWqCZjZS4gFgGRRO090
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=jeddah-ads-46daa.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=jeddah-ads-46daa
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=jeddah-ads-46daa.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=210776216129
NEXT_PUBLIC_FIREBASE_APP_ID=1:210776216129:web:8a911e71d3406771acecc0

# Firebase Admin SDK (Private)
FIREBASE_PROJECT_ID=jeddah-ads-46daa
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@jeddah-ads-46daa.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCqvyAzE8zPdbj3\ndg4jxIYPK/aB3/l4h28OsIn6km4svLL4uhg71+QB5F0p9i1P9Pw1E4QjsO+zUApH\nb9EvL46Axv1bgFKqMd3wEoe6YGe+hOHIxtwpBd7DWTUfRJ1zK9LsfAGkImp1vf7w\nVyMsAUffivt+FNGXM4rQfbmATH24wbr76LZciLeY9qmUpEaVimmaonltsjecjANL\nK22y0AQ25dhfQc6M3nCiL7nh9gd9EKKYkjEslXJYXMtV0Jgz+DiRlEs7UwyAbxLX\njzrDvREBd/Ibb1uAHIG+htfgi9U/lvvfsryb26gscepm2S+xGQuilol6jMe3Vwym\nj2SLiBorAgMBAAECggEAGi+zvYGk4JBabMFTS9MBCGSiqqpx9TU4KBWVI7O/Z+cM\nv66ytsLWeh/O1femXWPiJjW3B05EhMiauvgAKe9uOHvMMXNNukJpmj8NR90vK/3v\nLr6o1zXKQ0V0KzZ3u0kWUSR3j/ejQimAZtXGVCJiJnuHNH/24OyLtowBnhadFW+I\nhj3koyFm7w9Zyh6MGKHiRDXk3m0nGKCA03Aa2XbOu/nplbktMOhFC2vsbARaUMYI\n2g1G/RZN5V7unhtQDkUScBteg6U9/bhjwsMGlKQYDazswJoKl5VBwuWeg+d1+B3Y\nm+TPuwYiNyzDlatDNvxyX4BNuIGcbKxyA1SqfzxTOQKBgQDdDMauQaPX1iDa62HA\ngi7TNwLUTjBi0p7bjCOjaqOxJFmX19OlGL5AzPu0m5+K4wuDFaBao4w2eIXAA9pj\nhimAGt03EzeVvf7jVKLJI6OTukKFoI2a0WgUVKBUK3wrEp/LBrCqG9cnkTSjY2fj\nQ4yml+9ia+k4MZf4wxpj849ZBwKBgQDFvkVJDZ+EcGGXTXuFNH6wFgmfxCU1ZwlD\nQWNfkrudPzS49gCKcQ69tYtwH5P9EdKMi/u4Kmg84EB9oQXQl5GgDw6G+buAdu9l\ngRHZx/fz+YaCeQccxDSVjPaM1nP+pTBt2u7gm7uGQL6e5lWKAh/H8X8oqqkJ2R0E\n9/5+i7mgvQKBgE1cY0wo/MZU0jrLlfJhnTGeVwcmNhjfzWjYqsBOWets5U4W4qMs\n/aiAFLcon7VjsGu37d7Kzg9iLqz8rDmYgn2q6TCVMSbez42P2Ui7iEvzK8TIY8aC\n8wHqfBH5BgOtCO9s7/cYtzvJvbpQ19LZmSfUlJrFWWGpOZ596YaBfvGRAoGBAKKX\ni6LAx9v/B89/z0O84TpqNGmgvzOE0DHzzwDjxs5KDVDUPaeXxJYqc0ezP1zDzcrw\nwv4wKFt9zKk/wGc+aWghWUGUkB7WLIvar9HRQcji8D3RxA5cKhyZtpQhNWk5bHO3\no9kdU/jUvagsHkOG8ZjWska+5JULZ3gRbbmhq/VFAoGBAI9ww2GWLH6fYOgVGZ12\n3B6i1zX5/10+sYicVAq64JnOnOU6+XeNBW8iigaHYhNGprtCixFnGYFZG/asQoi0\nDzC+EkTqXhuewjpUuSt7o150pdUdgip7i8bRpVjqP41HYw0skl/KBDNnV7iqjpao\nyIEoKqfnW97bsfJ8h0v3r2Hl\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=jeddah-ads-46daa.firebasestorage.app
```

## Deployment Steps

### 1. Prepare the Repository

```bash
# Add all files
git add .

# Commit changes
git commit -m "Setup Firebase integration and admin authentication"

# Push to GitHub
git push origin main
```

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy
vercel

# Follow the prompts and add environment variables when asked
```

#### Option B: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables in the project settings
4. Deploy

### 3. Post-Deployment Setup

1. **Update API URL**:
   - After deployment, update `NEXT_PUBLIC_API_URL` in Vercel to your actual domain
   - Example: `https://jeddah-ads.vercel.app/api`

2. **Deploy Firebase Rules**:
   ```bash
   firebase deploy --only firestore:rules,storage:rules --project jeddah-ads-46daa
   ```

3. **Update Authorized Domains**:
   - Go to Firebase Console → Authentication → Settings
   - Add your Vercel domain to authorized domains

## Important Notes

### Security Considerations
- The current setup uses secure rules in production
- Never deploy with open rules to production
- Keep your Firebase private key secure

### Admin Accounts
Two admin accounts are available:
1. admin@yourdomain.com / admin123
2. senatorever@gmail.com / ABMabm2122@@

### Files NOT to Commit
These files are already in .gitignore:
- `.env.local`
- `.env`
- `firestore-open.rules`
- `storage-open.rules`
- Local test scripts

## Troubleshooting

### Common Issues
1. **Authentication errors**: Ensure Email/Password is enabled in Firebase
2. **Permission errors**: Deploy the security rules
3. **API errors**: Check that all environment variables are set correctly

### Vercel Environment Variables
- Add them in Project Settings → Environment Variables
- Ensure multiline values (like FIREBASE_PRIVATE_KEY) are properly formatted
- You might need to encode the private key in base64 for Vercel

## Final Checklist
- [ ] All environment variables added to Vercel
- [ ] Firebase Authentication enabled
- [ ] Security rules deployed
- [ ] Authorized domains updated
- [ ] Test admin login on production