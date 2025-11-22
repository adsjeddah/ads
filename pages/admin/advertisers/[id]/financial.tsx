import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaPlus,
  FaFileInvoice,
  FaMoneyBillWave,
  FaChartLine,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaBuilding,
  FaPhone,
  FaEnvelope,
} from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// Import the financial components
import CreateSubscriptionForm from '../../../../components/admin/CreateSubscriptionForm';
import RecordPaymentForm from '../../../../components/admin/RecordPaymentForm';
import SubscriptionsList from '../../../../components/admin/SubscriptionsList';
import InvoicesTable from '../../../../components/admin/InvoicesTable';
import PaymentHistoryTable from '../../../../components/admin/PaymentHistoryTable';
import StatCard from '../../../../components/admin/StatCard';

interface Advertiser {
  id: string;
  company_name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  status: string;
}

interface FinancialSummary {
  total_subscriptions: number;
  active_subscriptions: number;
  total_revenue: number;
  total_paid: number;
  total_pending: number;
  total_invoices: number;
  paid_invoices: number;
  unpaid_invoices: number;
}

interface Subscription {
  id: string;
  plan_id: string;
  start_date: any;
  end_date: any;
  base_price: number;
  discount_type: 'amount' | 'percentage';
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: 'active' | 'expired' | 'cancelled';
  payment_status: 'paid' | 'partial' | 'pending';
  created_at: any;
}

interface Invoice {
  id: string;
  subscription_id: string;
  invoice_number: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'cancelled';
  issued_date: any;
  due_date: any;
  created_at: any;
}

interface Payment {
  id: string;
  subscription_id: string;
  amount: number;
  payment_date: any;
  payment_method: string;
  notes?: string;
  created_at: any;
}

interface Plan {
  id: string;
  name: string;
  duration_days: number;
  price: number;
}

export default function AdvertiserFinancial() {
  const router = useRouter();
  const { id } = router.query;
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateSubscription, setShowCreateSubscription] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    // Wait for router to be ready and ensure id is valid
    if (router.isReady && id && id !== 'undefined') {
      fetchData();
    }
  }, [id, router, router.isReady, refreshKey]);

  const fetchData = async () => {
    // Double check id is available and valid
    if (!id || id === 'undefined') {
      console.warn('No valid advertiser ID available');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      // Fetch all data in parallel
      const [
        advertiserRes,
        subscriptionsRes,
        invoicesRes,
        paymentsRes,
        plansRes
      ] = await Promise.all([
        axios.get(`${apiUrl}/advertisers/${id}`, { headers }),
        axios.get(`${apiUrl}/advertisers/${id}/subscriptions`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${apiUrl}/advertisers/${id}/invoices`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${apiUrl}/advertisers/${id}/payments`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${apiUrl}/plans`, { headers }).catch(() => ({ data: [] }))
      ]);

      setAdvertiser(advertiserRes.data);
      setSubscriptions(subscriptionsRes.data || []);
      setInvoices(invoicesRes.data || []);
      setPayments(paymentsRes.data || []);
      setPlans(plansRes.data || []);

      // Fetch financial summary
      try {
        const summaryRes = await axios.get(`${apiUrl}/financial/advertiser-summary/${id}`, { headers });
        setSummary(summaryRes.data);
      } catch (err) {
        console.error('Error fetching summary:', err);
        // Set default summary
        setSummary({
          total_subscriptions: subscriptionsRes.data?.length || 0,
          active_subscriptions: subscriptionsRes.data?.filter((s: any) => s.status === 'active').length || 0,
          total_revenue: subscriptionsRes.data?.reduce((sum: number, s: any) => sum + (s.total_amount || 0), 0) || 0,
          total_paid: subscriptionsRes.data?.reduce((sum: number, s: any) => sum + (s.paid_amount || 0), 0) || 0,
          total_pending: subscriptionsRes.data?.reduce((sum: number, s: any) => sum + (s.remaining_amount || 0), 0) || 0,
          total_invoices: invoicesRes.data?.length || 0,
          paid_invoices: invoicesRes.data?.filter((i: any) => i.status === 'paid').length || 0,
          unpaid_invoices: invoicesRes.data?.filter((i: any) => i.status !== 'paid').length || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('خطأ في تحميل البيانات');
      // Set empty states
      setSubscriptions([]);
      setInvoices([]);
      setPayments([]);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionCreated = () => {
    setShowCreateSubscription(false);
    setRefreshKey((prev) => prev + 1);
    toast.success('تم إنشاء الاشتراك والفاتورة بنجاح!');
  };

  const handlePaymentRecorded = () => {
    setShowRecordPayment(false);
    setSelectedSubscription(null);
    setRefreshKey((prev) => prev + 1);
    toast.success('تم تسجيل الدفعة بنجاح!');
  };

  const handleRecordPayment = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowRecordPayment(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
      </div>
    );
  }

  if (!advertiser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-red-500">
        لم يتم العثور على المعلن.
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>النظام المالي - {advertiser.company_name}</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gradient">النظام المالي المتكامل</h1>
                <p className="text-gray-600 mt-1">{advertiser.company_name}</p>
              </div>
              <Link href={`/admin/advertisers/${id}`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <FaArrowLeft />
                  <span>العودة للمعلن</span>
                </motion.button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Advertiser Quick Info */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                  <FaBuilding className="text-3xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{advertiser.company_name}</h2>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <FaPhone /> {advertiser.phone}
                    </span>
                    {advertiser.email && (
                      <span className="flex items-center gap-1">
                        <FaEnvelope /> {advertiser.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    advertiser.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {advertiser.status === 'active' ? 'نشط' : 'غير نشط'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Financial Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="إجمالي الاشتراكات"
                value={summary.total_subscriptions}
                subtitle={`نشط: ${summary.active_subscriptions}`}
                icon={FaCalendarAlt}
                color="blue"
              />
              <StatCard
                title="إجمالي الإيرادات"
                value={`${summary.total_revenue} ريال`}
                subtitle={`مدفوع: ${summary.total_paid} ريال`}
                icon={FaChartLine}
                color="green"
              />
              <StatCard
                title="المبلغ المتبقي"
                value={`${summary.total_pending} ريال`}
                subtitle={`من ${summary.total_revenue} ريال`}
                icon={FaHourglassHalf}
                color="orange"
              />
              <StatCard
                title="الفواتير"
                value={summary.total_invoices}
                subtitle={`مدفوعة: ${summary.paid_invoices} | معلقة: ${summary.unpaid_invoices}`}
                icon={FaFileInvoice}
                color="purple"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateSubscription(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <FaPlus />
              إنشاء اشتراك جديد
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowRecordPayment(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <FaMoneyBillWave />
              تسجيل دفعة
            </motion.button>
          </div>

          {/* Subscriptions List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <SubscriptionsList
              subscriptions={subscriptions}
              plans={plans}
              onAddPayment={handleRecordPayment}
              loading={loading}
            />
          </motion.div>

          {/* Invoices Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <InvoicesTable
              invoices={invoices}
              loading={loading}
            />
          </motion.div>

          {/* Payment History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <PaymentHistoryTable
              payments={payments}
              loading={loading}
            />
          </motion.div>
        </div>
      </div>

      {/* Create Subscription Modal */}
      {showCreateSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">إنشاء اشتراك جديد</h3>
              <button
                onClick={() => setShowCreateSubscription(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <CreateSubscriptionForm
                advertiserId={id as string}
                onSuccess={handleSubscriptionCreated}
                onCancel={() => setShowCreateSubscription(false)}
              />
            </div>
          </motion.div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showRecordPayment && selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">تسجيل دفعة</h3>
              <button
                onClick={() => {
                  setShowRecordPayment(false);
                  setSelectedSubscription(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <RecordPaymentForm
                subscription={selectedSubscription}
                onSuccess={handlePaymentRecorded}
                onCancel={() => {
                  setShowRecordPayment(false);
                  setSelectedSubscription(null);
                }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
