import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaPhone,
  FaMapMarkerAlt,
  FaDesktop,
  FaMobileAlt,
  FaTabletAlt,
  FaChrome,
  FaSafari,
  FaFirefox,
  FaEdge,
  FaGlobe,
  FaClock,
  FaCalendarAlt,
  FaEye,
  FaMousePointer,
  FaChartLine,
  FaFilter,
  FaDownload
} from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Advertiser {
  id: string;
  company_name: string;
  phone: string;
}

interface CallDetail {
  timestamp: any;
  phone?: string;
  ip_address?: string;
  country?: string;
  city?: string;
  region?: string;
  isp?: string;
  device_type?: string;
  device_vendor?: string;
  device_model?: string;
  os?: string;
  browser?: string;
  browser_version?: string;
  page_url?: string;
  referrer?: string;
  screen_resolution?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  session_id?: string;
  time_on_page?: number;
  is_returning_visitor?: boolean;
  previous_visits?: number;
}

interface Statistics {
  id: string;
  date: any;
  views: number;
  clicks: number;
  calls: number;
  click_details?: any[];
  call_details?: CallDetail[];
}

export default function AdvertiserStatistics() {
  const router = useRouter();
  const { id } = router.query;
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [statistics, setStatistics] = useState<Statistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // آخر 30 يوم
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterDevice, setFilterDevice] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/admin/login';
      return;
    }
    
    if (router.isReady && id && id !== 'undefined') {
      fetchData();
    }
  }, [id, router.isReady, selectedPeriod]);

  const fetchData = async () => {
    if (!id || id === 'undefined') {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const [advertiserRes, statsRes] = await Promise.all([
        axios.get(`${apiUrl}/advertisers/${id}`, { headers }),
        axios.get(`${apiUrl}/advertisers/${id}/statistics`, { 
          headers,
          params: { days: selectedPeriod }
        })
      ]);

      setAdvertiser(advertiserRes.data);
      setStatistics(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  // دمج جميع تفاصيل المكالمات من كل الأيام
  const allCallDetails = statistics.flatMap(stat => 
    (stat.call_details || []).map(call => ({
      ...call,
      date: stat.date
    }))
  );

  // فلترة تفاصيل المكالمات
  const filteredCallDetails = allCallDetails.filter(call => {
    if (filterCity !== 'all' && call.city !== filterCity) return false;
    if (filterDevice !== 'all' && call.device_type !== filterDevice) return false;
    if (filterSource !== 'all' && call.utm_source !== filterSource) return false;
    return true;
  });

  // احصائيات سريعة
  const totalCalls = allCallDetails.length;
  const uniqueCities = Array.from(new Set(allCallDetails.map(c => c.city).filter(Boolean)));
  const mobileCount = allCallDetails.filter(c => c.device_type === 'Mobile').length;
  const desktopCount = allCallDetails.filter(c => c.device_type === 'Desktop').length;
  const googleAdsCount = allCallDetails.filter(c => c.utm_source === 'google' || c.utm_medium === 'cpc').length;

  // دالة لتنسيق التاريخ والوقت
  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'dd/MM/yyyy - hh:mm:ss a', { locale: ar });
    } catch {
      return 'N/A';
    }
  };

  // دالة لتنسيق الوقت فقط
  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'hh:mm:ss a', { locale: ar });
    } catch {
      return 'N/A';
    }
  };

  // دالة لتحديد أيقونة الجهاز
  const getDeviceIcon = (deviceType: string | undefined) => {
    switch (deviceType) {
      case 'Mobile': return <FaMobileAlt className="text-blue-500" />;
      case 'Desktop': return <FaDesktop className="text-green-500" />;
      case 'Tablet': return <FaTabletAlt className="text-purple-500" />;
      default: return <FaGlobe className="text-gray-500" />;
    }
  };

  // دالة لتحديد أيقونة المتصفح
  const getBrowserIcon = (browser: string | undefined) => {
    if (!browser) return <FaGlobe className="text-gray-400" />;
    if (browser.includes('Chrome')) return <FaChrome className="text-yellow-500" />;
    if (browser.includes('Safari')) return <FaSafari className="text-blue-400" />;
    if (browser.includes('Firefox')) return <FaFirefox className="text-orange-500" />;
    if (browser.includes('Edge')) return <FaEdge className="text-blue-600" />;
    return <FaGlobe className="text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
      </div>
    );
  }

  if (!advertiser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-red-500">
        لم يتم العثور على المعلن
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>إحصائيات تفصيلية - {advertiser.company_name}</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href={`/admin/advertisers/${id}`}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-4"
              >
                <FaArrowLeft />
                <span>العودة</span>
              </motion.button>
            </Link>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                📊 إحصائيات تفصيلية
              </h1>
              <p className="text-xl text-gray-600">{advertiser.company_name}</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">إجمالي المكالمات</p>
                  <p className="text-4xl font-bold mt-2">{totalCalls}</p>
                </div>
                <FaPhone className="text-5xl opacity-20" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">من الموبايل</p>
                  <p className="text-4xl font-bold mt-2">{mobileCount}</p>
                  <p className="text-sm text-blue-100 mt-1">
                    {totalCalls > 0 ? Math.round((mobileCount / totalCalls) * 100) : 0}%
                  </p>
                </div>
                <FaMobileAlt className="text-5xl opacity-20" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">من Google Ads</p>
                  <p className="text-4xl font-bold mt-2">{googleAdsCount}</p>
                  <p className="text-sm text-green-100 mt-1">
                    {totalCalls > 0 ? Math.round((googleAdsCount / totalCalls) * 100) : 0}%
                  </p>
                </div>
                <FaChartLine className="text-5xl opacity-20" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">مدن مختلفة</p>
                  <p className="text-4xl font-bold mt-2">{uniqueCities.length}</p>
                </div>
                <FaMapMarkerAlt className="text-5xl opacity-20" />
              </div>
            </motion.div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <FaFilter className="text-primary-500" />
              <h2 className="text-xl font-bold text-gray-800">الفلاتر</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الفترة الزمنية
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="7">آخر 7 أيام</option>
                  <option value="30">آخر 30 يوم</option>
                  <option value="90">آخر 90 يوم</option>
                  <option value="365">السنة الماضية</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المدينة
                </label>
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">جميع المدن</option>
                  {uniqueCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع الجهاز
                </label>
                <select
                  value={filterDevice}
                  onChange={(e) => setFilterDevice(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">جميع الأجهزة</option>
                  <option value="Mobile">موبايل</option>
                  <option value="Desktop">كمبيوتر</option>
                  <option value="Tablet">تابلت</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  مصدر الزيارة
                </label>
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">جميع المصادر</option>
                  <option value="google">Google</option>
                  <option value="facebook">Facebook</option>
                  <option value="twitter">Twitter</option>
                  <option value="instagram">Instagram</option>
                </select>
              </div>
            </div>
          </div>

          {/* Call Details Table */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FaPhone className="text-primary-500" />
                <h2 className="text-xl font-bold text-gray-800">
                  تفاصيل المكالمات ({filteredCallDetails.length})
                </h2>
              </div>

              <button className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                <FaDownload />
                <span>تصدير Excel</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-right py-3 px-3 text-sm font-semibold text-gray-700">التاريخ والوقت</th>
                    <th className="text-right py-3 px-3 text-sm font-semibold text-gray-700">الموقع</th>
                    <th className="text-right py-3 px-3 text-sm font-semibold text-gray-700">الجهاز</th>
                    <th className="text-right py-3 px-3 text-sm font-semibold text-gray-700">المتصفح</th>
                    <th className="text-right py-3 px-3 text-sm font-semibold text-gray-700">المصدر</th>
                    <th className="text-right py-3 px-3 text-sm font-semibold text-gray-700">الحملة</th>
                    <th className="text-right py-3 px-3 text-sm font-semibold text-gray-700">الوقت في الصفحة</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCallDetails.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        لا توجد مكالمات في الفترة المحددة
                      </td>
                    </tr>
                  ) : (
                    filteredCallDetails.map((call, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-3 text-sm">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800">
                              {formatTime(call.timestamp)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(
                                call.timestamp?.toDate ? call.timestamp.toDate() : new Date(call.timestamp),
                                'dd/MM/yyyy',
                                { locale: ar }
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-sm">
                          <div className="flex items-center gap-2">
                            <FaMapMarkerAlt className="text-red-500" />
                            <div className="flex flex-col">
                              <span className="font-semibold">{call.city || 'غير محدد'}</span>
                              <span className="text-xs text-gray-500">{call.country || ''}</span>
                              {call.isp && (
                                <span className="text-xs text-gray-400">({call.isp})</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-sm">
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(call.device_type)}
                            <div className="flex flex-col">
                              <span className="font-semibold">{call.device_type || 'غير محدد'}</span>
                              <span className="text-xs text-gray-500">{call.os || ''}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-sm">
                          <div className="flex items-center gap-2">
                            {getBrowserIcon(call.browser)}
                            <span>{call.browser || 'غير محدد'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-sm">
                          {call.utm_source ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {call.utm_source}
                            </span>
                          ) : call.referrer ? (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                              {call.referrer}
                            </span>
                          ) : (
                            <span className="text-gray-400">مباشر</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-sm">
                          {call.utm_campaign ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                              {call.utm_campaign}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-sm">
                          <div className="flex items-center gap-1">
                            <FaClock className="text-gray-400" />
                            <span>
                              {call.time_on_page 
                                ? `${call.time_on_page}ث`
                                : '-'
                              }
                            </span>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

