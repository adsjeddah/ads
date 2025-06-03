import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaSave, FaBuilding, FaPhone, FaListAlt, FaWhatsapp, FaCalendarAlt, FaMoneyBillWave, FaBox, FaTruck, FaBoxes, FaHome, FaDolly, FaShippingFast, FaWarehouse, FaHandshake, FaTools, FaPeopleCarry, FaRoute, FaClock, FaShieldAlt, FaAward, FaStar, FaMapMarkedAlt, FaHeadset, FaUserTie, FaClipboardCheck, FaTruckLoading, FaBoxOpen } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

interface ExistingAdvertiser {
  id: number;
  company_name: string;
  phone: string;
  services: string;
  icon_url: string;
}

// Utility function to convert Arabic numerals to English numerals
const arabicToEnglishNumerals = (str: string): string => {
  if (typeof str !== 'string') return str;
  // Also handle Persian numerals just in case
  str = str.replace(/[۰۱۲۳۴۵۶۷۸۹]/g, (d) => (d.charCodeAt(0) - 1776).toString());
  return str.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => (d.charCodeAt(0) - 1632).toString());
};

export default function NewAdvertiser() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    company_name: '',
    phone: '',
    whatsapp: '',
    services: '',
    selected_icon: '',
    plan_id: '',
    duration_type: 'preset', // 'preset' or 'custom'
    preset_duration: '30', // 15, 30, 90
    custom_start_date: '',
    custom_end_date: '',
    base_price: 0,
    discount_amount: 0,
    discount_type: 'amount', // 'amount' or 'percentage'
    total_amount: 0,
    paid_amount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [existingAdvertisers, setExistingAdvertisers] = useState<ExistingAdvertiser[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // أسعار ثابتة للمدد المختلفة (احتياطي في حالة عدم استخدام الخطط من قاعدة البيانات)
  const pricingPlans: { [key: string]: { name: string; price: number } } = {
    '14': { name: 'أسبوعين', price: 500 },
    '30': { name: 'شهر', price: 800 },
    '60': { name: 'شهرين', price: 1400 },
    '90': { name: '3 أشهر', price: 1800 }
  };

  // أيقونات مناسبة لشركات نقل العفش
  const availableIcons = [
    { icon: FaTruck, name: 'truck', color: 'text-blue-600' },
    { icon: FaBoxes, name: 'boxes', color: 'text-amber-600' },
    { icon: FaHome, name: 'home', color: 'text-green-600' },
    { icon: FaDolly, name: 'dolly', color: 'text-purple-600' },
    { icon: FaShippingFast, name: 'shipping-fast', color: 'text-red-600' },
    { icon: FaWarehouse, name: 'warehouse', color: 'text-indigo-600' },
    { icon: FaHandshake, name: 'handshake', color: 'text-teal-600' },
    { icon: FaTools, name: 'tools', color: 'text-orange-600' },
    { icon: FaPeopleCarry, name: 'people-carry', color: 'text-pink-600' },
    { icon: FaRoute, name: 'route', color: 'text-cyan-600' },
    { icon: FaClock, name: 'clock', color: 'text-yellow-600' },
    { icon: FaShieldAlt, name: 'shield-alt', color: 'text-gray-600' },
    { icon: FaAward, name: 'award', color: 'text-yellow-500' },
    { icon: FaStar, name: 'star', color: 'text-yellow-400' },
    { icon: FaMapMarkedAlt, name: 'map-marked-alt', color: 'text-green-500' },
    { icon: FaHeadset, name: 'headset', color: 'text-blue-500' },
    { icon: FaUserTie, name: 'user-tie', color: 'text-gray-700' },
    { icon: FaClipboardCheck, name: 'clipboard-check', color: 'text-green-700' },
    { icon: FaTruckLoading, name: 'truck-loading', color: 'text-red-700' },
    { icon: FaBoxOpen, name: 'box-open', color: 'text-amber-700' },
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
    } else {
      fetchPlans();
      fetchExistingAdvertisers();
    }
  }, [router]);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/plans`);
      // إزالة التكرارات بناءً على الاسم والسعر
      const uniquePlans = response.data.reduce((acc: any[], plan: any) => {
        const exists = acc.find(p => p.name === plan.name && p.price === plan.price);
        if (!exists) {
          acc.push(plan);
        }
        return acc;
      }, []);
      setPlans(uniquePlans);
      // تعيين أول خطة كافتراضية
      if (uniquePlans.length > 0) {
        setFormData(prev => ({
          ...prev,
          plan_id: uniquePlans[0].id.toString(),
          base_price: uniquePlans[0].price
        }));
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      // toast.error('خطأ في جلب الخطط'); // User might not need to see this if plans are secondary
    }
  };

  const fetchExistingAdvertisers = async () => {
    setLoadingExisting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/admin/advertisers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExistingAdvertisers(
        response.data.filter(
          (adv: ExistingAdvertiser) => adv.company_name && adv.company_name.toLowerCase() !== 'المدير' && adv.company_name.toLowerCase() !== 'admin'
        )
      );
    } catch (error) {
      console.error('Error fetching existing advertisers:', error);
      // toast.error('خطأ في جلب قائمة المعلنين الحاليين'); // Optional: might be too noisy
    } finally {
      setLoadingExisting(false);
    }
  };

  const calculateEndDate = (startDate: string, days: number) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateTotalAmount = () => {
    let basePrice = 0;
    
    if (formData.duration_type === 'preset' && formData.plan_id) {
      const selectedPlan = plans.find(p => p.id.toString() === formData.plan_id);
      basePrice = selectedPlan?.price || 0;
    } else if (formData.custom_start_date && formData.custom_end_date) {
      const days = calculateDays(formData.custom_start_date, formData.custom_end_date);
      // حساب السعر للأيام المخصصة (26.67 ريال لليوم الواحد بناءً على سعر الشهر)
      basePrice = Math.round((800 / 30) * days);
    }
    
    // حساب الخصم
    let discountValue = 0;
    if (formData.discount_type === 'amount') {
      discountValue = formData.discount_amount;
    } else if (formData.discount_type === 'percentage') {
      discountValue = (basePrice * formData.discount_amount) / 100;
    }
    
    const totalAmount = Math.max(0, basePrice - discountValue);
    
    setFormData(prev => ({
      ...prev,
      base_price: basePrice,
      total_amount: totalAmount
    }));
  };

  useEffect(() => {
    calculateTotalAmount();
  }, [formData.duration_type, formData.plan_id, formData.custom_start_date, formData.custom_end_date, formData.discount_amount, formData.discount_type, plans]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    let { value } = e.target; // Make value mutable for potential conversion

    const fieldsForNumeralConversion = ['phone', 'whatsapp', 'discount_amount', 'paid_amount'];

    if (fieldsForNumeralConversion.includes(name)) {
      value = arabicToEnglishNumerals(value);
    }
    
    if (name === 'paid_amount' || name === 'discount_amount') {
      // Ensure that even after conversion, we attempt to parse it as a float.
      // The arabicToEnglishNumerals function returns a string.
      const numValue = parseFloat(value) || 0;
      setFormData(prev => ({ // Use functional update for safety
        ...prev,
        [name]: numValue,
      }));
    } else {
      setFormData(prev => ({ // Use functional update for safety
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // حساب تواريخ البداية والنهاية
    let startDate = new Date().toISOString().split('T')[0];
    let endDate = '';
    
    if (formData.duration_type === 'preset' && formData.plan_id) {
      const selectedPlan = plans.find(p => p.id.toString() === formData.plan_id);
      if (selectedPlan) {
        endDate = calculateEndDate(startDate, selectedPlan.duration_days);
      }
    } else {
      startDate = formData.custom_start_date;
      endDate = formData.custom_end_date;
    }

    const data = new FormData();
    data.append('company_name', formData.company_name);
    data.append('phone', formData.phone);
    data.append('whatsapp', formData.whatsapp);
    data.append('services', formData.services);
    data.append('selected_icon', formData.selected_icon);
    data.append('plan_id', formData.plan_id || '1');
    data.append('start_date', startDate);
    data.append('end_date', endDate);
    data.append('base_price', formData.base_price.toString());
    data.append('discount_type', formData.discount_type);
    data.append('discount_amount', formData.discount_amount.toString());
    data.append('total_amount', formData.total_amount.toString());
    data.append('paid_amount', formData.paid_amount.toString());

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/admin/advertisers`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('تم إضافة المعلن بنجاح');
      router.push('/admin/dashboard?tab=advertisers');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'خطأ في إضافة المعلن');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>إضافة معلن جديد - لوحة التحكم</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gradient">إضافة معلن جديد</h1>
              <Link href="/admin/dashboard?tab=advertisers">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <FaArrowLeft />
                  <span>العودة للمعلنين</span>
                </motion.button>
              </Link>
            </div>
          </div>
        </header>

        {/* Form */}
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-3xl mx-auto"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Name */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  <FaBuilding className="inline ml-2" /> اسم الشركة
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="اسم شركة نقل العفش"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Phone */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    <FaPhone className="inline ml-2" /> رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="05XXXXXXXX"
                    dir="ltr"
                  />
                </div>
                {/* WhatsApp */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    <FaWhatsapp className="inline ml-2" /> رقم الواتساب (اختياري)
                  </label>
                  <input
                    type="tel"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="05XXXXXXXX"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Services */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  <FaListAlt className="inline ml-2" /> الخدمات المقدمة
                </label>
                <textarea
                  name="services"
                  value={formData.services}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                  placeholder="مثال: نقل عفش، فك وتركيب، تغليف احترافي..."
                />
              </div>

              {/* Existing Advertisers List */}
              <div className="col-span-1 md:col-span-2 my-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="text-md font-semibold text-gray-700 mb-3 border-b pb-2">
                  <FaListAlt className="inline ml-2 text-primary-600" />
                  المعلنون المسجلون حالياً (للمراجعة السريعة)
                </h3>
                {loadingExisting ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : existingAdvertisers.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4 text-center">لا يوجد معلنون مسجلون حالياً.</p>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-2">
                    <ul className="space-y-2">
                      {existingAdvertisers.map(adv => (
                        <li key={adv.id} className="text-sm p-2.5 border rounded-md bg-white shadow-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <strong className="text-gray-800">{adv.company_name}</strong>
                              <span className="text-gray-500 block sm:inline sm:mr-2 text-xs">({adv.phone})</span>
                            </div>
                            {adv.icon_url && typeof adv.icon_url === 'string' &&
                              React.createElement(
                                availableIcons.find(i => i.name === adv.icon_url)?.icon || FaBuilding,
                                { className: `w-5 h-5 ${availableIcons.find(i => i.name === adv.icon_url)?.color || 'text-gray-400'}` }
                              )
                            }
                          </div>
                          {adv.services && <p className="text-xs text-gray-600 mt-1 truncate" title={adv.services}>{adv.services}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  اختر أيقونة الشركة
                </label>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                  {availableIcons.map((iconItem) => {
                    const IconComponent = iconItem.icon;
                    return (
                      <motion.button
                        key={iconItem.name}
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFormData({ ...formData, selected_icon: iconItem.name })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.selected_icon === iconItem.name
                            ? 'border-primary-500 bg-primary-50 shadow-lg'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <IconComponent className={`text-2xl ${iconItem.color}`} />
                      </motion.button>
                    );
                  })}
                </div>
              </div>


              {/* Package/Plan Selection */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  <FaBox className="inline ml-2" /> اختر الباقة
                </label>
                
                {/* Duration Type Toggle */}
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="duration_type"
                      value="preset"
                      checked={formData.duration_type === 'preset'}
                      onChange={handleInputChange}
                      className="ml-2"
                    />
                    <span>باقة محددة مسبقاً</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="duration_type"
                      value="custom"
                      checked={formData.duration_type === 'custom'}
                      onChange={handleInputChange}
                      className="ml-2"
                    />
                    <span>تحديد مدة مخصصة</span>
                  </label>
                </div>

                {formData.duration_type === 'preset' ? (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {plans.map((plan) => (
                        <motion.div
                          key={plan.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              plan_id: plan.id.toString(),
                              base_price: plan.price
                            });
                          }}
                          className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                            formData.plan_id === plan.id.toString()
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
                    
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 text-sm mb-1">تاريخ البداية</label>
                      <input
                        type="date"
                        name="custom_start_date"
                        value={formData.custom_start_date}
                        onChange={handleInputChange}
                        required={formData.duration_type === 'custom'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm mb-1">تاريخ النهاية</label>
                      <input
                        type="date"
                        name="custom_end_date"
                        value={formData.custom_end_date}
                        onChange={handleInputChange}
                        required={formData.duration_type === 'custom'}
                        min={formData.custom_start_date}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Discount Section */}
              <div className="bg-yellow-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FaMoneyBillWave className="ml-2 text-yellow-600" /> الخصم (اختياري)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">نوع الخصم</label>
                    <select
                      name="discount_type"
                      value={formData.discount_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    >
                      <option value="amount">مبلغ ثابت</option>
                      <option value="percentage">نسبة مئوية</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      {formData.discount_type === 'amount' ? 'قيمة الخصم (ريال)' : 'نسبة الخصم (%)'}
                    </label>
                    <input
                      type="number"
                      name="discount_amount"
                      value={formData.discount_amount}
                      onChange={handleInputChange}
                      min="0"
                      max={formData.discount_type === 'percentage' ? 100 : formData.base_price}
                      step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                {/* عرض تأثير الخصم */}
                {formData.discount_amount > 0 && (
                  <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">قيمة الخصم: </span>
                      {formData.discount_type === 'amount'
                        ? `${formData.discount_amount} ريال`
                        : `${formData.discount_amount}% = ${Math.round((formData.base_price * formData.discount_amount) / 100)} ريال`
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Information */}
              <div className="bg-blue-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FaMoneyBillWave className="ml-2 text-blue-600" /> معلومات الدفع
                </h3>
                
                {/* ملخص الحساب */}
                <div className="bg-white rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-600">السعر الأساسي:</span>
                    <span className="font-semibold text-gray-800">{formData.base_price} ريال</span>
                  </div>
                  
                  {formData.discount_amount > 0 && (
                    <div className="flex justify-between items-center pb-3 border-b text-green-600">
                      <span>الخصم:</span>
                      <span className="font-semibold">
                        -{formData.discount_type === 'amount'
                          ? `${formData.discount_amount}`
                          : `${Math.round((formData.base_price * formData.discount_amount) / 100)}`
                        } ريال
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-gray-800">المجموع:</span>
                    <span className="text-primary-600">{formData.total_amount} ريال</span>
                  </div>
                </div>
                
                {/* المبلغ المدفوع */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">المبلغ المدفوع</label>
                  <input
                    type="number"
                    name="paid_amount"
                    value={formData.paid_amount}
                    onChange={handleInputChange}
                    min="0"
                    max={formData.total_amount}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="0"
                  />
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700">المبلغ المتبقي:</span>
                    <span className="text-2xl font-bold text-red-600">{formData.total_amount - formData.paid_amount} ريال</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
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
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <FaSave />
                    <span>حفظ المعلن</span>
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