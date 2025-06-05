import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FaUsers, FaFileInvoice, FaChartLine, FaBell, 
  FaSignOutAlt, FaPlus, FaEye, FaEdit, FaTrash,
  FaCheckCircle, FaClock, FaTimesCircle, FaMoneyBillWave
} from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Statistics {
  totalAdvertisers: { count: number };
  activeSubscriptions: { count: number };
  totalRevenue: { total: number };
  pendingRequests: { count: number };
}

interface Advertiser {
  id: string;
  company_name: string;
  phone: string;
  email?: string;
  status: string;
  created_at: string;
  total_subscriptions?: number;
  active_subscriptions?: number;
  total_amount?: number;
  paid_amount?: number;
  remaining_amount?: number;
}

interface AdRequest {
  id: string;
  company_name: string;
  contact_name: string;
  phone: string;
  email?: string;
  whatsapp?: string;
  plan_name?: string;
  price?: number;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [adRequests, setAdRequests] = useState<AdRequest[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, advertisersRes, requestsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/statistics/dashboard`, { headers }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/advertisers`, { headers }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/ad-requests`, { headers })
      ]);

      setStatistics(statsRes.data);
      setAdvertisers(advertisersRes.data);
      setAdRequests(requestsRes.data.filter((req: AdRequest) => req.status === 'pending'));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('خطأ في تحميل البيانات');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/admin/login');
  };

  const handleDeleteAdvertiser = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المعلن؟')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/advertisers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('تم حذف المعلن بنجاح');
      fetchData();
    } catch (error) {
      toast.error('خطأ في حذف المعلن');
    }
  };

  const handleUpdateRequestStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/ad-requests/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('تم تحديث حالة الطلب');
      fetchData();
    } catch (error) {
      toast.error('خطأ في تحديث الطلب');
    }
  };

  const StatCard = ({ icon: Icon, title, value, color }: any) => (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`w-16 h-16 ${color} rounded-full flex items-center justify-center text-white text-2xl`}>
          <Icon />
        </div>
      </div>
    </motion.div>
  );

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
        <title>لوحة التحكم - دليل شركات نقل العفش</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gradient">لوحة التحكم</h1>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors"
              >
                <FaSignOutAlt />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-2 border-b-2 transition-colors ${
                  activeTab === 'overview' 
                    ? 'border-primary-500 text-primary-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                نظرة عامة
              </button>
              <button
                onClick={() => setActiveTab('advertisers')}
                className={`py-4 px-2 border-b-2 transition-colors ${
                  activeTab === 'advertisers' 
                    ? 'border-primary-500 text-primary-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                المعلنين
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`py-4 px-2 border-b-2 transition-colors ${
                  activeTab === 'invoices'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                الفواتير
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-4 px-2 border-b-2 transition-colors relative ${
                  activeTab === 'requests'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                طلبات الإعلان
                {adRequests.length > 0 && (
                  <span className="absolute -top-1 -left-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {adRequests.length}
                  </span>
                )}
              </button>
              <Link href="/admin/plans">
                <button
                  className={`py-4 px-2 border-b-2 transition-colors ${
                    false
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  خطط الأسعار
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  icon={FaUsers}
                  title="إجمالي المعلنين"
                  value={statistics?.totalAdvertisers.count || 0}
                  color="bg-primary-500"
                />
                <StatCard
                  icon={FaCheckCircle}
                  title="الاشتراكات النشطة"
                  value={statistics?.activeSubscriptions.count || 0}
                  color="bg-green-500"
                />
                <StatCard
                  icon={FaMoneyBillWave}
                  title="إجمالي الإيرادات"
                  value={`${statistics?.totalRevenue.total || 0} ريال`}
                  color="bg-secondary-500"
                />
                <StatCard
                  icon={FaBell}
                  title="طلبات معلقة"
                  value={statistics?.pendingRequests.count || 0}
                  color="bg-accent-500"
                />
              </div>

              {/* Recent Advertisers */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">أحدث المعلنين</h2>
                  <Link href="/admin/advertisers/new">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      className="btn-primary flex items-center gap-2"
                    >
                      <FaPlus />
                      <span>إضافة معلن</span>
                    </motion.button>
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-3 px-4">الشركة</th>
                        <th className="text-right py-3 px-4">الهاتف</th>
                        <th className="text-right py-3 px-4">الحالة</th>
                        <th className="text-right py-3 px-4">الاشتراكات</th>
                        <th className="text-right py-3 px-4">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advertisers.slice(0, 5).map((advertiser) => (
                        <tr key={advertiser.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{advertiser.company_name}</td>
                          <td className="py-3 px-4">{advertiser.phone}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              advertiser.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {advertiser.status === 'active' ? 'نشط' : 'غير نشط'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {advertiser.active_subscriptions || 0} / {advertiser.total_subscriptions || 0}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Link href={`/admin/advertisers/${advertiser.id}`}>
                                <button className="text-blue-600 hover:text-blue-800">
                                  <FaEye />
                                </button>
                              </Link>
                              <Link href={`/admin/advertisers/${advertiser.id}/edit`}>
                                <button className="text-green-600 hover:text-green-800">
                                  <FaEdit />
                                </button>
                              </Link>
                              <button
                                onClick={() => handleDeleteAdvertiser(advertiser.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'advertisers' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">جميع المعلنين</h2>
                  <Link href="/admin/advertisers/new">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      className="btn-primary flex items-center gap-2"
                    >
                      <FaPlus />
                      <span>إضافة معلن</span>
                    </motion.button>
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-3 px-4">الشركة</th>
                        <th className="text-right py-3 px-4">الهاتف</th>
                        <th className="text-right py-3 px-4">البريد</th>
                        <th className="text-right py-3 px-4">الحالة</th>
                        <th className="text-right py-3 px-4">تاريخ التسجيل</th>
                        <th className="text-right py-3 px-4">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advertisers.map((advertiser) => (
                        <tr key={advertiser.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{advertiser.company_name}</td>
                          <td className="py-3 px-4">{advertiser.phone}</td>
                          <td className="py-3 px-4">{advertiser.email || '-'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              advertiser.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {advertiser.status === 'active' ? 'نشط' : 'غير نشط'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {format(new Date(advertiser.created_at), 'dd/MM/yyyy', { locale: ar })}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Link href={`/admin/advertisers/${advertiser.id}`}>
                                <button className="text-blue-600 hover:text-blue-800">
                                  <FaEye />
                                </button>
                              </Link>
                              <Link href={`/admin/advertisers/${advertiser.id}/edit`}>
                                <button className="text-green-600 hover:text-green-800">
                                  <FaEdit />
                                </button>
                              </Link>
                              <button
                                onClick={() => handleDeleteAdvertiser(advertiser.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'invoices' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">إدارة الفواتير</h2>
                  <Link href="/admin/invoices">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      className="btn-primary flex items-center gap-2"
                    >
                      <FaFileInvoice />
                      <span>عرض جميع الفواتير</span>
                    </motion.button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600 mb-1">إجمالي المدفوعات</p>
                    <p className="text-2xl font-bold text-green-800">
                      {statistics?.totalRevenue.total || 0} ريال
                    </p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-sm text-yellow-600 mb-1">المبالغ المعلقة</p>
                    <p className="text-2xl font-bold text-yellow-800">
                      {advertisers.reduce((sum, adv) => sum + (adv.remaining_amount || 0), 0)} ريال
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600 mb-1">عدد الفواتير</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {advertisers.reduce((sum, adv) => sum + (adv.total_subscriptions || 0), 0)}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-3 px-4">المعلن</th>
                        <th className="text-right py-3 px-4">إجمالي المبلغ</th>
                        <th className="text-right py-3 px-4">المدفوع</th>
                        <th className="text-right py-3 px-4">المتبقي</th>
                        <th className="text-right py-3 px-4">الحالة</th>
                        <th className="text-right py-3 px-4">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advertisers.filter(adv => (adv.total_amount || 0) > 0).slice(0, 10).map((advertiser) => (
                        <tr key={advertiser.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{advertiser.company_name}</td>
                          <td className="py-3 px-4">{advertiser.total_amount || 0} ريال</td>
                          <td className="py-3 px-4 text-green-600">{advertiser.paid_amount || 0} ريال</td>
                          <td className="py-3 px-4 text-red-600">{advertiser.remaining_amount || 0} ريال</td>
                          <td className="py-3 px-4">
                            {advertiser.remaining_amount === 0 && (advertiser.total_amount || 0) > 0 ? (
                              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                مدفوع بالكامل
                              </span>
                            ) : (advertiser.paid_amount || 0) > 0 ? (
                              <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                                دفع جزئي
                              </span>
                            ) : (advertiser.total_amount || 0) > 0 ? (
                              <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                غير مدفوع
                              </span>
                            ) : null}
                          </td>
                          <td className="py-3 px-4">
                            <Link href={`/admin/advertisers/${advertiser.id}/invoices`}>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                className="text-primary-600 hover:text-primary-700"
                              >
                                <FaEye />
                              </motion.button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'requests' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">طلبات الإعلان المعلقة</h2>
                  <Link href="/admin/ad-requests">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                    >
                      <FaEye />
                      <span>عرض جميع الطلبات</span>
                    </motion.button>
                  </Link>
                </div>

                {adRequests.filter(r => r.status === 'pending').length === 0 ? (
                  <p className="text-center text-gray-500 py-8">لا توجد طلبات معلقة</p>
                ) : (
                  <div className="space-y-4">
                    {adRequests.filter(r => r.status === 'pending').slice(0, 5).map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg">{request.company_name}</h3>
                            <p className="text-gray-600">المسؤول: {request.contact_name}</p>
                            <p className="text-gray-600">الهاتف: {request.phone}</p>
                            {request.whatsapp && <p className="text-gray-600">واتساب: {request.whatsapp}</p>}
                            <p className="text-primary-600 font-semibold mt-2">
                              الخطة: {request.plan_name} - {request.price} ريال
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Link href={`/admin/ad-requests/${request.id}`}>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                title="عرض التفاصيل"
                              >
                                <FaEye />
                              </motion.button>
                            </Link>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              onClick={() => router.push(`/admin/ad-requests/${request.id}/convert`)}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                            >
                              <FaCheckCircle />
                              <span>قبول</span>
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              onClick={() => handleUpdateRequestStatus(request.id, 'rejected')}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                            >
                              <FaTimesCircle />
                              <span>رفض</span>
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {adRequests.filter(r => r.status === 'pending').length > 5 && (
                      <div className="text-center pt-4">
                        <Link href="/admin/ad-requests">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            عرض المزيد من الطلبات...
                          </motion.button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}