import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowRight, FaEye, FaCheck, FaTimes, FaClock, FaBuilding, FaPhone, FaWhatsapp, FaCalendarAlt } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

interface AdRequest {
  id: number;
  company_name: string;
  contact_name: string;
  phone: string;
  whatsapp?: string;
  plan_id: number;
  plan_name?: string;
  message?: string;
  status: string;
  created_at: string;
}

export default function AdRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState<AdRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
    } else {
      fetchRequests();
    }
  }, [router]);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/ad-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ad requests:', error);
      toast.error('خطأ في جلب طلبات الإعلان');
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      await axios.put(`${apiUrl}/ad-requests/${requestId}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (newStatus === 'approved') {
        // Navigate to create advertiser page with pre-filled data
        router.push(`/admin/ad-requests/${requestId}/convert`);
      } else if (newStatus === 'rejected') {
        toast.success('تم رفض الطلب ونقله إلى الطلبات المرفوضة');
        fetchRequests();
      } else {
        toast.success('تم تحديث حالة الطلب');
        fetchRequests();
      }
    } catch (error) {
      console.error('Error updating request status:', error);
      toast.error('خطأ في تحديث حالة الطلب');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-0.5 md:gap-1 px-1.5 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-sm font-medium bg-yellow-100 text-yellow-800">
            <FaClock className="text-[8px] md:text-xs" />
            <span className="hidden sm:inline">انتظار</span>
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-0.5 md:gap-1 px-1.5 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-sm font-medium bg-green-100 text-green-800">
            <FaCheck className="text-[8px] md:text-xs" />
            <span className="hidden sm:inline">موافق</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-0.5 md:gap-1 px-1.5 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-sm font-medium bg-red-100 text-red-800">
            <FaTimes className="text-[8px] md:text-xs" />
            <span className="hidden sm:inline">مرفوض</span>
          </span>
        );
      default:
        return null;
    }
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  return (
    <>
      <Head>
        <title>طلبات المعلنين - لوحة التحكم</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
          {/* Header */}
          <div className="mb-4 md:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-gray-800">طلبات المعلنين</h1>
                <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">إدارة طلبات الإعلان الواردة</p>
              </div>
              <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                <Link href="/admin/ad-requests/rejected" className="flex-1 sm:flex-initial">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs md:text-sm"
                  >
                    <FaTimes />
                    <span className="hidden sm:inline">الطلبات المرفوضة</span>
                    <span className="sm:hidden">مرفوض</span>
                  </motion.button>
                </Link>
                <Link href="/admin/dashboard" className="flex-1 sm:flex-initial">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs md:text-sm"
                  >
                    <FaArrowRight className="rotate-180" />
                    <span className="hidden sm:inline">لوحة التحكم</span>
                    <span className="sm:hidden">رجوع</span>
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mb-4 md:mb-6 flex gap-1 md:gap-2 overflow-x-auto scrollbar-hide pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-xs md:text-sm ${
                filter === 'all' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              الكل ({requests.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-xs md:text-sm ${
                filter === 'pending' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              انتظار ({requests.filter(r => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-xs md:text-sm ${
                filter === 'approved' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              موافق ({requests.filter(r => r.status === 'approved').length})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-xs md:text-sm ${
                filter === 'rejected' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              مرفوض ({requests.filter(r => r.status === 'rejected').length})
            </button>
          </div>

          {/* Requests Table */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">لا توجد طلبات {filter !== 'all' && getStatusBadge(filter)}</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto -mx-2 md:mx-0">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-right text-[10px] md:text-xs font-medium text-gray-500 uppercase">
                        الشركة
                      </th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-right text-[10px] md:text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                        المسؤول
                      </th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-right text-[10px] md:text-xs font-medium text-gray-500 uppercase">
                        التواصل
                      </th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-right text-[10px] md:text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                        الخطة
                      </th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-right text-[10px] md:text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                        التاريخ
                      </th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-right text-[10px] md:text-xs font-medium text-gray-500 uppercase">
                        الحالة
                      </th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-right text-[10px] md:text-xs font-medium text-gray-500 uppercase">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests.map((request) => (
                      <motion.tr
                        key={request.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-2 md:px-4 py-2 md:py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FaBuilding className="text-gray-400 ml-1 md:ml-2 text-xs md:text-sm" />
                            <div className="text-xs md:text-sm font-medium text-gray-900 truncate max-w-[100px] md:max-w-none">
                              {request.company_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-4 whitespace-nowrap hidden sm:table-cell">
                          <div className="text-xs md:text-sm text-gray-900">{request.contact_name}</div>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 md:gap-2">
                            <a
                              href={`tel:${request.phone}`}
                              className="text-primary-600 hover:text-primary-800 p-1"
                              title="اتصال"
                            >
                              <FaPhone className="text-xs md:text-sm" />
                            </a>
                            {request.whatsapp && (
                              <a
                                href={`https://wa.me/${request.whatsapp}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-800 p-1"
                                title="واتساب"
                              >
                                <FaWhatsapp className="text-xs md:text-sm" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="text-xs md:text-sm text-gray-900">{request.plan_name || `خطة ${request.plan_id}`}</div>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-4 whitespace-nowrap hidden lg:table-cell">
                          <div className="flex items-center text-xs md:text-sm text-gray-500">
                            <FaCalendarAlt className="ml-1 text-xs" />
                            {formatDate(request.created_at)}
                          </div>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-4 whitespace-nowrap">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium">
                          <div className="flex items-center gap-1 md:gap-2">
                            <Link href={`/admin/ad-requests/${request.id}`}>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="text-primary-600 hover:text-primary-900 p-1"
                                title="عرض التفاصيل"
                              >
                                <FaEye className="text-sm md:text-base" />
                              </motion.button>
                            </Link>
                            {request.status === 'pending' && (
                              <>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleStatusChange(request.id, 'approved')}
                                  className="text-green-600 hover:text-green-900 p-1"
                                  title="الموافقة"
                                >
                                  <FaCheck className="text-sm md:text-base" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleStatusChange(request.id, 'rejected')}
                                  className="text-red-600 hover:text-red-900 p-1"
                                  title="رفض"
                                >
                                  <FaTimes className="text-sm md:text-base" />
                                </motion.button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}