#!/usr/bin/env node

/**
 * سكريبت لاستيراد Service Account من ملف JSON
 * Script to import Service Account from JSON file
 * 
 * Usage: node scripts/import-service-account.js path/to/service-account.json
 */

const fs = require('fs');
const path = require('path');

// التحقق من المعاملات
if (process.argv.length < 3) {
  console.error('\n❌ يجب توفير مسار ملف JSON');
  console.error('❌ Please provide path to JSON file\n');
  console.error('Usage: node scripts/import-service-account.js path/to/service-account.json\n');
  process.exit(1);
}

const jsonFilePath = process.argv[2];

// التحقق من وجود الملف
if (!fs.existsSync(jsonFilePath)) {
  console.error(`\n❌ الملف غير موجود: ${jsonFilePath}`);
  console.error(`❌ File not found: ${jsonFilePath}\n`);
  process.exit(1);
}

try {
  // قراءة ملف JSON
  const serviceAccount = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

  // التحقق من القيم المطلوبة
  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
    console.error('\n❌ ملف JSON غير صحيح - يجب أن يحتوي على project_id, client_email, private_key');
    console.error('❌ Invalid JSON file - must contain project_id, client_email, private_key\n');
    process.exit(1);
  }

  // قراءة ملف .env.local الحالي
  const envPath = path.join(__dirname, '..', '.env.local');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // تحديث القيم
  const updates = {
    'FIREBASE_PROJECT_ID': serviceAccount.project_id,
    'FIREBASE_CLIENT_EMAIL': serviceAccount.client_email,
    'FIREBASE_PRIVATE_KEY': serviceAccount.private_key,
    'FIREBASE_STORAGE_BUCKET': `${serviceAccount.project_id}.firebasestorage.app`
  };

  // إنشاء أو تحديث .env.local
  Object.keys(updates).forEach(key => {
    const value = updates[key];
    const regex = new RegExp(`^${key}=.*$`, 'm');
    
    if (envContent.match(regex)) {
      // تحديث القيمة الموجودة
      envContent = envContent.replace(regex, `${key}="${value}"`);
    } else {
      // إضافة قيمة جديدة
      envContent += `\n${key}="${value}"`;
    }
  });

  // حفظ الملف
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ تم تحديث .env.local بنجاح!');
  console.log('✅ Successfully updated .env.local!\n');
  console.log('📋 القيم المحدثة / Updated values:');
  console.log(`   • FIREBASE_PROJECT_ID: ${serviceAccount.project_id}`);
  console.log(`   • FIREBASE_CLIENT_EMAIL: ${serviceAccount.client_email}`);
  console.log(`   • FIREBASE_PRIVATE_KEY: [HIDDEN]`);
  console.log(`   • FIREBASE_STORAGE_BUCKET: ${serviceAccount.project_id}.firebasestorage.app`);
  console.log('\n🚀 يمكنك الآن تشغيل: npm run dev');
  console.log('🚀 You can now run: npm run dev\n');

} catch (error) {
  console.error('\n❌ خطأ:', error.message);
  console.error('❌ Error:', error.message, '\n');
  process.exit(1);
}

