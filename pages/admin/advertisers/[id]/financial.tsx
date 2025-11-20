/**
 * صفحة إدارة المالية للمعلن - نظام متكامل للاشتراكات والفواتير والمدفوعات
 * تستخدم FinancialService للتحديثات التلقائية والدقيقة
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FaArrowLeft, 
  FaBuilding, 
  FaPlus,
  FaSync
} from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

// Import our new components
import FinancialSummaryCard from '../../../../components/admin/FinancialSummaryCard';
import CreateSubscriptionForm from '../../../../components/admin/CreateSubscriptionForm';
import RecordPaymentForm from '../../../../components/admin/RecordPaymentForm';
import SubscriptionsList from '../../../../components/admin/SubscriptionsList';
import PaymentHistoryTable from '../../../../components/admin/PaymentHistoryTable';

interface Advertiser {
  id: string;
  company_name: string;
  phone: string;
  email: string;
  status: string;
}

interface FinancialSummary {
  total_subscriptions: number;
  active_subscriptions: number;
  expired_subscriptions: number;
  total_spent: number;
  total_paid: number;
  total_pending: number;
  payment_history: any[];
  unpaid_invoices: any[];
}

export default function AdvertiserFinancial() {
  const router = useRouter();
  const { id } = router.query;
  
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [showCreateSubscriptionForm, setShowCreateSubscriptionForm] = useState(false);
  const [showRecordPaymentForm, setShowRecordPaymentForm] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchAllData();
    }
  }, [id]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAdvertiser(),
        fetchFinancialSummary(),
        fetchSubscriptions(),
        fetchPlans(),
        fetchInvoices()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvertiser = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await axios.get(`${apiUrl}/advertisers/${id}`);
      setAdvertiser(response.data);
    } catch (error) {
      console.error('Error fetching advertiser:', error);
    }
  };

  const fetchFinancialSummary = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await axios.get(`${apiUrl}/financial/advertiser-summary?advertiser_id=${id}`);
      if (response.data.success) {
        setFinancialSummary(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching financial summary:', error);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await axios.get(`${apiUrl}/subscriptions?advertiser_id=${id}`);
      setSubscriptions(response.data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await axios.get(`${apiUrl}/plans`);
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await axios.get(`${apiUrl}/invoices`);
      // Filter invoices for this advertiser's subscriptions
      const subscriptionIds = subscriptions.map(s => s.id);
      const filteredInvoices = response.data.filter((inv: any) => 
        subscriptionIds.includes(inv.subscription_id)
      );
      setInvoices(filteredInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const handleRefresh = async () => {
    toast.loading('جاري التحديث...', { id: 'refresh' });
    await fetchAllData();
    toast.success('تم التحديث بنجاح', { id: 'refresh' });
  };

  const handleSubscriptionCreated = () => {
    setShowCreateSubscriptionForm(false);
    handleRefresh();
  };

  const handlePaymentRecorded = () => {
    setShowRecordPaymentForm(false);
    setSelectedSubscription(null);
    handleRefresh();
  };

  const handleAddPayment = (subscription: any) => {
    setSelectedSubscription(subscription);
    setShowRecordPaymentForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات المالية...</p>
        </div>
      </div>
    );
  }

  if (!advertiser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-red-500">لم يتم العثور على المعلن</p>
          <Link href="/admin/dashboard?tab=advertisers">
            <button className="mt-4 btn-primary">العودة للمعلنين</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{advertiser.company_name} - الإدارة المالية</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Link href={`/admin/advertisers/${id}`}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <FaArrowLeft />
                    <span>العودة</span>
                  </motion.button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
                    <FaBuilding />
                    {advertiser.company_name}
                  </h1>
                  <p className="text-sm text-gray-500">الإدارة المالية المتكاملة</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={handleRefresh}
                  whileHover={{ scale: 1.05, rotate: 180 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="تحديث البيانات"
                >
                  <FaSync className="text-gray-600" />
                </motion.button>
                
                {!showCreateSubscriptionForm && (
                  <motion.button
                    onClick={() => setShowCreateSubscriptionForm(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    <FaPlus />
                    اشتراك جديد
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Financial Summary */}
            {financialSummary && (
              <FinancialSummaryCard 
                summary={financialSummary} 
                loading={false}
              />
            )}

            {/* Create Subscription Form */}
            {showCreateSubscriptionForm && (
              <CreateSubscriptionForm
                advertiserId={id as string}
                onSuccess={handleSubscriptionCreated}
                onCancel={() => setShowCreateSubscriptionForm(false)}
              />
            )}

            {/* Record Payment Form */}
            {showRecordPaymentForm && selectedSubscription && (
              <RecordPaymentForm
                subscription={selectedSubscription}
                invoices={invoices.filter(inv => inv.subscription_id === selectedSubscription.id)}
                onSuccess={handlePaymentRecorded}
                onCancel={() => {
                  setShowRecordPaymentForm(false);
                  setSelectedSubscription(null);
                }}
              />
            )}

            {/* Subscriptions List */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">الاشتراكات</h2>
              <SubscriptionsList
                subscriptions={subscriptions}
                plans={plans}
                onAddPayment={handleAddPayment}
                loading={false}
              />
            </div>

            {/* Payment History */}
            {financialSummary && financialSummary.payment_history.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">سجل المدفوعات</h2>
                <PaymentHistoryTable
                  payments={financialSummary.payment_history}
                  loading={false}
                />
              </div>
            )}

            {/* Unpaid Invoices Alert */}
            {financialSummary && financialSummary.unpaid_invoices.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-xl p-6"
              >
                <h3 className="text-xl font-bold text-red-700 mb-3">
                  ⚠️ فواتير غير مدفوعة ({financialSummary.unpaid_invoices.length})
                </h3>
                <p className="text-red-600 mb-4">
                  يوجد {financialSummary.unpaid_invoices.length} فاتورة غير مدفوعة بمبلغ إجمالي{' '}
                  {financialSummary.unpaid_invoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString('ar-SA')} ريال
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {financialSummary.unpaid_invoices.map((invoice: any) => (
                    <div key={invoice.id} className="bg-white rounded-lg p-4 border border-red-200">
                      <p className="font-semibold text-gray-800">{invoice.invoice_number}</p>
                      <p className="text-red-600 font-bold">{invoice.amount.toLocaleString('ar-SA')} ريال</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

