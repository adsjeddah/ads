const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// فتح قاعدة البيانات
const db = new sqlite3.Database(path.join(__dirname, 'jeddah_ads.db'));

console.log('بدء تحديث قاعدة البيانات...');

db.serialize(() => {
  // التحقق من وجود الأعمدة الجديدة وإضافتها إذا لم تكن موجودة
  db.all("PRAGMA table_info(subscriptions)", (err, columns) => {
    if (err) {
      console.error('خطأ في قراءة معلومات الجدول:', err);
      return;
    }
    
    const columnNames = columns.map(col => col.name);
    
    // إضافة عمود base_price إذا لم يكن موجوداً
    if (!columnNames.includes('base_price')) {
      db.run(`ALTER TABLE subscriptions ADD COLUMN base_price DECIMAL(10,2) DEFAULT 0`, (err) => {
        if (err) {
          console.error('خطأ في إضافة عمود base_price:', err);
        } else {
          console.log('تم إضافة عمود base_price بنجاح');
        }
      });
    }
    
    // إضافة عمود discount_type إذا لم يكن موجوداً
    if (!columnNames.includes('discount_type')) {
      db.run(`ALTER TABLE subscriptions ADD COLUMN discount_type TEXT DEFAULT 'amount'`, (err) => {
        if (err) {
          console.error('خطأ في إضافة عمود discount_type:', err);
        } else {
          console.log('تم إضافة عمود discount_type بنجاح');
        }
      });
    }
    
    // إضافة عمود discount_amount إذا لم يكن موجوداً
    if (!columnNames.includes('discount_amount')) {
      db.run(`ALTER TABLE subscriptions ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0`, (err) => {
        if (err) {
          console.error('خطأ في إضافة عمود discount_amount:', err);
        } else {
          console.log('تم إضافة عمود discount_amount بنجاح');
        }
      });
    }
    
    // تحديث القيم الموجودة لتعيين base_price = total_amount للسجلات القديمة
    db.run(`UPDATE subscriptions SET base_price = total_amount WHERE base_price IS NULL OR base_price = 0`, (err) => {
      if (err) {
        console.error('خطأ في تحديث القيم الموجودة:', err);
      } else {
        console.log('تم تحديث القيم الموجودة بنجاح');
      }
    });
  });
});

// إغلاق قاعدة البيانات بعد ثانيتين
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('خطأ في إغلاق قاعدة البيانات:', err);
    } else {
      console.log('تم إغلاق قاعدة البيانات');
    }
  });
}, 2000);