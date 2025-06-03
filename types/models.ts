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
  created_at: Date;
  updated_at: Date;
}

export interface Plan {
  id?: string;
  name: string;
  duration_days: number;
  price: number;
  features?: string;
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
  amount: number;
  status: 'paid' | 'unpaid' | 'cancelled';
  issued_date: Date;
  due_date?: Date;
  paid_date?: Date;
  created_at: Date;
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
}

export interface Payment {
  id?: string;
  subscription_id: string;
  amount: number;
  payment_date: Date;
  payment_method?: string;
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