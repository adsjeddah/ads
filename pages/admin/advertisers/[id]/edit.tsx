import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaArrowLeft, FaSave, FaBuilding, FaPhone, FaEnvelope, FaLock, FaImage, FaListAlt, FaWhatsapp, FaToggleOn, FaToggleOff, FaBox, FaMoneyBillWave,
  FaTruck, FaBoxes, FaHome, FaDolly, FaShippingFast, FaWarehouse, FaHandshake, FaTools, FaPeopleCarry, FaRoute, FaClock, FaShieldAlt, FaAward, FaStar, FaMapMarkedAlt, FaHeadset, FaUserTie, FaClipboardCheck, FaTruckLoading, FaBoxOpen
} from 'react-icons/fa'; // Added more icons for preset selection
import axios from 'axios';
import toast from 'react-hot-toast';

// Utility function to convert Arabic numerals to English numerals
const arabicToEnglishNumerals = (str: string): string => {
  if (typeof str !== 'string') return str;
  // Also handle Persian numerals just in case
  str = str.replace(/[۰۱۲۳۴۵۶۷۸۹]/g, (d) => (d.charCodeAt(0) - 1776).toString());
  return str.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => (d.charCodeAt(0) - 1632).toString());
};

interface IconDefinition {
  icon: React.ElementType;
  name: string;
  color: string;
}

// Available Icons (copied from new.tsx)
const availableIcons: IconDefinition[] = [
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

interface AdvertiserFormData {
  company_name: string;
  phone: string;
  whatsapp: string;
  // email: string; // Removed
  services: string;
  status: 'active' | 'inactive' | 'admin' | 'deleted';
  // icon?: File | null; // Removed - only preset icons
  selected_icon_name?: string; // For preset icon name
  // password?: string; // Removed
  include_vat?: boolean; // خيار إضافة ضريبة القيمة المضافة (15%)
  // Subscription fields
  plan_id: string;
  duration_type: 'preset' | 'custom';
  preset_duration: string; // Corresponds to plan_id if duration_type is 'preset'
  custom_start_date: string;
  custom_end_date: string;
  base_price: number;
  discount_amount: number;
  discount_type: 'amount' | 'percentage';
  total_amount: number;
  paid_amount: number;
}

interface Plan {
  id: number;
  name: string;
  duration_days: number;
  price: number;
  features?: string;
}

interface Subscription {
  id: number;
  plan_id: number;
  start_date: string;
  end_date: string;
  base_price: number;
  discount_type: 'amount' | 'percentage';
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  status: string;
  payment_status: string;
}

export default function EditAdvertiser() {
  const router = useRouter();
  const { id } = router.query;
  const [formData, setFormData] = useState<Partial<AdvertiserFormData>>({ // Made partial for initial load
    company_name: '',
    phone: '',
    whatsapp: '',
    // email: '', // Removed
    services: '',
    status: 'active',
    // icon: null, // Removed
    selected_icon_name: '', // Initialize
    // password: '', // Removed
    include_vat: false,
    plan_id: '',
    duration_type: 'preset',
    preset_duration: '',
    custom_start_date: '',
    custom_end_date: '',
    base_price: 0,
    discount_amount: 0,
    discount_type: 'amount',
    total_amount: 0,
    paid_amount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // const [previewIcon, setPreviewIcon] = useState<string | null>(null); // Removed
  const [currentIconUrl, setCurrentIconUrl] = useState<string | null>(null); // Still useful to know original icon
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    if (id) {
      fetchAdvertiserData();
    }
  }, [id, router]);

  const fetchAdvertiserData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    try {
      // Fetch plans first
      const plansResponse = await axios.get(`${apiUrl}/plans`, { headers });
      const uniquePlans = plansResponse.data.reduce((acc: any[], plan: any) => {
        const exists = acc.find(p => p.name === plan.name && p.price === plan.price);
        if (!exists) acc.push(plan);
        return acc;
      }, []);
      setPlans(uniquePlans);

      // Fetch advertiser data directly by ID
      const advertiserResponse = await axios.get(`${apiUrl}/advertisers/${id}`, { headers });
      const advertiser = advertiserResponse.data;

      if (!advertiser) {
        toast.error('لم يتم العثور على المعلن');
        router.push('/admin/dashboard?tab=advertisers');
        return;
      }

      // Fetch current active subscription for this advertiser
      const subscriptionsResponse = await axios.get(`${apiUrl}/subscriptions?advertiser_id=${id}`, { headers });
      const activeSubscriptions = subscriptionsResponse.data.filter((sub: Subscription) => sub.status === 'active');
      const latestActiveSubscription = activeSubscriptions.length > 0
        ? activeSubscriptions.sort((a: Subscription, b: Subscription) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0]
        : null;
      setCurrentSubscription(latestActiveSubscription);
      
      setFormData(prev => ({
        ...prev,
        company_name: advertiser.company_name || '',
        phone: advertiser.phone || '',
        whatsapp: advertiser.whatsapp || '',
        // email: advertiser.email || '', // Removed
        services: advertiser.services || '',
        status: advertiser.status || 'active',
        include_vat: advertiser.include_vat || false,
        // password: '', // Removed
        // Pre-fill subscription data if available
        plan_id: latestActiveSubscription?.plan_id?.toString() || (uniquePlans.length > 0 ? uniquePlans[0].id.toString() : ''),
        selected_icon_name: advertiser.icon_url && !advertiser.icon_url.startsWith('/uploads/') ? advertiser.icon_url : '', // If icon_url is not a path, assume it's a preset name
        duration_type: latestActiveSubscription ? 'preset' : 'preset',
        base_price: latestActiveSubscription?.base_price || 0,
        discount_amount: latestActiveSubscription?.discount_amount || 0,
        discount_type: latestActiveSubscription?.discount_type || 'amount',
        total_amount: latestActiveSubscription?.total_amount || 0,
        paid_amount: latestActiveSubscription?.paid_amount || 0,
        // Note: custom_start_date and custom_end_date are not pre-filled from existing subscription
        // as "editing" a subscription usually implies new terms or a new period.
      }));

      if (advertiser.icon_url) {
        // If icon_url is not a path (i.e., it's a preset name), it's handled by selected_icon_name prefill.
        // If it was an uploaded path, use it directly (Firebase Storage returns full URLs)
        if (advertiser.icon_url) {
           setCurrentIconUrl(advertiser.icon_url);
        }
      }
      
    } catch (error) {
      console.error("Error fetching data for edit:", error);
      toast.error('خطأ في تحميل بيانات المعلن أو الاشتراكات');
    } finally {
      setLoading(false);
    }
  };

  // The new handleInputChange with numeral conversion is below, this old/duplicate section is removed.
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    let { value } = e.target; // Make value mutable
    const type = e.target.type; // Get type for numeric parsing

    const fieldsForNumeralConversion = ['phone', 'whatsapp', 'discount_amount', 'paid_amount'];

    if (fieldsForNumeralConversion.includes(name)) {
      value = arabicToEnglishNumerals(value);
    }
    
    // Handle parsing for number types, excluding phone/whatsapp which are kept as strings after conversion
    if (type === 'number' && name !== 'phone' && name !== 'whatsapp') {
      setFormData(prev => ({
        ...prev,
        // For number inputs, if value is empty string after conversion, treat as 0 or allow empty if schema supports
        // parseFloat('') is NaN. parseFloat(' ') is NaN.
        // Let's ensure it becomes a valid number or an empty string if that's intended for clearing.
        // For simplicity, let's default to 0 if parsing fails or empty, but allow empty string to clear.
        [name]: value === '' ? '' : (parseFloat(value) || 0)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };
 
  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { // Removed
  //   if (e.target.files && e.target.files[0]) {
  //     const file = e.target.files[0];
  //     // setFormData({ ...formData, icon: file }); // icon field removed from formData
  //     // setPreviewIcon(URL.createObjectURL(file)); // previewIcon state removed
  //   }
  // };
  
  const toggleStatus = () => {
    setFormData(prev => ({
      ...prev,
      status: prev.status === 'active' ? 'inactive' : 'active'
    }));
  };

  // Financial Calculation Logic (ported from new.tsx)
  const calculateDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateTotalAmount = () => {
    let newBasePrice = 0;
    
    // Ensure formData and plans are populated before calculating
    if (!formData.duration_type || !formData.plan_id || plans.length === 0) {
      // If critical data is missing, maybe set defaults or wait
      // For now, let's ensure it doesn't crash if plans aren't loaded
      // or if plan_id is not yet set from an existing subscription.
      const initialPlan = plans.find(p => p.id.toString() === formData.plan_id);
      newBasePrice = initialPlan?.price || formData.base_price || 0; // Use existing base_price if plan not found yet
    } else if (formData.duration_type === 'preset') {
      const selectedPlanObj = plans.find(p => p.id.toString() === formData.plan_id);
      newBasePrice = selectedPlanObj?.price || 0;
    } else if (formData.duration_type === 'custom' && formData.custom_start_date && formData.custom_end_date) {
      const days = calculateDays(formData.custom_start_date, formData.custom_end_date);
      newBasePrice = Math.round((800 / 30) * days);
    }
    
    let discountValue = 0;
    if (formData.discount_type === 'amount') {
      discountValue = formData.discount_amount || 0;
    } else if (formData.discount_type === 'percentage') {
      discountValue = (newBasePrice * (formData.discount_amount || 0)) / 100;
    }
    
    let newTotalAmount = Math.max(0, newBasePrice - discountValue);
    
    // إضافة ضريبة القيمة المضافة إذا تم تفعيلها
    if (formData.include_vat) {
      const vatAmount = newTotalAmount * 0.15; // 15%
      newTotalAmount = newTotalAmount + vatAmount;
    }
    
    newTotalAmount = Math.round(newTotalAmount * 100) / 100; // تقريب إلى منزلتين عشريتين
    
    // Only update if values have actually changed to prevent infinite loops if not careful with useEffect
    if (newBasePrice !== formData.base_price || newTotalAmount !== formData.total_amount) {
      setFormData(prev => ({
        ...prev,
        base_price: newBasePrice,
        total_amount: newTotalAmount,
      }));
    }
  };

  useEffect(() => {
    if (!loading && plans.length > 0) {
        calculateTotalAmount();
    }
  }, [
    formData.duration_type,
    formData.plan_id,
    formData.custom_start_date,
    formData.custom_end_date,
    formData.discount_amount,
    formData.discount_type,
    formData.include_vat,
    plans,
    loading
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('token');

    // 1. Update Advertiser Profile Data
    const advertiserProfileData = new FormData();
    advertiserProfileData.append('company_name', formData.company_name || '');
    advertiserProfileData.append('phone', formData.phone || '');
    advertiserProfileData.append('whatsapp', formData.whatsapp || '');
    // advertiserProfileData.append('email', formData.email || ''); // Removed
    advertiserProfileData.append('services', formData.services || '');
    advertiserProfileData.append('status', formData.status || 'active');
    advertiserProfileData.append('include_vat', String(formData.include_vat || false));
    // Password field and its related logic are fully removed.
    
    // Icon handling: only selected_icon_name is now relevant from formData
    if (formData.selected_icon_name && formData.selected_icon_name.trim() !== '') {
      advertiserProfileData.append('selected_icon_name', formData.selected_icon_name);
    }
    // If formData.selected_icon_name is empty or undefined, nothing is sent for the icon.
    // The backend PUT /api/admin/advertisers/:id is already set up to only update icon_url
    // if selected_icon_name (or a file, which is now removed from this form) is provided.
    // This means if no new preset icon is selected, the existing icon on the server will be preserved.

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      await axios.put(`${apiUrl}/advertisers/${id}`, advertiserProfileData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('تم تحديث بيانات المعلن بنجاح');

      // 2. Handle Subscription: Create a new subscription if details are present and valid
      // This assumes "editing" subscription details means creating a new one.
      // The backend POST /api/admin/subscriptions should handle deactivating old active subscriptions.
      
      let newSubscriptionStartDate = '';
      let newSubscriptionEndDate = '';

      if (formData.duration_type === 'preset' && formData.plan_id && plans.length > 0) {
        const plan = plans.find(p => p.id.toString() === formData.plan_id);
        if (plan) {
          newSubscriptionStartDate = formData.custom_start_date || new Date().toISOString().split('T')[0]; // Default to today or custom
          const endDateObj = new Date(newSubscriptionStartDate);
          endDateObj.setDate(endDateObj.getDate() + plan.duration_days);
          newSubscriptionEndDate = endDateObj.toISOString().split('T')[0];
        }
      } else if (formData.duration_type === 'custom' && formData.custom_start_date && formData.custom_end_date) {
        newSubscriptionStartDate = formData.custom_start_date;
        newSubscriptionEndDate = formData.custom_end_date;
      }
      
      // Check if there's enough data to create/update a subscription
      // A simple check: if a plan is selected or custom dates are set.
      const hasSubscriptionData = formData.plan_id || (formData.custom_start_date && formData.custom_end_date);

      if (hasSubscriptionData && newSubscriptionStartDate && newSubscriptionEndDate) {
        const subscriptionPayload = {
          advertiser_id: id,
          plan_id: formData.plan_id || '1', // Default if not set, though UI should ensure it
          start_date: newSubscriptionStartDate,
          end_date: newSubscriptionEndDate,
          base_price: formData.base_price || 0,
          discount_type: formData.discount_type || 'amount',
          discount_amount: formData.discount_amount || 0,
          total_amount: formData.total_amount || 0,
          paid_amount: formData.paid_amount || 0,
        };

        await axios.post(`${apiUrl}/subscriptions`, subscriptionPayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('تم حفظ/تحديث بيانات الاشتراك بنجاح');
      }
      
      router.push(`/admin/advertisers/${id}`);

    } catch (error: any) {
      console.error("Error in handleSubmit:", error);
      const errorMessage = error.response?.data?.error || error.message || 'خطأ في حفظ التعديلات';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div></div>;
  }

  return (
    <>
      <Head>
        <title>تعديل المعلن: {formData.company_name} - لوحة التحكم</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gradient">تعديل: {formData.company_name}</h1>
              <Link href={`/admin/advertisers/${id}`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <FaArrowLeft />
                  <span>العودة للتفاصيل</span>
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
                    dir="ltr"
                  />
                </div>
                {/* WhatsApp */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    <FaWhatsapp className="inline ml-2" /> رقم الواتساب
                  </label>
                  <input
                    type="tel"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Email and Password fields are removed as per user request */}
              
              {/* Status Toggle */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  الحالة
                </label>
                <button
                  type="button"
                  onClick={toggleStatus}
                  className={`w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    formData.status === 'active' 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  {formData.status === 'active' ? <FaToggleOn /> : <FaToggleOff />}
                  <span>{formData.status === 'active' ? 'نشط' : 'غير نشط'}</span>
                </button>
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
                />
              </div>

              {/* Icon Selection (Enhanced) */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  <FaImage className="inline ml-2" /> أيقونة الشركة
                </label>
                <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-600 mb-2">اختر أيقونة جاهزة:</p>
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                    {availableIcons.map((iconItem) => {
                      const IconComponent = iconItem.icon;
                      return (
                        <motion.button
                          key={iconItem.name}
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, selected_icon_name: iconItem.name }));
                            // setPreviewIcon(null); // Removed
                            // setCurrentIconUrl(null); // Optionally clear current server icon preview
                          }}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            formData.selected_icon_name === iconItem.name
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

                {/* Custom file upload removed */}
                
                 {/* Preview for selected preset icon */}
                 {formData.selected_icon_name && (() => {
                  const selectedIconDetails = availableIcons.find(i => i.name === formData.selected_icon_name);
                  if (selectedIconDetails) {
                    const IconComp = selectedIconDetails.icon;
                    return (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-1">الأيقونة المختارة:</p>
                        <div className={`w-24 h-24 flex items-center justify-center rounded-lg shadow-md border-2 border-primary-500 bg-primary-50`}>
                           <IconComp className={`text-5xl ${selectedIconDetails.color}`} />
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

{/* --- Subscription Management UI (Ported from new.tsx) --- */}

              {/* Package/Plan Selection */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  <FaBox className="inline ml-2" /> الباقة الحالية/الجديدة
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
                            setFormData(prev => ({
                              ...prev,
                              plan_id: plan.id.toString(),
                              // base_price will be updated by calculateTotalAmount via useEffect
                            }));
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
                      <label className="block text-gray-600 text-sm mb-1">تاريخ البداية المقترح</label>
                      <input
                        type="date"
                        name="custom_start_date"
                        value={formData.custom_start_date || ''}
                        onChange={handleInputChange}
                        required={formData.duration_type === 'custom'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm mb-1">تاريخ النهاية المقترح</label>
                      <input
                        type="date"
                        name="custom_end_date"
                        value={formData.custom_end_date || ''}
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
                      value={formData.discount_type || 'amount'}
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
                      value={formData.discount_amount || 0}
                      onChange={handleInputChange}
                      min="0"
                      max={formData.discount_type === 'percentage' ? 100 : (formData.base_price || 0)}
                      step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                {(formData.discount_amount || 0) > 0 && (
                  <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">قيمة الخصم: </span>
                      {formData.discount_type === 'amount'
                        ? `${formData.discount_amount || 0} ريال`
                        : `${formData.discount_amount || 0}% = ${Math.round(((formData.base_price || 0) * (formData.discount_amount || 0)) / 100)} ريال`
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
                    checked={formData.include_vat || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, include_vat: e.target.checked }))}
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2 ml-3"
                  />
                  <span className="text-gray-700">
                    إضافة ضريبة القيمة المضافة (15%)
                  </span>
                </label>
                
                {formData.include_vat && (
                  <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">قيمة الضريبة: </span>
                      {Math.round((formData.total_amount || 0) / 1.15 * 0.15 * 100) / 100} ريال (15%)
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Information */}
              <div className="bg-blue-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FaMoneyBillWave className="ml-2 text-blue-600" /> معلومات الدفع للاشتراك الجديد/المعدل
                </h3>
                
                <div className="bg-white rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-600">السعر الأساسي:</span>
                    <span className="font-semibold text-gray-800">{formData.base_price || 0} ريال</span>
                  </div>
                  
                  {(formData.discount_amount || 0) > 0 && (
                    <div className="flex justify-between items-center pb-3 border-b text-green-600">
                      <span>الخصم:</span>
                      <span className="font-semibold">
                        -{formData.discount_type === 'amount'
                          ? `${formData.discount_amount || 0}`
                          : `${Math.round(((formData.base_price || 0) * (formData.discount_amount || 0)) / 100)}`
                        } ريال
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-gray-800">المجموع:</span>
                    <span className="text-primary-600">{formData.total_amount || 0} ريال</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">المبلغ المدفوع (للاشتراك الجديد/المعدل)</label>
                  <input
                    type="number"
                    name="paid_amount"
                    value={formData.paid_amount || 0}
                    onChange={handleInputChange}
                    min="0"
                    max={formData.total_amount || 0}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="0"
                  />
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700">المبلغ المتبقي:</span>
                    <span className="text-2xl font-bold text-red-600">{(formData.total_amount || 0) - (formData.paid_amount || 0)} ريال</span>
                  </div>
                </div>
              </div>
              {/* --- End of Subscription Management UI --- */}

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={saving}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                  saving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:shadow-xl'
                }`}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <FaSave />
                    <span>حفظ التعديلات</span>
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