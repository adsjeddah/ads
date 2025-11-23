import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaBuilding, FaPhone, FaWhatsapp, FaUser, FaCalendarAlt, FaFileAlt, FaCheck, FaTimes, FaClock } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

interface AdRequest {
  id: number;
  company_name: string;
  contact_name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  plan_id: number;
  plan_name?: string;
  plan_price?: number;
  plan_duration?: number;
  message?: string;
  status: string;
  created_at: string;
}

export default function AdRequestDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [request, setRequest] = useState<AdRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/admin/login');
        return;
      }
    }
    if (id) {
      fetchRequest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchRequest = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await axios.get(`${apiUrl}/ad-requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequest(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ad request:', error);
      toast.error('خطأ في جلب تفاصيل الطلب');
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      await axios.put(`${apiUrl}/ad-requests/${id}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (newStatus === 'approved') {
        // Navigate to create advertiser page with pre-filled data
        router.push(`/admin/ad-requests/${id}/convert`);
      } else if (newStatus === 'rejected') {
        toast.success('تم رفض الطلب ونقله إلى الطلبات المرفوضة');
        router.push('/admin/ad-requests');
      } else {
        toast.success('تم تحديث حالة الطلب');
        fetchRequest();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <p className="text-gray-500">الطلب غير موجود</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>تفاصيل طلب الإعلان - {request.company_name}</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/admin/ad-requests">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
              >
                <FaArrowLeft />
                العودة لطلبات المعلنين
              </motion.button>
            </Link>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">تفاصيل طلب الإعلان</h1>
                <p className="text-gray-600 mt-2">معلومات الطلب المقدم من {request.company_name}</p>
              </div>
              {getStatusBadge(request.status)}
            </div>
          </div>

          {/* Request Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaBuilding className="text-primary-600" />
                معلومات الشركة
              </h2>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">اسم الشركة</label>
                  <p className="text-lg font-medium">{request.company_name}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">اسم المسؤول</label>
                  <p className="text-lg font-medium flex items-center gap-2">
                    <FaUser className="text-gray-400" />
                    {request.contact_name}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">رقم الهاتف</label>
                  <p className="text-lg font-medium">
                    <a
                      href={`tel:${request.phone}`}
                      className="flex items-center gap-2 text-primary-600 hover:text-primary-800"
                    >
                      <FaPhone />
                      {request.phone}
                    </a>
                  </p>
                </div>
                
                {request.whatsapp && (
                  <div>
                    <label className="text-sm text-gray-500">رقم الواتساب</label>
                    <p className="text-lg font-medium">
                      <a
                        href={`https://wa.me/${request.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-green-600 hover:text-green-800"
                      >
                        <FaWhatsapp />
                        {request.whatsapp}
                      </a>
                    </p>
                  </div>
                )}
                
                {request.email && (
                  <div>
                    <label className="text-sm text-gray-500">البريد الإلكتروني</label>
                    <p className="text-lg font-medium">{request.email}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Plan Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaFileAlt className="text-primary-600" />
                تفاصيل الطلب
              </h2>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">الخطة المطلوبة</label>
                  <p className="text-lg font-medium">{request.plan_name || `خطة ${request.plan_id}`}</p>
                </div>
                
                {request.plan_price && (
                  <div>
                    <label className="text-sm text-gray-500">سعر الخطة</label>
                    <p className="text-lg font-medium">{request.plan_price} ريال</p>
                  </div>
                )}
                
                {request.plan_duration && (
                  <div>
                    <label className="text-sm text-gray-500">مدة الخطة</label>
                    <p className="text-lg font-medium">{request.plan_duration} يوم</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm text-gray-500">تاريخ الطلب</label>
                  <p className="text-lg font-medium flex items-center gap-2">
                    <FaCalendarAlt className="text-gray-400" />
                    {new Date(request.created_at).toLocaleString('ar-SA')}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Message */}
            {request.message && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow-md p-6 lg:col-span-2"
              >
                <h2 className="text-xl font-bold mb-4">رسالة إضافية</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{request.message}</p>
              </motion.div>
            )}
          </div>

          {/* Actions */}
          {request.status === 'pending' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 bg-white rounded-lg shadow-md p-6"
            >
              <h2 className="text-xl font-bold mb-4">الإجراءات</h2>
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleStatusChange('approved')}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FaCheck />
                  الموافقة وإضافة كمعلن
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleStatusChange('rejected')}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <FaTimes />
                  رفض الطلب
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}