import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaPlus, FaMoneyBillWave, FaCalendarAlt, FaCheckCircle, FaClock, FaExclamationCircle, FaFileInvoice, FaEdit } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Subscription {
  id: number;
  plan_name: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_status: string;
  status: string;
}

interface Payment {
  id: number;
  subscription_id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes: string;
}

interface Invoice {
  id: number;
  subscription_id: number;
  invoice_number: string;
  amount: number;
  status: string;
  issued_date: string;
  due_date: string;
  paid_date: string | null;
  plan_name: string;
  subscription_total: number;
  subscription_paid: number;
  subscription_remaining: number;
}

interface Advertiser {
  id: number;
  company_name: string;
  phone: string;
  email: string;
}

export default function AdvertiserInvoices() {
  const router = useRouter();
  const { id } = router.query;
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'cash',
    notes: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
    } else if (id) {
      fetchData();
    }
  }, [router, id]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch advertiser info
      const advertiserRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/advertisers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdvertiser(advertiserRes.data);

      // Fetch subscriptions
      const subscriptionsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/advertisers/${id}/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubscriptions(subscriptionsRes.data);

      // Fetch payments
      const paymentsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/advertisers/${id}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(paymentsRes.data);

      // Fetch invoices
      const invoicesRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/advertisers/${id}/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(invoicesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!selectedSubscription || !paymentForm.amount) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const amount = parseFloat(paymentForm.amount);
    if (amount <= 0) {
      toast.error('يجب أن يكون المبلغ أكبر من صفر');
      return;
    }

    if (amount > selectedSubscription.remaining_amount) {
      toast.error('المبلغ أكبر من المتبقي');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      await axios.post(`${apiUrl}/payments`, {
        subscription_id: selectedSubscription.id,
        amount: amount,
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('تم إضافة الدفعة بنجاح');
      setShowPaymentModal(false);
      setPaymentForm({ amount: '', payment_method: 'cash', notes: '' });
      setSelectedSubscription(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'خطأ في إضافة الدفعة');
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FaCheckCircle className="ml-1" /> مدفوع بالكامل
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FaClock className="ml-1" /> دفع جزئي
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <FaExclamationCircle className="ml-1" /> غير مدفوع
          </span>
        );
      default:
        return null;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: { [key: string]: string } = {
      cash: 'نقدي',
      bank_transfer: 'تحويل بنكي',
      card: 'بطاقة ائتمان',
      check: 'شيك'
    };
    return methods[method] || method;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>فواتير {advertiser?.company_name} - لوحة التحكم</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gradient">فواتير {advertiser?.company_name}</h1>
                <p className="text-gray-600 mt-1">{advertiser?.phone} • {advertiser?.email}</p>
              </div>
              <Link href="/admin/invoices">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <FaArrowLeft />
                  <span>العودة لإدارة الفواتير</span>
                </motion.button>
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Subscriptions */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FaFileInvoice className="ml-2" /> الاشتراكات
            </h2>
            
            {subscriptions.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <p className="text-gray-500">لا توجد اشتراكات</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {subscriptions.map((subscription) => (
                  <motion.div
                    key={subscription.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-lg p-6"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800">{subscription.plan_name}</h3>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center">
                            <FaCalendarAlt className="ml-1" />
                            {new Date(subscription.start_date).toLocaleDateString('ar-SA')} - 
                            {new Date(subscription.end_date).toLocaleDateString('ar-SA')}
                          </span>
                          <span className={subscription.status === 'active' ? 'text-green-600' : 'text-gray-500'}>
                            {subscription.status === 'active' ? '● نشط' : '○ منتهي'}
                          </span>
                        </div>
                      </div>
                      <div className="text-left">
                        {getPaymentStatusBadge(subscription.payment_status)}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600">الإجمالي</p>
                        <p className="text-lg font-bold text-gray-800">{subscription.total_amount} ريال</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-green-600">المدفوع</p>
                        <p className="text-lg font-bold text-green-800">{subscription.paid_amount} ريال</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3">
                        <p className="text-xs text-red-600">المتبقي</p>
                        <p className="text-lg font-bold text-red-800">{subscription.remaining_amount} ريال</p>
                      </div>
                      <div className="flex items-center justify-center">
                        {subscription.remaining_amount > 0 && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedSubscription(subscription);
                              setShowPaymentModal(true);
                            }}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm"
                          >
                            <FaPlus />
                            <span>إضافة دفعة</span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Invoices */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FaFileInvoice className="ml-2" /> الفواتير
            </h2>
            
            {invoices.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <p className="text-gray-500">لا توجد فواتير</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الفاتورة</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الخطة</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الإصدار</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الاستحقاق</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {invoice.invoice_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {invoice.plan_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(invoice.issued_date).toLocaleDateString('ar-SA')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(invoice.due_date).toLocaleDateString('ar-SA')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {invoice.amount} ريال
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {invoice.status === 'paid' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <FaCheckCircle className="ml-1" /> مدفوعة
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <FaExclamationCircle className="ml-1" /> غير مدفوعة
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Link href={`/admin/invoices/${invoice.id}`}>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="text-primary-600 hover:text-primary-700 font-medium"
                              >
                                عرض التفاصيل
                              </motion.button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Payments History */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FaMoneyBillWave className="ml-2" /> سجل الدفعات
            </h2>
            
            {payments.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <p className="text-gray-500">لا توجد دفعات</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاشتراك</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">طريقة الدفع</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(payment.payment_date).toLocaleDateString('ar-SA')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {subscriptions.find(s => s.id === payment.subscription_id)?.plan_name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                            {payment.amount} ريال
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getPaymentMethodLabel(payment.payment_method)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {payment.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && selectedSubscription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold mb-4">إضافة دفعة جديدة</h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">الاشتراك: {selectedSubscription.plan_name}</p>
                <p className="text-sm text-gray-600">المتبقي: {selectedSubscription.remaining_amount} ريال</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">المبلغ</label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    max={selectedSubscription.remaining_amount}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">طريقة الدفع</label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="cash">نقدي</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="card">بطاقة ائتمان</option>
                    <option value="check">شيك</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">ملاحظات (اختياري)</label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="أي ملاحظات إضافية..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddPayment}
                  className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  حفظ الدفعة
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentForm({ amount: '', payment_method: 'cash', notes: '' });
                    setSelectedSubscription(null);
                  }}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  إلغاء
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
}