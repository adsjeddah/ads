import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaSave, FaBuilding, FaPhone, FaListAlt, FaWhatsapp, FaCalendarAlt, FaMoneyBillWave, FaBox, FaTruck, FaBoxes, FaHome, FaDolly, FaShippingFast, FaWarehouse, FaHandshake, FaTools, FaPeopleCarry, FaRoute, FaClock, FaShieldAlt, FaAward, FaStar, FaMapMarkedAlt, FaHeadset, FaUserTie, FaClipboardCheck, FaTruckLoading, FaBoxOpen, FaBroom, FaSprayCan, FaBrush, FaWater, FaTint, FaWrench, FaBug, FaLeaf, FaShower, FaToilet, FaSoap, FaTrash, FaRecycle, FaHammer, FaFaucet } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import CoverageAndPackageSelector, { SelectedPackage } from '../../../components/admin/CoverageAndPackageSelector';
import SectorSelector, { SectorType } from '../../../components/admin/SectorSelector';
import { formatNumber, formatPrice, toEnglishNumerals } from '@/lib/utils/numbers';

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
    preset_duration: '30', // 7, 14, 30
    custom_start_date: '',
    custom_end_date: '',
    base_price: 0,
    discount_amount: 0,
    discount_type: 'amount', // 'amount' or 'percentage'
    include_vat: false, // إضافة ضريبة القيمة المضافة (15%)
    total_amount: 0,
    paid_amount: 0,
    // 🆕 تصنيف العملاء
    customer_type: 'new' as 'new' | 'trusted' | 'vip',
    payment_terms_days: 0, // مهلة الدفع بالأيام (للعملاء الموثوقين)
  });
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [existingAdvertisers, setExistingAdvertisers] = useState<ExistingAdvertiser[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  
  // 🆕 نظام القطاعات
  const [selectedSector, setSelectedSector] = useState<SectorType>(null);
  
  // 🆕 النظام الجديد: الباقات المتعددة
  const [selectedPackages, setSelectedPackages] = useState<SelectedPackage[]>([]);

  // 🆕 Handler للباقات - مثبت بـ useCallback لتجنب infinite loop
  const handlePackagesChange = useCallback((packages: SelectedPackage[]) => {
    setSelectedPackages(packages);
    
    // حساب المبلغ الكلي من جميع الباقات
    const totalBasePrice = packages.reduce((sum, pkg) => sum + pkg.plan.price, 0);
    setFormData(prev => ({
      ...prev,
      base_price: totalBasePrice,
    }));
  }, []);

  // أسعار ثابتة للمدد المختلفة (احتياطي في حالة عدم استخدام الخطط من قاعدة البيانات)
  // تحديث 2025: الأسعار الموحدة لجميع المدن والقطاعات
  const pricingPlans: { [key: string]: { name: string; price: number } } = {
    '7': { name: 'أسبوع', price: 400 },
    '14': { name: 'أسبوعين', price: 800 },
    '30': { name: 'شهر', price: 1500 }
  };

  // 🆕 دالة للحصول على الأيقونات المناسبة حسب القطاع
  const getIconsBySector = (sector: SectorType) => {
    const iconSets = {
      movers: [
    { icon: FaTruck, name: 'truck', color: 'text-blue-600' },
    { icon: FaBoxes, name: 'boxes', color: 'text-amber-600' },
    { icon: FaHome, name: 'home', color: 'text-green-600' },
    { icon: FaDolly, name: 'dolly', color: 'text-purple-600' },
    { icon: FaShippingFast, name: 'shipping-fast', color: 'text-red-600' },
    { icon: FaWarehouse, name: 'warehouse', color: 'text-indigo-600' },
    { icon: FaHandshake, name: 'handshake', color: 'text-teal-600' },
    { icon: FaPeopleCarry, name: 'people-carry', color: 'text-pink-600' },
    { icon: FaRoute, name: 'route', color: 'text-cyan-600' },
        { icon: FaBoxOpen, name: 'box-open', color: 'text-amber-700' },
        { icon: FaTruckLoading, name: 'truck-loading', color: 'text-red-700' },
        { icon: FaMapMarkedAlt, name: 'map-marked-alt', color: 'text-green-500' },
    { icon: FaClock, name: 'clock', color: 'text-yellow-600' },
    { icon: FaShieldAlt, name: 'shield-alt', color: 'text-gray-600' },
    { icon: FaAward, name: 'award', color: 'text-yellow-500' },
    { icon: FaStar, name: 'star', color: 'text-yellow-400' },
    { icon: FaHeadset, name: 'headset', color: 'text-blue-500' },
    { icon: FaUserTie, name: 'user-tie', color: 'text-gray-700' },
    { icon: FaClipboardCheck, name: 'clipboard-check', color: 'text-green-700' },
        { icon: FaTools, name: 'tools', color: 'text-orange-600' },
      ],
      cleaning: [
        { icon: FaBroom, name: 'broom', color: 'text-green-600' },
        { icon: FaSprayCan, name: 'spray-can', color: 'text-blue-600' },
        { icon: FaBrush, name: 'brush', color: 'text-purple-600' },
        { icon: FaSoap, name: 'soap', color: 'text-pink-600' },
        { icon: FaShower, name: 'shower', color: 'text-cyan-600' },
        { icon: FaToilet, name: 'toilet', color: 'text-indigo-600' },
        { icon: FaTrash, name: 'trash', color: 'text-gray-600' },
        { icon: FaRecycle, name: 'recycle', color: 'text-green-500' },
        { icon: FaHome, name: 'home', color: 'text-teal-600' },
        { icon: FaBuilding, name: 'building', color: 'text-blue-700' },
        { icon: FaShieldAlt, name: 'shield-alt', color: 'text-gray-600' },
        { icon: FaStar, name: 'star', color: 'text-yellow-400' },
        { icon: FaAward, name: 'award', color: 'text-yellow-500' },
        { icon: FaHeadset, name: 'headset', color: 'text-blue-500' },
        { icon: FaUserTie, name: 'user-tie', color: 'text-gray-700' },
        { icon: FaClock, name: 'clock', color: 'text-yellow-600' },
        { icon: FaHandshake, name: 'handshake', color: 'text-teal-600' },
        { icon: FaClipboardCheck, name: 'clipboard-check', color: 'text-green-700' },
      ],
      'water-leaks': [
        { icon: FaTint, name: 'tint', color: 'text-blue-600' },
        { icon: FaWater, name: 'water', color: 'text-cyan-600' },
        { icon: FaFaucet, name: 'faucet', color: 'text-blue-500' },
        { icon: FaWrench, name: 'wrench', color: 'text-orange-600' },
        { icon: FaTools, name: 'tools', color: 'text-amber-600' },
        { icon: FaHammer, name: 'hammer', color: 'text-red-600' },
        { icon: FaShower, name: 'shower', color: 'text-cyan-500' },
        { icon: FaToilet, name: 'toilet', color: 'text-indigo-600' },
        { icon: FaHome, name: 'home', color: 'text-green-600' },
        { icon: FaBuilding, name: 'building', color: 'text-blue-700' },
        { icon: FaShieldAlt, name: 'shield-alt', color: 'text-gray-600' },
        { icon: FaStar, name: 'star', color: 'text-yellow-400' },
        { icon: FaAward, name: 'award', color: 'text-yellow-500' },
        { icon: FaHeadset, name: 'headset', color: 'text-blue-500' },
        { icon: FaUserTie, name: 'user-tie', color: 'text-gray-700' },
        { icon: FaClock, name: 'clock', color: 'text-yellow-600' },
        { icon: FaHandshake, name: 'handshake', color: 'text-teal-600' },
        { icon: FaClipboardCheck, name: 'clipboard-check', color: 'text-green-700' },
      ],
      'pest-control': [
        { icon: FaBug, name: 'bug', color: 'text-red-600' },
        { icon: FaSprayCan, name: 'spray-can', color: 'text-green-600' },
        { icon: FaLeaf, name: 'leaf', color: 'text-green-500' },
        { icon: FaShieldAlt, name: 'shield-alt', color: 'text-blue-600' },
        { icon: FaTools, name: 'tools', color: 'text-orange-600' },
        { icon: FaHome, name: 'home', color: 'text-teal-600' },
        { icon: FaBuilding, name: 'building', color: 'text-blue-700' },
        { icon: FaWarehouse, name: 'warehouse', color: 'text-indigo-600' },
        { icon: FaStar, name: 'star', color: 'text-yellow-400' },
        { icon: FaAward, name: 'award', color: 'text-yellow-500' },
        { icon: FaHeadset, name: 'headset', color: 'text-blue-500' },
        { icon: FaUserTie, name: 'user-tie', color: 'text-gray-700' },
        { icon: FaClock, name: 'clock', color: 'text-yellow-600' },
        { icon: FaHandshake, name: 'handshake', color: 'text-teal-600' },
        { icon: FaClipboardCheck, name: 'clipboard-check', color: 'text-green-700' },
        { icon: FaMapMarkedAlt, name: 'map-marked-alt', color: 'text-green-500' },
      ],
    };

    return sector ? iconSets[sector] || [] : [];
  };

  // الأيقونات المتاحة حسب القطاع المختار
  const availableIcons = getIconsBySector(selectedSector);

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
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/advertisers`, {
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
    // 🆕 حساب السعر الأساسي من جميع الباقات المختارة
    let basePrice = selectedPackages.reduce((sum, pkg) => sum + pkg.plan.price, 0);
    
    // حساب الخصم
    let discountValue = 0;
    if (formData.discount_type === 'amount') {
      discountValue = formData.discount_amount;
    } else if (formData.discount_type === 'percentage') {
      discountValue = (basePrice * formData.discount_amount) / 100;
    }
    
    let totalAmount = Math.max(0, basePrice - discountValue);
    
    // إضافة ضريبة القيمة المضافة إذا تم تفعيلها
    if (formData.include_vat) {
      const vatAmount = totalAmount * 0.15; // 15%
      totalAmount = totalAmount + vatAmount;
    }
    
    totalAmount = Math.round(totalAmount * 100) / 100; // تقريب إلى منزلتين عشريتين
    
    setFormData(prev => ({
      ...prev,
      base_price: basePrice,
      total_amount: totalAmount
    }));
  };

  // 🆕 حساب المبلغ الكلي عند تغيير الباقات أو الخصم أو الضريبة
  useEffect(() => {
    calculateTotalAmount();
  }, [selectedPackages, formData.discount_amount, formData.discount_type, formData.include_vat]);

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
    
    // التحقق من اختيار القطاع
    if (!selectedSector) {
      toast.error('يرجى اختيار القطاع');
      return;
    }
    
    // التحقق من اختيار الباقات
    if (selectedPackages.length === 0) {
      toast.error('يرجى اختيار باقة واحدة على الأقل');
      return;
    }
    
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const startDate = new Date().toISOString().split('T')[0];

      // 🆕 تحديد coverage_type بناءً على الباقات المختارة
      let coverageType: 'kingdom' | 'city' | 'both' = 'kingdom';
      const hasKingdom = selectedPackages.some(pkg => pkg.coverage_type === 'kingdom');
      const hasCity = selectedPackages.some(pkg => pkg.coverage_type === 'city');
      
      if (hasKingdom && hasCity) {
        coverageType = 'both';
      } else if (hasCity) {
        coverageType = 'city';
      }

      // استخراج المدن المختارة
      const selectedCities = selectedPackages
        .filter(pkg => pkg.coverage_type === 'city' && pkg.city)
        .map(pkg => pkg.city as string);

      // بيانات المعلن الأساسية
    const advertiserData = {
      company_name: formData.company_name,
      phone: formData.phone,
      whatsapp: formData.whatsapp || null,
      services: formData.services || null,
      selected_icon: formData.selected_icon || null,
        status: 'active',
        
        // 🆕 القطاع
        sector: selectedSector,
        
        // 🆕 التغطية الجغرافية
        coverage_type: coverageType,
        coverage_cities: selectedCities.length > 0 ? selectedCities : null,
        
        // تصنيف العميل
        customer_type: formData.customer_type,
        is_trusted: formData.customer_type === 'trusted' || formData.customer_type === 'vip',
        payment_terms_days: formData.payment_terms_days,
        
        // الضريبة
        include_vat: formData.include_vat,
        
        // 🆕 الباقات المختارة (سيتم إنشاء اشتراك لكل باقة)
        packages: selectedPackages.map(pkg => ({
          plan_id: pkg.plan_id,
          coverage_type: pkg.coverage_type,
          city: pkg.city || null,
      start_date: startDate,
          end_date: calculateEndDate(startDate, pkg.plan.duration_days),
          base_price: pkg.plan.price,
      discount_type: formData.discount_type,
      discount_amount: formData.discount_amount,
      total_amount: formData.total_amount,
      paid_amount: formData.paid_amount,
        }))
    };

      // 🔍 Log للتحقق من البيانات المرسلة
      console.log('📤 إرسال بيانات المعلن:', {
        sector: advertiserData.sector,
        coverage_type: advertiserData.coverage_type,
        coverage_cities: advertiserData.coverage_cities,
        packages_count: advertiserData.packages.length
      });

      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/advertisers`, advertiserData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      toast.success('تم إضافة المعلن بنجاح مع جميع الباقات المختارة!');
      router.push('/admin/dashboard?tab=advertisers');
    } catch (error: any) {
      console.error('Error creating advertiser:', error);
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all english-numbers"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all english-numbers"
                    placeholder="05XXXXXXXX"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* 🆕 Customer Type - تصنيف العميل */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  <FaUserTie className="inline ml-2" /> تصنيف العميل
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div 
                    onClick={() => setFormData({ ...formData, customer_type: 'new', payment_terms_days: 0 })}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      formData.customer_type === 'new' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        formData.customer_type === 'new' 
                          ? 'border-blue-500 bg-blue-500' 
                          : 'border-gray-400'
                      }`}>
                        {formData.customer_type === 'new' && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                      <span className="font-semibold text-blue-700">عميل جديد</span>
                    </div>
                    <p className="text-xs text-gray-600">يجب الدفع لتفعيل الاشتراك</p>
                  </div>

                  <div 
                    onClick={() => setFormData({ ...formData, customer_type: 'trusted', payment_terms_days: 7 })}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      formData.customer_type === 'trusted' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        formData.customer_type === 'trusted' 
                          ? 'border-green-500 bg-green-500' 
                          : 'border-gray-400'
                      }`}>
                        {formData.customer_type === 'trusted' && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                      <span className="font-semibold text-green-700">عميل موثوق</span>
                    </div>
                    <p className="text-xs text-gray-600">مهلة دفع 7 أيام - تفعيل فوري</p>
                  </div>

                  <div 
                    onClick={() => setFormData({ ...formData, customer_type: 'vip', payment_terms_days: 14 })}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      formData.customer_type === 'vip' 
                        ? 'border-amber-500 bg-amber-50' 
                        : 'border-gray-300 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        formData.customer_type === 'vip' 
                          ? 'border-amber-500 bg-amber-500' 
                          : 'border-gray-400'
                      }`}>
                        {formData.customer_type === 'vip' && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                      <span className="font-semibold text-amber-700">⭐ عميل VIP</span>
                    </div>
                    <p className="text-xs text-gray-600">مهلة دفع 14 يوم - تفعيل فوري</p>
                  </div>
                </div>
                
                {/* معلومات إضافية حسب نوع العميل */}
                {formData.customer_type === 'new' && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                    ℹ️ العميل الجديد: يتطلب دفع ريال واحد على الأقل لتفعيل الاشتراك فوراً
                  </div>
                )}
                {formData.customer_type === 'trusted' && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm text-green-800">
                    ✅ العميل الموثوق: يتم تفعيل الاشتراك فوراً مع مهلة دفع 7 أيام
                  </div>
                )}
                {formData.customer_type === 'vip' && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-lg text-sm text-amber-800">
                    ⭐ العميل VIP: يتم تفعيل الاشتراك فوراً مع مهلة دفع 14 يوم وامتيازات خاصة
                  </div>
                )}
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

              {/* 🆕 Sector Selection - STEP 1 */}
              <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200 shadow-lg">
                <SectorSelector
                  selectedSector={selectedSector}
                  onSectorChange={setSelectedSector}
                />
              </div>

              {/* 🆕 Icon Selection - STEP 2 - يظهر فقط بعد اختيار القطاع */}
              {selectedSector && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-md"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 text-white font-bold text-lg shadow-lg">
                      2
                    </div>
              <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        اختر أيقونة مناسبة للشركة
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        اختر أيقونة تُمثل الشركة بشكل مناسب
                      </p>
                    </div>
                  </div>

                  {availableIcons.length > 0 ? (
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
                            className={`p-4 rounded-xl border-2 transition-all ${
                          formData.selected_icon === iconItem.name
                                ? 'border-primary-500 bg-primary-50 shadow-lg ring-2 ring-primary-200'
                                : 'border-gray-200 hover:border-primary-300 bg-white hover:shadow-md'
                        }`}
                      >
                        <IconComponent className={`text-2xl ${iconItem.color}`} />
                      </motion.button>
                    );
                  })}
                </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>لا توجد أيقونات متاحة لهذا القطاع</p>
              </div>
                  )}

                  {formData.selected_icon && (
                        <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4 text-center"
                    >
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold text-sm">
                        ✅ تم اختيار الأيقونة
                      </span>
                    </motion.div>
                  )}
                        </motion.div>
              )}

              {/* 🆕 Package/Plan Selection - STEP 3 & 4 - يظهر فقط بعد اختيار القطاع */}
              {selectedSector && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border-2 border-gray-200"
                >
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold text-lg shadow-lg">
                        3
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                          <FaBox className="text-primary-500" />
                          اختيار التغطية الجغرافية والباقات
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      حدد نوع التغطية المطلوبة ثم اختر الباقات المناسبة لقطاع <strong>{selectedSector === 'movers' ? 'نقل العفش' : selectedSector === 'cleaning' ? 'النظافة' : selectedSector === 'water-leaks' ? 'كشف تسربات المياه' : 'مكافحة الحشرات'}</strong>
                    </p>
                  </div>
                  
                  <CoverageAndPackageSelector
                    plans={plans}
                    onSelectionChange={handlePackagesChange}
                    sector={selectedSector}
                  />
                </motion.div>
              )}

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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all english-numbers"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                {/* عرض تأثير الخصم */}
                {formData.discount_amount > 0 && (
                  <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                    <p className="text-sm text-gray-700 english-numbers">
                      <span className="font-semibold">قيمة الخصم: </span>
                      {formData.discount_type === 'amount'
                        ? formatPrice(formData.discount_amount)
                        : `${formatNumber(formData.discount_amount)}% = ${formatPrice(Math.round((formData.base_price * formData.discount_amount) / 100))}`
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* VAT Section */}
              <div className="bg-purple-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FaMoneyBillWave className="ml-2 text-purple-600" /> ضريبة القيمة المضافة (اختياري)
                </h3>
                
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="include_vat"
                    checked={formData.include_vat}
                    onChange={(e) => setFormData({ ...formData, include_vat: e.target.checked })}
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2 ml-3"
                  />
                  <span className="text-gray-700">
                    إضافة ضريبة القيمة المضافة (15%)
                  </span>
                </label>
                
                {formData.include_vat && (
                  <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                    <p className="text-sm text-gray-700 english-numbers">
                      <span className="font-semibold">قيمة الضريبة: </span>
                      {formatPrice(Math.round((formData.total_amount / 1.15) * 0.15 * 100) / 100)} (15%)
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
                <div className="bg-white rounded-lg p-4 space-y-3 english-numbers">
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-600">السعر الأساسي:</span>
                    <span className="font-semibold text-gray-800">{formatPrice(formData.base_price)}</span>
                  </div>
                  
                  {formData.discount_amount > 0 && (
                    <div className="flex justify-between items-center pb-3 border-b text-green-600">
                      <span>الخصم:</span>
                      <span className="font-semibold">
                        -{formData.discount_type === 'amount'
                          ? formatPrice(formData.discount_amount)
                          : formatPrice(Math.round((formData.base_price * formData.discount_amount) / 100))
                        }
                      </span>
                    </div>
                  )}
                  
                  {formData.include_vat && (
                    <>
                      <div className="flex justify-between items-center pb-3 border-b">
                        <span className="text-gray-600">المبلغ قبل الضريبة:</span>
                        <span className="font-semibold text-gray-800">
                          {formatPrice(Math.round((formData.total_amount / 1.15) * 100) / 100)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b text-purple-600">
                        <span>ضريبة القيمة المضافة (15%):</span>
                        <span className="font-semibold">
                          +{formatPrice(Math.round((formData.total_amount / 1.15) * 0.15 * 100) / 100)}
                        </span>
                      </div>
                    </>
                  )}
                  
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-gray-800">المجموع {formData.include_vat ? 'شامل الضريبة' : ''}:</span>
                    <span className="text-primary-600">{formatPrice(formData.total_amount)}</span>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all english-numbers"
                    placeholder="0"
                  />
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center english-numbers">
                    <span className="text-lg font-semibold text-gray-700">المبلغ المتبقي:</span>
                    <span className="text-2xl font-bold text-red-600">{formatPrice(formData.total_amount - formData.paid_amount)}</span>
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