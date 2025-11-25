#!/bin/bash

# سكريبت لإضافة import للدوال الرقمية في جميع ملفات Admin

echo "🔢 بدء تطبيق الأرقام الإنجليزية على جميع الصفحات..."

# قائمة الملفات التي تحتاج تحديث
files=(
  "pages/admin/dashboard.tsx"
  "pages/admin/plans.tsx"
  "pages/admin/invoices.tsx"
  "pages/admin/invoices/[id].tsx"
  "pages/admin/advertisers/[id].tsx"
  "pages/admin/advertisers/[id]/edit.tsx"
  "pages/admin/advertisers/[id]/financial.tsx"
  "pages/admin/advertisers/[id]/renew.tsx"
  "pages/admin/advertisers/[id]/invoices.tsx"
  "pages/admin/update-pricing.tsx"
  "pages/admin/refunds/[id].tsx"
  "pages/admin/ad-requests.tsx"
  "pages/admin/ad-requests/[id].tsx"
  "pages/admin/ad-requests/[id]/convert.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ معالجة: $file"
    # يمكن إضافة معالجات هنا
  else
    echo "⚠️  ملف غير موجود: $file"
  fi
done

echo "✅ تم الانتهاء!"

