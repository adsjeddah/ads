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
  FaUndo,
  FaClock,
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
  total_subscriptions?: number;
  active_subscriptions?: number;
  total_revenue?: number;
  total_paid?: number;
  total_pending?: number;
  total_invoices?: number;
  paid_invoices?: number;
  unpaid_invoices?: number;
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

interface Refund {
  id: string;
  subscription_id: string;
  invoice_id?: string;
  payment_id?: string;
  original_amount: number;
  refund_amount: number;
  refund_reason: string;
  refund_method: string;
  refund_date: any;
  processed_by: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  bank_details?: string;
  notes?: string;
  created_at: any;
  completed_at?: any;
}

export default function AdvertiserFinancial() {
  const router = useRouter();
  const { id } = router.query;
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
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

      // Fetch refunds - جلب جميع الاستردادات وفلترتها للمعلن الحالي
      try {
        const refundsRes = await axios.get(`${apiUrl}/refunds`, { headers });
        // فلترة الاستردادات للاشتراكات الخاصة بالمعلن
        const subscriptionIds = (subscriptionsRes.data || []).map((sub: Subscription) => sub.id);
        const advertiserRefunds = (refundsRes.data || []).filter((refund: Refund) =>
          subscriptionIds.includes(refund.subscription_id)
        );
        setRefunds(advertiserRefunds);
      } catch (error) {
        console.error('Error fetching refunds:', error);
        setRefunds([]);
      }

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
                value={summary.total_subscriptions || 0}
                subtitle={`نشط: ${summary.active_subscriptions || 0}`}
                icon={FaCalendarAlt}
                color="blue"
              />
              <StatCard
                title="إجمالي الإيرادات"
                value={`${summary.total_revenue || 0} ريال`}
                subtitle={`مدفوع: ${summary.total_paid || 0} ريال`}
                icon={FaChartLine}
                color="green"
              />
              <StatCard
                title="المبلغ المتبقي"
                value={`${summary.total_pending || 0} ريال`}
                subtitle={`من ${summary.total_revenue || 0} ريال`}
                icon={FaHourglassHalf}
                color="orange"
              />
              <StatCard
                title="الفواتير"
                value={summary.total_invoices || 0}
                subtitle={`مدفوعة: ${summary.paid_invoices || 0} | معلقة: ${summary.unpaid_invoices || 0}`}
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
              onActivateGrace={(subscription) => {
                // Navigate to main advertiser page where grace period modal is
                window.location.href = `/admin/advertisers/${id}#grace-period`;
              }}
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
            className="mb-8"
          >
            <PaymentHistoryTable
              payments={payments}
              loading={loading}
            />
          </motion.div>

          {/* Refunds Section */}
          {refunds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FaUndo />
                  الاستردادات ({refunds.length})
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">الرقم</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">المبلغ</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">الطريقة</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">السبب</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">الحالة</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">التاريخ</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refunds.map((refund) => (
                      <tr key={refund.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="text-sm font-mono text-gray-600">
                            #{refund.id.slice(0, 8)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-lg text-red-600">
                            {refund.refund_amount.toLocaleString('en-US')} ريال
                          </p>
                          <p className="text-xs text-gray-500">
                            من {refund.original_amount.toLocaleString('en-US')}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {refund.refund_method === 'cash' && 'نقداً'}
                          {refund.refund_method === 'bank_transfer' && 'تحويل بنكي'}
                          {refund.refund_method === 'card' && 'بطاقة'}
                          {refund.refund_method === 'online' && 'أونلاين'}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-sm text-gray-700 truncate" title={refund.refund_reason}>
                            {refund.refund_reason}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${
                              refund.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : refund.status === 'approved'
                                ? 'bg-blue-100 text-blue-800'
                                : refund.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {refund.status === 'pending' && <FaClock className="text-xs" />}
                            {refund.status === 'completed' && <FaCheckCircle className="text-xs" />}
                            {refund.status === 'rejected' && <FaTimesCircle className="text-xs" />}
                            {refund.status === 'pending' && 'معلق'}
                            {refund.status === 'approved' && 'موافق'}
                            {refund.status === 'completed' && 'مكتمل'}
                            {refund.status === 'rejected' && 'مرفوض'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {refund.created_at?.toDate
                            ? format(refund.created_at.toDate(), 'dd/MM/yyyy', { locale: ar })
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Link href={`/admin/refunds/${refund.id}`}>
                            <button className="text-blue-600 hover:text-blue-800 transition-colors">
                              التفاصيل
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* إحصائيات الاستردادات */}
              <div className="bg-gray-50 px-6 py-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-gray-600">إجمالي المسترد: </span>
                    <span className="font-bold text-red-600">
                      {refunds
                        .filter((r) => r.status === 'completed')
                        .reduce((sum, r) => sum + r.refund_amount, 0)
                        .toLocaleString('en-US')}{' '}
                      ريال
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">معلق: </span>
                    <span className="font-bold text-yellow-600">
                      {refunds.filter((r) => r.status === 'pending').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">مكتمل: </span>
                    <span className="font-bold text-green-600">
                      {refunds.filter((r) => r.status === 'completed').length}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
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
