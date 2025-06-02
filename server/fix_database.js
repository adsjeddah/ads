const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// فتح قاعدة البيانات
const db = new sqlite3.Database(path.join(__dirname, 'jeddah_ads.db'));

console.log('بدء إصلاح قاعدة البيانات...');

db.serialize(() => {
  // عرض بنية الجدول الحالية
  console.log('\nبنية جدول subscriptions الحالية:');
  db.all("PRAGMA table_info(subscriptions)", (err, columns) => {
    if (err) {
      console.error('خطأ في قراءة معلومات الجدول:', err);
      return;
    }
    
    console.log('الأعمدة الموجودة:');
    columns.forEach(col => {
      console.log(`- ${col.name} (${col.type})`);
    });
    
    const columnNames = columns.map(col => col.name);
    
    // قائمة الأعمدة المطلوبة
    const requiredColumns = [
      { name: 'base_price', type: 'DECIMAL(10,2)', default: '0' },
      { name: 'discount_type', type: 'TEXT', default: "'amount'" },
      { name: 'discount_amount', type: 'DECIMAL(10,2)', default: '0' },
      { name: 'total_amount', type: 'DECIMAL(10,2)', default: '0' },
      { name: 'paid_amount', type: 'DECIMAL(10,2)', default: '0' },
      { name: 'remaining_amount', type: 'DECIMAL(10,2)', default: '0' }
    ];
    
    // إضافة الأعمدة المفقودة
    requiredColumns.forEach(column => {
      if (!columnNames.includes(column.name)) {
        const query = `ALTER TABLE subscriptions ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.default}`;
        db.run(query, (err) => {
          if (err) {
            console.error(`خطأ في إضافة عمود ${column.name}:`, err);
          } else {
            console.log(`تم إضافة عمود ${column.name} بنجاح`);
          }
        });
      }
    });
    
    // بعد ثانيتين، عرض البنية الجديدة
    setTimeout(() => {
      console.log('\nبنية جدول subscriptions بعد التحديث:');
      db.all("PRAGMA table_info(subscriptions)", (err, newColumns) => {
        if (!err) {
          console.log('الأعمدة الموجودة:');
          newColumns.forEach(col => {
            console.log(`- ${col.name} (${col.type})`);
          });
        }
        
        // إغلاق قاعدة البيانات
        db.close((err) => {
          if (err) {
            console.error('خطأ في إغلاق قاعدة البيانات:', err);
          } else {
            console.log('\nتم إغلاق قاعدة البيانات');
          }
        });
      });
    }, 2000);
  });
});