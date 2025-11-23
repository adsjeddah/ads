import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowRight, FaEye, FaCheck, FaTimes, FaClock, FaBuilding, FaPhone, FaWhatsapp, FaCalendarAlt } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

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
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <FaClock className="text-xs" />
            قيد الانتظار
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <FaCheck className="text-xs" />
            موافق عليه
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <FaTimes className="text-xs" />
            مرفوض
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
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">طلبات المعلنين</h1>
                <p className="text-gray-600 mt-2">إدارة طلبات الإعلان الواردة من العملاء</p>
              </div>
              <div className="flex gap-3">
                <Link href="/admin/ad-requests/rejected">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <FaTimes />
                    الطلبات المرفوضة
                  </motion.button>
                </Link>
                <Link href="/admin/dashboard">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <FaArrowRight className="rotate-180" />
                    العودة للوحة التحكم
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              الكل ({requests.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              قيد الانتظار ({requests.filter(r => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'approved' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              موافق عليه ({requests.filter(r => r.status === 'approved').length})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الشركة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        المسؤول
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        التواصل
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الخطة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        التاريخ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الحالة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FaBuilding className="text-gray-400 ml-2" />
                            <div className="text-sm font-medium text-gray-900">
                              {request.company_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{request.contact_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${request.phone}`}
                              className="text-primary-600 hover:text-primary-800"
                              title="اتصال"
                            >
                              <FaPhone />
                            </a>
                            {request.whatsapp && (
                              <a
                                href={`https://wa.me/${request.whatsapp}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-800"
                                title="واتساب"
                              >
                                <FaWhatsapp />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{request.plan_name || `خطة ${request.plan_id}`}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <FaCalendarAlt className="ml-1" />
                            {new Date(request.created_at).toLocaleDateString('ar-SA')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/ad-requests/${request.id}`}>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="text-primary-600 hover:text-primary-900"
                                title="عرض التفاصيل"
                              >
                                <FaEye />
                              </motion.button>
                            </Link>
                            {request.status === 'pending' && (
                              <>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleStatusChange(request.id, 'approved')}
                                  className="text-green-600 hover:text-green-900"
                                  title="الموافقة وإضافة كمعلن"
                                >
                                  <FaCheck />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleStatusChange(request.id, 'rejected')}
                                  className="text-red-600 hover:text-red-900"
                                  title="رفض"
                                >
                                  <FaTimes />
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