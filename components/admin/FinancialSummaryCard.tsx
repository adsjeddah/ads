/**
 * بطاقة الملخص المالي - تعرض ملخص شامل للحالة المالية للمعلن
 */

import React from 'react';
import { motion } from 'framer-motion';
import { FaMoneyBillWave, FaCheckCircle, FaExclamationCircle, FaChartLine } from 'react-icons/fa';

interface FinancialSummaryCardProps {
  summary: {
    total_subscriptions: number;
    active_subscriptions: number;
    expired_subscriptions: number;
    total_spent: number;
    total_paid: number;
    total_pending: number;
  };
  loading?: boolean;
}

export default function FinancialSummaryCard({ summary, loading }: FinancialSummaryCardProps) {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'إجمالي المبلغ',
      value: `${summary.total_spent.toLocaleString('ar-SA')} ريال`,
      icon: FaChartLine,
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      iconColor: 'text-blue-500'
    },
    {
      label: 'المبلغ المدفوع',
      value: `${summary.total_paid.toLocaleString('ar-SA')} ريال`,
      icon: FaCheckCircle,
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      iconColor: 'text-green-500',
      percentage: summary.total_spent > 0 ? ((summary.total_paid / summary.total_spent) * 100).toFixed(1) : '0'
    },
    {
      label: 'المبلغ المتبقي',
      value: `${summary.total_pending.toLocaleString('ar-SA')} ريال`,
      icon: FaExclamationCircle,
      color: summary.total_pending > 0 ? 'red' : 'gray',
      bgColor: summary.total_pending > 0 ? 'bg-red-100' : 'bg-gray-100',
      textColor: summary.total_pending > 0 ? 'text-red-600' : 'text-gray-600',
      iconColor: summary.total_pending > 0 ? 'text-red-500' : 'text-gray-500'
    },
    {
      label: 'الاشتراكات النشطة',
      value: `${summary.active_subscriptions} / ${summary.total_subscriptions}`,
      icon: FaMoneyBillWave,
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      iconColor: 'text-purple-500'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 rounded-xl shadow-lg p-6 border border-primary-100"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FaMoneyBillWave className="text-primary-500" />
          الملخص المالي
        </h3>
        {summary.total_pending > 0 && (
          <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
            يوجد مستحقات
          </span>
        )}
        {summary.total_pending === 0 && summary.total_paid > 0 && (
          <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-semibold">
            ✓ مدفوع بالكامل
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`${stat.bgColor} rounded-lg p-4 relative overflow-hidden`}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`text-2xl ${stat.iconColor}`} />
                {stat.percentage && (
                  <span className={`text-xs font-semibold ${stat.textColor}`}>
                    {stat.percentage}%
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className={`text-lg font-bold ${stat.textColor}`}>
                {stat.value}
              </p>
            </div>
            
            {/* Progress bar for paid amount */}
            {stat.percentage && (
              <div className="mt-2 h-1.5 bg-white rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.percentage}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className={`h-full bg-gradient-to-r from-green-400 to-green-600`}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Payment Progress */}
      {summary.total_spent > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">نسبة الدفع الإجمالية</span>
            <span className="font-bold text-gray-800">
              {((summary.total_paid / summary.total_spent) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(summary.total_paid / summary.total_spent) * 100}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r ${
                summary.total_pending === 0 
                  ? 'from-green-400 to-green-600'
                  : summary.total_paid > summary.total_spent / 2
                  ? 'from-yellow-400 to-yellow-600'
                  : 'from-red-400 to-red-600'
              }`}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

