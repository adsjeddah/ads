import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FaArrowLeft, 
  FaSave, 
  FaBuilding, 
  FaPhone, 
  FaListAlt, 
  FaWhatsapp,
  FaTruck, FaBoxes, FaHome, FaDolly, FaShippingFast, FaWarehouse, 
  FaHandshake, FaTools, FaPeopleCarry, FaRoute, FaClock, 
  FaShieldAlt, FaAward, FaStar, FaMapMarkedAlt, FaHeadset, 
  FaUserTie, FaClipboardCheck, FaTruckLoading, FaBoxOpen,
  FaBroom, FaSprayCan, FaBrush, FaWater, FaTint, FaWrench, 
  FaBug, FaLeaf, FaShower, FaToilet, FaSoap, FaTrash, 
  FaRecycle, FaHammer, FaFaucet
} from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function EditAdvertiserSimple() {
  const router = useRouter();
  const { id } = router.query;
  
  const [formData, setFormData] = useState({
    company_name: '',
    phone: '',
    whatsapp: '',
    services: '',
    selected_icon: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sector, setSector] = useState<string>('');

  // جميع الأيقونات المتاحة
  const allIcons = [
    // نقل العفش
    { icon: FaTruck, name: 'truck', color: 'text-blue-600', category: 'movers' },
    { icon: FaBoxes, name: 'boxes', color: 'text-amber-600', category: 'movers' },
    { icon: FaHome, name: 'home', color: 'text-green-600', category: 'all' },
    { icon: FaDolly, name: 'dolly', color: 'text-purple-600', category: 'movers' },
    { icon: FaShippingFast, name: 'shipping-fast', color: 'text-red-600', category: 'movers' },
    { icon: FaWarehouse, name: 'warehouse', color: 'text-indigo-600', category: 'movers' },
    { icon: FaHandshake, name: 'handshake', color: 'text-teal-600', category: 'all' },
    { icon: FaPeopleCarry, name: 'people-carry', color: 'text-pink-600', category: 'movers' },
    { icon: FaRoute, name: 'route', color: 'text-cyan-600', category: 'movers' },
    { icon: FaBoxOpen, name: 'box-open', color: 'text-amber-700', category: 'movers' },
    { icon: FaTruckLoading, name: 'truck-loading', color: 'text-red-700', category: 'movers' },
    { icon: FaMapMarkedAlt, name: 'map-marked-alt', color: 'text-green-500', category: 'all' },
    // النظافة
    { icon: FaBroom, name: 'broom', color: 'text-green-600', category: 'cleaning' },
    { icon: FaSprayCan, name: 'spray-can', color: 'text-blue-600', category: 'cleaning' },
    { icon: FaBrush, name: 'brush', color: 'text-purple-600', category: 'cleaning' },
    { icon: FaSoap, name: 'soap', color: 'text-pink-600', category: 'cleaning' },
    { icon: FaShower, name: 'shower', color: 'text-cyan-600', category: 'cleaning' },
    { icon: FaToilet, name: 'toilet', color: 'text-indigo-600', category: 'cleaning' },
    { icon: FaTrash, name: 'trash', color: 'text-gray-600', category: 'cleaning' },
    { icon: FaRecycle, name: 'recycle', color: 'text-green-500', category: 'cleaning' },
    // كشف تسربات
    { icon: FaTint, name: 'tint', color: 'text-blue-600', category: 'water-leaks' },
    { icon: FaWater, name: 'water', color: 'text-cyan-600', category: 'water-leaks' },
    { icon: FaFaucet, name: 'faucet', color: 'text-blue-500', category: 'water-leaks' },
    { icon: FaWrench, name: 'wrench', color: 'text-orange-600', category: 'all' },
    { icon: FaHammer, name: 'hammer', color: 'text-red-600', category: 'all' },
    // مكافحة حشرات
    { icon: FaBug, name: 'bug', color: 'text-red-600', category: 'pest-control' },
    { icon: FaLeaf, name: 'leaf', color: 'text-green-500', category: 'pest-control' },
    // عامة
    { icon: FaClock, name: 'clock', color: 'text-yellow-600', category: 'all' },
    { icon: FaShieldAlt, name: 'shield-alt', color: 'text-gray-600', category: 'all' },
    { icon: FaAward, name: 'award', color: 'text-yellow-500', category: 'all' },
    { icon: FaStar, name: 'star', color: 'text-yellow-400', category: 'all' },
    { icon: FaHeadset, name: 'headset', color: 'text-blue-500', category: 'all' },
    { icon: FaUserTie, name: 'user-tie', color: 'text-gray-700', category: 'all' },
    { icon: FaClipboardCheck, name: 'clipboard-check', color: 'text-green-700', category: 'all' },
    { icon: FaTools, name: 'tools', color: 'text-orange-600', category: 'all' },
  ];

  // فلترة الأيقونات حسب القطاع
  const getFilteredIcons = () => {
    if (!sector) return allIcons;
    return allIcons.filter(icon => icon.category === sector || icon.category === 'all');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/admin/login';
      return;
    }
    
    if (id) {
      fetchAdvertiserData();
    }
  }, [id]);

  const fetchAdvertiserData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await axios.get(`${apiUrl}/advertisers/${id}`, { headers });
      const advertiser = response.data;
      
      if (!advertiser) {
        toast.error('لم يتم العثور على المعلن');
        router.push('/admin/dashboard?tab=advertisers');
        return;
      }
      
      setFormData({
        company_name: advertiser.company_name || '',
        phone: advertiser.phone || '',
        whatsapp: advertiser.whatsapp || '',
        services: advertiser.services || '',
        selected_icon: advertiser.icon_url || ''
      });
      
      setSector(advertiser.sector || '');
      
    } catch (error: any) {
      console.error('Error fetching advertiser:', error);
      toast.error('خطأ في تحميل بيانات المعلن');
      router.push('/admin/dashboard?tab=advertisers');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_name || !formData.phone) {
      toast.error('اسم الشركة والهاتف مطلوبان');
      return;
    }
    
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      // تحديث البيانات الأساسية فقط
      const updateData = {
        company_name: formData.company_name,
        phone: formData.phone,
        whatsapp: formData.whatsapp || null,
        services: formData.services || null,
        icon_url: formData.selected_icon || null
      };
      
      await axios.put(`${apiUrl}/advertisers/${id}`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      toast.success('تم تحديث بيانات المعلن بنجاح! ✅');
      
      // الانتقال لصفحة عرض المعلن
      setTimeout(() => {
        router.push(`/admin/advertisers/${id}`);
      }, 1000);
      
    } catch (error: any) {
      console.error('Error updating advertiser:', error);
      toast.error(error.response?.data?.error || 'خطأ في تحديث بيانات المعلن');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>تعديل بيانات المعلن - {formData.company_name}</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gradient">تعديل بيانات المعلن</h1>
              <Link href={`/admin/advertisers/${id}`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <FaArrowLeft />
                  <span>العودة</span>
                </motion.button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white rounded-xl shadow-lg p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* اسم الشركة */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <FaBuilding className="inline ml-2" />
                    اسم الشركة <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="مثال: شركة النقل السريع"
                  />
                </div>

                {/* رقم الهاتف */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <FaPhone className="inline ml-2" />
                    رقم الهاتف <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                  />
                </div>

                {/* واتساب */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <FaWhatsapp className="inline ml-2" />
                    رقم الواتساب (اختياري)
                  </label>
                  <input
                    type="tel"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                  />
                </div>

                {/* وصف الخدمات */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <FaListAlt className="inline ml-2" />
                    وصف الخدمات (اختياري)
                  </label>
                  <textarea
                    name="services"
                    value={formData.services}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="مثال: نقل العفش، تغليف، فك وتركيب، تخزين"
                  />
                </div>

                {/* اختيار الأيقونة */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    اختر الأيقونة
                  </label>
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                    {getFilteredIcons().map((iconItem) => {
                      const IconComponent = iconItem.icon;
                      const isSelected = formData.selected_icon === iconItem.name;
                      
                      return (
                        <motion.div
                          key={iconItem.name}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setFormData(prev => ({ ...prev, selected_icon: iconItem.name }))}
                          className={`
                            w-16 h-16 rounded-xl flex items-center justify-center cursor-pointer transition-all
                            ${isSelected 
                              ? 'bg-gradient-to-br from-primary-500 to-secondary-500 shadow-lg ring-4 ring-primary-300' 
                              : 'bg-gray-100 hover:bg-gray-200'
                            }
                          `}
                        >
                          <IconComponent 
                            className={`text-3xl ${isSelected ? 'text-white' : iconItem.color}`} 
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                  {formData.selected_icon && (
                    <p className="text-sm text-gray-600 mt-3">
                      الأيقونة المختارة: <span className="font-semibold">{formData.selected_icon}</span>
                    </p>
                  )}
                </div>

                {/* الأزرار */}
                <div className="flex gap-4 pt-6 border-t">
                  <Link href={`/admin/advertisers/${id}`} className="flex-1">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                    >
                      إلغاء
                    </motion.button>
                  </Link>
                  
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <FaSave />
                    {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </motion.button>
                </div>
              </form>
            </div>

            {/* معلومات إضافية */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">ℹ️ ملاحظة مهمة:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• التعديلات ستظهر تلقائياً في جميع الأماكن المرتبطة بالمعلن</li>
                <li>• الفواتير والاشتراكات ستعكس التغييرات تلقائياً</li>
                <li>• لا تحتاج لتحديث أي شيء آخر يدوياً</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

