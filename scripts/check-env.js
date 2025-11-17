#!/usr/bin/env node

/**
 * سكريبت للتحقق من المتغيرات البيئية المطلوبة
 * Check Environment Variables Script
 * 
 * Usage: node scripts/check-env.js
 */

require('dotenv').config({ path: '.env.local' });

const chalk = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
};

console.log('\n' + chalk.bold(chalk.blue('🔍 فحص المتغيرات البيئية / Environment Variables Check')));
console.log(chalk.blue('═'.repeat(60)) + '\n');

// المتغيرات المطلوبة
const requiredEnvVars = {
  'Firebase Admin SDK': [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_STORAGE_BUCKET',
  ],
  'Firebase Client SDK': [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ],
};

let allPassed = true;
let missingVars = [];

// فحص كل مجموعة
Object.entries(requiredEnvVars).forEach(([category, vars]) => {
  console.log(chalk.bold(`\n📦 ${category}:`));
  console.log('─'.repeat(60));
  
  vars.forEach((varName) => {
    const value = process.env[varName];
    const exists = !!value;
    const isPlaceholder = value && (
      value.includes('your-') || 
      value.includes('YOUR_') ||
      value === 'your-project-id' ||
      value === 'your-api-key'
    );
    
    if (!exists) {
      console.log(`  ${chalk.red('✗')} ${varName} ${chalk.red('مفقود / Missing')}`);
      allPassed = false;
      missingVars.push(varName);
    } else if (isPlaceholder) {
      console.log(`  ${chalk.yellow('⚠')} ${varName} ${chalk.yellow('قيمة افتراضية / Placeholder value')}`);
      allPassed = false;
    } else {
      const displayValue = varName.includes('PRIVATE_KEY') 
        ? '****** (مخفي / Hidden)'
        : value.length > 30 
          ? value.substring(0, 30) + '...'
          : value;
      console.log(`  ${chalk.green('✓')} ${varName} ${chalk.green('موجود / Found')}`);
      console.log(`    ${chalk.blue('└─')} ${displayValue}`);
    }
  });
});

// النتيجة النهائية
console.log('\n' + chalk.blue('═'.repeat(60)));
console.log(chalk.bold('\n📊 النتيجة النهائية / Final Result:\n'));

if (allPassed) {
  console.log(chalk.green('✅ رائع! جميع المتغيرات البيئية موجودة وصحيحة'));
  console.log(chalk.green('✅ Perfect! All environment variables are set correctly\n'));
  console.log(chalk.blue('💡 يمكنك الآن تشغيل التطبيق:'));
  console.log(chalk.blue('💡 You can now run the app:'));
  console.log(chalk.bold('\n   npm run dev\n'));
  process.exit(0);
} else {
  console.log(chalk.red('❌ يوجد متغيرات مفقودة أو تحتاج إلى تعديل'));
  console.log(chalk.red('❌ Some variables are missing or need to be updated\n'));
  
  if (missingVars.length > 0) {
    console.log(chalk.yellow('📝 المتغيرات المفقودة / Missing Variables:'));
    missingVars.forEach(v => console.log(`   - ${v}`));
    console.log('');
  }
  
  console.log(chalk.yellow('🔧 الخطوات التالية / Next Steps:'));
  console.log(chalk.yellow('   1. تأكد من وجود ملف .env.local'));
  console.log(chalk.yellow('      Make sure .env.local file exists'));
  console.log(chalk.yellow('   2. راجع ملف FIREBASE_SETUP.md للتفاصيل'));
  console.log(chalk.yellow('      Check FIREBASE_SETUP.md for details'));
  console.log(chalk.yellow('   3. احصل على البيانات من Firebase Console'));
  console.log(chalk.yellow('      Get credentials from Firebase Console\n'));
  
  process.exit(1);
}

