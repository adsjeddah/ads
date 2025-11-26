import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaTags, FaClock, FaDollarSign } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  features: string[];
  is_active: boolean;
  created_at: string;
}

export default function AdminPlans() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_days: '30',
    features: '',
    is_active: true
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
    } else {
      fetchPlans();
    }
  }, [router]);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/plans`);
      setPlans(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('خطأ في جلب الخطط السعرية');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const planData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        duration_days: parseInt(formData.duration_days),
        features: formData.features.split('\n').filter(f => f.trim()),
        is_active: formData.is_active
      };

      if (editingPlan) {
        // Update existing plan
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL || '/api'}/plans/${editingPlan.id}`,
          planData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('تم تحديث الخطة بنجاح');
      } else {
        // Create new plan
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || '/api'}/plans`,
          planData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('تم إضافة الخطة بنجاح');
      }

      // Reset form and refresh
      setFormData({
        name: '',
        description: '',
        price: '',
        duration_days: '30',
        features: '',
        is_active: true
      });
      setEditingPlan(null);
      setShowForm(false);
      fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('خطأ في حفظ الخطة');
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price.toString(),
      duration_days: plan.duration_days.toString(),
      features: plan.features.join('\n'),
      is_active: plan.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخطة؟')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || '/api'}/plans/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('تم حذف الخطة بنجاح');
      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('خطأ في حذف الخطة');
    }
  };

  return (
    <>
      <Head>
        <title>إدارة خطط الأسعار | لوحة التحكم</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="container mx-auto px-3 md:px-4 py-4 md:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h1 className="text-lg md:text-2xl font-bold text-gray-800">إدارة خطط الأسعار</h1>
              <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setEditingPlan(null);
                    setFormData({
                      name: '',
                      description: '',
                      price: '',
                      duration_days: '30',
                      features: '',
                      is_active: true
                    });
                    setShowForm(!showForm);
                  }}
                  className="btn-primary flex items-center gap-1 md:gap-2 flex-1 sm:flex-initial justify-center text-sm md:text-base px-3 py-2"
                >
                  <FaPlus />
                  <span className="hidden sm:inline">إضافة خطة</span>
                  <span className="sm:hidden">إضافة</span>
                </button>
                <Link href="/admin/dashboard" className="flex-1 sm:flex-initial">
                  <button className="btn-secondary flex items-center gap-1 md:gap-2 w-full justify-center text-sm md:text-base px-3 py-2">
                    <FaArrowLeft />
                    <span>رجوع</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-4 md:mb-8"
            >
              <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">
                {editingPlan ? 'تعديل الخطة' : 'إضافة خطة جديدة'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                      اسم الخطة
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                      السعر (ريال)
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
                      required
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                    الوصف
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                      المدة (يوم)
                    </label>
                    <input
                      type="number"
                      value={formData.duration_days}
                      onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                      الحالة
                    </label>
                    <select
                      value={formData.is_active.toString()}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
                    >
                      <option value="true">نشط</option>
                      <option value="false">غير نشط</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                    المميزات (سطر لكل ميزة)
                  </label>
                  <textarea
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base"
                    rows={4}
                    placeholder="ظهور في قائمة الشركات&#10;معلومات الاتصال&#10;دعم البريد"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 md:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingPlan(null);
                    }}
                    className="btn-secondary"
                  >
                    إلغاء
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingPlan ? 'تحديث' : 'إضافة'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-t-4 border-b-4 border-primary-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {plans.map((plan) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-md md:shadow-lg overflow-hidden"
                >
                  <div className={`p-4 md:p-6 ${plan.is_active ? 'bg-gradient-to-r from-primary-500 to-secondary-500' : 'bg-gray-500'} text-white`}>
                    <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">{plan.name}</h3>
                    <p className="text-xs md:text-sm opacity-90">{plan.description}</p>
                    <div className="mt-2 md:mt-4 flex items-end gap-1">
                      <span className="text-2xl md:text-3xl font-bold">{plan.price}</span>
                      <span className="text-xs md:text-sm mb-1">ريال</span>
                    </div>
                  </div>

                  <div className="p-4 md:p-6">
                    <div className="flex items-center gap-1 md:gap-2 text-gray-600 mb-3 md:mb-4 text-sm md:text-base">
                      <FaClock className="text-sm" />
                      <span>{plan.duration_days} يوم</span>
                    </div>

                    <div className="space-y-1.5 md:space-y-2 mb-4 md:mb-6 max-h-32 md:max-h-none overflow-y-auto">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-1.5 md:gap-2">
                          <span className="text-green-500 mt-0.5 text-sm">✓</span>
                          <span className="text-gray-600 text-xs md:text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(plan)}
                        className="flex-1 btn-secondary text-xs md:text-sm flex items-center justify-center gap-1 py-2"
                      >
                        <FaEdit className="text-xs md:text-sm" />
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="flex-1 btn-danger text-xs md:text-sm flex items-center justify-center gap-1 py-2"
                      >
                        <FaTrash className="text-xs md:text-sm" />
                        حذف
                      </button>
                    </div>

                    {!plan.is_active && (
                      <div className="mt-2 md:mt-3 text-center text-xs md:text-sm text-gray-500">
                        غير نشط
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && plans.length === 0 && (
            <div className="text-center py-20">
              <FaTags className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-500">لا توجد خطط أسعار حالياً</p>
              <p className="text-gray-400 mt-2">اضغط على "إضافة خطة جديدة" للبدء</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}