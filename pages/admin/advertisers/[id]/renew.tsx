import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaRedo, FaBox, FaMoneyBillWave, FaClock } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

// Utility function to convert Arabic numerals to English numerals
const arabicToEnglishNumerals = (str: string): string => {
  if (typeof str !== 'string') return str;
  // Also handle Persian numerals just in case
  str = str.replace(/[۰۱۲۳۴۵۶۷۸۹]/g, (d) => (d.charCodeAt(0) - 1776).toString());
  return str.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => (d.charCodeAt(0) - 1632).toString());
};

interface Plan {
  id: number;
  name: string;
  duration_days: number;
  price: number;
  features?: string;
}

export default function RenewSubscription() {
  const router = useRouter();
  const { id, subscription } = router.query;
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [customDuration, setCustomDuration] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [discountType, setDiscountType] = useState('amount');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [basePrice, setBasePrice] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlans();
    // تعيين تاريخ البداية لليوم التالي لانتهاء الاشتراك الحالي
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setCustomStartDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [selectedPlan, discountType, discountAmount, customStartDate, customEndDate, plans]);

  const fetchPlans = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await axios.get(`${apiUrl}/plans`);
      const uniquePlans = response.data.reduce((acc: any[], plan: any) => {
        const exists = acc.find(p => p.name === plan.name && p.price === plan.price);
        if (!exists) {
          acc.push(plan);
        }
        return acc;
      }, []);
      setPlans(uniquePlans);
      if (uniquePlans.length > 0) {
        setSelectedPlan(uniquePlans[0].id.toString());
        setBasePrice(uniquePlans[0].price);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const calculateTotal = () => {
    let price = 0;
    
    if (!customDuration && selectedPlan) {
      const plan = plans.find(p => p.id.toString() === selectedPlan);
      price = plan?.price || 0;
    } else if (customStartDate && customEndDate) {
      const days = Math.ceil((new Date(customEndDate).getTime() - new Date(customStartDate).getTime()) / (1000 * 60 * 60 * 24));
      price = Math.round((800 / 30) * days);
    }
    
    setBasePrice(price);
    
    let discount = 0;
    if (discountType === 'amount') {
      discount = discountAmount;
    } else {
      discount = (price * discountAmount) / 100;
    }
    
    setTotalAmount(Math.max(0, price - discount));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let startDate = customStartDate;
    let endDate = '';
    
    if (!customDuration && selectedPlan) {
      const plan = plans.find(p => p.id.toString() === selectedPlan);
      if (plan) {
        const end = new Date(startDate);
        end.setDate(end.getDate() + plan.duration_days);
        endDate = end.toISOString().split('T')[0];
      }
    } else {
      endDate = customEndDate;
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      await axios.post(
        `${apiUrl}/subscriptions`,
        {
          advertiser_id: id,
          plan_id: selectedPlan || '1',
          start_date: startDate,
          end_date: endDate,
          base_price: basePrice,
          discount_type: discountType,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          paid_amount: paidAmount,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success('تم تجديد الاشتراك بنجاح');
      router.push(`/admin/advertisers/${id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'خطأ في تجديد الاشتراك');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>تجديد الاشتراك - لوحة التحكم</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gradient">تجديد الاشتراك</h1>
              <Link href={`/admin/advertisers/${id}`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <FaArrowLeft />
                  <span>العودة للمعلن</span>
                </motion.button>
              </Link>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-3xl mx-auto"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* اختيار الباقة */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  <FaBox className="inline ml-2" /> اختر الباقة
                </label>
                
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!customDuration}
                      onChange={() => setCustomDuration(false)}
                      className="ml-2"
                    />
                    <span>باقة محددة مسبقاً</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={customDuration}
                      onChange={() => setCustomDuration(true)}
                      className="ml-2"
                    />
                    <span>تحديد مدة مخصصة</span>
                  </label>
                </div>

                {!customDuration ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {plans.map((plan) => (
                      <motion.div
                        key={plan.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedPlan(plan.id.toString())}
                        className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                          selectedPlan === plan.id.toString()
                            ? 'border-primary-500 bg-primary-50 shadow-lg'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-800">{plan.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">المدة: {plan.duration_days} يوم</p>
                            {plan.features && (
                              <p className="text-xs text-gray-500 mt-2">{plan.features}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary-600">{plan.price}</p>
                            <p className="text-sm text-gray-600">ريال</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 text-sm mb-1">تاريخ البداية</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        required={customDuration}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm mb-1">تاريخ النهاية</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        required={customDuration}
                        min={customStartDate}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* الخصم */}
              <div className="bg-yellow-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FaMoneyBillWave className="ml-2 text-yellow-600" /> الخصم (اختياري)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">نوع الخصم</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="amount">مبلغ ثابت</option>
                      <option value="percentage">نسبة مئوية</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      {discountType === 'amount' ? 'قيمة الخصم (ريال)' : 'نسبة الخصم (%)'}
                    </label>
                    <input
                      type="number"
                      value={discountAmount}
                      onChange={(e) => {
                        const convertedValue = arabicToEnglishNumerals(e.target.value);
                        setDiscountAmount(parseFloat(convertedValue) || 0);
                      }}
                      min="0"
                      max={discountType === 'percentage' ? 100 : basePrice}
                      step={discountType === 'percentage' ? '1' : '0.01'}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* معلومات الدفع */}
              <div className="bg-blue-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FaMoneyBillWave className="ml-2 text-blue-600" /> معلومات الدفع
                </h3>
                
                <div className="bg-white rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-600">السعر الأساسي:</span>
                    <span className="font-semibold text-gray-800">{basePrice} ريال</span>
                  </div>
                  
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center pb-3 border-b text-green-600">
                      <span>الخصم:</span>
                      <span className="font-semibold">
                        -{discountType === 'amount'
                          ? discountAmount
                          : Math.round((basePrice * discountAmount) / 100)
                        } ريال
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-gray-800">المجموع:</span>
                    <span className="text-primary-600">{totalAmount} ريال</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">المبلغ المدفوع</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => {
                      const convertedValue = arabicToEnglishNumerals(e.target.value);
                      setPaidAmount(parseFloat(convertedValue) || 0);
                    }}
                    min="0"
                    max={totalAmount}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                  />
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700">المبلغ المتبقي:</span>
                    <span className="text-2xl font-bold text-red-600">{totalAmount - paidAmount} ريال</span>
                  </div>
                </div>
              </div>

              {/* زر الحفظ */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>جاري التجديد...</span>
                  </>
                ) : (
                  <>
                    <FaRedo />
                    <span>تجديد الاشتراك</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
}