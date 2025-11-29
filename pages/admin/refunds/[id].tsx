/**
 * صفحة تفاصيل الاسترداد
 * عرض كامل لتفاصيل الاسترداد مع إمكانية تحديث الحالة
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaMoneyBillWave,
  FaFileInvoice,
  FaBuilding,
  FaCalendarAlt,
  FaUser,
  FaUndo,
  FaStickyNote
} from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDate, formatDateTime, formatPrice } from '@/lib/utils';

interface Refund {
  id: string;
  subscription_id: string;
  invoice_id?: string;
  payment_id?: string;
  original_amount: number;
  refund_amount: number;
  refund_reason: string;
  refund_method: string;
  refund_date: Date;
  processed_by: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  bank_details?: string;
  notes?: string;
  created_at: Date;
  completed_at?: Date;
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

interface Advertiser {
  id: string;
  company_name: string;
  phone: string;
  email: string;
}

export default function RefundDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [refund, setRefund] = useState<Refund | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/admin/login');
        return;
      }
    }
    if (id) {
      fetchRefundDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchRefundDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      // جلب تفاصيل الاسترداد
      const refundRes = await axios.get(`${apiUrl}/refunds/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRefund(refundRes.data);

      // جلب تفاصيل الاشتراك
      if (refundRes.data.subscription_id) {
        const subRes = await axios.get(
          `${apiUrl}/subscriptions/${refundRes.data.subscription_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSubscription(subRes.data);

        // جلب تفاصيل المعلن
        if (subRes.data.advertiser_id) {
          const advRes = await axios.get(
            `${apiUrl}/advertisers/${subRes.data.advertiser_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setAdvertiser(advRes.data);
        }
      }
    } catch (error: any) {
      console.error('Error fetching refund details:', error);
      toast.error('خطأ في جلب التفاصيل');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'approved' | 'completed' | 'rejected') => {
    const confirmMessages = {
      approved: 'هل تريد الموافقة على هذا الاسترداد؟',
      completed: 'هل تم تنفيذ الاسترداد فعلياً؟ سيتم تحديث الاشتراك تلقائياً.',
      rejected: 'هل تريد رفض هذا الاسترداد؟'
    };

    if (!confirm(confirmMessages[newStatus])) {
      return;
    }

    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      await axios.patch(
        `${apiUrl}/refunds/${id}`,
        {
          status: newStatus,
          notes: notes || `تم ${newStatus === 'completed' ? 'إتمام' : newStatus === 'approved' ? 'الموافقة على' : 'رفض'} الاسترداد`
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('تم تحديث الحالة بنجاح');
      setNotes('');
      fetchRefundDetails();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('خطأ في تحديث الحالة');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
      </div>
    );
  }

  if (!refund) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaTimesCircle className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">لم يتم العثور على الاسترداد</h2>
          <Link href="/admin/refunds">
            <button className="btn-primary mt-4">العودة للقائمة</button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusInfo = () => {
    const statuses = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: FaClock, label: 'معلق' },
      approved: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: FaCheckCircle, label: 'موافق عليه' },
      completed: { color: 'bg-green-100 text-green-800 border-green-300', icon: FaCheckCircle, label: 'مكتمل' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-300', icon: FaTimesCircle, label: 'مرفوض' }
    };
    return statuses[refund.status] || statuses.pending;
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <>
      <Head>
        <title>تفاصيل الاسترداد - {refund.id.slice(0, 8)}</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Link href="/admin/refunds">
                  <button className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
                    <FaArrowLeft />
                    <span>العودة للقائمة</span>
                  </button>
                </Link>
                <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
                  <FaUndo />
                  تفاصيل الاسترداد #{refund.id.slice(0, 8)}
                </h1>
              </div>

              <div className={`px-4 py-2 rounded-full border-2 ${statusInfo.color} flex items-center gap-2`}>
                <StatusIcon />
                <span className="font-semibold">{statusInfo.label}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* العمود الأيمن: معلومات الاسترداد */}
            <div className="lg:col-span-2 space-y-6">
              {/* المبالغ */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl shadow-lg p-6 border border-primary-200"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaMoneyBillWave className="text-primary-600" />
                  المبالغ المالية
                </h2>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-sm text-gray-600 mb-1">المبلغ الأصلي</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {formatPrice(refund.original_amount)}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow border-2 border-primary-300">
                    <p className="text-sm text-gray-600 mb-1">مبلغ الاسترداد</p>
                    <p className="text-3xl font-bold text-primary-600">
                      {formatPrice(refund.refund_amount)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>نسبة الاسترداد:</strong>{' '}
                    {((refund.refund_amount / refund.original_amount) * 100).toFixed(1)}%
                  </p>
                </div>
              </motion.div>

              {/* التفاصيل */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaFileInvoice className="text-blue-600" />
                  تفاصيل الاسترداد
                </h2>

                <div className="space-y-4">
                  <div className="flex justify-between items-start pb-3 border-b">
                    <span className="text-gray-600">السبب:</span>
                    <span className="font-semibold text-gray-800 text-right max-w-md">
                      {refund.refund_reason}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-600">طريقة الاسترداد:</span>
                    <span className="font-semibold text-gray-800">
                      {refund.refund_method === 'cash' && 'نقداً'}
                      {refund.refund_method === 'bank_transfer' && 'تحويل بنكي'}
                      {refund.refund_method === 'card' && 'بطاقة'}
                      {refund.refund_method === 'online' && 'أونلاين'}
                    </span>
                  </div>

                  {refund.bank_details && (
                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="text-gray-600">التفاصيل البنكية:</span>
                      <span className="font-mono text-gray-800">{refund.bank_details}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-600">تاريخ الإنشاء:</span>
                    <span className="font-semibold text-gray-800">
                      {formatDateTime(refund.created_at, 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>

                  {refund.completed_at && (
                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="text-gray-600">تاريخ الإتمام:</span>
                      <span className="font-semibold text-green-600">
                        {formatDateTime(refund.completed_at, 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                  )}

                  {refund.notes && (
                    <div className="pt-2">
                      <p className="text-gray-600 mb-2">ملاحظات:</p>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-800">{refund.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* معلومات الاشتراك */}
              {subscription && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl shadow-lg p-6"
                >
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FaCalendarAlt className="text-purple-600" />
                    معلومات الاشتراك
                  </h2>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">رقم الاشتراك:</span>
                      <Link href={`/admin/advertisers/${advertiser?.id}`}>
                        <span className="font-mono text-blue-600 hover:underline cursor-pointer">
                          #{subscription.id.slice(0, 8)}
                        </span>
                      </Link>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">إجمالي الاشتراك:</span>
                      <span className="font-bold">{formatPrice(subscription.total_amount)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">المدفوع:</span>
                      <span className="font-bold text-green-600">
                        {formatPrice(subscription.paid_amount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">المتبقي:</span>
                      <span className="font-bold text-orange-600">
                        {formatPrice(subscription.remaining_amount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">الحالة:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                        subscription.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {subscription.status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* العمود الأيسر: المعلن والإجراءات */}
            <div className="space-y-6">
              {/* معلومات المعلن */}
              {advertiser && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg p-6"
                >
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FaBuilding className="text-indigo-600" />
                    معلومات المعلن
                  </h2>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">الشركة:</p>
                      <Link href={`/admin/advertisers/${advertiser.id}`}>
                        <p className="font-bold text-lg text-blue-600 hover:underline cursor-pointer">
                          {advertiser.company_name}
                        </p>
                      </Link>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">الهاتف:</p>
                      <a href={`tel:${advertiser.phone}`} className="font-semibold text-gray-800 hover:text-primary-600">
                        {advertiser.phone}
                      </a>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">البريد:</p>
                      <a href={`mailto:${advertiser.email}`} className="font-semibold text-gray-800 hover:text-primary-600 break-all">
                        {advertiser.email}
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* الإجراءات */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaUser className="text-orange-600" />
                  إجراءات الإدارة
                </h2>

                {/* ملاحظات */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <FaStickyNote className="inline ml-1" />
                    إضافة ملاحظة:
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                    placeholder="ملاحظات اختيارية..."
                  />
                </div>

                {/* أزرار الإجراءات */}
                <div className="space-y-3">
                  {refund.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus('approved')}
                        disabled={updating}
                        className="w-full btn-primary bg-blue-500 hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <FaCheckCircle />
                        موافقة على الاسترداد
                      </button>

                      <button
                        onClick={() => handleUpdateStatus('rejected')}
                        disabled={updating}
                        className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <FaTimesCircle />
                        رفض الاسترداد
                      </button>
                    </>
                  )}

                  {refund.status === 'approved' && (
                    <button
                      onClick={() => handleUpdateStatus('completed')}
                      disabled={updating}
                      className="w-full btn-primary bg-green-500 hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <FaCheckCircle />
                      إتمام الاسترداد
                    </button>
                  )}

                  {refund.status === 'completed' && (
                    <div className="p-4 bg-green-50 rounded-lg text-center border border-green-200">
                      <FaCheckCircle className="text-3xl text-green-600 mx-auto mb-2" />
                      <p className="text-green-800 font-semibold">
                        تم إتمام الاسترداد بنجاح
                      </p>
                    </div>
                  )}

                  {refund.status === 'rejected' && (
                    <div className="p-4 bg-red-50 rounded-lg text-center border border-red-200">
                      <FaTimesCircle className="text-3xl text-red-600 mx-auto mb-2" />
                      <p className="text-red-800 font-semibold">
                        تم رفض الاسترداد
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


















