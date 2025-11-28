/**
 * Subscription Status Manager Component
 * مكون إدارة حالات الاشتراك (إيقاف مؤقت، إيقاف كامل، إعادة تشغيل)
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { 
  FaPlay, 
  FaPause, 
  FaStop, 
  FaRedo, 
  FaClock, 
  FaCheckCircle, 
  FaBan,
  FaHistory,
  FaExclamationTriangle
} from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Subscription } from '@/types/models';
import { formatDate, formatDateTime } from '@/lib/utils/date';
import { getValidToken, handleAuthError } from '@/lib/utils/auth';

interface SubscriptionStatusManagerProps {
  subscription: Subscription;
  onStatusChanged: () => void;
}

export default function SubscriptionStatusManager({ 
  subscription, 
  onStatusChanged 
}: SubscriptionStatusManagerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [actionType, setActionType] = useState<'pause' | 'stop' | null>(null);
  const [reason, setReason] = useState('');
  
  // الحصول على معلومات الحالة
  const getStatusInfo = () => {
    switch (subscription.status) {
      case 'active':
        return {
          label: 'نشط',
          color: 'bg-green-100 text-green-800',
          icon: FaCheckCircle,
          iconColor: 'text-green-600'
        };
      case 'paused':
        return {
          label: 'متوقف مؤقتاً',
          color: 'bg-yellow-100 text-yellow-800',
          icon: FaPause,
          iconColor: 'text-yellow-600'
        };
      case 'stopped':
        return {
          label: 'متوقف',
          color: 'bg-red-100 text-red-800',
          icon: FaBan,
          iconColor: 'text-red-600'
        };
      case 'expired':
        return {
          label: 'منتهي',
          color: 'bg-gray-100 text-gray-800',
          icon: FaClock,
          iconColor: 'text-gray-600'
        };
      default:
        return {
          label: subscription.status,
          color: 'bg-gray-100 text-gray-800',
          icon: FaClock,
          iconColor: 'text-gray-600'
        };
    }
  };
  
  const statusInfo = getStatusInfo();
  
  // دالة الإيقاف المؤقت
  const handlePause = async () => {
    setActionType('pause');
    setShowReasonModal(true);
  };
  
  // دالة الإيقاف الكامل
  const handleStop = async () => {
    setActionType('stop');
    setShowReasonModal(true);
  };
  
  // دالة إعادة التشغيل (من Pause)
  const handleResume = async () => {
    if (!confirm('هل تريد إعادة تشغيل هذا الاشتراك؟ سيتم تمديد تاريخ النهاية بعدد أيام التوقف.')) {
      return;
    }
    
    setLoading(true);
    try {
      // الحصول على token محدّث
      const token = await getValidToken();
      
      if (!token) {
        toast.error('انتهت جلستك، الرجاء تسجيل الدخول مرة أخرى');
        router.push('/admin/login');
        return;
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await axios.post(
        `${apiUrl}/subscriptions/${subscription.id}/resume`,
        { notes: 'إعادة تشغيل بواسطة الإدارة' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        const data = response.data.data;
        toast.success(
          `تم إعادة التشغيل بنجاح!\n` +
          `مدة التوقف: ${data.pause_duration_days} يوم\n` +
          `تاريخ النهاية الجديد: ${formatDate(data.new_end_date, 'dd/MM/yyyy')}`
        );
        onStatusChanged();
      }
    } catch (error: any) {
      console.error('Error resuming subscription:', error);
      
      // معالجة أخطاء Authentication
      if (handleAuthError(error, router)) {
        toast.error('انتهت جلستك، الرجاء تسجيل الدخول مرة أخرى');
        return;
      }
      
      toast.error(error.response?.data?.error || 'خطأ في إعادة التشغيل');
    } finally {
      setLoading(false);
    }
  };
  
  // دالة إعادة التنشيط (من Stop)
  const handleReactivate = async () => {
    if (!confirm('هل تريد إعادة تنشيط هذا الاشتراك؟ سيبدأ من جديد بنفس الباقة والمدة.')) {
      return;
    }
    
    setLoading(true);
    try {
      // الحصول على token محدّث
      const token = await getValidToken();
      
      if (!token) {
        toast.error('انتهت جلستك، الرجاء تسجيل الدخول مرة أخرى');
        router.push('/admin/login');
        return;
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await axios.post(
        `${apiUrl}/subscriptions/${subscription.id}/reactivate`,
        { notes: 'إعادة تنشيط بواسطة الإدارة' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        const data = response.data.data;
        toast.success(
          `تم إعادة التنشيط بنجاح!\n` +
          `المدة: ${data.total_days} يوم\n` +
          `تاريخ النهاية: ${formatDate(data.new_end_date, 'dd/MM/yyyy')}`
        );
        onStatusChanged();
      }
    } catch (error: any) {
      console.error('Error reactivating subscription:', error);
      
      // معالجة أخطاء Authentication
      if (handleAuthError(error, router)) {
        toast.error('انتهت جلستك، الرجاء تسجيل الدخول مرة أخرى');
        return;
      }
      
      toast.error(error.response?.data?.error || 'خطأ في إعادة التنشيط');
    } finally {
      setLoading(false);
    }
  };
  
  // تنفيذ الإجراء
  const executeAction = async () => {
    if (!actionType) return;
    
    if (actionType === 'stop' && !reason.trim()) {
      toast.error('الرجاء إدخال سبب الإيقاف');
      return;
    }
    
    setLoading(true);
    try {
      // الحصول على token محدّث
      const token = await getValidToken();
      
      if (!token) {
        toast.error('انتهت جلستك، الرجاء تسجيل الدخول مرة أخرى');
        router.push('/admin/login');
        return;
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await axios.post(
        `${apiUrl}/subscriptions/${subscription.id}/${actionType}`,
        { reason: reason || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success(response.data.message);
        setShowReasonModal(false);
        setReason('');
        setActionType(null);
        onStatusChanged();
      }
    } catch (error: any) {
      console.error(`Error ${actionType}ing subscription:`, error);
      
      // معالجة أخطاء Authentication
      if (handleAuthError(error, router)) {
        toast.error('انتهت جلستك، الرجاء تسجيل الدخول مرة أخرى');
        return;
      }
      
      toast.error(error.response?.data?.error || `خطأ في ${actionType === 'pause' ? 'الإيقاف المؤقت' : 'الإيقاف'}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-3 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-bold text-gray-800">إدارة حالة الاشتراك</h3>
        <div className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full ${statusInfo.color} flex items-center gap-2 w-fit`}>
          <statusInfo.icon className={`${statusInfo.iconColor} text-sm md:text-base`} />
          <span className="font-semibold text-sm md:text-base">{statusInfo.label}</span>
        </div>
      </div>
      
      {/* معلومات الحالة */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4 mb-4 md:mb-6">
        {subscription.paused_at && (
          <div className="bg-yellow-50 p-2 md:p-3 rounded-lg">
            <p className="text-[10px] md:text-xs text-yellow-600 mb-0.5 md:mb-1">متوقف منذ</p>
            <p className="text-xs md:text-sm font-semibold text-yellow-800">
              {formatDate(subscription.paused_at, 'dd/MM/yyyy')}
            </p>
          </div>
        )}
        
        {subscription.total_paused_days && subscription.total_paused_days > 0 && (
          <div className="bg-blue-50 p-2 md:p-3 rounded-lg">
            <p className="text-[10px] md:text-xs text-blue-600 mb-0.5 md:mb-1">إجمالي أيام التوقف</p>
            <p className="text-xs md:text-sm font-semibold text-blue-800">
              {subscription.total_paused_days} يوم
            </p>
          </div>
        )}
        
        {subscription.remaining_active_days && (
          <div className="bg-green-50 p-2 md:p-3 rounded-lg">
            <p className="text-[10px] md:text-xs text-green-600 mb-0.5 md:mb-1">الأيام المتبقية</p>
            <p className="text-xs md:text-sm font-semibold text-green-800">
              {subscription.remaining_active_days} يوم
            </p>
          </div>
        )}
        
        {subscription.active_days && (
          <div className="bg-purple-50 p-2 md:p-3 rounded-lg">
            <p className="text-[10px] md:text-xs text-purple-600 mb-0.5 md:mb-1">الأيام المستخدمة</p>
            <p className="text-xs md:text-sm font-semibold text-purple-800">
              {subscription.active_days} يوم
            </p>
          </div>
        )}
      </div>
      
      {/* أزرار الإجراءات - محسّنة للموبايل */}
      <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-3">
        {subscription.status === 'active' && (
          <>
            <button
              onClick={handlePause}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 md:py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 active:bg-yellow-700 transition-colors disabled:opacity-50 text-sm md:text-base font-medium shadow-sm"
            >
              <FaPause className="text-sm" />
              <span>إيقاف مؤقت</span>
            </button>
            
            <button
              onClick={handleStop}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 md:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors disabled:opacity-50 text-sm md:text-base font-medium shadow-sm"
            >
              <FaStop className="text-sm" />
              <span>إيقاف كامل</span>
            </button>
          </>
        )}
        
        {subscription.status === 'paused' && (
          <>
            <button
              onClick={handleResume}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 md:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 active:bg-green-700 transition-colors disabled:opacity-50 text-sm md:text-base font-medium shadow-sm"
            >
              <FaPlay className="text-sm" />
              <span>تشغيل</span>
            </button>
            
            <button
              onClick={handleStop}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 md:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors disabled:opacity-50 text-sm md:text-base font-medium shadow-sm"
            >
              <FaStop className="text-sm" />
              <span>إيقاف كامل</span>
            </button>
          </>
        )}
        
        {subscription.status === 'stopped' && (
          <button
            onClick={handleReactivate}
            disabled={loading}
            className="col-span-2 flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 md:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors disabled:opacity-50 text-sm md:text-base font-medium shadow-sm"
          >
            <FaRedo className="text-sm" />
            <span>إعادة تنشيط</span>
          </button>
        )}
      </div>
      
      {/* Modal للسبب - محسّن للموبايل */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md"
          >
            {/* مؤشر السحب للموبايل */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden" />
            
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <FaExclamationTriangle className="text-yellow-500 text-xl sm:text-2xl" />
              <h3 className="text-base sm:text-lg font-bold">
                {actionType === 'pause' ? 'إيقاف مؤقت' : 'إيقاف كامل'}
              </h3>
            </div>
            
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
              {actionType === 'pause' 
                ? 'سيتم إيقاف الاشتراك مؤقتاً. الأيام لن تُحتسب أثناء التوقف.' 
                : 'سيتم إيقاف الاشتراك بشكل كامل. يمكن إعادة تنشيطه لاحقاً.'}
            </p>
            
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={actionType === 'stop' ? 'السبب (مطلوب)' : 'السبب (اختياري)'}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm sm:text-base"
              rows={3}
              required={actionType === 'stop'}
            />
            
            <div className="flex gap-2 sm:gap-3 mt-4">
              <button
                onClick={executeAction}
                disabled={loading || (actionType === 'stop' && !reason.trim())}
                className="flex-1 bg-blue-500 text-white px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors disabled:opacity-50 text-sm sm:text-base font-medium"
              >
                {loading ? 'جاري التنفيذ...' : 'تأكيد'}
              </button>
              
              <button
                onClick={() => {
                  setShowReasonModal(false);
                  setReason('');
                  setActionType(null);
                }}
                disabled={loading}
                className="flex-1 bg-gray-200 text-gray-700 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg hover:bg-gray-300 active:bg-gray-400 transition-colors text-sm sm:text-base font-medium"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

