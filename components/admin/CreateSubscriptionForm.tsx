/**
 * نموذج إنشاء اشتراك جديد - مع حساب تلقائي للخصومات والمبالغ
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaPercent, FaMoneyBillWave, FaCalendarAlt, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import { getValidToken, getAuthHeaders, handleAuthError } from '../lib/utils/auth';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  description?: string;
}

interface CreateSubscriptionFormProps {
  advertiserId: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function CreateSubscriptionForm({
  advertiserId,
  onSuccess,
  onCancel
}: CreateSubscriptionFormProps) {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  
  // Form state
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('percentage');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [initialPayment, setInitialPayment] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  // Calculated values
  const [calculation, setCalculation] = useState<any>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (selectedPlanId) {
      calculateDiscount();
    }
  }, [selectedPlanId, discountType, discountAmount]);

  const fetchPlans = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await axios.get(`${apiUrl}/plans`);
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('فشل تحميل الخطط');
    } finally {
      setLoadingPlans(false);
    }
  };

  const calculateDiscount = async () => {
    const selectedPlan = plans.find(p => p.id === selectedPlanId);
    if (!selectedPlan) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await axios.post(`${apiUrl}/financial/calculate-discount`, {
        base_price: selectedPlan.price,
        discount_type: discountType,
        discount_amount: discountAmount
      });
      setCalculation(response.data.data);
    } catch (error: any) {
      console.error('Error calculating discount:', error);
      if (error.response?.data?.details) {
        toast.error(error.response.data.details);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlanId) {
      toast.error('الرجاء اختيار خطة');
      return;
    }

    if (!calculation) {
      toast.error('خطأ في حساب المبلغ');
      return;
    }

    if (initialPayment > calculation.total_amount) {
      toast.error('الدفعة الأولية لا يمكن أن تتجاوز المبلغ الإجمالي');
      return;
    }

    setLoading(true);
    
    try {
      // 🔑 الحصول على التوكن الصحيح
      const token = await getValidToken();
      if (!token) {
        toast.error('انتهت جلستك، الرجاء تسجيل الدخول مرة أخرى');
        router.push('/admin/login');
        return;
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await axios.post(
        `${apiUrl}/financial/create-subscription`, 
        {
          advertiser_id: advertiserId,
          plan_id: selectedPlanId,
          start_date: startDate,
          discount_type: discountType,
          discount_amount: discountAmount,
          initial_payment: initialPayment,
          payment_method: paymentMethod,
          notes: notes
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('تم إنشاء الاشتراك بنجاح!');
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      
      // معالجة أخطاء المصادقة
      if (handleAuthError(error, router)) {
        toast.error('انتهت جلستك، الرجاء تسجيل الدخول مرة أخرى');
        return;
      }
      
      toast.error(error.response?.data?.details || 'فشل إنشاء الاشتراك');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  if (loadingPlans) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FaPlus className="text-primary-500" />
          إضافة اشتراك جديد
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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Plan Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <FaMoneyBillWave className="inline mr-2 text-primary-500" />
            اختر الخطة
          </label>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          >
            <option value="">-- اختر الخطة --</option>
            {plans.map(plan => (
              <option key={plan.id} value={plan.id}>
                {plan.name} - {plan.price.toLocaleString('ar-SA')} ريال ({plan.duration_days} يوم)
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <FaCalendarAlt className="inline mr-2 text-primary-500" />
            تاريخ البداية
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>

        {/* Discount Section */}
        {selectedPlan && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-gray-700">الخصومات</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">نوع الخصم</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as 'amount' | 'percentage')}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="percentage">نسبة مئوية</option>
                  <option value="amount">مبلغ ثابت</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">قيمة الخصم</label>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  min="0"
                  max={discountType === 'percentage' ? 100 : selectedPlan.price}
                  step="0.01"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Calculation Summary */}
            {calculation && (
              <div className="mt-4 bg-white rounded-lg p-4 border-2 border-primary-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">السعر الأساسي:</span>
                    <span className="font-semibold">{calculation.base_price.toLocaleString('ar-SA')} ريال</span>
                  </div>
                  {calculation.discount_value > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>الخصم:</span>
                      <span className="font-semibold">- {calculation.discount_value.toLocaleString('ar-SA')} ريال</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-primary-600 pt-2 border-t">
                    <span>المبلغ الإجمالي:</span>
                    <span>{calculation.total_amount.toLocaleString('ar-SA')} ريال</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Initial Payment */}
        {calculation && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              الدفعة الأولية (اختياري)
            </label>
            <input
              type="number"
              value={initialPayment}
              onChange={(e) => setInitialPayment(parseFloat(e.target.value) || 0)}
              min="0"
              max={calculation.total_amount}
              step="0.01"
              placeholder="0.00"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {initialPayment > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                المتبقي: {(calculation.total_amount - initialPayment).toLocaleString('ar-SA')} ريال
              </p>
            )}
          </div>
        )}

        {/* Payment Method */}
        {initialPayment > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              طريقة الدفع
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="cash">نقدي</option>
              <option value="bank_transfer">تحويل بنكي</option>
              <option value="credit_card">بطاقة ائتمان</option>
              <option value="check">شيك</option>
            </select>
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
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <motion.button
            type="submit"
            disabled={loading || !selectedPlanId || !calculation}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 px-6 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                جاري الإنشاء...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <FaPlus />
                إنشاء الاشتراك
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

