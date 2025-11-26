/**
 * نموذج تسجيل دفعة جديدة - مع تحديث تلقائي للاشتراك والفاتورة
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaMoneyBillWave, FaCalendarAlt, FaFileInvoiceDollar, FaTimes, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Subscription {
  id: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_status: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
}

interface RecordPaymentFormProps {
  subscription: Subscription;
  invoices?: Invoice[];
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function RecordPaymentForm({
  subscription,
  invoices = [],
  onSuccess,
  onCancel
}: RecordPaymentFormProps) {
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [invoiceId, setInvoiceId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');

  // Safety check - return loading state if subscription is not available
  if (!subscription) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid');
  const maxAmount = subscription.remaining_amount || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const paymentAmount = parseFloat(amount);
    
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error('الرجاء إدخال مبلغ صحيح');
      return;
    }

    if (paymentAmount > maxAmount) {
      toast.error(`المبلغ يتجاوز المتبقي (${maxAmount.toLocaleString('ar-SA')} ريال)`);
      return;
    }

    setLoading(true);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const token = localStorage.getItem('token');
      const response = await axios.post(`${apiUrl}/financial/record-payment`, {
        subscription_id: subscription.id,
        invoice_id: invoiceId || undefined,
        amount: paymentAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        transaction_id: transactionId || undefined,
        notes: notes || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('تم تسجيل الدفعة بنجاح!');
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error recording payment:', error);
      const errorMessage = error.response?.data?.details || error.response?.data?.error || 'فشل تسجيل الدفعة';
      
      // إذا كان الخطأ 401 (Unauthorized)، نعرض رسالة واضحة
      if (error.response?.status === 401) {
        toast.error(errorMessage, { duration: 6000 });
        // بعد 3 ثواني، نعيد التوجيه لصفحة تسجيل الدخول
        setTimeout(() => {
          if (confirm('انتهت صلاحية الجلسة. هل تريد تسجيل الدخول مرة أخرى؟')) {
            localStorage.removeItem('token');
            window.location.href = '/admin/login';
          }
        }, 2000);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const amountNum = parseFloat(amount) || 0;
  const newRemainingAmount = maxAmount - amountNum;
  const willBeFullyPaid = newRemainingAmount <= 0.01;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FaMoneyBillWave className="text-green-500" />
          تسجيل دفعة جديدة
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        )}
      </div>

      {/* Subscription Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6 border border-blue-200">
        <h4 className="font-semibold text-gray-700 mb-3">ملخص الاشتراك</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">الإجمالي</p>
            <p className="text-lg font-bold text-gray-800">
              {subscription.total_amount.toLocaleString('ar-SA')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">المدفوع</p>
            <p className="text-lg font-bold text-green-600">
              {subscription.paid_amount.toLocaleString('ar-SA')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">المتبقي</p>
            <p className="text-lg font-bold text-red-600">
              {subscription.remaining_amount.toLocaleString('ar-SA')}
            </p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
              style={{ width: `${(subscription.paid_amount / subscription.total_amount) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <FaMoneyBillWave className="inline mr-2 text-green-500" />
            المبلغ *
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.01"
              max={maxAmount}
              step="0.01"
              placeholder="0.00"
              className="w-full p-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
              ريال
            </span>
          </div>
          <div className="flex justify-between mt-2">
            <button
              type="button"
              onClick={() => setAmount(maxAmount.toString())}
              className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
            >
              دفع المتبقي بالكامل
            </button>
            <span className="text-xs text-gray-500">
              الحد الأقصى: {maxAmount.toLocaleString('ar-SA')} ريال
            </span>
          </div>
        </div>

        {/* Amount Preview */}
        {amountNum > 0 && (
          <div className={`rounded-lg p-4 border-2 ${willBeFullyPaid ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'}`}>
            <div className="flex items-center gap-2 mb-2">
              {willBeFullyPaid && <FaCheckCircle className="text-green-500" />}
              <h5 className="font-semibold text-gray-700">بعد هذه الدفعة:</h5>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">المبلغ المدفوع:</p>
                <p className="font-bold text-green-600">
                  {(subscription.paid_amount + amountNum).toLocaleString('ar-SA')} ريال
                </p>
              </div>
              <div>
                <p className="text-gray-600">المتبقي:</p>
                <p className={`font-bold ${willBeFullyPaid ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.max(0, newRemainingAmount).toLocaleString('ar-SA')} ريال
                </p>
              </div>
            </div>
            {willBeFullyPaid && (
              <p className="text-sm text-green-600 font-semibold mt-2 flex items-center gap-2">
                <FaCheckCircle />
                ✓ سيتم تحديث حالة الاشتراك إلى "مدفوع بالكامل"
              </p>
            )}
          </div>
        )}

        {/* Invoice Selection */}
        {unpaidInvoices.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FaFileInvoiceDollar className="inline mr-2 text-blue-500" />
              ربط بفاتورة (اختياري)
            </label>
            <select
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">-- اختيار تلقائي --</option>
              {unpaidInvoices.map(invoice => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.invoice_number} - {invoice.amount.toLocaleString('ar-SA')} ريال
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Payment Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <FaCalendarAlt className="inline mr-2 text-blue-500" />
            تاريخ الدفع *
          </label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            طريقة الدفع *
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            required
          >
            <option value="cash">نقدي</option>
            <option value="bank_transfer">تحويل بنكي</option>
            <option value="credit_card">بطاقة ائتمان</option>
            <option value="check">شيك</option>
          </select>
        </div>

        {/* Transaction ID */}
        {(paymentMethod === 'bank_transfer' || paymentMethod === 'credit_card') && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              رقم المعاملة (اختياري)
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="مثال: TXN123456"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ملاحظات (اختياري)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="أي ملاحظات إضافية..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <motion.button
            type="submit"
            disabled={loading || !amount || parseFloat(amount) <= 0}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                جاري التسجيل...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <FaCheckCircle />
                تسجيل الدفعة
              </span>
            )}
          </motion.button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );
}

