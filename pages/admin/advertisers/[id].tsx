import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaEdit, FaTrash, FaBuilding, FaPhone, FaEnvelope, FaListAlt, FaWhatsapp, FaCalendarAlt, FaMoneyBillWave, FaChartLine, FaPlus, FaFileInvoice, FaPause, FaPlay, FaRedo, FaClock, FaBox } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Advertiser {
  id: number;
  company_name: string;
  phone: string;
  whatsapp?: string;
  email: string;
  services?: string;
  icon_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Subscription {
  id: number;
  plan_name: string;
  start_date: string;
  end_date: string;
  status: string;
  payment_status: string;
  price: number;
  duration_days: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
}

interface Invoice {
  id: number;
  subscription_id: number; // Added this line
  invoice_number: string;
  amount: number;
  status: string;
  issued_date: string;
  due_date: string;
  paid_date?: string;
}

interface Statistics {
  id: string;
  advertiser_id: string;
  date: any;
  views: number;
  clicks: number;
  calls: number;
  call_details?: Array<{ phone: string; timestamp: any }>;
}

export default function AdvertiserDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [statistics, setStatistics] = useState<Statistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [showGracePeriodModal, setShowGracePeriodModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [gracePeriodDays, setGracePeriodDays] = useState(7);

  // Helper function to safely convert Firestore Timestamp to Date
  const toDate = (timestamp: any): Date => {
    try {
      if (!timestamp) return new Date();
      
      // If it's already a Date object
      if (timestamp instanceof Date) {
        if (isNaN(timestamp.getTime())) return new Date();
        return timestamp;
      }
      
      // If it's a Firestore Timestamp with toDate method
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        const date = timestamp.toDate();
        if (isNaN(date.getTime())) return new Date();
        return date;
      }
      
      // If it's a Firestore Timestamp with seconds
      if (timestamp.seconds !== undefined && timestamp.seconds !== null) {
        const date = new Date(timestamp.seconds * 1000);
        if (isNaN(date.getTime())) return new Date();
        return date;
      }
      
      // If it's a Firestore Timestamp with _seconds (from serialization)
      if (timestamp._seconds !== undefined && timestamp._seconds !== null) {
        const date = new Date(timestamp._seconds * 1000);
        if (isNaN(date.getTime())) return new Date();
        return date;
      }
      
      // If it's a string or number
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return new Date();
      return date;
    } catch (error) {
      console.error('Error converting timestamp:', timestamp, error);
      return new Date();
    }
  };

  // Helper function to safely format dates
  const formatDate = (timestamp: any, formatString: string): string => {
    try {
      const date = toDate(timestamp);
      // Double check the date is valid before formatting
      if (isNaN(date.getTime())) {
        return '-';
      }
      return format(date, formatString, { locale: ar });
    } catch (error) {
      console.error('Error formatting date:', timestamp, error);
      return '-';
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    if (id) {
      fetchAdvertiserDetails();
    }
  }, [id, router]);

  const fetchAdvertiserDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      // Fetch advertiser data directly by ID
      const advertiserResponse = await axios.get(`${apiUrl}/advertisers/${id}`, { headers });
      setAdvertiser(advertiserResponse.data);
      
      if (advertiserResponse.data) {
        const subsResponse = await axios.get(`${apiUrl}/subscriptions?advertiser_id=${id}`, { headers });
        setSubscriptions(subsResponse.data);

        // Fetch invoices for this advertiser's subscriptions
        const allInvoicesResponse = await axios.get(`${apiUrl}/invoices`, { headers });
        const advertiserInvoices = allInvoicesResponse.data.filter((inv: Invoice & { advertiser_id: number }) => 
            subsResponse.data.some((sub: Subscription) => inv.subscription_id === sub.id)
        );
        setInvoices(advertiserInvoices);

        // Fetch statistics (last 30 days)
        try {
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          
          const statsResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL || '/api'}/statistics/advertiser/${id}`,
            {
              params: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
              }
            }
          );
          setStatistics(statsResponse.data);
        } catch (statsError) {
          console.error('Error fetching statistics:', statsError);
          // Don't show error toast for statistics as it's not critical
        }
      }

    } catch (error) {
      console.error('Error fetching advertiser details:', error);
      toast.error('خطأ في تحميل بيانات المعلن');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteAdvertiser = async () => {
    if (!advertiser || !confirm(`هل أنت متأكد من حذف المعلن ${advertiser.company_name}؟`)) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      await axios.delete(`${apiUrl}/advertisers/${advertiser.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('تم حذف المعلن بنجاح');
      router.push('/admin/dashboard?tab=advertisers');
    } catch (error) {
      toast.error('خطأ في حذف المعلن');
    }
  };

  const handleToggleStatus = async () => {
    if (!advertiser) return;
    
    const newStatus = advertiser.status === 'active' ? 'inactive' : 'active';
    const confirmMessage = newStatus === 'active'
      ? 'هل تريد تفعيل هذا المعلن؟'
      : 'هل تريد إيقاف هذا المعلن؟';
    
    if (confirm(confirmMessage)) {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        await axios.put(
          `${apiUrl}/advertisers/${advertiser.id}`,
          { status: newStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success(newStatus === 'active' ? 'تم تفعيل المعلن' : 'تم إيقاف المعلن');
        fetchAdvertiserDetails();
      } catch (error) {
        toast.error('خطأ في تحديث حالة المعلن');
      }
    }
  };

  const handleAddGracePeriod = async () => {
    if (!selectedSubscription) return;
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const newEndDate = new Date(selectedSubscription.end_date);
      newEndDate.setDate(newEndDate.getDate() + gracePeriodDays);
      
      await axios.put(
        `${apiUrl}/subscriptions/${selectedSubscription.id}`,
        { end_date: newEndDate.toISOString().split('T')[0] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`تم إضافة ${gracePeriodDays} يوم كفترة سماح`);
      setShowGracePeriodModal(false);
      fetchAdvertiserDetails();
    } catch (error) {
      toast.error('خطأ في إضافة فترة السماح');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div></div>;
  }

  if (!advertiser) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-red-500">لم يتم العثور على المعلن.</div>;
  }

  const InfoCard = ({ title, children, icon: Icon }: { title: string, children: React.ReactNode, icon: React.ElementType }) => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center text-xl font-semibold text-gray-700 mb-4">
        <Icon className="mr-3 text-primary-500" />
        {title}
      </div>
      {children}
    </div>
  );

  return (
    <>
      <Head>
        <title>{advertiser.company_name} - تفاصيل المعلن</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gradient">{advertiser.company_name}</h1>
              <Link href="/admin/dashboard?tab=advertisers">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <FaArrowLeft />
                  <span>العودة للمعلنين</span>
                </motion.button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Advertiser Info & Actions */}
            <div className="lg:col-span-1 space-y-8">
              <InfoCard title="معلومات الشركة" icon={FaBuilding}>
                {advertiser.icon_url && (
                  <div className="mb-4 text-center">
                    <img src={advertiser.icon_url} alt={advertiser.company_name} className="w-32 h-32 object-contain rounded-full shadow-md mx-auto" />
                  </div>
                )}
                <p><strong>الهاتف:</strong> <a href={`tel:${advertiser.phone}`} className="text-blue-600 hover:underline">{advertiser.phone}</a></p>
                {advertiser.whatsapp && <p><strong>واتساب:</strong> <a href={`https://wa.me/${advertiser.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">{advertiser.whatsapp}</a></p>}
                <p><strong>البريد الإلكتروني:</strong> <a href={`mailto:${advertiser.email}`} className="text-blue-600 hover:underline">{advertiser.email}</a></p>
                <p><strong>الحالة:</strong> <span className={`px-2 py-1 rounded-full text-xs ${advertiser.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{advertiser.status === 'active' ? 'نشط' : 'غير نشط'}</span></p>
                <p><strong>الخدمات:</strong> {advertiser.services || 'غير محدد'}</p>
                <p className="text-sm text-gray-500 mt-2">تاريخ الإنشاء: {formatDate(advertiser.created_at, 'dd/MM/yyyy HH:mm')}</p>
                <p className="text-sm text-gray-500">آخر تحديث: {formatDate(advertiser.updated_at, 'dd/MM/yyyy HH:mm')}</p>
                <div className="mt-6 flex gap-3">
                  <Link href={`/admin/advertisers/${advertiser.id}/edit`}>
                    <motion.button whileHover={{scale: 1.05}} className="btn-primary flex-1 flex items-center justify-center gap-2"><FaEdit /> تعديل</motion.button>
                  </Link>
                  <motion.button onClick={handleDeleteAdvertiser} whileHover={{scale: 1.05}} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex-1 flex items-center justify-center gap-2"><FaTrash /> حذف</motion.button>
                </div>
              </InfoCard>

              <InfoCard title="إضافة اشتراك جديد" icon={FaPlus}>
                {/* TODO: Add New Subscription Form Here */}
                <p className="text-gray-500">سيتم إضافة نموذج إضافة اشتراك هنا قريباً.</p>
              </InfoCard>
            </div>

            {/* Right Column: Subscriptions, Invoices, Stats */}
            <div className="lg:col-span-2 space-y-8">
              <InfoCard title="الاشتراكات" icon={FaCalendarAlt}>
                {subscriptions.length > 0 ? (
                  <ul className="space-y-4">
                    {subscriptions.map(sub => (
                      <li key={sub.id} className="border rounded-lg p-4">
                        <h4 className="font-semibold">{sub.plan_name} ({sub.price} ريال / {sub.duration_days} يوم)</h4>
                        <p>من: {formatDate(sub.start_date, 'dd/MM/yyyy')} إلى: {formatDate(sub.end_date, 'dd/MM/yyyy')}</p>
                        <p>الحالة: <span className={`px-2 py-1 rounded-full text-xs ${sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{sub.status === 'active' ? 'نشط' : 'غير نشط'}</span></p>
                        <p>الدفع: <span className={`px-2 py-1 rounded-full text-xs ${sub.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{sub.payment_status === 'paid' ? 'مدفوع' : 'غير مدفوع'}</span></p>
                        {/* TODO: Add actions like renew, cancel, view invoice */}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-gray-500">لا توجد اشتراكات حالية.</p>}
              </InfoCard>

              <InfoCard title="الفواتير" icon={FaFileInvoice}>
                {invoices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right py-2 px-3">رقم الفاتورة</th>
                          <th className="text-right py-2 px-3">المبلغ</th>
                          <th className="text-right py-2 px-3">الحالة</th>
                          <th className="text-right py-2 px-3">تاريخ الإصدار</th>
                          <th className="text-right py-2 px-3">تاريخ الاستحقاق</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map(inv => (
                          <tr key={inv.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3">{inv.invoice_number}</td>
                            <td className="py-2 px-3">{inv.amount} ريال</td>
                            <td className="py-2 px-3"><span className={`px-2 py-1 rounded-full text-xs ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : (inv.status === 'unpaid' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800')}`}>{inv.status === 'paid' ? 'مدفوعة' : (inv.status === 'unpaid' ? 'غير مدفوعة' : 'معلقة')}</span></td>
                            <td className="py-2 px-3">{formatDate(inv.issued_date, 'dd/MM/yyyy')}</td>
                            <td className="py-2 px-3">{formatDate(inv.due_date, 'dd/MM/yyyy')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-gray-500">لا توجد فواتير.</p>}
              </InfoCard>

              <InfoCard title="الإحصائيات (آخر 30 يوم)" icon={FaChartLine}>
                {statistics.length > 0 ? (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-sm text-blue-600 mb-1">إجمالي المشاهدات</div>
                        <div className="text-3xl font-bold text-blue-800">
                          {statistics.reduce((sum, stat) => sum + (stat.views || 0), 0)}
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="text-sm text-green-600 mb-1">إجمالي النقرات</div>
                        <div className="text-3xl font-bold text-green-800">
                          {statistics.reduce((sum, stat) => sum + (stat.clicks || 0), 0)}
                        </div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="text-sm text-purple-600 mb-1">إجمالي المكالمات</div>
                        <div className="text-3xl font-bold text-purple-800">
                          {statistics.reduce((sum, stat) => sum + (stat.calls || 0), 0)}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-right py-2 px-3 text-sm font-semibold">التاريخ</th>
                            <th className="text-right py-2 px-3 text-sm font-semibold">المشاهدات</th>
                            <th className="text-right py-2 px-3 text-sm font-semibold">النقرات</th>
                            <th className="text-right py-2 px-3 text-sm font-semibold">المكالمات</th>
                            <th className="text-right py-2 px-3 text-sm font-semibold">معدل التحويل</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statistics.slice().reverse().slice(0, 10).map((stat) => {
                            const conversionRate = stat.views > 0 
                              ? ((stat.calls / stat.views) * 100).toFixed(1)
                              : '0';
                            return (
                              <tr key={stat.id} className="border-b hover:bg-gray-50">
                                <td className="py-2 px-3 text-sm">
                                  {stat.date?.toDate ? format(stat.date.toDate(), 'dd/MM/yyyy', { locale: ar }) : 'N/A'}
                                </td>
                                <td className="py-2 px-3 text-sm">{stat.views || 0}</td>
                                <td className="py-2 px-3 text-sm">{stat.clicks || 0}</td>
                                <td className="py-2 px-3 text-sm font-bold text-purple-600">{stat.calls || 0}</td>
                                <td className="py-2 px-3 text-sm">
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                    {conversionRate}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Call Details */}
                    {statistics.some(s => s.call_details && s.call_details.length > 0) && (
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold mb-3 text-gray-800">تفاصيل المكالمات الأخيرة</h4>
                        <div className="space-y-2">
                          {statistics
                            .flatMap(s => (s.call_details || []).map(cd => ({ ...cd, date: s.date })))
                            .slice(-10)
                            .reverse()
                            .map((call, idx) => (
                              <div key={idx} className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="flex items-center gap-2">
                                  <FaPhone className="text-purple-600" />
                                  <span className="font-mono text-sm">{call.phone}</span>
                                </div>
                                <div className="text-sm text-gray-600">
                                  {call.timestamp?.toDate 
                                    ? format(call.timestamp.toDate(), 'dd/MM/yyyy HH:mm', { locale: ar })
                                    : 'N/A'}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">لا توجد إحصائيات متاحة حالياً.</p>
                )}
              </InfoCard>
            </div>
          </div>
        </div>
      </div>

      {/* Modal لتجديد الاشتراك */}
      {showRenewalModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaRedo className="text-blue-600" />
              تجديد الاشتراك
            </h3>
            
            <p className="text-gray-600 mb-4">
              سيتم تجديد الاشتراك لنفس الباقة ({selectedSubscription.plan_name})
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRenewalModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                إلغاء
              </button>
              <Link href={`/admin/advertisers/${id}/renew?subscription=${selectedSubscription.id}`}>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  متابعة التجديد
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal لإضافة فترة سماح */}
      {showGracePeriodModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaClock className="text-orange-600" />
              إضافة فترة سماح
            </h3>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">
                عدد الأيام
              </label>
              <input
                type="number"
                value={gracePeriodDays}
                onChange={(e) => setGracePeriodDays(parseInt(e.target.value) || 0)}
                min="1"
                max="30"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                سيتم تمديد الاشتراك حتى: {format(
                  new Date(new Date(selectedSubscription.end_date).getTime() + gracePeriodDays * 24 * 60 * 60 * 1000),
                  'dd/MM/yyyy',
                  { locale: ar }
                )}
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowGracePeriodModal(false);
                  setGracePeriodDays(7);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddGracePeriod}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                إضافة فترة السماح
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}