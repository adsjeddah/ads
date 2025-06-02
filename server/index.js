const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'jeddah-ads-secret-key-2024';

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', process.env.FRONTEND_URL].filter(Boolean), // Add deployed frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Dynamic uploads directory
const UPLOADS_FOLDER = 'uploads';
const uploadsPath = process.env.UPLOADS_DIR ? process.env.UPLOADS_DIR : path.join(__dirname, UPLOADS_FOLDER);

// Ensure the uploads directory exists
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
  res.sendStatus(200); // Simple OK status
});

// إعداد multer لرفع الملفات
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure the uploads directory exists (Multer might need this again if run before app.use)
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
    }
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('يُسمح فقط بملفات الصور'));
    }
  }
});

// Middleware للتحقق من JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'غير مصرح' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'رمز غير صالح' });
    }
    req.user = user;
    next();
  });
};

// ==================== دوال مساعدة للفواتير ====================

// توليد رقم فاتورة فريد
function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}${day}-${random}`;
}

// إنشاء فاتورة جديدة
function createInvoice(subscriptionId, amount, dueDate, callback) {
  const invoiceNumber = generateInvoiceNumber();
  
  db.run(`
    INSERT INTO invoices (subscription_id, invoice_number, amount, due_date, status)
    VALUES (?, ?, ?, ?, 'unpaid')
  `, [subscriptionId, invoiceNumber, amount, dueDate], function(err) {
    if (err) {
      console.error("Error creating invoice:", err);
      return callback(err);
    }
    callback(null, { id: this.lastID, invoice_number: invoiceNumber });
  });
}

// تسجيل دفعة جديدة وتحديث حالة الاشتراك والفواتير
function recordPayment(subscriptionId, amount, paymentMethod, notes, callback) {
  db.serialize(() => {
    // إدراج سجل الدفعة
    db.run(`
      INSERT INTO payments (subscription_id, amount, payment_method, notes)
      VALUES (?, ?, ?, ?)
    `, [subscriptionId, amount, paymentMethod || 'cash', notes || ''], function(err) {
      if (err) {
        console.error("Error recording payment:", err);
        return callback(err);
      }
      
      const paymentId = this.lastID;
      
      // تحديث المبلغ المدفوع والمتبقي في الاشتراك
      db.run(`
        UPDATE subscriptions
        SET paid_amount = paid_amount + ?,
            remaining_amount = total_amount - (paid_amount + ?),
            payment_status = CASE
              WHEN (paid_amount + ?) >= total_amount THEN 'paid'
              WHEN (paid_amount + ?) > 0 THEN 'partial'
              ELSE 'unpaid'
            END
        WHERE id = ?
      `, [amount, amount, amount, amount, subscriptionId], function(updateErr) {
        if (updateErr) {
          return callback(updateErr);
        }
        
        // تحديث حالة الفواتير غير المدفوعة
        db.run(`
          UPDATE invoices
          SET status = 'paid', paid_date = date('now')
          WHERE subscription_id = ?
            AND status = 'unpaid'
            AND amount <= (
              SELECT paid_amount FROM subscriptions WHERE id = ?
            )
        `, [subscriptionId, subscriptionId], function(invoiceErr) {
          if (invoiceErr) {
            return callback(invoiceErr);
          }
          
          callback(null, { payment_id: paymentId });
        });
      });
    });
  });
}

// ==================== المسارات العامة ====================

// الحصول على المعلنين النشطين مع نظام الروتيت
app.get('/api/advertisers/active', (req, res) => {
  const query = `
    SELECT a.*, s.end_date, s.payment_status, s.paid_amount, s.total_amount
    FROM advertisers a
    JOIN subscriptions s ON a.id = s.advertiser_id
    WHERE a.status = 'active'
    AND s.status = 'active'
    AND s.end_date >= date('now')
    AND (s.payment_status = 'paid' OR (s.payment_status = 'partial' AND s.paid_amount > 0))
    ORDER BY RANDOM()
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // تسجيل المشاهدات
    const date = new Date().toISOString().split('T')[0];
    rows.forEach(advertiser => {
      db.run(
        `INSERT OR REPLACE INTO statistics (advertiser_id, date, views) 
         VALUES (?, ?, COALESCE((SELECT views FROM statistics WHERE advertiser_id = ? AND date = ?), 0) + 1)`,
        [advertiser.id, date, advertiser.id, date]
      );
    });
    
    res.json(rows);
  });
});

// الحصول على جميع الخطط
app.get('/api/plans', (req, res) => {
  db.all('SELECT * FROM plans ORDER BY duration_days', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// إرسال طلب إعلان
app.post('/api/ad-requests', (req, res) => {
  const { company_name, contact_name, phone, whatsapp, plan_id, message } = req.body;
  
  // Basic validation
  if (!company_name || !contact_name || !phone || !plan_id) {
    return res.status(400).json({ error: 'يرجى ملء الحقول الإلزامية (اسم الشركة، اسم المسؤول، الهاتف) واختيار خطة.' });
  }
  
  const query = `
    INSERT INTO ad_requests (company_name, contact_name, phone, whatsapp, plan_id, message, email)
    VALUES (?, ?, ?, ?, ?, ?, NULL)
  `;
  // Passing NULL for email as it's removed from this form. The column allows NULL.
  
  db.run(query, [company_name, contact_name, phone, whatsapp, plan_id, message], function(err) {
    if (err) {
      console.error("Error creating ad request:", err.message);
      return res.status(500).json({ error: 'حدث خطأ أثناء تسجيل طلب الإعلان.' });
    }
    res.status(201).json({ id: this.lastID, message: 'تم إرسال طلبك بنجاح! سنتواصل معك قريباً.' });
  });
});

// ==================== مسارات المصادقة ====================

// تسجيل الدخول
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get('SELECT * FROM advertisers WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, status: user.status },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token, user: { ...user, password: undefined } });
  });
});

// ==================== مسارات الإدارة ====================

// الحصول على جميع المعلنين (للإدارة)
app.get('/api/admin/advertisers', authenticateToken, (req, res) => {
  if (req.user.status !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح للمدراء فقط' });
  }
  
  const query = `
    SELECT a.*, 
           COUNT(DISTINCT s.id) as total_subscriptions,
           SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) as active_subscriptions
    FROM advertisers a
    LEFT JOIN subscriptions s ON a.id = s.advertiser_id
    WHERE a.status != 'admin'
    GROUP BY a.id
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// إضافة معلن جديد
app.post('/api/admin/advertisers', authenticateToken, upload.none(), (req, res) => {
  if (req.user.status !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح للمدراء فقط' });
  }
  
  const {
    company_name, phone, whatsapp, services, selected_icon,
    plan_id, start_date, end_date, base_price, discount_type, discount_amount,
    total_amount, paid_amount
  } = req.body;
  
  // بدء معاملة
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // إضافة المعلن
    const advertiserQuery = `
      INSERT INTO advertisers (company_name, phone, whatsapp, services, icon_url)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    db.run(advertiserQuery, [company_name, phone, whatsapp, services, selected_icon], function(err) {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: err.message });
      }
      
      const advertiserId = this.lastID;
      
      // إضافة الاشتراك
      const parsedTotalAmount = parseFloat(total_amount);
      const parsedPaidAmount = parseFloat(paid_amount);
      const remaining_amount = parsedTotalAmount - parsedPaidAmount;
      
      let payment_status = 'unpaid';
      if (parsedPaidAmount > 0) {
        payment_status = remaining_amount <= 0 ? 'paid' : 'partial';
      }
      
      const subscriptionQuery = `
        INSERT INTO subscriptions (
          advertiser_id, plan_id, start_date, end_date,
          base_price, discount_type, discount_amount,
          total_amount, paid_amount, remaining_amount, payment_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.run(subscriptionQuery, [
        advertiserId, plan_id, start_date, end_date,
        base_price || total_amount, discount_type || 'amount', discount_amount || 0,
        total_amount, paid_amount, remaining_amount, payment_status
      ], function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        
        const subscriptionId = this.lastID;
        
        // إنشاء فاتورة للاشتراك الجديد
        const dueDate = new Date(start_date);
        dueDate.setDate(dueDate.getDate() + 7); // موعد الاستحقاق بعد 7 أيام
        
        createInvoice(subscriptionId, parsedTotalAmount, dueDate.toISOString().split('T')[0], (invoiceErr, invoice) => {
          if (invoiceErr) {
            console.error("Error creating invoice:", invoiceErr);
            // Continue even if invoice creation fails
          }
          
          // إضافة الدفعة الأولى إذا كان هناك مبلغ مدفوع
          if (parseFloat(paid_amount) > 0) {
            recordPayment(subscriptionId, parsedPaidAmount, 'cash', 'الدفعة الأولى عند التسجيل', (paymentErr) => {
              if (paymentErr) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: paymentErr.message });
              }
              
              db.run('COMMIT');
              res.json({
                id: advertiserId,
                message: 'تم إضافة المعلن بنجاح',
                invoice: invoice
              });
            });
          } else {
            db.run('COMMIT');
            res.json({
              id: advertiserId,
              message: 'تم إضافة المعلن بنجاح',
              invoice: invoice
            });
          }
        });
      });
    });
  });
});

// إضافة اشتراك جديد (للتجديد)
app.post('/api/admin/subscriptions', authenticateToken, (req, res) => {
  if (req.user.status !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح للمدراء فقط' });
  }
  
  const {
    advertiser_id, plan_id, start_date, end_date,
    base_price, discount_type, discount_amount,
    total_amount, paid_amount
  } = req.body;
  
  const parsedTotalAmount = parseFloat(total_amount);
  const parsedPaidAmount = parseFloat(paid_amount);
  const remaining_amount = parsedTotalAmount - parsedPaidAmount;

  let payment_status = 'unpaid';
  if (parsedPaidAmount > 0) {
    payment_status = remaining_amount <= 0 ? 'paid' : 'partial';
  }
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Step 1: Deactivate any existing active subscriptions for this advertiser
    const deactivateOldSubscriptionsQuery = `
      UPDATE subscriptions
      SET status = 'inactive', end_date = date(?)
      WHERE advertiser_id = ? AND status = 'active' AND date(end_date) >= date(?)`;
      // We set end_date to new start_date or today if new start_date is in future, to avoid overlap
      // More robustly, end_date could be new_start_date - 1 day.
      // For simplicity here, using new start_date, assuming reports will filter by status='active'.
      // A more precise end_date would be MAX(today, new_start_date - 1 day)
      // Let's use the day before the new subscription starts, or today if new start is today/past.
      const today = new Date().toISOString().split('T')[0];
      const newSubStartDate = new Date(start_date);
      const dayBeforeNewStart = new Date(newSubStartDate.setDate(newSubStartDate.getDate() -1 )).toISOString().split('T')[0];
      const oldSubEndDate = (new Date(start_date) <= new Date(today)) ? today : dayBeforeNewStart;

    db.run(deactivateOldSubscriptionsQuery, [oldSubEndDate, advertiser_id, oldSubEndDate], function(err) {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: `Failed to deactivate old subscriptions: ${err.message}` });
      }

      // Step 2: Insert the new subscription
      const subscriptionQuery = `
        INSERT INTO subscriptions (
          advertiser_id, plan_id, start_date, end_date,
          base_price, discount_type, discount_amount,
          total_amount, paid_amount, remaining_amount, payment_status, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `; // New subscriptions are 'active' by default
      
      db.run(subscriptionQuery, [
        advertiser_id, plan_id, start_date, end_date,
        base_price || total_amount, discount_type || 'amount', discount_amount || 0,
        total_amount, paid_amount, remaining_amount, payment_status
      ], function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: `Failed to create new subscription: ${err.message}` });
        }
        
        const subscriptionId = this.lastID;
        
        // Step 3: Create invoice for the subscription
        const dueDate = new Date(start_date);
        dueDate.setDate(dueDate.getDate() + 7); // موعد الاستحقاق بعد 7 أيام من بداية الاشتراك
        
        createInvoice(subscriptionId, parsedTotalAmount, dueDate.toISOString().split('T')[0], (invoiceErr, invoice) => {
          if (invoiceErr) {
            console.error("Error creating invoice:", invoiceErr);
            // Continue even if invoice creation fails
          }
          
          // Step 4: Add payment record if applicable
          if (parseFloat(paid_amount) > 0) {
            recordPayment(subscriptionId, parsedPaidAmount, 'cash', 'دفعة عند التجديد', (paymentErr) => {
              if (paymentErr) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: paymentErr.message });
              }
              
              db.run('COMMIT');
              res.json({
                id: subscriptionId,
                message: 'تم تجديد الاشتراك بنجاح',
                invoice: invoice
              });
            });
          } else {
            db.run('COMMIT');
            res.json({
              id: subscriptionId,
              message: 'تم تجديد الاشتراك بنجاح',
              invoice: invoice
            });
          }
        });
    }); // End of db.run for new subscription insert
  }); // End of db.run for deactivating old subscriptions
}); // End of db.serialize
}); // End of app.post('/api/admin/subscriptions') route handler

// تحديث اشتراك (لإضافة فترة سماح)
app.put('/api/admin/subscriptions/:id', authenticateToken, (req, res) => {
  if (req.user.status !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح للمدراء فقط' });
  }
  
  const { id } = req.params;
  const { end_date } = req.body;
  
  const query = `UPDATE subscriptions SET end_date = ? WHERE id = ?`;
  
  db.run(query, [end_date, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'تم تحديث الاشتراك بنجاح' });
  });
});

// تحديث معلن
app.put('/api/admin/advertisers/:id', authenticateToken, upload.single('icon'), (req, res) => {
  if (req.user.status !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح للمدراء فقط' });
  }
  
  const { id } = req.params;
  // Email and password are no longer sent from the edit form for advertiser profile
  const { company_name, phone, whatsapp, services, status, selected_icon_name } = req.body;
  
  let icon_url_to_update = undefined; // Removed TypeScript type annotation

  if (req.file) { // Custom uploaded icon takes precedence
    icon_url_to_update = `/uploads/${req.file.filename}`;
  } else if (selected_icon_name && typeof selected_icon_name === 'string' && selected_icon_name.trim() !== '') { // Preset icon name
    icon_url_to_update = selected_icon_name.trim();
  }
  // If neither req.file nor selected_icon_name is provided, icon_url_to_update remains undefined,
  // and icon_url field will not be included in the SQL UPDATE, preserving the existing icon.

  let updateFields = [];
  let values = [];
  
  if (company_name !== undefined) { updateFields.push('company_name = ?'); values.push(company_name); }
  if (phone !== undefined) { updateFields.push('phone = ?'); values.push(phone); }
  if (whatsapp !== undefined) { updateFields.push('whatsapp = ?'); values.push(whatsapp); }
  if (services !== undefined) { updateFields.push('services = ?'); values.push(services); }
  // Email is no longer editable from this form
  // Password is no longer editable from this form
  if (status) { updateFields.push('status = ?'); values.push(status); }
  if (icon_url_to_update !== undefined) { updateFields.push('icon_url = ?'); values.push(icon_url_to_update); }
  
  updateFields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const query = `UPDATE advertisers SET ${updateFields.join(', ')} WHERE id = ?`;
  
  db.run(query, values, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'تم تحديث المعلن بنجاح' });
  });
});

// حذف معلن
app.delete('/api/admin/advertisers/:id', authenticateToken, (req, res) => {
  if (req.user.status !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح للمدراء فقط' });
  }
  
  const { id } = req.params;
  
  db.run('UPDATE advertisers SET status = "deleted" WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'تم حذف المعلن بنجاح' });
  });
});

// ==================== مسارات الاشتراكات ====================

// الحصول على اشتراكات معلن
app.get('/api/admin/advertisers/:id/subscriptions', authenticateToken, (req, res) => {
  if (req.user.status !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح للمدراء فقط' });
  }
  
  const { id } = req.params;
  
  const query = `
    SELECT s.*, p.name as plan_name, p.price, p.duration_days
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.advertiser_id = ?
    ORDER BY s.created_at DESC
  `;
  
  db.all(query, [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// إضافة اشتراك جديد
app.post('/api/admin/subscriptions', authenticateToken, (req, res) => {
  if (req.user.status !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح للمدراء فقط' });
  }
  
  const { advertiser_id, plan_id, start_date, payment_status } = req.body;
  
  // الحصول على مدة الخطة
  db.get('SELECT duration_days, price FROM plans WHERE id = ?', [plan_id], (err, plan) => {
    if (err || !plan) {
      return res.status(400).json({ error: 'خطة غير موجودة' });
    }
    
    const startDate = new Date(start_date || Date.now());
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.duration_days);
    
    const query = `
      INSERT INTO subscriptions (advertiser_id, plan_id, start_date, end_date, payment_status)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    db.run(query, [
      advertiser_id,
      plan_id,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      payment_status || 'pending'
    ], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // إنشاء فاتورة
      const invoiceNumber = `INV-${Date.now()}-${this.lastID}`;
      db.run(
        `INSERT INTO invoices (subscription_id, invoice_number, amount, due_date)
         VALUES (?, ?, ?, date('now', '+7 days'))`,
        [this.lastID, invoiceNumber, plan.price],
        (err) => {
          if (err) {
            console.error('Error creating invoice:', err);
          }
        }
      );
      
      res.json({ id: this.lastID, message: 'تم إضافة الاشتراك بنجاح' });
    });
  });
});

// تحديث حالة الاشتراك
app.put('/api/admin/subscriptions/:id', authenticateToken, (req, res) => {
  if (req.user.status !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح للمدراء فقط' });
  }
  
  const { id } = req.params;
  const { status, payment_status } = req.body;
  
  let updateFields = [];
  let values = [];
  
  if (status) { updateFields.push('status = ?'); values.push(status); }
  if (payment_status) { updateFields.push('payment_status = ?'); values.push(payment_status); }
  
  values.push(id);
  
  const query = `UPDATE subscriptions SET ${updateFields.join(', ')} WHERE id = ?`;
  
  db.run(query, values, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // تحديث الفاتورة إذا تم الدفع
    if (payment_status === 'paid') {
      db.run(
        `UPDATE invoices SET status = 'paid', paid_date = date('now') WHERE subscription_id = ?`,
        [id]
      );
    }
    
    res.json({ message: 'تم تحديث الاشتراك بنجاح' });
  });
});

// ==================== مسارات الإحصائيات ====================

// الحصول على إحصائيات عامة
app.get('/api/admin/statistics', authenticateToken, (req, res) => {
  if (req.user.status !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح للمدراء فقط' });
  }
  
  const queries = {
    totalAdvertisers: `SELECT COUNT(*) as count FROM advertisers WHERE status = 'active'`,
    activeSubscriptions: `SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active' AND end_date >= date('now')`,
    totalRevenue: `SELECT SUM(amount) as total FROM invoices WHERE status = 'paid'`,
    pendingRequests: `SELECT COUNT(*) as count FROM ad_requests WHERE status = 'pending'`,
    monthlyStats: `
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as subscriptions,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_subscriptions
      FROM subscriptions
      WHERE created_at >= date('now', '-6 months')
      GROUP BY month
      ORDER BY month DESC
    `
  };
  
  const results = {};
  let completed = 0;
  
  Object.keys(queries).forEach(key => {
    db.all(queries[key], [], (err, rows) => {
      if (err) {
        console.error(`Error in ${key}:`, err);
        results[key] = null;
      } else {
        results[key] = rows.length === 1 && (key !== 'monthlyStats') ? rows[0] : rows;
      }
      
      completed++;
      if (completed === Object.keys(queries).length) {
        res.json(results);
      }
    });
  });
});

// الحصول على إحصائيات معلن محدد
app.get('/api/admin/advertisers/:id/statistics', authenticateToken, (req, res) => {
  if (req.user.status !== 'admin' && req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({ error: 'غير مصرح' });
  }
  
  const { id } = req.params;
  const { start_date, end_date } = req.query;
  
  let query = `
    SELECT date, views, clicks
    FROM statistics
    WHERE advertiser_id = ?
  `;
  
  const params = [id];
  
  if (start_date) {
    query += ' AND date >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    query += ' AND date <= ?';
    params.push(end_date);
  }
  
  query += ' ORDER BY date DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// ==================== مسارات الفواتير ====================

// الحصول على الفواتير
app.get('/api/admin/invoices', authenticateToken, (req, res) => {
  if (req.user.status !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح للمدراء فقط' });
  }
  
  const query = `
    SELECT i.*, s.advertiser_id, a.company_name, p.name as plan_name
    FROM invoices i
    JOIN subscriptions s ON i.subscription_id = s.id
    JOIN advertisers a ON s.advertiser_id = a.id
    JOIN plans p ON s.plan_id = p.id
    ORDER BY i.created_at DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// الحصول على طلبات الإعلان
app.get('/api/admin/ad-requests', authenticateToken, (req, res) => {
  if (req.user.status !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح للمدراء فقط' });
  }
  
  const query = `
    SELECT ar.*, p.name as plan_name, p.price
    FROM ad_requests ar
    LEFT JOIN plans p ON ar.plan_id = p.id
    ORDER BY ar.created_at DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// تحديث حالة طلب الإعلان
app.put('/api/admin/ad-requests/:id', authenticateToken, (req, res) => {
  if (req.user.status !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح للمدراء فقط' });
  }
  
  const { id } = req.params;
  const { status } = req.body;
  
  db.run('UPDATE ad_requests SET status = ? WHERE id = ?', [status, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'تم تحديث حالة الطلب بنجاح' });
  });
});

// الحصول على تفاصيل طلب إعلان محدد
app.get('/api/admin/ad-requests/:id', authenticateToken, (req, res) => {
  if (req.user.status !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح للمدراء فقط' });
  }
  
  const { id } = req.params;
  const query = `
    SELECT ar.*, p.name as plan_name, p.price as plan_price, p.duration_days as plan_duration
    FROM ad_requests ar
    LEFT JOIN plans p ON ar.plan_id = p.id
    WHERE ar.id = ?
  `;
  
  db.get(query, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'طلب الإعلان غير موجود' });
    }
    res.json(row);
  });
});

// تحديث حالة طلب الإعلان (مع مسار أكثر وضوحاً)
app.put('/api/admin/ad-requests/:id/status', authenticateToken, (req, res) => {
  if (req.user.status !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح للمدراء فقط' });
  }
  
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'حالة غير صالحة' });
  }
  
  db.run('UPDATE ad_requests SET status = ? WHERE id = ?', [status, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'طلب الإعلان غير موجود' });
    }
    res.json({ message: 'تم تحديث حالة الطلب بنجاح' });
  });
});

// ==================== مسارات الفواتير والدفعات ====================

// الحصول على المعلنين مع معلومات الفواتير
app.get('/api/admin/advertisers/invoices', authenticateToken, (req, res) => {
  if (req.user.status !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح للمدراء فقط' });
  }
  
  const query = `
    SELECT
      a.id,
      a.company_name,
      a.phone,
      a.email,
      COUNT(DISTINCT s.id) as total_subscriptions,
      COALESCE(SUM(s.total_amount), 0) as total_amount,
      COALESCE(SUM(s.paid_amount), 0) as paid_amount,
      COALESCE(SUM(s.remaining_amount), 0) as remaining_amount,
      (
        SELECT json_object(
          'id', s2.id,
          'plan_name', p.name,
          'end_date', s2.end_date
        )
        FROM subscriptions s2
        JOIN plans p ON s2.plan_id = p.id
        WHERE s2.advertiser_id = a.id
        AND s2.status = 'active'
        ORDER BY s2.created_at DESC
        LIMIT 1
      ) as active_subscription
    FROM advertisers a
    LEFT JOIN subscriptions s ON a.id = s.advertiser_id
    WHERE a.status != 'deleted' AND a.status != 'admin'
    GROUP BY a.id
    ORDER BY a.company_name
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Parse active_subscription JSON
    rows = rows.map(row => ({
      ...row,
      active_subscription: row.active_subscription ? JSON.parse(row.active_subscription) : null
    }));
    
    res.json(rows);
  });
});

// الحصول على دفعات معلن
app.get('/api/admin/advertisers/:id/payments', authenticateToken, (req, res) => {
  if (req.user.status !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح للمدراء فقط' });
  }
  
  const { id } = req.params;
  
  const query = `
    SELECT p.*, s.plan_id
    FROM payments p
    JOIN subscriptions s ON p.subscription_id = s.id
    WHERE s.advertiser_id = ?
    ORDER BY p.payment_date DESC, p.created_at DESC
  `;
  
  db.all(query, [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// إضافة دفعة جديدة
app.post('/api/admin/payments', authenticateToken, (req, res) => {
  if (req.user.status !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح للمدراء فقط' });
  }
  
  const { subscription_id, amount, payment_method, notes } = req.body;
  
  // التحقق من الاشتراك والمبلغ المتبقي
  db.get(
    'SELECT remaining_amount, total_amount FROM subscriptions WHERE id = ?',
    [subscription_id],
    (err, subscription) => {
      if (err || !subscription) {
        return res.status(400).json({ error: 'اشتراك غير موجود' });
      }
      
      if (parseFloat(amount) > subscription.remaining_amount) {
        return res.status(400).json({ error: 'المبلغ أكبر من المتبقي' });
      }
      
      // استخدام دالة recordPayment المحسنة
      recordPayment(subscription_id, amount, payment_method, notes, (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.json({
          message: 'تم إضافة الدفعة بنجاح',
          payment_id: result.payment_id
        });
      });
    }
  );
});

// ==================== مسارات إدارة الفواتير الشاملة ====================

// الحصول على جميع الفواتير مع التفاصيل
app.get('/api/admin/invoices', authenticateToken, (req, res) => {
  if (req.user.status !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح للمدراء فقط' });
  }
  
  const query = `
    SELECT
      i.*,
      a.company_name,
      a.phone,
      s.start_date,
      s.end_date,
      s.total_amount as subscription_total,
      s.paid_amount as subscription_paid,
      s.remaining_amount as subscription_remaining,
      p.name as plan_name
    FROM invoices i
    JOIN subscriptions s ON i.subscription_id = s.id
    JOIN advertisers a ON s.advertiser_id = a.id
    JOIN plans p ON s.plan_id = p.id
    ORDER BY i.created_at DESC
  `;
  
  db.all(query, [], (err, invoices) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(invoices);
  });
});

// الحصول على فواتير معلن محدد
app.get('/api/admin/advertisers/:id/invoices', authenticateToken, (req, res) => {
  if (req.user.status !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح للمدراء فقط' });
  }
  
  const { id } = req.params;
  
  const query = `
    SELECT
      i.*,
      s.start_date,
      s.end_date,
      s.total_amount as subscription_total,
      s.paid_amount as subscription_paid,
      s.remaining_amount as subscription_remaining,
      p.name as plan_name
    FROM invoices i
    JOIN subscriptions s ON i.subscription_id = s.id
    JOIN plans p ON s.plan_id = p.id
    WHERE s.advertiser_id = ?
    ORDER BY i.created_at DESC
  `;
  
  db.all(query, [id], (err, invoices) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(invoices);
  });
});

// الحصول على تفاصيل فاتورة محددة
app.get('/api/admin/invoices/:id', authenticateToken, (req, res) => {
  if (req.user.status !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح للمدراء فقط' });
  }
  
  const { id } = req.params;
  
  const query = `
    SELECT
      i.*,
      a.id as advertiser_id,
      a.company_name,
      a.phone,
      a.whatsapp,
      a.services,
      s.start_date,
      s.end_date,
      s.total_amount as subscription_total,
      s.paid_amount as subscription_paid,
      s.remaining_amount as subscription_remaining,
      s.discount_type,
      s.discount_amount,
      s.base_price,
      p.name as plan_name,
      p.duration_days
    FROM invoices i
    JOIN subscriptions s ON i.subscription_id = s.id
    JOIN advertisers a ON s.advertiser_id = a.id
    JOIN plans p ON s.plan_id = p.id
    WHERE i.id = ?
  `;
  
  db.get(query, [id], (err, invoice) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!invoice) {
      return res.status(404).json({ error: 'الفاتورة غير موجودة' });
    }
    
    // الحصول على سجل المدفوعات للاشتراك
    db.all(
      `SELECT * FROM payments WHERE subscription_id = ? ORDER BY payment_date DESC`,
      [invoice.subscription_id],
      (err, payments) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        invoice.payments = payments;
        res.json(invoice);
      }
    );
  });
});

// تحديث حالة الفاتورة
app.put('/api/admin/invoices/:id', authenticateToken, (req, res) => {
  if (req.user.status !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح للمدراء فقط' });
  }
  
  const { id } = req.params;
  const { status, paid_date } = req.body;
  
  let updateQuery = 'UPDATE invoices SET status = ?';
  let params = [status];
  
  if (paid_date) {
    updateQuery += ', paid_date = ?';
    params.push(paid_date);
  }
  
  updateQuery += ' WHERE id = ?';
  params.push(id);
  
  db.run(updateQuery, params, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json({ message: 'تم تحديث حالة الفاتورة بنجاح' });
  });
});

// بدء الخادم
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});