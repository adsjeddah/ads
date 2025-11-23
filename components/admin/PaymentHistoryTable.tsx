/**
 * جدول سجل المدفوعات - عرض تاريخي كامل لجميع الدفعات
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaMoneyBillWave, 
  FaCalendarAlt, 
  FaCreditCard,
  FaUniversity,
  FaMoneyCheck,
  FaReceipt,
  FaFileInvoiceDollar
} from 'react-icons/fa';
import { formatDate, formatPrice, firestoreTimestampToDate } from '@/lib/utils';

interface Payment {
  id: string;
  subscription_id: string;
  invoice_id?: string;
  amount: number;
  payment_date: any;
  payment_method?: string;
  transaction_id?: string;
  notes?: string;
  created_at: any;
}

interface PaymentHistoryTableProps {
  payments: Payment[];
  loading?: boolean;
}

export default function PaymentHistoryTable({ payments, loading }: PaymentHistoryTableProps) {
  if (loading || !payments) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!Array.isArray(payments) || payments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <FaReceipt className="text-6xl text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">لا يوجد سجل مدفوعات</p>
        <p className="text-gray-400 text-sm mt-2">سيظهر هنا سجل جميع الدفعات المسجلة</p>
      </div>
    );
  }

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case 'bank_transfer': return <FaUniversity className="text-blue-500" />;
      case 'credit_card': return <FaCreditCard className="text-purple-500" />;
      case 'check': return <FaMoneyCheck className="text-green-500" />;
      default: return <FaMoneyBillWave className="text-green-500" />;
    }
  };

  const getPaymentMethodLabel = (method?: string) => {
    const labels: { [key: string]: string } = {
      'cash': 'نقدي',
      'bank_transfer': 'تحويل بنكي',
      'credit_card': 'بطاقة ائتمان',
      'check': 'شيك'
    };
    return labels[method || 'cash'] || method || 'نقدي';
  };

  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-3 rounded-lg">
              <FaReceipt className="text-green-500 text-xl" />
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">سجل المدفوعات</h3>
              <p className="text-white/80 text-sm">{payments.length} دفعة</p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-white/80 text-sm">إجمالي المدفوعات</p>
            <p className="text-white font-bold text-2xl">
              {formatPrice(totalPayments)}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                التاريخ
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                المبلغ
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                طريقة الدفع
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                رقم المعاملة
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                الفاتورة
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                ملاحظات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payments.map((payment, index) => (
              <motion.tr
                key={payment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-blue-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(firestoreTimestampToDate(payment.payment_date))}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <FaMoneyBillWave className="text-green-500" />
                    <span className="text-sm font-bold text-green-600">
                      {formatPrice(payment.amount)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(payment.payment_method)}
                    <span className="text-sm text-gray-700">
                      {getPaymentMethodLabel(payment.payment_method)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {payment.transaction_id ? (
                    <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                      {payment.transaction_id}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {payment.invoice_id ? (
                    <div className="flex items-center gap-2">
                      <FaFileInvoiceDollar className="text-blue-500" />
                      <span className="text-sm text-gray-700">
                        مربوط
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {payment.notes ? (
                    <span className="text-sm text-gray-700">
                      {payment.notes}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            عدد الدفعات: <span className="font-semibold text-gray-900">{payments.length}</span>
          </p>
          <p className="text-sm text-gray-600">
            الإجمالي: <span className="font-bold text-green-600 text-lg">{formatPrice(totalPayments)}</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

