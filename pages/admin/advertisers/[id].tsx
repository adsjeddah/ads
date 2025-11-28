import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaEdit, FaTrash, FaBuilding, FaPhone, FaEnvelope, FaListAlt, FaWhatsapp, FaCalendarAlt, FaMoneyBillWave, FaChartLine, FaPlus, FaFileInvoice, FaPause, FaPlay, FaRedo, FaClock, FaBox, FaStop, FaTruck, FaBoxes, FaHome, FaDolly, FaShippingFast, FaWarehouse, FaHandshake, FaTools, FaPeopleCarry, FaRoute, FaShieldAlt, FaAward, FaStar, FaMapMarkedAlt, FaHeadset, FaUserTie, FaClipboardCheck, FaTruckLoading, FaBoxOpen, FaGift, FaTimes, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import SubscriptionStatusManager from '../../../components/admin/SubscriptionStatusManager';
import RecordPaymentForm from '../../../components/admin/RecordPaymentForm';

interface Advertiser {
  id: number;
  company_name: string;
  phone: string;
  whatsapp?: string;
  email: string;
  services?: string;
  icon_url?: string;
  status: string;
  sector?: 'movers' | 'cleaning' | 'water-leaks' | 'pest-control';
  coverage_type?: 'kingdom' | 'city' | 'both';
  coverage_cities?: string[];
  customer_type?: 'new' | 'trusted' | 'vip';
  is_trusted?: boolean;
  payment_terms_days?: number;
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
  // Grace Period fields
  is_in_grace_period?: boolean;
  grace_period_end_date?: string;
  grace_period_days?: number;
  total_grace_extensions?: number;
  // Coverage info
  coverage_area?: 'kingdom' | 'city';
  city?: string;
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
  const [gracePeriodDays, setGracePeriodDays] = useState(3);
  const [gracePeriodReason, setGracePeriodReason] = useState('');
  const [gracePeriodLoading, setGracePeriodLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // حالات الإجراءات السريعة للموبايل
  const [showQuickActionModal, setShowQuickActionModal] = useState(false);
  const [quickActionType, setQuickActionType] = useState<'pause' | 'stop' | 'resume' | 'reactivate' | null>(null);
  const [quickActionReason, setQuickActionReason] = useState('');
  const [quickActionLoading, setQuickActionLoading] = useState(false);

  // تعريف الأيقونات المتاحة (نفس النظام من index.tsx)
  const iconComponents: { [key: string]: any } = {
    'truck': FaTruck,
    'boxes': FaBoxes,
    'home': FaHome,
    'dolly': FaDolly,
    'shipping-fast': FaShippingFast,
    'warehouse': FaWarehouse,
    'handshake': FaHandshake,
    'tools': FaTools,
    'people-carry': FaPeopleCarry,
    'route': FaRoute,
    'clock': FaClock,
    'shield-alt': FaShieldAlt,
    'award': FaAward,
    'star': FaStar,
    'map-marked-alt': FaMapMarkedAlt,
    'headset': FaHeadset,
    'user-tie': FaUserTie,
    'clipboard-check': FaClipboardCheck,
    'truck-loading': FaTruckLoading,
    'box-open': FaBoxOpen,
  };

  const iconColors: { [key: string]: string } = {
    'truck': 'text-blue-600',
    'boxes': 'text-amber-600',
    'home': 'text-green-600',
    'dolly': 'text-purple-600',
    'shipping-fast': 'text-red-600',
    'warehouse': 'text-indigo-600',
    'handshake': 'text-teal-600',
    'tools': 'text-orange-600',
    'people-carry': 'text-pink-600',
    'route': 'text-cyan-600',
    'clock': 'text-yellow-600',
    'shield-alt': 'text-gray-600',
    'award': 'text-yellow-500',
    'star': 'text-yellow-400',
    'map-marked-alt': 'text-green-500',
    'headset': 'text-blue-500',
    'user-tie': 'text-gray-700',
    'clipboard-check': 'text-green-700',
    'truck-loading': 'text-red-700',
    'box-open': 'text-amber-700',
  };

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

  // Helper functions for translations
  const getSectorName = (sector?: string) => {
    const sectors: Record<string, string> = {
      'movers': 'نقل العفش',
      'cleaning': 'النظافة',
      'water-leaks': 'كشف تسربات المياه',
      'pest-control': 'مكافحة الحشرات'
    };
    return sector ? sectors[sector] || sector : 'غير محدد';
  };

  const getCoverageTypeName = (type?: string) => {
    const types: Record<string, string> = {
      'kingdom': 'المملكة كاملة',
      'city': 'مدن محددة',
      'both': 'المملكة + مدن محددة'
    };
    return type ? types[type] || type : 'غير محدد';
  };

  const getCityName = (city: string) => {
    const cities: Record<string, string> = {
      'jeddah': 'جدة',
      'riyadh': 'الرياض',
      'dammam': 'الدمام'
    };
    return cities[city] || city;
  };

  const getCustomerTypeName = (type?: string) => {
    const types: Record<string, string> = {
      'new': 'عميل جديد',
      'trusted': 'عميل موثوق',
      'vip': '⭐ عميل VIP'
    };
    return type ? types[type] || type : 'عميل جديد';
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/admin/login');
        return;
      }
    }
    if (id) {
      fetchAdvertiserDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
    
    setGracePeriodLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      // استخدام الـ API الجديد لتفعيل فترة السماح
      const response = await axios.post(
        `${apiUrl}/subscriptions/${selectedSubscription.id}/activate-grace`,
        { 
          days: gracePeriodDays,
          reason: gracePeriodReason || 'تمديد فترة سماح'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(response.data.message || `تم تفعيل فترة سماح لمدة ${gracePeriodDays} أيام`);
      setShowGracePeriodModal(false);
      setGracePeriodReason('');
      fetchAdvertiserDetails();
    } catch (error: any) {
      console.error('Error adding grace period:', error);
      toast.error(error.response?.data?.error || 'خطأ في إضافة فترة السماح');
    } finally {
      setGracePeriodLoading(false);
    }
  };

  // دوال الإجراءات السريعة للموبايل
  const openQuickAction = (subscription: Subscription, action: 'pause' | 'stop' | 'resume' | 'reactivate') => {
    setSelectedSubscription(subscription);
    setQuickActionType(action);
    setQuickActionReason('');
    setShowQuickActionModal(true);
  };

  const executeQuickAction = async () => {
    if (!selectedSubscription || !quickActionType) return;
    
    // التحقق من السبب للإيقاف الكامل
    if (quickActionType === 'stop' && !quickActionReason.trim()) {
      toast.error('الرجاء إدخال سبب الإيقاف');
      return;
    }

    setQuickActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      let endpoint = '';
      let successMessage = '';
      
      switch (quickActionType) {
        case 'pause':
          endpoint = `${apiUrl}/subscriptions/${selectedSubscription.id}/pause`;
          successMessage = 'تم إيقاف الاشتراك مؤقتاً';
          break;
        case 'stop':
          endpoint = `${apiUrl}/subscriptions/${selectedSubscription.id}/stop`;
          successMessage = 'تم إيقاف الاشتراك';
          break;
        case 'resume':
          endpoint = `${apiUrl}/subscriptions/${selectedSubscription.id}/resume`;
          successMessage = 'تم إعادة تشغيل الاشتراك';
          break;
        case 'reactivate':
          endpoint = `${apiUrl}/subscriptions/${selectedSubscription.id}/reactivate`;
          successMessage = 'تم إعادة تنشيط الاشتراك';
          break;
      }

      const response = await axios.post(
        endpoint,
        { reason: quickActionReason || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(response.data.message || successMessage);
      setShowQuickActionModal(false);
      setQuickActionType(null);
      setQuickActionReason('');
      setSelectedSubscription(null);
      fetchAdvertiserDetails();
    } catch (error: any) {
      console.error('Error executing quick action:', error);
      toast.error(error.response?.data?.error || 'حدث خطأ في تنفيذ الإجراء');
    } finally {
      setQuickActionLoading(false);
    }
  };

  const getQuickActionInfo = () => {
    switch (quickActionType) {
      case 'pause':
        return {
          title: 'إيقاف مؤقت',
          description: 'سيتم إيقاف الاشتراك مؤقتاً. الأيام لن تُحتسب أثناء التوقف.',
          color: 'bg-yellow-500',
          icon: FaPause,
          requireReason: false
        };
      case 'stop':
        return {
          title: 'إيقاف كامل',
          description: 'سيتم إيقاف الاشتراك بشكل كامل. يمكن إعادة تنشيطه لاحقاً.',
          color: 'bg-red-500',
          icon: FaStop,
          requireReason: true
        };
      case 'resume':
        return {
          title: 'إعادة تشغيل',
          description: 'سيتم إعادة تشغيل الاشتراك وتمديد تاريخ النهاية بعدد أيام التوقف.',
          color: 'bg-green-500',
          icon: FaPlay,
          requireReason: false
        };
      case 'reactivate':
        return {
          title: 'إعادة تنشيط',
          description: 'سيبدأ الاشتراك من جديد بنفس الباقة والمدة.',
          color: 'bg-blue-500',
          icon: FaRedo,
          requireReason: false
        };
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div></div>;
  }

  if (!advertiser) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-red-500">لم يتم العثور على المعلن.</div>;
  }

  const InfoCard = ({ title, children, icon: Icon }: { title: string, children: React.ReactNode, icon: React.ElementType }) => (
    <div className="bg-white rounded-lg md:rounded-xl shadow-md md:shadow-lg p-4 md:p-6">
      <div className="flex items-center text-base md:text-xl font-semibold text-gray-700 mb-3 md:mb-4">
        <Icon className="mr-2 md:mr-3 text-primary-500 text-lg md:text-xl" />
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
          <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-2xl font-bold text-gradient truncate max-w-[150px] md:max-w-none">{advertiser.company_name}</h1>
                {/* حالة المعلن */}
                <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-semibold ${advertiser.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {advertiser.status === 'active' ? '● نشط' : '○ موقف'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* أزرار سريعة لتغيير الحالة - للموبايل */}
                <button
                  onClick={handleToggleStatus}
                  className={`md:hidden flex items-center justify-center p-2 rounded-lg transition-all ${
                    advertiser.status === 'active' 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200 active:bg-red-300' 
                      : 'bg-green-100 text-green-600 hover:bg-green-200 active:bg-green-300'
                  }`}
                  title={advertiser.status === 'active' ? 'إيقاف المعلن' : 'تفعيل المعلن'}
                >
                  {advertiser.status === 'active' ? <FaStop className="text-sm" /> : <FaPlay className="text-sm" />}
                </button>
                
                <Link href="/admin/dashboard?tab=advertisers">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-1 md:gap-2 text-gray-600 hover:text-primary-600 transition-colors text-sm md:text-base"
                  >
                    <FaArrowLeft />
                    <span className="hidden sm:inline">العودة للمعلنين</span>
                    <span className="sm:hidden">رجوع</span>
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </header>
        
        {/* شريط إجراءات سريعة للموبايل - يظهر تحت الهيدر */}
        {subscriptions.length > 0 && (
          <div className="md:hidden bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-3 py-2 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap">إجراءات سريعة:</span>
              {subscriptions.slice(0, 1).map(sub => (
                <div key={sub.id} className="flex items-center gap-1.5">
                  {/* الاشتراك النشط */}
                  {sub.status === 'active' && (
                    <>
                      <button
                        onClick={() => openQuickAction(sub, 'pause')}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-yellow-500 text-white text-xs font-medium rounded-lg active:bg-yellow-600 shadow-sm"
                      >
                        <FaPause className="text-[10px]" />
                        <span>إيقاف مؤقت</span>
                      </button>
                      <button
                        onClick={() => openQuickAction(sub, 'stop')}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg active:bg-red-600 shadow-sm"
                      >
                        <FaStop className="text-[10px]" />
                        <span>إيقاف</span>
                      </button>
                    </>
                  )}
                  {/* الاشتراك المتوقف مؤقتاً */}
                  {sub.status === 'paused' && (
                    <>
                      <button
                        onClick={() => openQuickAction(sub, 'resume')}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg active:bg-green-600 shadow-sm"
                      >
                        <FaPlay className="text-[10px]" />
                        <span>تشغيل</span>
                      </button>
                      <button
                        onClick={() => openQuickAction(sub, 'stop')}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg active:bg-red-600 shadow-sm"
                      >
                        <FaStop className="text-[10px]" />
                        <span>إيقاف</span>
                      </button>
                    </>
                  )}
                  {/* الاشتراك المتوقف */}
                  {sub.status === 'stopped' && (
                    <button
                      onClick={() => openQuickAction(sub, 'reactivate')}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg active:bg-blue-600 shadow-sm"
                    >
                      <FaRedo className="text-[10px]" />
                      <span>إعادة تنشيط</span>
                    </button>
                  )}
                  {/* الاشتراك المنتهي أو الملغي */}
                  {(sub.status === 'expired' || sub.status === 'cancelled') && (
                    <button
                      onClick={() => openQuickAction(sub, 'reactivate')}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg active:bg-blue-600 shadow-sm"
                    >
                      <FaRedo className="text-[10px]" />
                      <span>إعادة تنشيط</span>
                    </button>
                  )}
                  {/* في انتظار الدفع */}
                  {sub.status === 'pending_payment' && (
                    <>
                      <button
                        onClick={() => openQuickAction(sub, 'reactivate')}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg active:bg-green-600 shadow-sm"
                      >
                        <FaPlay className="text-[10px]" />
                        <span>تفعيل</span>
                      </button>
                      <button
                        onClick={() => openQuickAction(sub, 'stop')}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg active:bg-red-600 shadow-sm"
                      >
                        <FaStop className="text-[10px]" />
                        <span>إلغاء</span>
                      </button>
                    </>
                  )}
                  {/* حالة الاشتراك واسم الباقة */}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    sub.status === 'active' ? 'bg-green-100 text-green-700' :
                    sub.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                    sub.status === 'stopped' ? 'bg-red-100 text-red-700' :
                    sub.status === 'expired' ? 'bg-gray-100 text-gray-700' :
                    sub.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {sub.status === 'active' ? 'نشط' :
                     sub.status === 'paused' ? 'متوقف مؤقتاً' :
                     sub.status === 'stopped' ? 'متوقف' :
                     sub.status === 'expired' ? 'منتهي' :
                     sub.status === 'cancelled' ? 'ملغي' :
                     'انتظار الدفع'}
                  </span>
                  <span className="text-[10px] text-gray-400">({sub.plan_name})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            {/* Left Column: Advertiser Info & Actions */}
            <div className="lg:col-span-1 space-y-4 md:space-y-8">
              <InfoCard title="معلومات الشركة" icon={FaBuilding}>
                {/* عرض الأيقونة */}
                <div className="mb-6 flex justify-center">
                  {advertiser.icon_url && iconComponents[advertiser.icon_url] ? (
                    <div className="w-32 h-32 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-full flex items-center justify-center shadow-lg border-4 border-primary-200">
                      {React.createElement(iconComponents[advertiser.icon_url], {
                        className: `text-6xl ${iconColors[advertiser.icon_url] || 'text-primary-600'}`
                      })}
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-lg border-4 border-primary-300">
                      {advertiser.company_name.charAt(0)}
                    </div>
                  )}
                </div>
                
                <p><strong>الهاتف:</strong> <a href={`tel:${advertiser.phone}`} className="text-blue-600 hover:underline">{advertiser.phone}</a></p>
                {advertiser.whatsapp && <p><strong>واتساب:</strong> <a href={`https://wa.me/${advertiser.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">{advertiser.whatsapp}</a></p>}
                <p><strong>البريد الإلكتروني:</strong> <a href={`mailto:${advertiser.email}`} className="text-blue-600 hover:underline">{advertiser.email}</a></p>
                <p><strong>الحالة:</strong> <span className={`px-2 py-1 rounded-full text-xs ${advertiser.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{advertiser.status === 'active' ? 'نشط' : 'غير نشط'}</span></p>
                <p><strong>الخدمات:</strong> {advertiser.services || 'غير محدد'}</p>
                
                {/* القطاع */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="mb-2"><strong>القطاع:</strong> <span className="px-3 py-1 rounded-lg bg-purple-100 text-purple-800 text-sm font-semibold">{getSectorName(advertiser.sector)}</span></p>
                  
                  {/* التغطية الجغرافية */}
                  <p className="mb-2"><strong>التغطية:</strong> <span className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-sm font-semibold">{getCoverageTypeName(advertiser.coverage_type)}</span></p>
                  
                  {/* المدن المغطاة */}
                  {advertiser.coverage_cities && advertiser.coverage_cities.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold text-gray-700 mb-1">المدن المغطاة:</p>
                      <div className="flex flex-wrap gap-2">
                        {advertiser.coverage_cities.map((city) => (
                          <span key={city} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            {getCityName(city)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* تصنيف العميل */}
                  {advertiser.customer_type && (
                    <p className="mt-2"><strong>تصنيف العميل:</strong> <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                      advertiser.customer_type === 'vip' ? 'bg-amber-100 text-amber-800' :
                      advertiser.customer_type === 'trusted' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>{getCustomerTypeName(advertiser.customer_type)}</span></p>
                  )}
                  
                  {/* مهلة الدفع */}
                  {advertiser.payment_terms_days && advertiser.payment_terms_days > 0 && (
                    <p className="mt-2 text-sm"><strong>مهلة الدفع:</strong> <span className="text-orange-600 font-semibold">{advertiser.payment_terms_days} يوم</span></p>
                  )}
                </div>
                
                <p className="text-sm text-gray-500 mt-4">تاريخ الإنشاء: {formatDate(advertiser.created_at, 'dd/MM/yyyy HH:mm')}</p>
                <p className="text-sm text-gray-500">آخر تحديث: {formatDate(advertiser.updated_at, 'dd/MM/yyyy HH:mm')}</p>
                <div className="mt-4 md:mt-6 flex flex-col gap-2 md:gap-3">
                  <div className="flex gap-2 md:gap-3">
                    <Link href={`/admin/advertisers/${advertiser.id}/edit-simple`} className="flex-1">
                      <motion.button whileHover={{scale: 1.05}} className="btn-primary w-full flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base py-2 md:py-2.5"><FaEdit /> <span className="hidden sm:inline">تعديل</span><span className="sm:hidden">تعديل</span></motion.button>
                    </Link>
                    <motion.button onClick={handleDeleteAdvertiser} whileHover={{scale: 1.05}} className="bg-red-500 hover:bg-red-600 text-white px-3 md:px-4 py-2 rounded-lg flex-1 flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base"><FaTrash /> حذف</motion.button>
                  </div>
                  <Link href={`/admin/advertisers/${advertiser.id}/statistics`}>
                    <motion.button whileHover={{scale: 1.05}} className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-3 md:px-4 py-2 rounded-lg w-full flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base"><FaChartLine /> <span className="hidden sm:inline">إحصائيات تفصيلية</span><span className="sm:hidden">الإحصائيات</span></motion.button>
                  </Link>
                </div>
              </InfoCard>

              <InfoCard title="الإدارة المالية" icon={FaMoneyBillWave}>
                <p className="text-gray-600 mb-3 md:mb-4 text-sm md:text-base">إدارة الاشتراكات والفواتير والمدفوعات</p>
                <Link href={`/admin/advertisers/${advertiser.id}/financial`}>
                  <motion.button 
                    whileHover={{scale: 1.05}} 
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-3 md:px-4 py-2.5 md:py-3 rounded-lg flex items-center justify-center gap-1 md:gap-2 font-semibold shadow-lg hover:shadow-xl transition-all text-sm md:text-base"
                  >
                    <FaMoneyBillWave />
                    فتح النظام المالي
                  </motion.button>
                </Link>
              </InfoCard>
            </div>

            {/* Right Column: Subscriptions, Invoices, Stats */}
            <div className="lg:col-span-2 space-y-4 md:space-y-8">
              <InfoCard title="الاشتراكات" icon={FaCalendarAlt}>
                {subscriptions.length > 0 ? (
                  <div className="space-y-6">
                    {subscriptions.map(sub => (
                      <div key={sub.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-lg">{sub.plan_name}</h4>
                            <p className="text-sm text-gray-600">{sub.price} ريال / {sub.duration_days} يوم</p>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              sub.status === 'active' ? 'bg-green-100 text-green-800' :
                              sub.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                              sub.status === 'stopped' ? 'bg-red-100 text-red-800' :
                              sub.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                              sub.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              sub.status === 'pending_payment' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {sub.status === 'active' ? '🟢 نشط' :
                               sub.status === 'paused' ? '🟡 متوقف مؤقتاً' :
                               sub.status === 'stopped' ? '🔴 متوقف' :
                               sub.status === 'expired' ? '⚫ منتهي' :
                               sub.status === 'cancelled' ? '❌ ملغي' :
                               sub.status === 'pending_payment' ? '🟠 انتظار الدفع' :
                               '⚫ ' + sub.status}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              sub.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                              sub.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {sub.payment_status === 'paid' ? 'مدفوع' :
                               sub.payment_status === 'partial' ? 'جزئي' : 'غير مدفوع'}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>من: {formatDate(sub.start_date, 'dd/MM/yyyy')} إلى: {formatDate(sub.end_date, 'dd/MM/yyyy')}</p>
                          <p>المبلغ الإجمالي: {sub.total_amount} ريال | المدفوع: {sub.paid_amount} ريال | المتبقي: {sub.remaining_amount} ريال</p>
                          {/* التغطية */}
                          {sub.coverage_area && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="font-semibold">التغطية:</span>
                              <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                                sub.coverage_area === 'kingdom' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {sub.coverage_area === 'kingdom' ? '🇸🇦 المملكة' : sub.city ? `🏙️ ${getCityName(sub.city)}` : 'مدينة محددة'}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Status Manager Component */}
                        {/* إدارة حالة الاشتراك - متاحة لجميع الحالات */}
                        <SubscriptionStatusManager 
                          subscription={sub as any}
                          onStatusChanged={fetchAdvertiserDetails}
                        />
                      </div>
                    ))}
                  </div>
                ) : <p className="text-gray-500">لا توجد اشتراكات حالية.</p>}
              </InfoCard>

              <InfoCard title="الفواتير" icon={FaFileInvoice}>
                {invoices.length > 0 ? (
                  <div className="overflow-x-auto -mx-4 md:mx-0">
                    <table className="w-full text-xs md:text-sm min-w-[500px]">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right py-2 px-2 md:px-3">الفاتورة</th>
                          <th className="text-right py-2 px-2 md:px-3">المبلغ</th>
                          <th className="text-right py-2 px-2 md:px-3">الحالة</th>
                          <th className="text-right py-2 px-2 md:px-3 hidden sm:table-cell">الإصدار</th>
                          <th className="text-right py-2 px-2 md:px-3 hidden md:table-cell">الاستحقاق</th>
                          <th className="text-center py-2 px-2 md:px-3">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map(inv => (
                          <tr key={inv.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-2 md:px-3 text-xs md:text-sm">{inv.invoice_number}</td>
                            <td className="py-2 px-2 md:px-3 font-semibold text-xs md:text-sm">{inv.amount.toLocaleString('ar-SA')}</td>
                            <td className="py-2 px-2 md:px-3"><span className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : (inv.status === 'unpaid' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800')}`}>{inv.status === 'paid' ? 'مدفوع' : (inv.status === 'unpaid' ? 'غير مدفوع' : 'معلق')}</span></td>
                            <td className="py-2 px-2 md:px-3 hidden sm:table-cell text-xs">{formatDate(inv.issued_date, 'dd/MM/yyyy')}</td>
                            <td className="py-2 px-2 md:px-3 hidden md:table-cell text-xs">{formatDate(inv.due_date, 'dd/MM/yyyy')}</td>
                            <td className="py-2 px-2 md:px-3 text-center">
                              {inv.status !== 'paid' && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    // العثور على الاشتراك المرتبط بالفاتورة
                                    const relatedSub = subscriptions.find(sub => sub.id === inv.subscription_id);
                                    if (relatedSub) {
                                      setSelectedSubscription(relatedSub);
                                      setSelectedInvoice(inv);
                                      setShowPaymentModal(true);
                                    } else {
                                      toast.error('لم يتم العثور على الاشتراك المرتبط');
                                    }
                                  }}
                                  className="inline-flex items-center gap-0.5 md:gap-1 px-2 md:px-3 py-1 md:py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-[10px] md:text-xs font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-sm"
                                  title="تسجيل دفعة"
                                >
                                  <FaMoneyBillWave className="text-xs" />
                                  <span className="hidden sm:inline">دفعة</span>
                                </motion.button>
                              )}
                              {inv.status === 'paid' && (
                                <span className="text-green-600 text-[10px] md:text-xs flex items-center justify-center gap-0.5">
                                  <FaCheckCircle className="text-xs" />
                                  <span className="hidden sm:inline">مكتمل</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-gray-500">لا توجد فواتير.</p>}
              </InfoCard>

              <InfoCard title="الإحصائيات (آخر 30 يوم)" icon={FaChartLine}>
                {statistics.length > 0 ? (
                  <div className="space-y-4 md:space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-2 md:gap-4">
                      <div className="bg-blue-50 p-2 md:p-4 rounded-lg border border-blue-200">
                        <div className="text-xs md:text-sm text-blue-600 mb-0.5 md:mb-1">المشاهدات</div>
                        <div className="text-lg md:text-3xl font-bold text-blue-800">
                          {statistics.reduce((sum, stat) => sum + (stat.views || 0), 0)}
                        </div>
                      </div>
                      <div className="bg-green-50 p-2 md:p-4 rounded-lg border border-green-200">
                        <div className="text-xs md:text-sm text-green-600 mb-0.5 md:mb-1">النقرات</div>
                        <div className="text-lg md:text-3xl font-bold text-green-800">
                          {statistics.reduce((sum, stat) => sum + (stat.clicks || 0), 0)}
                        </div>
                      </div>
                      <div className="bg-purple-50 p-2 md:p-4 rounded-lg border border-purple-200">
                        <div className="text-xs md:text-sm text-purple-600 mb-0.5 md:mb-1">المكالمات</div>
                        <div className="text-lg md:text-3xl font-bold text-purple-800">
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

      {/* Modal لتسجيل دفعة */}
      {showPaymentModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <FaMoneyBillWave className="text-green-600" />
                تسجيل دفعة
              </h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedSubscription(null);
                  setSelectedInvoice(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes className="text-xl text-gray-600" />
              </button>
            </div>

            {/* معلومات الاشتراك والفاتورة */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-800 mb-3">معلومات الاشتراك</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">إجمالي الاشتراك:</span>
                  <span className="font-bold text-gray-900 mr-2">{selectedSubscription.total_amount.toLocaleString('ar-SA')} ريال</span>
                </div>
                <div>
                  <span className="text-gray-600">المدفوع:</span>
                  <span className="font-bold text-green-600 mr-2">{selectedSubscription.paid_amount.toLocaleString('ar-SA')} ريال</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">المتبقي:</span>
                  <span className="font-bold text-red-600 mr-2 text-lg">{selectedSubscription.remaining_amount.toLocaleString('ar-SA')} ريال</span>
                </div>
              </div>
              {selectedInvoice && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <span className="text-gray-600 text-sm">الفاتورة:</span>
                  <span className="font-semibold text-gray-900 mr-2">{selectedInvoice.invoice_number}</span>
                  <span className="text-gray-600 text-sm mr-2">المبلغ:</span>
                  <span className="font-semibold text-gray-900">{selectedInvoice.amount.toLocaleString('ar-SA')} ريال</span>
                </div>
              )}
            </div>

            {/* نموذج تسجيل الدفعة */}
            <RecordPaymentForm
              subscription={selectedSubscription as any}
              invoices={invoices.map(inv => ({ ...inv, id: String(inv.id), invoice_number: inv.invoice_number, amount: inv.amount, status: inv.status }))}
              onSuccess={() => {
                setShowPaymentModal(false);
                setSelectedSubscription(null);
                setSelectedInvoice(null);
                fetchAdvertiserDetails();
                toast.success('تم تسجيل الدفعة بنجاح!');
              }}
              onCancel={() => {
                setShowPaymentModal(false);
                setSelectedSubscription(null);
                setSelectedInvoice(null);
              }}
            />
          </motion.div>
        </div>
      )}

      {/* Modal لإضافة فترة سماح - محدث */}
      {showGracePeriodModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <FaGift className="text-orange-600" />
                تفعيل فترة سماح
              </h3>
              <button
                onClick={() => {
                  setShowGracePeriodModal(false);
                  setGracePeriodDays(3);
                  setGracePeriodReason('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes className="text-xl text-gray-600" />
              </button>
            </div>

            {/* معلومات الاشتراك */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700 mb-2">
                <strong>الباقة:</strong> {selectedSubscription.plan_name}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>تاريخ الانتهاء الحالي:</strong>{' '}
                {format(new Date(selectedSubscription.end_date), 'dd/MM/yyyy', { locale: ar })}
              </p>
              {selectedSubscription.is_in_grace_period && (
                <p className="text-sm text-orange-700 font-semibold">
                  🎁 الاشتراك حالياً في فترة سماح
                </p>
              )}
              {selectedSubscription.total_grace_extensions !== undefined && selectedSubscription.total_grace_extensions > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  <strong>عدد التمديدات السابقة:</strong>{' '}
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold">
                    {selectedSubscription.total_grace_extensions} مرة
                  </span>
                </p>
              )}
            </div>
            
            {/* عدد الأيام */}
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">
                عدد الأيام <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={gracePeriodDays}
                onChange={(e) => setGracePeriodDays(parseInt(e.target.value) || 3)}
                min="1"
                max="30"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <p className="text-sm text-orange-600 mt-2 font-semibold">
                📅 التاريخ الجديد للانتهاء:{' '}
                {(() => {
                  const currentEnd = selectedSubscription.is_in_grace_period && selectedSubscription.grace_period_end_date
                    ? new Date(selectedSubscription.grace_period_end_date)
                    : new Date(selectedSubscription.end_date);
                  const newEnd = new Date(currentEnd.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);
                  return format(newEnd, 'dd/MM/yyyy', { locale: ar });
                })()}
              </p>
            </div>

            {/* سبب التمديد */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                سبب التمديد (اختياري)
              </label>
              <textarea
                value={gracePeriodReason}
                onChange={(e) => setGracePeriodReason(e.target.value)}
                placeholder="اكتب سبب إضافة فترة السماح..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* تحذير */}
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>ملاحظة:</strong> فترة السماح لن تؤثر على الفواتير أو الحسابات المالية. 
                هي مجرد تمديد مجاني للوقت لإتاحة الفرصة للمعلن للتجديد.
              </p>
            </div>
            
            {/* أزرار الإجراءات */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowGracePeriodModal(false);
                  setGracePeriodDays(3);
                  setGracePeriodReason('');
                }}
                disabled={gracePeriodLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddGracePeriod}
                disabled={gracePeriodLoading || gracePeriodDays < 1}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 font-semibold disabled:opacity-50 transition-all shadow-lg"
              >
                {gracePeriodLoading ? 'جاري التفعيل...' : '🎁 تفعيل فترة السماح'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal للإجراءات السريعة - محسّن للموبايل */}
      {showQuickActionModal && selectedSubscription && getQuickActionInfo() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md shadow-2xl"
          >
            {/* مؤشر السحب للموبايل */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden" />
            
            <div className="flex items-center gap-3 mb-4">
              {React.createElement(getQuickActionInfo()!.icon, {
                className: `text-2xl text-white p-2 rounded-full ${getQuickActionInfo()!.color}`
              })}
              <div>
                <h3 className="text-lg font-bold text-gray-900">{getQuickActionInfo()!.title}</h3>
                <p className="text-sm text-gray-500">{selectedSubscription.plan_name}</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg">
              {getQuickActionInfo()!.description}
            </p>
            
            {/* حقل السبب */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                السبب {getQuickActionInfo()!.requireReason && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={quickActionReason}
                onChange={(e) => setQuickActionReason(e.target.value)}
                placeholder={getQuickActionInfo()!.requireReason ? 'السبب مطلوب...' : 'السبب (اختياري)...'}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
              />
            </div>
            
            {/* أزرار الإجراءات */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowQuickActionModal(false);
                  setQuickActionType(null);
                  setQuickActionReason('');
                  setSelectedSubscription(null);
                }}
                disabled={quickActionLoading}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors font-medium text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={executeQuickAction}
                disabled={quickActionLoading || (getQuickActionInfo()!.requireReason && !quickActionReason.trim())}
                className={`flex-1 px-4 py-2.5 text-white rounded-lg font-medium text-sm disabled:opacity-50 transition-all shadow-sm ${getQuickActionInfo()!.color} hover:opacity-90 active:opacity-80`}
              >
                {quickActionLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري التنفيذ...
                  </span>
                ) : (
                  'تأكيد'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}