const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// إنشاء قاعدة البيانات
const DBNAME = 'jeddah_ads.db';
const dbPath = process.env.DATABASE_PATH ? process.env.DATABASE_PATH : path.join(__dirname, DBNAME);

// Ensure the directory for the database exists, especially for Render persistent disk
const dbDir = path.dirname(dbPath);
if (!require('fs').existsSync(dbDir)) {
  require('fs').mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log(`Connected to SQLite database at ${dbPath}`);
  }
});

// إنشاء الجداول
db.serialize(() => {
  // جدول المعلنين
  db.run(`
    CREATE TABLE IF NOT EXISTS advertisers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      whatsapp TEXT,
      services TEXT,
      icon_url TEXT,
      email TEXT UNIQUE,
      password TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // جدول الخطط
  db.run(`
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      duration_days INTEGER NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      features TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // جدول الاشتراكات
  db.run(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      advertiser_id INTEGER NOT NULL,
      plan_id INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      base_price DECIMAL(10,2) NOT NULL,
      discount_type TEXT DEFAULT 'amount',
      discount_amount DECIMAL(10,2) DEFAULT 0,
      total_amount DECIMAL(10,2) NOT NULL,
      paid_amount DECIMAL(10,2) DEFAULT 0,
      remaining_amount DECIMAL(10,2) NOT NULL,
      status TEXT DEFAULT 'active',
      payment_status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (advertiser_id) REFERENCES advertisers(id),
      FOREIGN KEY (plan_id) REFERENCES plans(id)
    )
  `);

  // جدول الفواتير
  db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL,
      invoice_number TEXT UNIQUE NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      status TEXT DEFAULT 'unpaid',
      issued_date DATE DEFAULT CURRENT_DATE,
      due_date DATE,
      paid_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
    )
  `);

  // جدول الإحصائيات
  db.run(`
    CREATE TABLE IF NOT EXISTS statistics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      advertiser_id INTEGER NOT NULL,
      date DATE NOT NULL,
      views INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      FOREIGN KEY (advertiser_id) REFERENCES advertisers(id),
      UNIQUE(advertiser_id, date)
    )
  `);

  // جدول الدفعات
  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      payment_date DATE DEFAULT CURRENT_DATE,
      payment_method TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
    )
  `);

  // جدول طلبات الإعلان
  db.run(`
    CREATE TABLE IF NOT EXISTS ad_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      whatsapp TEXT,
      email TEXT,
      plan_id INTEGER,
      message TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plan_id) REFERENCES plans(id)
    )
  `);

  // Attempt to add the whatsapp column to ad_requests if it doesn't exist
  db.run('ALTER TABLE ad_requests ADD COLUMN whatsapp TEXT', (err) => {
    if (err) {
      // We can ignore "duplicate column name" error, as it means the column already exists.
      if (!err.message.includes('duplicate column name')) {
        console.error('Error adding whatsapp column to ad_requests:', err.message);
      }
    } else {
      console.log('Whatsapp column added to ad_requests table or already exists.');
    }
  });

  // إدراج الخطط الافتراضية
  const plans = [
    { name: 'خطة أسبوعين', duration_days: 14, price: 500, features: 'ظهور في جميع الصفحات, دعم فني' },
    { name: 'خطة شهر', duration_days: 30, price: 800, features: 'ظهور في جميع الصفحات, دعم فني, تقارير شهرية' },
    { name: 'خطة شهرين', duration_days: 60, price: 1400, features: 'ظهور في جميع الصفحات, دعم فني, تقارير شهرية, أولوية في الظهور' },
    { name: 'خطة 3 أشهر', duration_days: 90, price: 1800, features: 'ظهور في جميع الصفحات, دعم فني, تقارير شهرية, أولوية في الظهور, تصميم مخصص' }
  ];

  const insertPlan = db.prepare('INSERT OR IGNORE INTO plans (name, duration_days, price, features) VALUES (?, ?, ?, ?)');
  plans.forEach(plan => {
    insertPlan.run(plan.name, plan.duration_days, plan.price, plan.features);
  });
  insertPlan.finalize();

  // إنشاء مستخدم إداري افتراضي
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`
    INSERT OR IGNORE INTO advertisers (company_name, phone, email, password, status)
    VALUES ('المدير', '0500000000', 'admin@jeddah-ads.com', ?, 'admin')
  `, [adminPassword]);
});

module.exports = db;