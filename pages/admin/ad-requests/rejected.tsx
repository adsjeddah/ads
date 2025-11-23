/**
 * صفحة الإعلانات المرفوضة
 * عرض جميع طلبات الإعلان التي تم رفضها
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaTimes, FaArrowLeft, FaCalendarAlt, FaUser, FaBuilding, FaPhone } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { formatDate, formatDateTime } from '@/lib/utils';

interface RejectedRequest {
  id: string;
  company_name: string;
  contact_name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  message?: string;
  created_at: any;
  rejected_at: any;
  rejection_reason?: string;
}

export default function RejectedAdRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState<RejectedRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
    } else {
      fetchRejectedRequests();
    }
  }, [router]);

  const fetchRejectedRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/ad-requests/rejected`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching rejected ad requests:', error);
      toast.error('خطأ في جلب الطلبات المرفوضة');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>الطلبات المرفوضة - لوحة التحكم</title>
        </Head>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>الطلبات المرفوضة - لوحة التحكم</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <button
                onClick={() => router.push('/admin/ad-requests')}
                className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors mb-4"
              >
                <FaArrowLeft />
                <span>العودة إلى طلبات الإعلان</span>
              </button>
              <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
                <FaTimes className="text-red-500" />
                الإعلانات المرفوضة
              </h1>
              <p className="text-gray-600 mt-2">
                {requests.length} طلب مرفوض
              </p>
            </motion.div>
          </div>

          {/* Content */}
          {requests.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-12 text-center"
            >
              <FaTimes className="mx-auto text-6xl text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">لا توجد طلبات مرفوضة</h2>
              <p className="text-gray-600">جميع الطلبات التي تم رفضها ستظهر هنا</p>
            </motion.div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wider">
                        اسم الشركة
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wider">
                        الاسم
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wider">
                        الهاتف
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wider">
                        تاريخ الإنشاء
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wider">
                        تاريخ الرفض
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wider">
                        سبب الرفض
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {requests.map((request, index) => (
                      <motion.tr
                        key={request.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FaBuilding className="text-red-500" />
                            <span className="font-semibold text-gray-900">{request.company_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FaUser className="text-gray-400" />
                            <span className="text-gray-700">{request.contact_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FaPhone className="text-green-500" />
                            <a 
                              href={`tel:${request.phone}`}
                              className="text-blue-600 hover:underline"
                            >
                              {request.phone}
                            </a>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-blue-500" />
                            <span className="text-sm text-gray-600">
                              {formatDate(request.created_at)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-red-500" />
                            <span className="text-sm text-gray-600">
                              {formatDateTime(request.rejected_at)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">
                            {request.rejection_reason || 'تم رفض الطلب'}
                          </span>
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

