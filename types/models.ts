// نماذج البيانات للمشروع

export interface Advertiser {
  id?: string;
  company_name: string;
  phone: string;
  whatsapp?: string;
  services?: string;
  icon_url?: string;
  email?: string;
  password?: string; // Hashed
  status: 'active' | 'inactive' | 'pending';
  include_vat?: boolean; // خيار إضافة ضريبة القيمة المضافة (15%)
  vat_percentage?: number; // نسبة الضريبة (افتراضياً 15%)
  
  // 🆕 نظام تصنيف العملاء (Customer Classification)
  customer_type?: 'new' | 'trusted' | 'vip'; // نوع العميل
  is_trusted?: boolean;                       // عميل موثوق؟
  credit_limit?: number;                      // حد الائتمان (للموثوقين فقط)
  trust_level?: number;                       // مستوى الثقة (1-5)
  payment_terms_days?: number;                // مهلة الدفع بالأيام
  
  // 🆕 نظام التغطية الجغرافية (Geographic Coverage System)
  coverage_type?: 'kingdom' | 'city' | 'both';  // نوع التغطية
  coverage_cities?: string[];                     // المدن المغطاة (إذا كان city أو both)
  // أمثلة: ['jeddah'], ['riyadh', 'jeddah'], etc.
  
  created_at: Date;
  updated_at: Date;
}

export interface Plan {
  id?: string;
  name: string;
  description?: string;
  duration_days: number;
  price: number;
  features?: string | string[];
  is_active?: boolean;
  
  // 🆕 نظام التغطية الجغرافية للباقات (Plan Coverage System)
  plan_type?: 'kingdom' | 'city';  // نوع الباقة: مملكة أو مدينة
  city?: string;                    // المدينة (إذا كانت باقة مدينة)
  // أمثلة: 'jeddah', 'riyadh', null (للباقات المملكة)
  
  created_at: Date;
}

export interface Subscription {
  id?: string;
  advertiser_id: string;
  plan_id: string;
  start_date: Date;
  end_date: Date;
  base_price: number;
  discount_type: 'amount' | 'percentage';
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  
  // الحالات الموسعة
  status: 'active' | 'paused' | 'stopped' | 'expired' | 'cancelled' | 'pending_payment';
  payment_status: 'paid' | 'partial' | 'pending';
  
  // 🆕 التغطية الجغرافية للاشتراك (Subscription Coverage)
  coverage_area?: 'kingdom' | 'city';  // منطقة التغطية لهذا الاشتراك
  city?: string;                        // المدينة (إذا كانت تغطية مدينة)
  // يمكن للمعلن الواحد أن يكون له عدة اشتراكات بتغطيات مختلفة
  
  // نظام الإيقاف المؤقت (Pause System)
  paused_at?: Date;                    // تاريخ الإيقاف المؤقت
  resumed_at?: Date;                   // تاريخ إعادة التشغيل
  total_paused_days?: number;          // إجمالي أيام التوقف
  current_pause_days?: number;         // أيام التوقف الحالي
  
  // نظام الإيقاف الكامل (Stop System)
  stopped_at?: Date;                   // تاريخ الإيقاف الكامل
  stop_reason?: string;                // سبب الإيقاف
  
  // نظام الإلغاء (Cancellation System)
  cancelled_at?: Date;                 // تاريخ الإلغاء
  cancellation_reason?: string;        // سبب الإلغاء
  
  // التواريخ الأصلية والمعدلة
  original_start_date?: Date;          // تاريخ البداية الأصلي
  original_end_date?: Date;            // تاريخ النهاية الأصلي
  adjusted_end_date?: Date;            // تاريخ النهاية المعدل (بعد احتساب التوقفات)
  actual_end_date?: Date;              // تاريخ النهاية الفعلي (عند الانتهاء)
  
  // الأيام الفعلية
  planned_days?: number;               // الأيام المخططة (من الباقة)
  active_days?: number;                // الأيام النشطة فعلياً
  remaining_active_days?: number;      // الأيام النشطة المتبقية
  
  // نظام فترة السماح (Grace Period System) - يدوي من الأدمن فقط
  grace_period_days?: number;          // عدد أيام السماح (افتراضي: 3)
  grace_period_end_date?: Date;        // تاريخ نهاية فترة السماح
  is_in_grace_period?: boolean;        // هل في فترة سماح الآن؟
  grace_period_started_at?: Date;      // متى بدأت فترة السماح الحالية
  grace_period_extensions?: GracePeriodExtension[]; // سجل جميع التمديدات
  total_grace_extensions?: number;     // عدد المحاولات الكلي للتمديد
  
  created_at: Date;
  updated_at?: Date;
}

// سجل تمديد فترة السماح
export interface GracePeriodExtension {
  extended_at: Date;                   // تاريخ التمديد
  extended_by: string;                 // من قام بالتمديد (admin uid)
  days_added: number;                  // عدد الأيام المضافة
  reason?: string;                     // سبب التمديد (اختياري)
  previous_end_date: Date;             // تاريخ النهاية قبل التمديد
  new_end_date: Date;                  // تاريخ النهاية بعد التمديد
  notes?: string;                      // ملاحظات إضافية
}

export interface Invoice {
  id?: string;
  subscription_id: string;
  invoice_number: string;
  
  // الحقول الجديدة للضرائب
  subtotal: number;              // المبلغ قبل الضريبة
  vat_percentage: number;        // نسبة الضريبة (15%)
  vat_amount: number;            // مبلغ الضريبة
  amount: number;                // الإجمالي (subtotal + vat_amount)
  
  status: 'paid' | 'unpaid' | 'cancelled';
  issued_date: Date;
  due_date?: Date;
  paid_date?: Date;
  
  // إضافات جديدة
  payment_link?: string;         // رابط الدفع الإلكتروني
  payment_gateway_id?: string;   // معرف من بوابة الدفع
  sent_to_customer?: boolean;    // هل تم إرسالها للعميل
  sent_date?: Date;              // تاريخ الإرسال
  
  created_at: Date;
  updated_at?: Date;
}

export interface AdRequest {
  id?: string;
  company_name: string;
  contact_name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  plan_id?: string;
  message?: string;
  status: 'pending' | 'contacted' | 'converted' | 'rejected';
  created_at: Date;
  // For rejected requests
  original_id?: string;
  rejected_at?: Date;
  rejection_reason?: string;
}

export interface Payment {
  id?: string;
  subscription_id: string;
  invoice_id?: string; // الفاتورة المرتبطة بالدفعة
  amount: number;
  payment_date: Date;
  payment_method?: string;
  transaction_id?: string; // معرف المعاملة المصرفية
  notes?: string;
  created_at: Date;
}

export interface Statistics {
  id?: string;
  advertiser_id: string;
  date: Date;
  views: number;
  clicks: number;
}

export interface Admin {
  id?: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin';
  created_at: Date;
}

// ==================== النماذج الجديدة للتحسينات ====================

// Audit Trail للفواتير
export interface InvoiceAudit {
  id?: string;
  invoice_id: string;
  action: 'created' | 'updated' | 'deleted' | 'paid' | 'cancelled' | 'sent';
  changed_fields?: Record<string, { old: any; new: any }>;
  performed_by: string;  // admin user ID
  performed_at: Date;
  ip_address?: string;
  user_agent?: string;
  notes?: string;
  created_at: Date;
}

// Reminder للتذكيرات
export interface Reminder {
  id?: string;
  invoice_id?: string;
  subscription_id?: string;
  advertiser_id: string;
  reminder_type: 'due_soon' | 'overdue' | 'subscription_expiring' | 'custom';
  scheduled_date: Date;
  sent_date?: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  delivery_method: 'whatsapp' | 'email' | 'sms';
  message: string;
  error_message?: string;
  created_at: Date;
}

// Refund للاستردادات
export interface Refund {
  id?: string;
  subscription_id: string;
  invoice_id?: string;
  payment_id?: string;
  original_amount: number;
  refund_amount: number;
  refund_reason: string;
  refund_method: 'cash' | 'bank_transfer' | 'card' | 'online';
  refund_date: Date;
  processed_by: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  bank_details?: string;
  notes?: string;
  created_at: Date;
  completed_at?: Date;
}

// Notification للإشعارات
export interface Notification {
  id?: string;
  type: string;
  invoice_id?: string;
  advertiser_id: string;
  recipient: string;
  message: string;
  status: 'sent' | 'failed' | 'pending';
  sent_at?: Date;
  error?: string;
  created_at: Date;
}

// Subscription Status History - سجل تاريخ حالات الاشتراك
export interface SubscriptionStatusHistory {
  id?: string;
  subscription_id: string;
  advertiser_id: string;
  
  // تفاصيل التغيير
  from_status: 'active' | 'paused' | 'stopped' | 'expired' | 'cancelled' | 'pending_payment';
  to_status: 'active' | 'paused' | 'stopped' | 'expired' | 'cancelled' | 'pending_payment';
  action_type: 'pause' | 'resume' | 'stop' | 'reactivate' | 'expire' | 'cancel';
  
  // تفاصيل التوقيت
  changed_at: Date;                    // تاريخ التغيير
  effective_from?: Date;               // تاريخ بدء التفعيل
  effective_until?: Date;              // تاريخ نهاية التفعيل (للإيقاف المؤقت)
  
  // الأيام
  days_before_change?: number;         // الأيام المتبقية قبل التغيير
  days_after_change?: number;          // الأيام المتبقية بعد التغيير
  pause_duration_days?: number;        // مدة التوقف (بالأيام) - للإيقاف المؤقت
  
  // التفاصيل المالية (عند التغيير)
  financial_impact?: {
    amount_paid: number;               // المبلغ المدفوع حتى الآن
    amount_remaining: number;          // المبلغ المتبقي
    refund_issued?: number;            // المبلغ المسترد (إن وجد)
  };
  
  // من قام بالتغيير
  changed_by: string;                  // معرف المستخدم/الأدمن
  changed_by_type: 'admin' | 'system' | 'auto';
  
  // السبب والملاحظات
  reason?: string;                     // سبب التغيير
  notes?: string;                      // ملاحظات إضافية
  ip_address?: string;                 // عنوان IP
  
  created_at: Date;
}