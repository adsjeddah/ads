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
  status: 'active' | 'expired' | 'cancelled';
  payment_status: 'paid' | 'partial' | 'pending';
  created_at: Date;
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