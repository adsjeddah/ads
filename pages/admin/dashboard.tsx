import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUsers, FaFileInvoice, FaChartLine, FaBell, 
  FaSignOutAlt, FaPlus, FaEye, FaEdit, FaTrash,
  FaCheckCircle, FaClock, FaTimesCircle, FaMoneyBillWave,
  FaHistory, FaUndo, FaExclamationTriangle, FaPercent,
  FaChartBar, FaCalendarAlt, FaArrowUp, FaArrowDown,
  FaPause, FaPlay, FaStop, FaBan, FaRedo, FaSearch, FaFilter,
  FaStickyNote, FaGift
} from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDate as formatDateUtil, formatPrice, firestoreTimestampToDate } from '@/lib/utils';
import { ar } from 'date-fns/locale';

interface Statistics {
  totalAdvertisers: { count: number };
  activeSubscriptions: { count: number };
  pausedSubscriptions?: { count: number };
  stoppedSubscriptions?: { count: number };
  totalRevenue: { total: number };
  pendingRequests: { count: number };
  totalVAT?: { total: number };
  pendingReminders?: { count: number };
  pendingRefunds?: { count: number };
  overdueInvoices?: { count: number };
  totalAudits?: number;
  gracePeriodSubscriptions?: { total: number; expiring_soon: number };
}

interface Advertiser {
  id: string;
  company_name: string;
  phone: string;
  email?: string;
  status: string;
  created_at: string;
  total_subscriptions?: number;
  active_subscriptions?: number;
  paused_subscriptions?: number;
  stopped_subscriptions?: number;
  total_amount?: number;
  paid_amount?: number;
  remaining_amount?: number;
}

interface AdRequest {
  id: string;
  company_name: string;
  contact_name: string;
  phone: string;
  email?: string;
  whatsapp?: string;
  plan_name?: string;
  price?: number;
  status: string;
  created_at: string;
}

interface Reminder {
  id: string;
  advertiser_id: string;
  reminder_type: string;
  status: string;
  scheduled_date: string;
  message: string;
}

interface Refund {
  id: string;
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
  created_at: Date | string;
  completed_at?: Date;
  // بيانات إضافية (من الاشتراك)
  company_name?: string;
  advertiser_id?: string;
}

interface AuditLog {
  id: string;
  invoice_id: string;
  action: string;
  performed_by: string;
  performed_at: string;
}

interface Subscription {
  id: string;
  advertiser_id: string;
  plan_id: string;
  start_date: Date;
  end_date: Date;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  company_name: string; // Advertiser's company name
  phone: string; // Advertiser's phone
  plan_name: string;
  amount: number; // Invoice amount (same as subscription_total for the main invoice)
  status: string; // 'paid', 'unpaid', 'partial', 'overdue'
  issued_date: string;
  due_date: string;
  subscription_total: number;
  subscription_paid: number;
  subscription_remaining: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [adRequests, setAdRequests] = useState<AdRequest[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  // States for refunds tab
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateRefundModal, setShowCreateRefundModal] = useState(false);

  // States for invoices tab
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesSearchTerm, setInvoicesSearchTerm] = useState('');
  const [invoicesFilterStatus, setInvoicesFilterStatus] = useState('all');
  
  // 🆕 Advanced Filters for Invoices
  const [invoicesDateRange, setInvoicesDateRange] = useState('all'); // 'all', 'today', 'last7days', 'thisMonth', 'lastMonth', 'custom'
  const [invoicesStartDate, setInvoicesStartDate] = useState('');
  const [invoicesEndDate, setInvoicesEndDate] = useState('');
  const [invoicesMinAmount, setInvoicesMinAmount] = useState('');
  const [invoicesMaxAmount, setInvoicesMaxAmount] = useState('');
  const [invoicesMinPaid, setInvoicesMinPaid] = useState('');
  const [invoicesMaxPaid, setInvoicesMaxPaid] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Initialize active tab from URL query parameter
  useEffect(() => {
    const tab = router.query.tab as string;
    if (tab && ['overview', 'advertisers', 'invoices', 'requests', 'reminders', 'refunds', 'audit'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [router.query.tab]);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  // Fetch refunds when switching to refunds tab
  useEffect(() => {
    if (activeTab === 'refunds') {
      fetchAllRefunds();
    }
  }, [activeTab]);

  // Fetch invoices when switching to invoices tab
  useEffect(() => {
    if (activeTab === 'invoices') {
      fetchAllInvoices();
    }
  }, [activeTab]);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
    }
  };

  // Helper function to change tab and update URL
  const changeTab = (tab: string) => {
    setActiveTab(tab);
    router.push(`/admin/dashboard?tab=${tab}`, undefined, { shallow: true });
  };

  // Helper function to safely convert Firestore Timestamp to Date
  const toDate = (timestamp: any): Date => {
    try {
      if (!timestamp) return new Date();
      
      // If it's already a Date object
      if (timestamp instanceof Date) {
        // Check if it's a valid date
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
  const formatDate = (timestamp: any, formatString: string = 'dd/MM/yyyy'): string => {
    try {
      const date = firestoreTimestampToDate(timestamp);
      if (!date || isNaN(date.getTime())) {
        return '-';
      }
      return formatDateUtil(date, formatString);
    } catch (error) {
      console.error('Error formatting date:', timestamp, error);
      return '-';
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const [statsRes, advertisersRes, requestsRes, remindersRes, refundsRes, auditRes, gracePeriodStatsRes] = await Promise.all([
        axios.get(`${apiUrl}/statistics/dashboard`, { headers }),
        axios.get(`${apiUrl}/advertisers`, { headers }),
        axios.get(`${apiUrl}/ad-requests`, { headers }),
        axios.get(`${apiUrl}/reminders?status=pending`, { headers }).catch(() => ({ data: { reminders: [] } })),
        axios.get(`${apiUrl}/refunds?status=pending`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${apiUrl}/audit/stats`, { headers }).catch(() => ({ data: { total_audits: 0 } })),
        axios.get(`${apiUrl}/subscriptions/grace-period/stats`, { headers }).catch(() => ({ data: { total: 0, expiring_soon: 0 } }))
      ]);

      // Enhance statistics with new data
      const remindersData = remindersRes.data.reminders || remindersRes.data || [];
      const refundsData = Array.isArray(refundsRes.data) ? refundsRes.data : [];
      
      const enhancedStats = {
        ...statsRes.data,
        pendingReminders: { count: remindersData.length || 0 },
        pendingRefunds: { count: refundsData.length || 0 },
        totalAudits: auditRes.data.total_audits || 0,
        gracePeriodSubscriptions: {
          total: gracePeriodStatsRes.data.total || 0,
          expiring_soon: gracePeriodStatsRes.data.expiring_soon || 0
        }
      };

      setStatistics(enhancedStats);
      setAdvertisers(advertisersRes.data);
      setAdRequests(requestsRes.data.filter((req: AdRequest) => req.status === 'pending'));
      setReminders(remindersData.slice(0, 5));
      setRefunds(refundsData.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('خطأ في تحميل البيانات');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/admin/login');
  };

  // Fetch all refunds with details for refunds tab
  const fetchAllRefunds = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await axios.get(`${apiUrl}/refunds`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // إثراء البيانات بمعلومات الاشتراك
      const enrichedRefunds = await Promise.all(
        response.data.map(async (refund: Refund) => {
          try {
            const subRes = await axios.get(`${apiUrl}/subscriptions/${refund.subscription_id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const subscription = subRes.data;
            
            // جلب معلومات المعلن
            if (subscription.advertiser_id) {
              const advRes = await axios.get(`${apiUrl}/advertisers/${subscription.advertiser_id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              return {
                ...refund,
                company_name: advRes.data.company_name,
                advertiser_id: subscription.advertiser_id
              };
            }
            return refund;
          } catch (error) {
            return refund;
          }
        })
      );
      
      setRefunds(enrichedRefunds);
    } catch (error: any) {
      console.error('Error fetching refunds:', error);
      toast.error('خطأ في جلب الاستردادات');
    }
  };

  // Fetch all invoices for invoices tab
  const fetchAllInvoices = async () => {
    setInvoicesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await axios.get(`${apiUrl}/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('خطأ في جلب الفواتير');
    } finally {
      setInvoicesLoading(false);
    }
  };

  // 🆕 Delete Invoice - حذف الفاتورة + إيقاف الاشتراك والإعلان
  const handleDeleteInvoice = async (invoiceId: number) => {
    if (!confirm('⚠️ تحذير: هل أنت متأكد من حذف هذه الفاتورة؟\n\n📋 سيتم:\n✅ حذف الفاتورة نهائياً\n✅ إيقاف الاشتراك المرتبط\n✅ إيقاف الإعلان عن الظهور\n\n⚠️ ملاحظة:\n• سيتم الحفاظ على سجلات الاشتراك والمدفوعات للأرشيف\n• هذا الإجراء لا يمكن التراجع عنه!\n\nهل تريد المتابعة؟')) {
      return;
    }

    // تأكيد إضافي
    if (!confirm('✋ تأكيد نهائي:\n\nاضغط موافق لحذف الفاتورة وإيقاف الإعلان نهائياً')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      await axios.delete(`${apiUrl}/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('✅ تم حذف الفاتورة وإيقاف الاشتراك بنجاح\n\n• الفاتورة: محذوفة ✅\n• الاشتراك: متوقف ✅\n• الإعلان: متوقف عن الظهور ✅');
      
      // تحديث القائمة
      setInvoices(invoices.filter(inv => inv.id !== invoiceId));
      
      // إعادة جلب البيانات لتحديث الإحصائيات
      fetchAllInvoices();
      
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      toast.error(error.response?.data?.error || 'خطأ في حذف الفاتورة');
    }
  };

  // Reset all advanced filters
  const resetAdvancedFilters = () => {
    setInvoicesDateRange('all');
    setInvoicesStartDate('');
    setInvoicesEndDate('');
    setInvoicesMinAmount('');
    setInvoicesMaxAmount('');
    setInvoicesMinPaid('');
    setInvoicesMaxPaid('');
    setInvoicesFilterStatus('all');
    setInvoicesSearchTerm('');
  };

  // Get invoice status badge
  const getInvoiceStatusBadge = (invoice: Invoice) => {
    if (invoice.status === 'paid') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FaCheckCircle className="mr-1" /> مدفوعة
        </span>
      );
    } else if (invoice.subscription_paid > 0 && invoice.subscription_remaining > 0) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <FaClock className="mr-1" /> مدفوعة جزئياً
        </span>
      );
    } else if (invoice.status === 'unpaid') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <FaExclamationTriangle className="mr-1" /> غير مدفوعة
        </span>
      );
    }
    return null;
  };

  // 🆕 Advanced Filter for Invoices - شامل ومفصل
  const filteredInvoices = invoices.filter(invoice => {
    // 1️⃣ البحث النصي (Search)
    const searchTermLower = invoicesSearchTerm.toLowerCase();
    const matchesSearch = invoice.company_name.toLowerCase().includes(searchTermLower) ||
                         invoice.phone.includes(invoicesSearchTerm) ||
                         invoice.invoice_number.toLowerCase().includes(searchTermLower) ||
                         invoice.plan_name.toLowerCase().includes(searchTermLower);
    
    if (!matchesSearch) return false;
    
    // 2️⃣ فلتر الحالة (Status Filter)
    if (invoicesFilterStatus !== 'all') {
      if (invoicesFilterStatus === 'paid' && invoice.status !== 'paid') return false;
      if (invoicesFilterStatus === 'unpaid' && (invoice.status !== 'unpaid' || invoice.subscription_paid > 0)) return false;
      if (invoicesFilterStatus === 'partial' && !(invoice.status === 'unpaid' && invoice.subscription_paid > 0 && invoice.subscription_remaining > 0)) return false;
    }
    
    // 3️⃣ فلتر التواريخ (Date Range Filter)
    if (invoicesDateRange !== 'all') {
      const invoiceDate = new Date(invoice.issued_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (invoicesDateRange === 'today') {
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        if (invoiceDate < today || invoiceDate > todayEnd) return false;
      }
      
      if (invoicesDateRange === 'last7days') {
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 7);
        if (invoiceDate < last7Days) return false;
      }
      
      if (invoicesDateRange === 'thisMonth') {
        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
        if (invoiceDate < thisMonthStart || invoiceDate > thisMonthEnd) return false;
      }
      
      if (invoicesDateRange === 'lastMonth') {
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
        if (invoiceDate < lastMonthStart || invoiceDate > lastMonthEnd) return false;
      }
      
      if (invoicesDateRange === 'custom') {
        if (invoicesStartDate) {
          const startDate = new Date(invoicesStartDate);
          startDate.setHours(0, 0, 0, 0);
          if (invoiceDate < startDate) return false;
        }
        if (invoicesEndDate) {
          const endDate = new Date(invoicesEndDate);
          endDate.setHours(23, 59, 59, 999);
          if (invoiceDate > endDate) return false;
        }
      }
    }
    
    // 4️⃣ فلتر المبلغ الإجمالي (Total Amount Filter)
    if (invoicesMinAmount && invoice.amount < parseFloat(invoicesMinAmount)) return false;
    if (invoicesMaxAmount && invoice.amount > parseFloat(invoicesMaxAmount)) return false;
    
    // 5️⃣ فلتر المبلغ المدفوع (Paid Amount Filter)
    if (invoicesMinPaid && invoice.subscription_paid < parseFloat(invoicesMinPaid)) return false;
    if (invoicesMaxPaid && invoice.subscription_paid > parseFloat(invoicesMaxPaid)) return false;
    
    return true;
  });

  // تحديث حالة الاسترداد
  const handleUpdateRefundStatus = async (refundId: string, newStatus: string) => {
    const confirmMessages = {
      approved: 'هل تريد الموافقة على هذا الاسترداد؟',
      completed: 'هل تم تنفيذ الاسترداد فعلياً؟ سيتم تحديث الاشتراك.',
      rejected: 'هل تريد رفض هذا الاسترداد؟'
    };

    if (!confirm(confirmMessages[newStatus as keyof typeof confirmMessages])) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      await axios.patch(
        `${apiUrl}/refunds/${refundId}`,
        { 
          status: newStatus,
          notes: `تم ${newStatus === 'completed' ? 'إتمام' : newStatus === 'approved' ? 'الموافقة على' : 'رفض'} الاسترداد بواسطة الإدارة`
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`تم ${newStatus === 'completed' ? 'إتمام' : newStatus === 'approved' ? 'الموافقة على' : 'رفض'} الاسترداد`);
      fetchAllRefunds();
    } catch (error: any) {
      console.error('Error updating refund:', error);
      toast.error('خطأ في تحديث الاسترداد');
    }
  };

  // Helper functions for refunds tab
  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: FaClock, label: 'معلق' },
      approved: { color: 'bg-blue-100 text-blue-800', icon: FaCheckCircle, label: 'موافق عليه' },
      completed: { color: 'bg-green-100 text-green-800', icon: FaCheckCircle, label: 'مكتمل' },
      rejected: { color: 'bg-red-100 text-red-800', icon: FaTimesCircle, label: 'مرفوض' }
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color} flex items-center gap-1 w-fit`}>
        <Icon className="text-xs" />
        {badge.label}
      </span>
    );
  };

  const getRefundMethodLabel = (method: string) => {
    const methods = {
      cash: 'نقداً',
      bank_transfer: 'تحويل بنكي',
      card: 'بطاقة',
      online: 'أونلاين'
    };
    return methods[method as keyof typeof methods] || method;
  };

  const handleDeleteAdvertiser = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المعلن؟ سيتم أرشفة البيانات المالية المرتبطة.')) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      await axios.delete(`${apiUrl}/advertisers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('تم حذف المعلن بنجاح');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting advertiser:', error);
      toast.error(error.response?.data?.error || 'خطأ في حذف المعلن');
    }
  };

  const handleUpdateRequestStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      await axios.put(`${apiUrl}/ad-requests/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (status === 'rejected') {
        toast.success('تم رفض الطلب ونقله إلى الطلبات المرفوضة');
      } else {
        toast.success('تم تحديث حالة الطلب');
      }
      
      fetchData();
    } catch (error) {
      toast.error('خطأ في تحديث الطلب');
    }
  };

  const StatCard = ({ icon: Icon, title, value, color }: any) => (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`w-16 h-16 ${color} rounded-full flex items-center justify-center text-white text-2xl`}>
          <Icon />
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>لوحة التحكم - دليل شركات نقل العفش</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gradient">لوحة التحكم</h1>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors"
              >
                <FaSignOutAlt />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4">
            <div className="flex gap-8">
              <button
                onClick={() => changeTab('overview')}
                className={`py-4 px-2 border-b-2 transition-colors ${
                  activeTab === 'overview' 
                    ? 'border-primary-500 text-primary-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                نظرة عامة
              </button>
              <button
                onClick={() => changeTab('advertisers')}
                className={`py-4 px-2 border-b-2 transition-colors ${
                  activeTab === 'advertisers' 
                    ? 'border-primary-500 text-primary-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                المعلنين
              </button>
              <button
                onClick={() => changeTab('invoices')}
                className={`py-4 px-2 border-b-2 transition-colors ${
                  activeTab === 'invoices'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                الفواتير
              </button>
              <button
                onClick={() => changeTab('requests')}
                className={`py-4 px-2 border-b-2 transition-colors relative ${
                  activeTab === 'requests'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                طلبات الإعلان
                {adRequests.length > 0 && (
                  <span className="absolute -top-1 -left-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {adRequests.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => changeTab('reminders')}
                className={`py-4 px-2 border-b-2 transition-colors relative ${
                  activeTab === 'reminders'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                التذكيرات
                {reminders.length > 0 && (
                  <span className="absolute -top-1 -left-2 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {reminders.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => changeTab('refunds')}
                className={`py-4 px-2 border-b-2 transition-colors relative ${
                  activeTab === 'refunds'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                الاستردادات
                {statistics?.pendingRefunds && statistics.pendingRefunds.count > 0 && (
                  <span className="absolute -top-1 -left-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {statistics.pendingRefunds.count}
                  </span>
                )}
              </button>
              <button
                onClick={() => changeTab('audit')}
                className={`py-4 px-2 border-b-2 transition-colors ${
                  activeTab === 'audit'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                سجل التدقيق
              </button>
              <Link href="/admin/plans">
                <button
                  className={`py-4 px-2 border-b-2 transition-colors ${
                    false
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  خطط الأسعار
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  icon={FaUsers}
                  title="إجمالي المعلنين"
                  value={statistics?.totalAdvertisers.count || 0}
                  color="bg-primary-500"
                />
                <StatCard
                  icon={FaCheckCircle}
                  title="الاشتراكات النشطة"
                  value={statistics?.activeSubscriptions.count || 0}
                  color="bg-green-500"
                />
                <StatCard
                  icon={FaMoneyBillWave}
                  title="إجمالي الإيرادات"
                  value={`${statistics?.totalRevenue.total || 0} ريال`}
                  color="bg-secondary-500"
                />
                <StatCard
                  icon={FaBell}
                  title="طلبات معلقة"
                  value={statistics?.pendingRequests.count || 0}
                  color="bg-accent-500"
                />
              </div>

              {/* Subscription Status Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  icon={FaPause}
                  title="اشتراكات متوقفة مؤقتاً"
                  value={statistics?.pausedSubscriptions?.count || 0}
                  color="bg-yellow-500"
                />
                <StatCard
                  icon={FaStop}
                  title="اشتراكات متوقفة"
                  value={statistics?.stoppedSubscriptions?.count || 0}
                  color="bg-red-500"
                />
                <StatCard
                  icon={FaPercent}
                  title="ضريبة VAT (15%)"
                  value={`${Math.round((statistics?.totalRevenue.total || 0) * 0.15 / 1.15)} ريال`}
                  color="bg-purple-500"
                />
                <StatCard
                  icon={FaClock}
                  title="تذكيرات معلقة"
                  value={statistics?.pendingReminders?.count || 0}
                  color="bg-yellow-500"
                />
                <StatCard
                  icon={FaUndo}
                  title="استردادات معلقة"
                  value={statistics?.pendingRefunds?.count || 0}
                  color="bg-indigo-500"
                />
                <StatCard
                  icon={FaGift}
                  title="فترات سماح نشطة"
                  value={statistics?.gracePeriodSubscriptions?.total || 0}
                  subtitle={statistics?.gracePeriodSubscriptions?.expiring_soon ? `${statistics.gracePeriodSubscriptions.expiring_soon} تنتهي قريباً` : undefined}
                  color="bg-orange-500"
                />
                <StatCard
                  icon={FaHistory}
                  title="سجلات التدقيق"
                  value={statistics?.totalAudits || 0}
                  color="bg-gray-500"
                />
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white cursor-pointer"
                  onClick={() => changeTab('invoices')}
                >
                  <FaFileInvoice className="text-3xl mb-2" />
                  <h3 className="text-lg font-bold mb-1">إدارة الفواتير</h3>
                  <p className="text-sm opacity-90">عرض وإدارة جميع الفواتير مع VAT</p>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl shadow-lg p-6 text-white cursor-pointer"
                  onClick={() => changeTab('refunds')}
                >
                  <FaUndo className="text-3xl mb-2" />
                  <h3 className="text-lg font-bold mb-1">إدارة الاستردادات</h3>
                  <p className="text-sm opacity-90">
                    {statistics?.pendingRefunds ? `${statistics.pendingRefunds.count} معلق` : 'عرض وإدارة الاستردادات'}
                  </p>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white cursor-pointer"
                  onClick={() => changeTab('reminders')}
                >
                  <FaBell className="text-3xl mb-2" />
                  <h3 className="text-lg font-bold mb-1">التذكيرات التلقائية</h3>
                  <p className="text-sm opacity-90">إدارة تذكيرات الدفع والاشتراكات</p>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white cursor-pointer"
                  onClick={() => changeTab('audit')}
                >
                  <FaHistory className="text-3xl mb-2" />
                  <h3 className="text-lg font-bold mb-1">سجل التدقيق</h3>
                  <p className="text-sm opacity-90">تتبع جميع التغييرات والعمليات</p>
                </motion.div>
              </div>

              {/* Recent Advertisers */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">أحدث المعلنين</h2>
                  <Link href="/admin/advertisers/new">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      className="btn-primary flex items-center gap-2"
                    >
                      <FaPlus />
                      <span>إضافة معلن</span>
                    </motion.button>
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-3 px-4">الشركة</th>
                        <th className="text-right py-3 px-4">الهاتف</th>
                        <th className="text-right py-3 px-4">الحالة</th>
                        <th className="text-right py-3 px-4">الاشتراكات</th>
                        <th className="text-right py-3 px-4">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advertisers.slice(0, 5).map((advertiser) => (
                        <tr key={advertiser.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{advertiser.company_name}</td>
                          <td className="py-3 px-4">{advertiser.phone}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              advertiser.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {advertiser.status === 'active' ? 'نشط' : 'غير نشط'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1">
                                <FaCheckCircle className="text-green-500" />
                                {advertiser.active_subscriptions || 0}
                              </span>
                              {advertiser.paused_subscriptions ? (
                                <span className="flex items-center gap-1 text-yellow-600">
                                  <FaPause className="text-xs" />
                                  {advertiser.paused_subscriptions}
                                </span>
                              ) : null}
                              {advertiser.stopped_subscriptions ? (
                                <span className="flex items-center gap-1 text-red-600">
                                  <FaStop className="text-xs" />
                                  {advertiser.stopped_subscriptions}
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Link href={`/admin/advertisers/${advertiser.id}`}>
                                <button className="text-blue-600 hover:text-blue-800">
                                  <FaEye />
                                </button>
                              </Link>
                              <Link href={`/admin/advertisers/${advertiser.id}/edit`}>
                                <button className="text-green-600 hover:text-green-800">
                                  <FaEdit />
                                </button>
                              </Link>
                              <button
                                onClick={() => handleDeleteAdvertiser(advertiser.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'advertisers' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">جميع المعلنين</h2>
                  <Link href="/admin/advertisers/new">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      className="btn-primary flex items-center gap-2"
                    >
                      <FaPlus />
                      <span>إضافة معلن</span>
                    </motion.button>
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-3 px-4">الشركة</th>
                        <th className="text-right py-3 px-4">الهاتف</th>
                        <th className="text-right py-3 px-4">البريد</th>
                        <th className="text-right py-3 px-4">الحالة</th>
                        <th className="text-right py-3 px-4">الاشتراكات</th>
                        <th className="text-right py-3 px-4">تاريخ التسجيل</th>
                        <th className="text-right py-3 px-4">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advertisers.map((advertiser) => (
                        <tr key={advertiser.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{advertiser.company_name}</td>
                          <td className="py-3 px-4">{advertiser.phone}</td>
                          <td className="py-3 px-4">{advertiser.email || '-'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              advertiser.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {advertiser.status === 'active' ? 'نشط' : 'غير نشط'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <span className="flex items-center gap-1 text-green-600">
                                <FaCheckCircle className="text-xs" />
                                {advertiser.active_subscriptions || 0}
                              </span>
                              {advertiser.paused_subscriptions ? (
                                <span className="flex items-center gap-1 text-yellow-600">
                                  <FaPause className="text-xs" />
                                  {advertiser.paused_subscriptions}
                                </span>
                              ) : null}
                              {advertiser.stopped_subscriptions ? (
                                <span className="flex items-center gap-1 text-red-600">
                                  <FaStop className="text-xs" />
                                  {advertiser.stopped_subscriptions}
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {formatDate(advertiser.created_at, 'dd/MM/yyyy')}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Link href={`/admin/advertisers/${advertiser.id}`}>
                                <button className="text-blue-600 hover:text-blue-800">
                                  <FaEye />
                                </button>
                              </Link>
                              <Link href={`/admin/advertisers/${advertiser.id}/edit`}>
                                <button className="text-green-600 hover:text-green-800">
                                  <FaEdit />
                                </button>
                              </Link>
                              <button
                                onClick={() => handleDeleteAdvertiser(advertiser.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'invoices' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* عدد الفواتير */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 rounded-xl shadow-lg p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium mb-1">عدد الفواتير</p>
                      <p className="text-3xl font-bold text-blue-900">{invoices.length}</p>
                    </div>
                    <div className="bg-blue-100 p-4 rounded-lg">
                      <FaFileInvoice className="text-blue-600 text-2xl" />
                    </div>
                  </div>
                </motion.div>

                {/* المبالغ المعلقة */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-yellow-50 rounded-xl shadow-lg p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-600 text-sm font-medium mb-1">المبالغ المعلقة</p>
                      <p className="text-3xl font-bold text-yellow-900">
                        {formatPrice(invoices.reduce((sum, inv) => sum + (inv.subscription_remaining || 0), 0))}
                      </p>
                    </div>
                    <div className="bg-yellow-100 p-4 rounded-lg">
                      <FaClock className="text-yellow-600 text-2xl" />
                    </div>
                  </div>
                </motion.div>

                {/* إجمالي المدفوعات */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-green-50 rounded-xl shadow-lg p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium mb-1">إجمالي المدفوعات</p>
                      <p className="text-3xl font-bold text-green-900">
                        {formatPrice(invoices.reduce((sum, inv) => sum + (inv.subscription_paid || 0), 0))}
                      </p>
                    </div>
                    <div className="bg-green-100 p-4 rounded-lg">
                      <FaMoneyBillWave className="text-green-600 text-2xl" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Button to refresh invoices */}
              <div className="text-center mb-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchAllInvoices}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 mx-auto"
                >
                  <FaFileInvoice />
                  تحديث الفواتير
                </motion.button>
              </div>

              {/* 🆕 Advanced Filters - فلاتر متقدمة شاملة */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">الفلاتر والبحث</h3>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                      <FaFilter />
                      <span>{showAdvancedFilters ? 'إخفاء الفلاتر المتقدمة' : 'إظهار الفلاتر المتقدمة'}</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={resetAdvancedFilters}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      إعادة تعيين
                    </motion.button>
                  </div>
                </div>

                {/* Basic Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Search */}
                  <div className="relative">
                    <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="البحث بالاسم أو الهاتف أو رقم الفاتورة..."
                      value={invoicesSearchTerm}
                      onChange={(e) => setInvoicesSearchTerm(e.target.value)}
                      className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Filter Status */}
                  <select
                    value={invoicesFilterStatus}
                    onChange={(e) => setInvoicesFilterStatus(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="paid">مدفوعة</option>
                    <option value="partial">مدفوعة جزئياً</option>
                    <option value="unpaid">غير مدفوعة</option>
                  </select>

                  {/* Date Range Quick Filter */}
                  <select
                    value={invoicesDateRange}
                    onChange={(e) => setInvoicesDateRange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">كل الفترات</option>
                    <option value="today">اليوم</option>
                    <option value="last7days">آخر 7 أيام</option>
                    <option value="thisMonth">الشهر الحالي</option>
                    <option value="lastMonth">الشهر السابق</option>
                    <option value="custom">مدة مخصصة</option>
                  </select>
                </div>

                {/* Advanced Filters - يظهر عند الطلب */}
                {showAdvancedFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t pt-4 mt-4"
                  >
                    <h4 className="text-md font-semibold text-gray-700 mb-3">الفلاتر المتقدمة</h4>
                    
                    {/* Custom Date Range */}
                    {invoicesDateRange === 'custom' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FaCalendarAlt className="inline ml-1" /> من تاريخ
                          </label>
                          <input
                            type="date"
                            value={invoicesStartDate}
                            onChange={(e) => setInvoicesStartDate(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FaCalendarAlt className="inline ml-1" /> إلى تاريخ
                          </label>
                          <input
                            type="date"
                            value={invoicesEndDate}
                            onChange={(e) => setInvoicesEndDate(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Amount Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaMoneyBillWave className="inline ml-1" /> المبلغ الإجمالي (من)
                        </label>
                        <input
                          type="number"
                          value={invoicesMinAmount}
                          onChange={(e) => setInvoicesMinAmount(e.target.value)}
                          placeholder="0"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaMoneyBillWave className="inline ml-1" /> المبلغ الإجمالي (إلى)
                        </label>
                        <input
                          type="number"
                          value={invoicesMaxAmount}
                          onChange={(e) => setInvoicesMaxAmount(e.target.value)}
                          placeholder="∞"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    {/* Paid Amount Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaCheckCircle className="inline ml-1" /> المبلغ المدفوع (من)
                        </label>
                        <input
                          type="number"
                          value={invoicesMinPaid}
                          onChange={(e) => setInvoicesMinPaid(e.target.value)}
                          placeholder="0"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaCheckCircle className="inline ml-1" /> المبلغ المدفوع (إلى)
                        </label>
                        <input
                          type="number"
                          value={invoicesMaxPaid}
                          onChange={(e) => setInvoicesMaxPaid(e.target.value)}
                          placeholder="∞"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    {/* Filter Summary */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                      ℹ️ عدد الفواتير المطابقة: <strong>{filteredInvoices.length}</strong> من أصل <strong>{invoices.length}</strong>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Invoices List */}
              {invoicesLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                  <p className="text-gray-500">لا توجد فواتير تطابق البحث أو الفلتر.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الفاتورة</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العميل</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الخطة</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الإصدار</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ الإجمالي</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المدفوع</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المتبقي</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredInvoices.map((invoice) => (
                          <motion.tr
                            key={invoice.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoice_number}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                              <div>{invoice.company_name}</div>
                              <div className="text-xs text-gray-500">{invoice.phone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{invoice.plan_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDateUtil(invoice.issued_date)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{formatPrice(invoice.amount)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">{formatPrice(invoice.subscription_paid)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">{formatPrice(invoice.subscription_remaining)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{getInvoiceStatusBadge(invoice)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center gap-2">
                                <Link href={`/admin/invoices/${invoice.id}`}>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 px-3 py-1 rounded"
                                    title="عرض الفاتورة"
                                  >
                                    <FaEye />
                                    <span>عرض</span>
                                  </motion.button>
                                </Link>
                                
                                {/* 🆕 Delete Button */}
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleDeleteInvoice(invoice.id)}
                                  className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1 px-3 py-1 rounded hover:bg-red-50"
                                  title="حذف الفاتورة نهائياً"
                                >
                                  <FaTrash />
                                  <span>حذف</span>
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'requests' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">طلبات الإعلان المعلقة</h2>
                  <Link href="/admin/ad-requests">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                    >
                      <FaEye />
                      <span>عرض جميع الطلبات</span>
                    </motion.button>
                  </Link>
                </div>

                {adRequests.filter(r => r.status === 'pending').length === 0 ? (
                  <p className="text-center text-gray-500 py-8">لا توجد طلبات معلقة</p>
                ) : (
                  <div className="space-y-4">
                    {adRequests.filter(r => r.status === 'pending').slice(0, 5).map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg">{request.company_name}</h3>
                            <p className="text-gray-600">المسؤول: {request.contact_name}</p>
                            <p className="text-gray-600">الهاتف: {request.phone}</p>
                            {request.whatsapp && <p className="text-gray-600">واتساب: {request.whatsapp}</p>}
                            <p className="text-primary-600 font-semibold mt-2">
                              الخطة: {request.plan_name} - {request.price} ريال
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatDate(request.created_at, 'dd/MM/yyyy HH:mm')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Link href={`/admin/ad-requests/${request.id}`}>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                title="عرض التفاصيل"
                              >
                                <FaEye />
                              </motion.button>
                            </Link>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              onClick={() => router.push(`/admin/ad-requests/${request.id}/convert`)}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                            >
                              <FaCheckCircle />
                              <span>قبول</span>
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              onClick={() => handleUpdateRequestStatus(request.id, 'rejected')}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                            >
                              <FaTimesCircle />
                              <span>رفض</span>
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {adRequests.filter(r => r.status === 'pending').length > 5 && (
                      <div className="text-center pt-4">
                        <Link href="/admin/ad-requests">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            عرض المزيد من الطلبات...
                          </motion.button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'reminders' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">التذكيرات التلقائية</h2>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => toast.success('جاري معالجة التذكيرات...')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <FaBell />
                      <span>إرسال التذكيرات</span>
                    </motion.button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <FaClock className="text-2xl text-yellow-600" />
                      <div>
                        <p className="text-sm text-yellow-600">معلقة</p>
                        <p className="text-xl font-bold text-yellow-800">{reminders.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <FaCheckCircle className="text-2xl text-green-600" />
                      <div>
                        <p className="text-sm text-green-600">تم الإرسال</p>
                        <p className="text-xl font-bold text-green-800">0</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <FaExclamationTriangle className="text-2xl text-red-600" />
                      <div>
                        <p className="text-sm text-red-600">فشلت</p>
                        <p className="text-xl font-bold text-red-800">0</p>
                      </div>
                    </div>
                  </div>
                </div>

                {reminders.length === 0 ? (
                  <div className="text-center py-12">
                    <FaBell className="text-6xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">لا توجد تذكيرات معلقة</p>
                    <p className="text-sm text-gray-400 mt-2">سيتم إنشاء التذكيرات تلقائياً يومياً</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reminders.map((reminder) => (
                      <div key={reminder.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                reminder.reminder_type === 'due_soon' 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : reminder.reminder_type === 'overdue'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {reminder.reminder_type === 'due_soon' && 'مستحق قريباً'}
                                {reminder.reminder_type === 'overdue' && 'متأخر'}
                                {reminder.reminder_type === 'subscription_expiring' && 'اشتراك منتهي'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(reminder.scheduled_date, 'dd/MM/yyyy')}
                              </span>
                            </div>
                            <p className="text-gray-700">{reminder.message}</p>
                          </div>
                          <button className="text-primary-600 hover:text-primary-700">
                            <FaEye />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'refunds' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Header with Create Button */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gradient flex items-center gap-2">
                  <FaUndo />
                  إدارة الاستردادات
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateRefundModal(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <FaPlus />
                  <span>إنشاء استرداد جديد</span>
                </motion.button>
              </div>

              {/* الإحصائيات */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-md p-4 text-center"
                >
                  <FaUndo className="text-3xl text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-800">{refunds.length}</p>
                  <p className="text-sm text-gray-600">الإجمالي</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-yellow-50 rounded-xl shadow-md p-4 text-center border border-yellow-200"
                >
                  <FaClock className="text-3xl text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-800">{refunds.filter(r => r.status === 'pending').length}</p>
                  <p className="text-sm text-yellow-700">معلق</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-blue-50 rounded-xl shadow-md p-4 text-center border border-blue-200"
                >
                  <FaCheckCircle className="text-3xl text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-800">{refunds.filter(r => r.status === 'approved').length}</p>
                  <p className="text-sm text-blue-700">موافق</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-green-50 rounded-xl shadow-md p-4 text-center border border-green-200"
                >
                  <FaCheckCircle className="text-3xl text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-800">{refunds.filter(r => r.status === 'completed').length}</p>
                  <p className="text-sm text-green-700">مكتمل</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-red-50 rounded-xl shadow-md p-4 text-center border border-red-200"
                >
                  <FaTimesCircle className="text-3xl text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-800">{refunds.filter(r => r.status === 'rejected').length}</p>
                  <p className="text-sm text-red-700">مرفوض</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl shadow-md p-4 text-center border border-primary-200"
                >
                  <FaMoneyBillWave className="text-3xl text-primary-600 mx-auto mb-2" />
                  <p className="text-xl font-bold text-primary-800">
                    {formatPrice(refunds.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.refund_amount, 0))}
                  </p>
                  <p className="text-xs text-primary-700">مجموع المسترد</p>
                </motion.div>
              </div>

              {/* الفلاتر والبحث */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* البحث */}
                  <div className="relative">
                    <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="بحث بالشركة، السبب، أو الرقم..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* فلتر الحالة */}
                  <div className="relative">
                    <FaFilter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                    >
                      <option value="all">جميع الحالات</option>
                      <option value="pending">معلق</option>
                      <option value="approved">موافق عليه</option>
                      <option value="completed">مكتمل</option>
                      <option value="rejected">مرفوض</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* جدول الاستردادات */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {(() => {
                  const filteredRefunds = refunds.filter(refund => {
                    const matchesStatus = filterStatus === 'all' || refund.status === filterStatus;
                    const matchesSearch = !searchTerm || 
                      refund.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      refund.refund_reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      refund.id.toLowerCase().includes(searchTerm.toLowerCase());
                    
                    return matchesStatus && matchesSearch;
                  });

                  return filteredRefunds.length === 0 ? (
                    <div className="text-center py-16">
                      <FaExclamationTriangle className="text-6xl text-gray-300 mx-auto mb-4" />
                      <p className="text-xl text-gray-500">لا توجد استردادات</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-right py-4 px-4 font-semibold text-gray-700">الرقم</th>
                            <th className="text-right py-4 px-4 font-semibold text-gray-700">الشركة</th>
                            <th className="text-right py-4 px-4 font-semibold text-gray-700">المبلغ</th>
                            <th className="text-right py-4 px-4 font-semibold text-gray-700">الطريقة</th>
                            <th className="text-right py-4 px-4 font-semibold text-gray-700">الحالة</th>
                            <th className="text-right py-4 px-4 font-semibold text-gray-700">التاريخ</th>
                            <th className="text-center py-4 px-4 font-semibold text-gray-700">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRefunds.map((refund, index) => (
                            <motion.tr
                              key={refund.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="border-b hover:bg-gray-50 transition-colors"
                            >
                              <td className="py-4 px-4">
                                <span className="text-sm font-mono text-gray-600">
                                  #{refund.id.slice(0, 8)}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div>
                                  <p className="font-semibold text-gray-800">
                                    {refund.company_name || 'غير معروف'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {refund.refund_reason?.slice(0, 40)}
                                    {refund.refund_reason && refund.refund_reason.length > 40 && '...'}
                                  </p>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <p className="font-bold text-lg text-primary-600">
                                  {formatPrice(refund.refund_amount)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  من {formatPrice(refund.original_amount)}
                                </p>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-sm text-gray-700">
                                  {getRefundMethodLabel(refund.refund_method)}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                {getStatusBadge(refund.status)}
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-600">
                                {formatDate(refund.created_at, 'dd/MM/yyyy')}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center justify-center gap-2">
                                  {/* زر عرض التفاصيل */}
                                  <Link href={`/admin/refunds/${refund.id}`}>
                                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                      <FaEye />
                                    </button>
                                  </Link>

                                  {/* أزرار تحديث الحالة */}
                                  {refund.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleUpdateRefundStatus(refund.id, 'approved')}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="موافقة"
                                      >
                                        <FaCheckCircle />
                                      </button>
                                      <button
                                        onClick={() => handleUpdateRefundStatus(refund.id, 'rejected')}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="رفض"
                                      >
                                        <FaTimesCircle />
                                      </button>
                                    </>
                                  )}

                                  {refund.status === 'approved' && (
                                    <button
                                      onClick={() => handleUpdateRefundStatus(refund.id, 'completed')}
                                      className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                                    >
                                      إتمام
                                    </button>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          )}

          {activeTab === 'audit' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">سجل التدقيق (Audit Trail)</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600 mb-1">إجمالي السجلات</p>
                    <p className="text-2xl font-bold text-blue-800">{statistics?.totalAudits || 0}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600 mb-1">إنشاء فواتير</p>
                    <p className="text-2xl font-bold text-green-800">-</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-purple-600 mb-1">تحديثات</p>
                    <p className="text-2xl font-bold text-purple-800">-</p>
                  </div>
                </div>

                <div className="text-center py-12">
                  <FaHistory className="text-6xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-700 font-semibold mb-2">سجل التدقيق متاح</p>
                  <p className="text-sm text-gray-500 mb-4">
                    يتم تسجيل جميع العمليات على الفواتير تلقائياً
                  </p>
                  <p className="text-xs text-gray-400">
                    • من قام بالعملية • متى • ماذا تغير
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Modal إنشاء استرداد */}
        <AnimatePresence>
          {showCreateRefundModal && (
            <CreateRefundModal
              onClose={() => setShowCreateRefundModal(false)}
              onSuccess={() => {
                setShowCreateRefundModal(false);
                fetchAllRefunds();
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// مكون Modal لإنشاء استرداد جديد
function CreateRefundModal({
  onClose,
  onSuccess
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [formData, setFormData] = useState({
    subscription_id: '',
    refund_amount: 0,
    refund_reason: '',
    refund_method: 'bank_transfer' as const,
    bank_details: '',
    notes: ''
  });

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await axios.get(`${apiUrl}/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubscriptions(response.data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('خطأ في جلب الاشتراكات');
    }
  };

  const handleSubscriptionChange = async (subscriptionId: string) => {
    const subscription = subscriptions.find(s => s.id === subscriptionId);
    setSelectedSubscription(subscription);
    setFormData(prev => ({
      ...prev,
      subscription_id: subscriptionId,
      refund_amount: subscription?.remaining_amount || 0
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subscription_id || !formData.refund_amount || !formData.refund_reason) {
      toast.error('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    if (selectedSubscription && formData.refund_amount > selectedSubscription.paid_amount) {
      toast.error('مبلغ الاسترداد أكبر من المبلغ المدفوع');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      await axios.post(
        `${apiUrl}/refunds`,
        {
          ...formData,
          original_amount: selectedSubscription?.paid_amount || 0,
          refund_date: new Date(),
          processed_by: 'admin',
          status: 'pending'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('تم إنشاء طلب الاسترداد بنجاح');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating refund:', error);
      toast.error('خطأ في إنشاء الاسترداد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gradient flex items-center gap-2">
              <FaPlus />
              إنشاء استرداد جديد
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaTimesCircle className="text-2xl text-gray-600" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* اختيار الاشتراك */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              الاشتراك <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.subscription_id}
              onChange={(e) => handleSubscriptionChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">اختر الاشتراك</option>
              {subscriptions.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.id.slice(0, 8)} - مدفوع: {sub.paid_amount?.toLocaleString('en-US')} ريال
                </option>
              ))}
            </select>
            
            {selectedSubscription && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                <p><strong>المدفوع:</strong> {selectedSubscription.paid_amount?.toLocaleString('en-US')} ريال</p>
                <p><strong>المتبقي:</strong> {selectedSubscription.remaining_amount?.toLocaleString('en-US')} ريال</p>
                <p><strong>الحالة:</strong> {selectedSubscription.status}</p>
              </div>
            )}
          </div>

          {/* مبلغ الاسترداد */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              مبلغ الاسترداد (ريال) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.refund_amount}
              onChange={(e) => setFormData(prev => ({ ...prev, refund_amount: parseFloat(e.target.value) || 0 }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min="0"
              step="0.01"
              required
            />
          </div>

          {/* السبب */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              سبب الاسترداد <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.refund_reason}
              onChange={(e) => setFormData(prev => ({ ...prev, refund_reason: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              required
            />
          </div>

          {/* الطريقة */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              طريقة الاسترداد <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.refund_method}
              onChange={(e) => setFormData(prev => ({ ...prev, refund_method: e.target.value as any }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="cash">نقداً</option>
              <option value="bank_transfer">تحويل بنكي</option>
              <option value="card">بطاقة</option>
              <option value="online">أونلاين</option>
            </select>
          </div>

          {/* التفاصيل البنكية */}
          {formData.refund_method === 'bank_transfer' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                التفاصيل البنكية
              </label>
              <input
                type="text"
                value={formData.bank_details}
                onChange={(e) => setFormData(prev => ({ ...prev, bank_details: e.target.value }))}
                placeholder="IBAN أو رقم الحساب"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          )}

          {/* ملاحظات */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ملاحظات إضافية
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={2}
            />
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {loading ? 'جاري الإنشاء...' : 'إنشاء الاسترداد'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}