import { createClient } from '@supabase/supabase-js'

// هذه القيم ستأتي من متغيرات البيئة في Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// مثال على دوال للتعامل مع البيانات

// جلب جميع المعلنين النشطين
export async function getActiveAdvertisers() {
  const { data, error } = await supabase
    .from('advertisers')
    .select('*')
    .eq('status', 'active')
    .neq('company_name', 'المدير')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// إضافة معلن جديد
export async function createAdvertiser(advertiserData: any) {
  const { data, error } = await supabase
    .from('advertisers')
    .insert([advertiserData])
    .select()
    .single()

  if (error) throw error
  return data
}

// رفع صورة شعار المعلن
export async function uploadAdvertiserLogo(file: File, advertiserId: number) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${advertiserId}-${Date.now()}.${fileExt}`
  const filePath = `logos/${fileName}`

  const { data, error } = await supabase.storage
    .from('advertiser-logos')
    .upload(filePath, file)

  if (error) throw error

  // الحصول على رابط الصورة العام
  const { data: { publicUrl } } = supabase.storage
    .from('advertiser-logos')
    .getPublicUrl(filePath)

  // تحديث رابط الصورة في قاعدة البيانات
  await supabase
    .from('advertisers')
    .update({ icon_url: publicUrl })
    .eq('id', advertiserId)

  return publicUrl
}

// تسجيل الدخول
export async function login(email: string, password: string) {
  // يمكن استخدام Supabase Auth أو التحقق اليدوي
  const { data: user, error } = await supabase
    .from('advertisers')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !user) {
    throw new Error('بيانات الدخول غير صحيحة')
  }

  // هنا يجب التحقق من كلمة المرور باستخدام bcrypt
  // لكن للتبسيط، سنفترض أن التحقق تم بنجاح
  
  return user
}

// جلب إحصائيات لوحة التحكم
export async function getDashboardStats() {
  // عدد المعلنين النشطين
  const { count: activeCount } = await supabase
    .from('advertisers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .neq('company_name', 'المدير')

  // عدد الاشتراكات النشطة
  const today = new Date().toISOString().split('T')[0]
  const { count: activeSubscriptions } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .gte('end_date', today)

  // إجمالي المدفوعات
  const { data: payments } = await supabase
    .from('subscriptions')
    .select('paid_amount')
  
  const totalPayments = payments?.reduce((sum, sub) => sum + (sub.paid_amount || 0), 0) || 0

  return {
    activeAdvertisers: activeCount || 0,
    activeSubscriptions: activeSubscriptions || 0,
    totalRevenue: totalPayments,
    pendingPayments: 0 // يمكن حسابها لاحقاً
  }
}