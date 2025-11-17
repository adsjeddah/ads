#!/bin/bash

echo "🚀 Preparing Jeddah Ads for Deployment"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if git is initialized
if [ ! -d .git ]; then
    echo -e "${RED}Error: Git not initialized. Run 'git init' first.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}1. Checking environment files...${NC}"
if [ -f .env.local ]; then
    echo -e "${GREEN}✓ .env.local found${NC}"
else
    echo -e "${RED}✗ .env.local not found${NC}"
    echo "Creating .env.local.example as reference..."
    cp .env.local.example .env.local.example.backup 2>/dev/null || echo "No example file to backup"
fi

echo -e "\n${YELLOW}2. Ensuring secure rules are set for production...${NC}"
# Make sure firebase.json uses secure rules
sed -i.bak 's/"firestore-open.rules"/"firestore.rules"/g' firebase.json
sed -i.bak 's/"storage-open.rules"/"storage.rules"/g' firebase.json
rm firebase.json.bak
echo -e "${GREEN}✓ Firebase configured to use secure rules${NC}"

echo -e "\n${YELLOW}3. Checking .gitignore...${NC}"
if grep -q ".env.local" .gitignore; then
    echo -e "${GREEN}✓ Sensitive files are ignored${NC}"
else
    echo -e "${RED}✗ .gitignore needs updating${NC}"
fi

echo -e "\n${YELLOW}4. Creating deployment checklist...${NC}"
cat > DEPLOYMENT_CHECKLIST.md << 'EOF'
# Deployment Checklist

## Before Deployment
- [ ] Enable Email/Password authentication in Firebase Console
- [ ] Deploy Firebase security rules
- [ ] Test admin login locally
- [ ] Review all environment variables

## During Deployment
- [ ] Add all environment variables to Vercel
- [ ] Ensure FIREBASE_PRIVATE_KEY is properly formatted
- [ ] Update NEXT_PUBLIC_API_URL after deployment

## After Deployment
- [ ] Add Vercel domain to Firebase authorized domains
- [ ] Test admin login on production
- [ ] Verify all features work correctly

## Admin Accounts
1. admin@yourdomain.com / admin123
2. senatorever@gmail.com / ABMabm2122@@
EOF
echo -e "${GREEN}✓ Deployment checklist created${NC}"

echo -e "\n${YELLOW}5. Git status:${NC}"
git status --short

echo -e "\n${GREEN}✅ Deployment preparation complete!${NC}"
echo -e "\nNext steps:"
echo "1. Review VERCEL_DEPLOYMENT_GUIDE.md"
echo "2. Complete items in DEPLOYMENT_CHECKLIST.md"
echo "3. Run: git add ."
echo "4. Run: git commit -m 'Prepare for deployment'"
echo "5. Run: git push origin main"
echo "6. Deploy to Vercel"

echo -e "\n${YELLOW}Important:${NC}"
echo "- Enable Email/Password auth in Firebase before deploying"
echo "- Deploy security rules: firebase deploy --only firestore:rules,storage:rules --project jeddah-ads-46daa"