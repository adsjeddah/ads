/**
 * Subscription Status Manager Component
 * مكون إدارة حالات الاشتراك (إيقاف مؤقت، إيقاف كامل، إعادة تشغيل)
 */

import React, { useState } from 'react';
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

interface SubscriptionStatusManagerProps {
  subscription: Subscription;
  onStatusChanged: () => void;
}

export default function SubscriptionStatusManager({ 
  subscription, 
  onStatusChanged 
}: SubscriptionStatusManagerProps) {
  
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
      const token = localStorage.getItem('token');
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
          `تاريخ النهاية الجديد: ${new Date(data.new_end_date).toLocaleDateString('ar-SA')}`
        );
        onStatusChanged();
      }
    } catch (error: any) {
      console.error('Error resuming subscription:', error);
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
    
    setLoading(false);
    try {
      const token = localStorage.getItem('token');
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
          `تاريخ النهاية: ${new Date(data.new_end_date).toLocaleDateString('ar-SA')}`
        );
        onStatusChanged();
      }
    } catch (error: any) {
      console.error('Error reactivating subscription:', error);
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
      const token = localStorage.getItem('token');
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
      toast.error(error.response?.data?.error || `خطأ في ${actionType === 'pause' ? 'الإيقاف المؤقت' : 'الإيقاف'}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800">إدارة حالة الاشتراك</h3>
        <div className={`px-4 py-2 rounded-full ${statusInfo.color} flex items-center gap-2`}>
          <statusInfo.icon className={statusInfo.iconColor} />
          <span className="font-semibold">{statusInfo.label}</span>
        </div>
      </div>
      
      {/* معلومات الحالة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {subscription.paused_at && (
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-xs text-yellow-600 mb-1">متوقف منذ</p>
            <p className="text-sm font-semibold text-yellow-800">
              {new Date(subscription.paused_at).toLocaleDateString('ar-SA')}
            </p>
          </div>
        )}
        
        {subscription.total_paused_days && subscription.total_paused_days > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-600 mb-1">إجمالي أيام التوقف</p>
            <p className="text-sm font-semibold text-blue-800">
              {subscription.total_paused_days} يوم
            </p>
          </div>
        )}
        
        {subscription.remaining_active_days && (
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-xs text-green-600 mb-1">الأيام المتبقية</p>
            <p className="text-sm font-semibold text-green-800">
              {subscription.remaining_active_days} يوم
            </p>
          </div>
        )}
        
        {subscription.active_days && (
          <div className="bg-purple-50 p-3 rounded-lg">
            <p className="text-xs text-purple-600 mb-1">الأيام المستخدمة</p>
            <p className="text-sm font-semibold text-purple-800">
              {subscription.active_days} يوم
            </p>
          </div>
        )}
      </div>
      
      {/* أزرار الإجراءات */}
      <div className="flex flex-wrap gap-3">
        {subscription.status === 'active' && (
          <>
            <button
              onClick={handlePause}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
            >
              <FaPause />
              <span>إيقاف مؤقت</span>
            </button>
            
            <button
              onClick={handleStop}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <FaStop />
              <span>إيقاف كامل</span>
            </button>
          </>
        )}
        
        {subscription.status === 'paused' && (
          <>
            <button
              onClick={handleResume}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <FaPlay />
              <span>إعادة تشغيل</span>
            </button>
            
            <button
              onClick={handleStop}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <FaStop />
              <span>إيقاف كامل</span>
            </button>
          </>
        )}
        
        {subscription.status === 'stopped' && (
          <button
            onClick={handleReactivate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <FaRedo />
            <span>إعادة تنشيط</span>
          </button>
        )}
      </div>
      
      {/* Modal للسبب */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <FaExclamationTriangle className="text-yellow-500 text-2xl" />
              <h3 className="text-lg font-bold">
                {actionType === 'pause' ? 'إيقاف مؤقت' : 'إيقاف كامل'}
              </h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              {actionType === 'pause' 
                ? 'سيتم إيقاف الاشتراك مؤقتاً. الأيام لن تُحتسب أثناء التوقف.' 
                : 'سيتم إيقاف الاشتراك بشكل كامل. يمكن إعادة تنشيطه لاحقاً.'}
            </p>
            
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={actionType === 'stop' ? 'السبب (مطلوب)' : 'السبب (اختياري)'}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              required={actionType === 'stop'}
            />
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={executeAction}
                disabled={loading || (actionType === 'stop' && !reason.trim())}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
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
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
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

