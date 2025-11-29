import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPhone,
  FaCalendarAlt,
  FaFilter,
  FaChartBar,
  FaDownload,
  FaEye,
  FaMousePointer,
  FaBuilding,
  FaMapMarkerAlt,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaChevronDown,
  FaChevronUp,
  FaExternalLinkAlt,
  FaMobileAlt,
  FaDesktop,
  FaTabletAlt,
  FaGlobe,
  FaClock,
  FaFilePdf,
  FaTrophy,
  FaExclamationTriangle
} from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface Summary {
  total_calls: number;
  total_views: number;
  total_clicks: number;
  avg_daily_calls: number;
  total_advertisers: number;
  period_days: number;
  top_advertiser: { id: string; name: string; calls: number } | null;
  least_advertiser: { id: string; name: string; calls: number } | null;
}

interface AdvertiserStat {
  advertiser_id: string;
  company_name: string;
  phone: string;
  city: string;
  sector: string;
  total_calls: number;
  total_views: number;
  total_clicks: number;
  call_details: any[];
  last_call_date: string | null;
}

interface ChartData {
  date: string;
  calls: number;
  views: number;
  clicks: number;
}

interface Breakdown {
  cities: { name: string; count: number }[];
  sectors: { name: string; count: number }[];
  devices: { name: string; count: number }[];
  sources: { name: string; count: number }[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const SECTORS_AR: Record<string, string> = {
  'movers': 'نقل عفش',
  'cleaning': 'نظافة',
  'pest-control': 'مكافحة حشرات',
  'water-leaks': 'كشف تسربات',
  'غير محدد': 'غير محدد'
};

const CITIES_AR: Record<string, string> = {
  'jeddah': 'جدة',
  'riyadh': 'الرياض',
  'dammam': 'الدمام',
  'makkah': 'مكة',
  'madinah': 'المدينة',
  'غير محدد': 'غير محدد'
};

export default function CallReports() {
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [advertisers, setAdvertisers] = useState<AdvertiserStat[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  
  // الفلاتر
  const [period, setPeriod] = useState('week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedSector, setSelectedSector] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // العرض
  const [expandedAdvertiser, setExpandedAdvertiser] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('area');
  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/admin/login';
      return;
    }
    
    fetchData();
  }, [period, customStartDate, customEndDate, selectedCity, selectedSector]);

  // التحديث التلقائي كل 10 ثواني
  useEffect(() => {
    if (!autoRefresh) return;
    
    const intervalId = setInterval(() => {
      fetchDataSilently();
    }, 10000); // كل 10 ثواني
    
    return () => clearInterval(intervalId);
  }, [autoRefresh, period, customStartDate, customEndDate, selectedCity, selectedSector]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params: any = { period };
      
      if (period === 'custom' && customStartDate && customEndDate) {
        params.start_date = customStartDate;
        params.end_date = customEndDate;
      }
      
      if (selectedCity !== 'all') params.city = selectedCity;
      if (selectedSector !== 'all') params.sector = selectedSector;

      const response = await axios.get('/api/reports/calls', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setSummary(response.data.data.summary);
        setAdvertisers(response.data.data.advertisers);
        setChartData(response.data.data.chart_data);
        setBreakdown(response.data.data.breakdown);
        setLastUpdated(new Date());
      }
    } catch (error: any) {
      console.error('Error fetching call reports:', error);
      toast.error('حدث خطأ في جلب التقارير');
    } finally {
      setLoading(false);
    }
  };

  // تحديث صامت بدون loading spinner (للتحديث التلقائي)
  const fetchDataSilently = async () => {
    if (isRefreshing) return; // تجنب الطلبات المتزامنة
    
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      const params: any = { period };
      
      if (period === 'custom' && customStartDate && customEndDate) {
        params.start_date = customStartDate;
        params.end_date = customEndDate;
      }
      
      if (selectedCity !== 'all') params.city = selectedCity;
      if (selectedSector !== 'all') params.sector = selectedSector;

      const response = await axios.get('/api/reports/calls', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        // مقارنة البيانات الجديدة مع القديمة لإظهار إشعار إذا كان هناك مكالمات جديدة
        const newTotalCalls = response.data.data.summary.total_calls;
        const oldTotalCalls = summary?.total_calls || 0;
        
        if (newTotalCalls > oldTotalCalls) {
          const newCalls = newTotalCalls - oldTotalCalls;
          toast.success(`📞 ${newCalls} مكالمة جديدة!`, {
            duration: 3000,
            position: 'top-center',
            icon: '🔔'
          });
        }
        
        setSummary(response.data.data.summary);
        setAdvertisers(response.data.data.advertisers);
        setChartData(response.data.data.chart_data);
        setBreakdown(response.data.data.breakdown);
        setLastUpdated(new Date());
      }
    } catch (error: any) {
      console.error('Error in silent refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // تصدير PDF
  const exportToPDF = async () => {
    toast.loading('جاري تجهيز ملف PDF...', { id: 'pdf-export' });
    
    try {
      // إنشاء نافذة طباعة مخصصة
      const printContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>تقرير المكالمات - ${format(new Date(), 'yyyy-MM-dd')}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Cairo', sans-serif; 
              padding: 40px;
              background: white;
              color: #1f2937;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #3B82F6;
            }
            .header h1 { color: #3B82F6; font-size: 28px; margin-bottom: 10px; }
            .header p { color: #6b7280; font-size: 14px; }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 30px;
            }
            .summary-card {
              background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
              padding: 20px;
              border-radius: 10px;
              text-align: center;
            }
            .summary-card h3 { font-size: 24px; color: #3B82F6; margin-bottom: 5px; }
            .summary-card p { font-size: 12px; color: #6b7280; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              padding: 12px;
              text-align: right;
              border-bottom: 1px solid #e5e7eb;
            }
            th {
              background: #3B82F6;
              color: white;
              font-weight: 600;
            }
            tr:nth-child(even) { background: #f9fafb; }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #9ca3af;
              font-size: 12px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            @media print {
              body { padding: 20px; }
              .summary-grid { grid-template-columns: repeat(2, 1fr); }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📞 تقرير المكالمات</h1>
            <p>الفترة: ${getPeriodLabel()} | تاريخ التقرير: ${format(new Date(), 'yyyy/MM/dd HH:mm', { locale: ar })}</p>
          </div>
          
          <div class="summary-grid">
            <div class="summary-card">
              <h3>${summary?.total_calls || 0}</h3>
              <p>إجمالي المكالمات</p>
            </div>
            <div class="summary-card">
              <h3>${summary?.avg_daily_calls || 0}</h3>
              <p>معدل يومي</p>
            </div>
            <div class="summary-card">
              <h3>${summary?.total_advertisers || 0}</h3>
              <p>عدد المعلنين</p>
            </div>
            <div class="summary-card">
              <h3>${summary?.total_views || 0}</h3>
              <p>إجمالي المشاهدات</p>
            </div>
          </div>
          
          <h2 style="margin-bottom: 15px; color: #374151;">📊 تفاصيل المعلنين</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>المعلن</th>
                <th>الهاتف</th>
                <th>المدينة</th>
                <th>القطاع</th>
                <th>المكالمات</th>
                <th>المشاهدات</th>
                <th>النقرات</th>
              </tr>
            </thead>
            <tbody>
              ${filteredAdvertisers.map((adv, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${adv.company_name}</td>
                  <td dir="ltr">${adv.phone}</td>
                  <td>${CITIES_AR[adv.city] || adv.city}</td>
                  <td>${SECTORS_AR[adv.sector] || adv.sector}</td>
                  <td><strong>${adv.total_calls}</strong></td>
                  <td>${adv.total_views}</td>
                  <td>${adv.total_clicks}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>تم إنشاء هذا التقرير بواسطة نظام بروكر للإعلانات</p>
            <p>prokr.net</p>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // انتظار تحميل الخطوط
        setTimeout(() => {
          printWindow.print();
          toast.success('تم فتح نافذة الطباعة', { id: 'pdf-export' });
        }, 500);
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('حدث خطأ في تصدير PDF', { id: 'pdf-export' });
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'day': return 'اليوم';
      case 'week': return 'آخر 7 أيام';
      case 'month': return 'آخر 30 يوم';
      case 'year': return 'آخر سنة';
      case 'custom': return `${customStartDate} - ${customEndDate}`;
      default: return 'آخر 7 أيام';
    }
  };

  // فلترة المعلنين حسب البحث
  const filteredAdvertisers = advertisers.filter(adv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      adv.company_name.toLowerCase().includes(query) ||
      adv.phone.includes(query) ||
      adv.city.toLowerCase().includes(query)
    );
  });

  // تنسيق التاريخ للرسم البياني
  const formatChartDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'MM/dd', { locale: ar });
    } catch {
      return dateStr;
    }
  };

  // أيقونة الجهاز
  const getDeviceIcon = (device: string) => {
    switch (device?.toLowerCase()) {
      case 'mobile': return <FaMobileAlt className="text-green-500" />;
      case 'desktop': return <FaDesktop className="text-blue-500" />;
      case 'tablet': return <FaTabletAlt className="text-purple-500" />;
      default: return <FaGlobe className="text-gray-500" />;
    }
  };

  if (loading && !summary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل التقارير...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>تقارير المكالمات | لوحة التحكم</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" ref={reportRef}>
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Link href="/admin/dashboard">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors"
                  >
                    <FaChevronDown className="rotate-90 text-gray-600" />
                  </motion.button>
                </Link>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FaPhone className="text-blue-500" />
                    تقارير المكالمات
                  </h1>
                  <p className="text-sm text-gray-500">{getPeriodLabel()}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* مؤشر التحديث اللحظي */}
                <div className="flex items-center gap-2">
                  {isRefreshing && (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {lastUpdated && (
                    <span className="text-xs text-gray-500 hidden md:inline">
                      آخر تحديث: {format(lastUpdated, 'HH:mm:ss', { locale: ar })}
                    </span>
                  )}
                </div>

                {/* زر التحديث اليدوي */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchData}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  title="تحديث البيانات"
                >
                  <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </motion.button>

                {/* زر التحديث التلقائي */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    autoRefresh 
                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                  title={autoRefresh ? 'إيقاف التحديث التلقائي' : 'تفعيل التحديث التلقائي'}
                >
                  {autoRefresh ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                      <span className="hidden md:inline text-sm">لحظي</span>
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                      <span className="hidden md:inline text-sm">متوقف</span>
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <FaFilter />
                  <span className="hidden sm:inline">فلترة</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={exportToPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  <FaFilePdf />
                  <span className="hidden sm:inline">تصدير PDF</span>
                </motion.button>
              </div>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-4 border-t">
                    {/* الفترة */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">الفترة</label>
                      <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="day">اليوم</option>
                        <option value="week">آخر 7 أيام</option>
                        <option value="month">آخر 30 يوم</option>
                        <option value="year">آخر سنة</option>
                        <option value="custom">تاريخ مخصص</option>
                      </select>
                    </div>

                    {/* تاريخ مخصص */}
                    {period === 'custom' && (
                      <>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">من</label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">إلى</label>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </>
                    )}

                    {/* المدينة */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">المدينة</label>
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">جميع المدن</option>
                        <option value="jeddah">جدة</option>
                        <option value="riyadh">الرياض</option>
                        <option value="dammam">الدمام</option>
                      </select>
                    </div>

                    {/* القطاع */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">القطاع</label>
                      <select
                        value={selectedSector}
                        onChange={(e) => setSelectedSector(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">جميع القطاعات</option>
                        <option value="movers">نقل عفش</option>
                        <option value="cleaning">نظافة</option>
                        <option value="pest-control">مكافحة حشرات</option>
                        <option value="water-leaks">كشف تسربات</option>
                      </select>
                    </div>

                    {/* البحث */}
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm text-gray-600 mb-1">بحث</label>
                      <input
                        type="text"
                        placeholder="اسم المعلن أو الهاتف..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* إجمالي المكالمات */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">إجمالي المكالمات</p>
                  <h3 className="text-3xl font-bold mt-1">{summary?.total_calls || 0}</h3>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <FaPhone className="text-2xl" />
                </div>
              </div>
            </motion.div>

            {/* المعدل اليومي */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">معدل يومي</p>
                  <h3 className="text-3xl font-bold mt-1">{summary?.avg_daily_calls || 0}</h3>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <FaChartBar className="text-2xl" />
                </div>
              </div>
            </motion.div>

            {/* الأكثر اتصالاً */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">الأكثر اتصالاً</p>
                  <h3 className="text-lg font-bold mt-1 truncate">
                    {summary?.top_advertiser?.name || '-'}
                  </h3>
                  <p className="text-amber-100 text-xs mt-1">
                    {summary?.top_advertiser?.calls || 0} مكالمة
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <FaTrophy className="text-2xl" />
                </div>
              </div>
            </motion.div>

            {/* الأقل اتصالاً */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl p-5 text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">الأقل اتصالاً</p>
                  <h3 className="text-lg font-bold mt-1 truncate">
                    {summary?.least_advertiser?.name || '-'}
                  </h3>
                  <p className="text-red-100 text-xs mt-1">
                    {summary?.least_advertiser?.calls || 0} مكالمة
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <FaExclamationTriangle className="text-2xl" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Chart Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FaChartBar className="text-blue-500" />
                اتجاه المكالمات
              </h2>
              <div className="flex gap-2">
                {(['area', 'line', 'bar'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      chartType === type
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type === 'area' ? 'مساحة' : type === 'line' ? 'خطي' : 'أعمدة'}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatChartDate}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontFamily: 'Cairo'
                      }}
                      labelFormatter={(label) => formatChartDate(label)}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="calls"
                      name="المكالمات"
                      stroke="#3B82F6"
                      fillOpacity={1}
                      fill="url(#callsGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="views"
                      name="المشاهدات"
                      stroke="#10B981"
                      fillOpacity={0.2}
                      fill="#10B981"
                      strokeWidth={2}
                    />
                  </AreaChart>
                ) : chartType === 'line' ? (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatChartDate}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                      labelFormatter={(label) => formatChartDate(label)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="calls"
                      name="المكالمات"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="views"
                      name="المشاهدات"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ fill: '#10B981' }}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatChartDate}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                      labelFormatter={(label) => formatChartDate(label)}
                    />
                    <Legend />
                    <Bar dataKey="calls" name="المكالمات" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="views" name="المشاهدات" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Breakdown Charts */}
          {breakdown && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* توزيع المدن */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-red-500" />
                  توزيع المكالمات حسب المدينة
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={breakdown.cities}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="name"
                        label={({ name, percent }) => `${CITIES_AR[name] || name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {breakdown.cities.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, CITIES_AR[name as string] || name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* توزيع القطاعات */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FaBuilding className="text-purple-500" />
                  توزيع المكالمات حسب القطاع
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={breakdown.sectors} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => SECTORS_AR[value] || value}
                        width={80}
                      />
                      <Tooltip formatter={(value, name) => [value, 'مكالمات']} />
                      <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          )}

          {/* Advertisers Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaBuilding />
                تفاصيل المعلنين ({filteredAdvertisers.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">#</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">المعلن</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase hidden sm:table-cell">الهاتف</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">المدينة</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">القطاع</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">المكالمات</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase hidden sm:table-cell">المشاهدات</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase hidden lg:table-cell">آخر مكالمة</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">تفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAdvertisers.map((adv, index) => (
                    <React.Fragment key={adv.advertiser_id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-4 py-4">
                          <Link href={`/admin/advertisers/${adv.advertiser_id}/statistics`}>
                            <span className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer flex items-center gap-1">
                              {adv.company_name}
                              <FaExternalLinkAlt className="text-xs opacity-50" />
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 hidden sm:table-cell" dir="ltr">
                          {adv.phone}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 hidden md:table-cell">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs">
                            <FaMapMarkerAlt className="text-red-400" />
                            {CITIES_AR[adv.city] || adv.city}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 hidden md:table-cell">
                          {SECTORS_AR[adv.sector] || adv.sector}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-bold">
                            <FaPhone className="text-xs" />
                            {adv.total_calls}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-sm text-gray-600 hidden sm:table-cell">
                          {adv.total_views}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500 hidden lg:table-cell">
                          {adv.last_call_date ? (
                            <span className="flex items-center gap-1">
                              <FaClock className="text-gray-400" />
                              {formatDistanceToNow(new Date(adv.last_call_date), { 
                                addSuffix: true, 
                                locale: ar 
                              })}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => setExpandedAdvertiser(
                              expandedAdvertiser === adv.advertiser_id ? null : adv.advertiser_id
                            )}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {expandedAdvertiser === adv.advertiser_id ? (
                              <FaChevronUp className="text-gray-500" />
                            ) : (
                              <FaChevronDown className="text-gray-500" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Call Details */}
                      <AnimatePresence>
                        {expandedAdvertiser === adv.advertiser_id && adv.call_details.length > 0 && (
                          <tr>
                            <td colSpan={9} className="px-4 py-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="bg-gray-50 rounded-lg p-4 my-2">
                                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <FaPhone className="text-blue-500" />
                                    تفاصيل المكالمات ({adv.call_details.length})
                                  </h4>
                                  <div className="max-h-64 overflow-y-auto">
                                    <table className="w-full text-sm">
                                      <thead className="bg-gray-200 sticky top-0">
                                        <tr>
                                          <th className="px-3 py-2 text-right">الوقت</th>
                                          <th className="px-3 py-2 text-right">الجهاز</th>
                                          <th className="px-3 py-2 text-right hidden sm:table-cell">المدينة</th>
                                          <th className="px-3 py-2 text-right hidden md:table-cell">المصدر</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200">
                                        {adv.call_details.slice(0, 20).map((call, idx) => (
                                          <tr key={idx} className="hover:bg-gray-100">
                                            <td className="px-3 py-2">
                                              {call.timestamp ? format(
                                                new Date(call.timestamp),
                                                'yyyy/MM/dd HH:mm',
                                                { locale: ar }
                                              ) : '-'}
                                            </td>
                                            <td className="px-3 py-2">
                                              <span className="flex items-center gap-1">
                                                {getDeviceIcon(call.device_type)}
                                                <span className="text-xs text-gray-500">
                                                  {call.device_type || 'غير معروف'}
                                                </span>
                                              </span>
                                            </td>
                                            <td className="px-3 py-2 hidden sm:table-cell">
                                              {call.city || '-'}
                                            </td>
                                            <td className="px-3 py-2 hidden md:table-cell">
                                              <span className={`px-2 py-1 rounded text-xs ${
                                                call.utm_source === 'google' 
                                                  ? 'bg-blue-100 text-blue-700'
                                                  : 'bg-gray-100 text-gray-600'
                                              }`}>
                                                {call.utm_source || 'direct'}
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  
                                  <div className="mt-3 pt-3 border-t flex justify-center">
                                    <Link href={`/admin/advertisers/${adv.advertiser_id}/statistics`}>
                                      <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                      >
                                        <FaChartBar />
                                        عرض الإحصائيات التفصيلية
                                        <FaExternalLinkAlt className="text-xs" />
                                      </motion.button>
                                    </Link>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))}

                  {filteredAdvertisers.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                        <FaPhone className="text-4xl mx-auto mb-3 text-gray-300" />
                        <p>لا توجد مكالمات في هذه الفترة</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
}

