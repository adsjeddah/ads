-- إنشاء جداول قاعدة البيانات في Supabase

-- جدول المعلنين
CREATE TABLE advertisers (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  services TEXT,
  icon_url TEXT,
  email TEXT UNIQUE,
  password TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- جدول الخطط
CREATE TABLE plans (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  features TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- جدول الاشتراكات
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  advertiser_id INTEGER REFERENCES advertisers(id),
  plan_id INTEGER REFERENCES plans(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  discount_type TEXT DEFAULT 'amount',
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- جدول الفواتير
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  advertiser_id INTEGER REFERENCES advertisers(id),
  subscription_id INTEGER REFERENCES subscriptions(id),
  invoice_number TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  payment_date DATE,
  payment_method TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- جدول طلبات الإعلان
CREATE TABLE ad_requests (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  plan_id INTEGER REFERENCES plans(id),
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- إدخال البيانات الأساسية
INSERT INTO plans (name, duration_days, price, features) VALUES
('خطة أسبوعين', 14, 500, 'عرض لمدة أسبوعين'),
('خطة شهر', 30, 800, 'عرض لمدة شهر كامل'),
('خطة شهرين', 60, 1400, 'عرض لمدة شهرين'),
('خطة 3 أشهر', 90, 1800, 'عرض لمدة 3 أشهر');

-- إنشاء مستخدم المدير
INSERT INTO advertisers (company_name, phone, email, password, status) VALUES
('المدير', '0500000000', 'admin@jeddah-ads.com', '$2a$10$YourHashedPasswordHere', 'active');