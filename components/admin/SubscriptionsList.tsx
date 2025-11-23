/**
 * قائمة الاشتراكات - عرض احترافي مع تفاصيل مالية كاملة
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaCalendarAlt, 
  FaMoneyBillWave, 
  FaCheckCircle, 
  FaExclamationCircle,
  FaClock,
  FaBox,
  FaTimes
} from 'react-icons/fa';
import { formatDate, formatPrice, firestoreTimestampToDate, daysBetween } from '@/lib/utils';

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

interface Plan {
  id: string;
  name: string;
  duration_days: number;
}

interface SubscriptionsListProps {
  subscriptions: Subscription[];
  plans: Plan[];
  onAddPayment?: (subscription: Subscription) => void;
  loading?: boolean;
}

export default function SubscriptionsList({
  subscriptions,
  plans,
  onAddPayment,
  loading
}: SubscriptionsListProps) {
  if (loading || !subscriptions || !plans) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <FaBox className="text-6xl text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">لا توجد اشتراكات حالية</p>
        <p className="text-gray-400 text-sm mt-2">قم بإضافة اشتراك جديد للبدء</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <FaCheckCircle className="text-green-500" />;
      case 'expired': return <FaClock className="text-yellow-500" />;
      case 'cancelled': return <FaTimes className="text-red-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      expired: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    
    const labels = {
      active: 'نشط',
      expired: 'منتهي',
      cancelled: 'ملغي'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string, hasRemaining: boolean) => {
    if (status === 'paid') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
          <FaCheckCircle />
          مدفوع بالكامل
        </span>
      );
    } else if (status === 'partial') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 flex items-center gap-1">
          <FaExclamationCircle />
          دفع جزئي
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 flex items-center gap-1 animate-pulse">
          <FaExclamationCircle />
          غير مدفوع
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      {subscriptions.map((sub, index) => {
        const plan = plans.find(p => p.id === sub.plan_id);
        const startDate = firestoreTimestampToDate(sub.start_date);
        const endDate = firestoreTimestampToDate(sub.end_date);
        const daysRemaining = startDate && endDate ? daysBetween(new Date(), endDate) : 0;
        const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
        const paymentPercentage = (sub.paid_amount / sub.total_amount) * 100;

        return (
          <motion.div
            key={sub.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-100 hover:border-primary-200 transition-colors"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg">
                    {getStatusIcon(sub.status)}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">
                      {plan?.name || 'خطة غير معروفة'}
                    </h4>
                    <p className="text-white/80 text-sm">
                      {plan?.duration_days} يوم
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(sub.status)}
                  {getPaymentStatusBadge(sub.payment_status, sub.remaining_amount > 0)}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <FaCalendarAlt className="text-blue-500 text-xl" />
                  <div>
                    <p className="text-xs text-gray-500">تاريخ البداية</p>
                    <p className="font-semibold text-gray-800">
                      {formatDate(startDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaCalendarAlt className="text-purple-500 text-xl" />
                  <div>
                    <p className="text-xs text-gray-500">تاريخ النهاية</p>
                    <p className="font-semibold text-gray-800">
                      {formatDate(endDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaClock className={`text-xl ${isExpiringSoon ? 'text-red-500 animate-pulse' : 'text-gray-500'}`} />
                  <div>
                    <p className="text-xs text-gray-500">المتبقي</p>
                    <p className={`font-semibold ${daysRemaining < 0 ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-gray-800'}`}>
                      {daysRemaining < 0 ? 'منتهي' : `${daysRemaining} يوم`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FaMoneyBillWave className="text-green-500" />
                  التفاصيل المالية
                </h5>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">السعر الأساسي</p>
                    <p className="font-bold text-gray-800">
                      {formatPrice(sub.base_price)}
                    </p>
                  </div>
                  
                  {sub.discount_amount > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">الخصم</p>
                      <p className="font-bold text-red-600">
                        - {sub.discount_type === 'percentage' 
                          ? `${sub.discount_amount}%` 
                          : formatPrice(sub.discount_amount)}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-xs text-gray-500 mb-1">الإجمالي</p>
                    <p className="font-bold text-primary-600">
                      {formatPrice(sub.total_amount)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 mb-1">المدفوع</p>
                    <p className="font-bold text-green-600">
                      {formatPrice(sub.paid_amount)}
                    </p>
                  </div>
                  
                  {sub.remaining_amount > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">المتبقي</p>
                      <p className="font-bold text-red-600 animate-pulse">
                        {formatPrice(sub.remaining_amount)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment Progress Bar */}
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-2">
                    <span>نسبة الدفع</span>
                    <span className="font-semibold">{paymentPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${paymentPercentage}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className={`h-full ${
                        paymentPercentage === 100
                          ? 'bg-gradient-to-r from-green-400 to-green-600'
                          : paymentPercentage >= 50
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                          : 'bg-gradient-to-r from-red-400 to-red-600'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              {sub.remaining_amount > 0 && sub.status === 'active' && onAddPayment && (
                <div className="pt-4 border-t">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onAddPayment(sub)}
                    className="w-full md:w-auto bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-6 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <FaMoneyBillWave />
                    تسجيل دفعة
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

