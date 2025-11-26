#!/bin/bash

# سكريبت لتحديث جميع الصفحات العامة لتطبيق نظام التتبع المتقدم

# الانتقال إلى مجلد الصفحات
cd "/Users/ahmedsalem/Desktop/all my projects/ads-main/pages"

# قائمة الصفحات التي تحتاج تحديث
PAGES=(
  "movers/index.tsx"
  "movers/jeddah.tsx"
  "movers/dammam.tsx"
  "cleaning/index.tsx"
  "cleaning/riyadh.tsx"
  "cleaning/jeddah.tsx"
  "cleaning/dammam.tsx"
  "water-leaks/index.tsx"
  "water-leaks/jeddah.tsx"
  "water-leaks/dammam.tsx"
  "pest-control/index.tsx"
  "pest-control/riyadh.tsx"
  "pest-control/jeddah.tsx"
  "pest-control/dammam.tsx"
)

echo "🚀 بدء تحديث ${#PAGES[@]} صفحة..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for PAGE in "${PAGES[@]}"; do
  echo "📄 تحديث: $PAGE"
  
  # 1. إضافة استيراد client-tracking إذا لم يكن موجوداً
  if ! grep -q "client-tracking" "$PAGE"; then
    # البحث عن سطر استيراد MdVerified وإضافة السطر الجديد بعده
    sed -i.bak '/^import { MdVerified }/a\
import { initializeTracking, collectEventData } from '"'"'../../lib/utils/client-tracking'"'"';
' "$PAGE"
  fi
  
  # 2. تحديث useEffect لإضافة initializeTracking
  if ! grep -q "initializeTracking" "$PAGE"; then
    sed -i.bak 's/useEffect(() => {/useEffect(() => {\
    \/\/ تهيئة نظام التتبع المتقدم\
    initializeTracking();\
/' "$PAGE"
  fi
  
  # 3. تحديث handleCall لإضافة بيانات التتبع
  if ! grep -q "collectEventData" "$PAGE"; then
    # إيجاد handleCall وتحديثه
    sed -i.bak '/const handleCall = async (phone: string, advertiserId: string) => {/,/window.location.href = `tel:${phone}`;/{
      /const handleCall = async (phone: string, advertiserId: string) => {/a\
    try {\
      \/\/ جمع بيانات التتبع المتقدمة\
      const trackingData = collectEventData();
      /try {/d
      /advertiserId,/a\
        ...trackingData
    }' "$PAGE"
  fi
  
  # حذف ملفات النسخ الاحتياطية
  rm -f "$PAGE.bak"
  
  echo "✅ تم تحديث: $PAGE"
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ اكتمل تحديث جميع الصفحات بنجاح!"

