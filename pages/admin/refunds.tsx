/**
 * صفحة إدارة الاستردادات - Admin Refunds Management
 * نظام بسيط وفعال ومترابط للأدمن فقط
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUndo,
  FaPlus,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaArrowLeft,
  FaMoneyBillWave,
  FaSearch,
  FaFilter,
  FaExclamationTriangle
} from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDate, formatPrice } from '@/lib/utils';

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
  created_at: Date;
  completed_at?: Date;
  
  // بيانات إضافية (من الاشتراك)
  company_name?: string;
  advertiser_id?: string;
}

export default function RefundsManagement() {
  const router = useRouter();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchRefunds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRefunds = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // تحديث حالة الاسترداد
  const handleUpdateStatus = async (refundId: string, newStatus: string) => {
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
      fetchRefunds();
    } catch (error: any) {
      console.error('Error updating refund:', error);
      toast.error('خطأ في تحديث الاسترداد');
    }
  };

  // فلترة الاستردادات
  const filteredRefunds = refunds.filter(refund => {
    const matchesStatus = filterStatus === 'all' || refund.status === filterStatus;
    const matchesSearch = !searchTerm || 
      refund.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.refund_reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // الإحصائيات
  const stats = {
    total: refunds.length,
    pending: refunds.filter(r => r.status === 'pending').length,
    approved: refunds.filter(r => r.status === 'approved').length,
    completed: refunds.filter(r => r.status === 'completed').length,
    rejected: refunds.filter(r => r.status === 'rejected').length,
    totalAmount: refunds
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + r.refund_amount, 0)
  };

  // عرض شارة الحالة
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

  // عرض طريقة الاسترداد
  const getMethodLabel = (method: string) => {
    const methods = {
      cash: 'نقداً',
      bank_transfer: 'تحويل بنكي',
      card: 'بطاقة',
      online: 'أونلاين'
    };
    return methods[method as keyof typeof methods] || method;
  };

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
        <title>إدارة الاستردادات - لوحة التحكم</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Link href="/admin/dashboard">
                  <button className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
                    <FaArrowLeft />
                    <span>العودة</span>
                  </button>
                </Link>
                <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
                  <FaUndo />
                  إدارة الاستردادات
                </h1>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <FaPlus />
                <span>إنشاء استرداد جديد</span>
              </motion.button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* الإحصائيات */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-md p-4 text-center"
            >
              <FaUndo className="text-3xl text-gray-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-sm text-gray-600">الإجمالي</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-yellow-50 rounded-xl shadow-md p-4 text-center border border-yellow-200"
            >
              <FaClock className="text-3xl text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
              <p className="text-sm text-yellow-700">معلق</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-blue-50 rounded-xl shadow-md p-4 text-center border border-blue-200"
            >
              <FaCheckCircle className="text-3xl text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-800">{stats.approved}</p>
              <p className="text-sm text-blue-700">موافق</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-green-50 rounded-xl shadow-md p-4 text-center border border-green-200"
            >
              <FaCheckCircle className="text-3xl text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-800">{stats.completed}</p>
              <p className="text-sm text-green-700">مكتمل</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-red-50 rounded-xl shadow-md p-4 text-center border border-red-200"
            >
              <FaTimesCircle className="text-3xl text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-800">{stats.rejected}</p>
              <p className="text-sm text-red-700">مرفوض</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl shadow-md p-4 text-center border border-primary-200"
            >
              <FaMoneyBillWave className="text-3xl text-primary-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-primary-800">{formatPrice(stats.totalAmount)}</p>
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
            {filteredRefunds.length === 0 ? (
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
                              {refund.refund_reason.slice(0, 40)}
                              {refund.refund_reason.length > 40 && '...'}
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
                            {getMethodLabel(refund.refund_method)}
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
                                  onClick={() => handleUpdateStatus(refund.id, 'approved')}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="موافقة"
                                >
                                  <FaCheckCircle />
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(refund.id, 'rejected')}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="رفض"
                                >
                                  <FaTimesCircle />
                                </button>
                              </>
                            )}

                            {refund.status === 'approved' && (
                              <button
                                onClick={() => handleUpdateStatus(refund.id, 'completed')}
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
            )}
          </div>
        </div>

        {/* Modal إنشاء استرداد */}
        <AnimatePresence>
          {showCreateModal && (
            <CreateRefundModal
              onClose={() => setShowCreateModal(false)}
              onSuccess={() => {
                setShowCreateModal(false);
                fetchRefunds();
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
                  {sub.id.slice(0, 8)} - مدفوع: {formatPrice(sub.paid_amount)}
                </option>
              ))}
            </select>
            
            {selectedSubscription && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                <p><strong>المدفوع:</strong> {formatPrice(selectedSubscription.paid_amount)}</p>
                <p><strong>المتبقي:</strong> {formatPrice(selectedSubscription.remaining_amount)}</p>
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

