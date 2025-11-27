/**
 * جدول الفواتير - عرض جميع الفواتير مع حالاتها
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaFileInvoiceDollar, 
  FaCheckCircle, 
  FaExclamationCircle,
  FaCalendarAlt,
  FaMoneyBillWave
} from 'react-icons/fa';
import { formatDate, formatPrice, firestoreTimestampToDate } from '@/lib/utils';

interface Invoice {
  id: string;
  subscription_id: string;
  invoice_number: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'partial' | 'cancelled';
  issued_date: any;
  due_date?: any;
  paid_date?: any;
  paid_amount?: number; // 🆕 المبلغ المدفوع الفعلي
  created_at: any;
}

interface Subscription {
  id: string;
  paid_amount: number;
  remaining_amount: number;
  total_amount: number;
}

interface InvoicesTableProps {
  invoices: Invoice[];
  subscriptions?: Subscription[]; // 🆕 لربط الفواتير بالاشتراكات
  loading?: boolean;
}

export default function InvoicesTable({ invoices, subscriptions = [], loading }: InvoicesTableProps) {
  if (loading || !invoices) {
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

  if (!Array.isArray(invoices) || invoices.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <FaFileInvoiceDollar className="text-6xl text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">لا توجد فواتير</p>
        <p className="text-gray-400 text-sm mt-2">سيتم إنشاء الفواتير تلقائياً عند إضافة اشتراكات</p>
      </div>
    );
  }

  // 🆕 دالة للحصول على المبلغ المدفوع للفاتورة من الاشتراك المرتبط
  const getInvoicePaidAmount = (invoice: Invoice): number => {
    // أولاً: استخدام paid_amount من الفاتورة مباشرة إذا كان موجوداً
    if (invoice.paid_amount !== undefined && invoice.paid_amount > 0) {
      return invoice.paid_amount;
    }
    // ثانياً: البحث في الاشتراك المرتبط
    const subscription = subscriptions.find(s => s.id === invoice.subscription_id);
    if (subscription) {
      return subscription.paid_amount || 0;
    }
    // ثالثاً: إذا كانت الحالة مدفوعة، افترض أن المبلغ كاملاً مدفوع
    if (invoice.status === 'paid') {
      return invoice.amount;
    }
    return 0;
  };

  const getStatusBadge = (status: string, paidAmt: number, totalAmt: number) => {
    // تحديد الحالة الفعلية بناءً على المبالغ
    let actualStatus = status;
    if (paidAmt >= totalAmt) {
      actualStatus = 'paid';
    } else if (paidAmt > 0) {
      actualStatus = 'partial';
    } else if (status !== 'cancelled') {
      actualStatus = 'unpaid';
    }

    const styles: Record<string, string> = {
      paid: 'bg-green-100 text-green-700',
      partial: 'bg-yellow-100 text-yellow-700',
      unpaid: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700'
    };
    
    const labels: Record<string, string> = {
      paid: 'مدفوعة',
      partial: 'مدفوعة جزئياً',
      unpaid: 'غير مدفوعة',
      cancelled: 'ملغاة'
    };

    const icons: Record<string, React.ReactNode> = {
      paid: <FaCheckCircle className="inline mr-1" />,
      partial: <FaExclamationCircle className="inline mr-1" />,
      unpaid: <FaExclamationCircle className="inline mr-1 animate-pulse" />,
      cancelled: null
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center ${styles[actualStatus] || styles.unpaid}`}>
        {icons[actualStatus]}
        {labels[actualStatus] || labels.unpaid}
      </span>
    );
  };

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  
  // 🆕 حساب المبلغ المدفوع الفعلي من كل فاتورة
  const paidAmount = invoices.reduce((sum, inv) => sum + getInvoicePaidAmount(inv), 0);
  const unpaidAmount = Math.max(0, totalAmount - paidAmount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white p-3 rounded-lg">
              <FaFileInvoiceDollar className="text-blue-500 text-xl" />
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">الفواتير</h3>
              <p className="text-white/80 text-sm">{invoices.length} فاتورة</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/20 rounded-lg p-3">
              <p className="text-white/80 text-xs">الإجمالي</p>
              <p className="text-white font-bold">{formatPrice(totalAmount)}</p>
            </div>
            <div className="bg-green-500/30 rounded-lg p-3">
              <p className="text-white/80 text-xs">المدفوع</p>
              <p className="text-white font-bold">{formatPrice(paidAmount)}</p>
            </div>
            <div className="bg-red-500/30 rounded-lg p-3">
              <p className="text-white/80 text-xs">المستحق</p>
              <p className="text-white font-bold">{formatPrice(unpaidAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                رقم الفاتورة
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                المبلغ
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                الحالة
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                تاريخ الإصدار
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                تاريخ الاستحقاق
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                تاريخ الدفع
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoices.map((invoice, index) => (
              <motion.tr
                key={invoice.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <FaFileInvoiceDollar className="text-blue-500" />
                    <span className="text-sm font-semibold text-gray-900 font-mono">
                      {invoice.invoice_number}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <FaMoneyBillWave className="text-green-500" />
                    <span className="text-sm font-bold text-gray-900">
                      {formatPrice(invoice.amount)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(invoice.status, getInvoicePaidAmount(invoice), invoice.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-gray-400 text-xs" />
                    <span className="text-sm text-gray-700">
                      {formatDate(firestoreTimestampToDate(invoice.issued_date))}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {invoice.due_date ? (
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-orange-400 text-xs" />
                      <span className="text-sm text-gray-700">
                        {formatDate(firestoreTimestampToDate(invoice.due_date))}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {invoice.paid_date ? (
                    <div className="flex items-center gap-2">
                      <FaCheckCircle className="text-green-500 text-xs" />
                      <span className="text-sm text-green-600 font-semibold">
                        {formatDate(firestoreTimestampToDate(invoice.paid_date))}
                      </span>
                    </div>
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-gray-500">عدد الفواتير</p>
              <p className="text-lg font-bold text-gray-900">{invoices.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">المدفوع</p>
              <p className="text-lg font-bold text-green-600">
                {invoices.filter(inv => getInvoicePaidAmount(inv) >= inv.amount).length}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">غير المدفوع</p>
              <p className="text-lg font-bold text-red-600">
                {invoices.filter(inv => getInvoicePaidAmount(inv) < inv.amount).length}
              </p>
            </div>
          </div>
          
          <div className="text-left">
            <p className="text-xs text-gray-500">إجمالي المبالغ</p>
            <p className="text-xl font-bold text-gray-900">
              {formatPrice(totalAmount)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

