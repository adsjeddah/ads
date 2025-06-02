import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { FaLock, FaUser, FaSignInAlt } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', formData);
      
      // حفظ التوكن في localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      toast.success('تم تسجيل الدخول بنجاح');
      router.push('/admin/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <>
      <Head>
        <title>تسجيل دخول الإدارة - دليل شركات نقل العفش</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-600 via-secondary-600 to-accent-600 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-8 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaLock className="text-3xl" />
              </div>
              <h1 className="text-3xl font-bold mb-2">لوحة التحكم</h1>
              <p className="text-gray-300">تسجيل دخول الإدارة</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  <FaUser className="inline ml-2" />
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="admin@example.com"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  <FaLock className="inline ml-2" />
                  كلمة المرور
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>جاري تسجيل الدخول...</span>
                  </>
                ) : (
                  <>
                    <FaSignInAlt />
                    <span>تسجيل الدخول</span>
                  </>
                )}
              </motion.button>

              <div className="text-center text-sm text-gray-600">
                <p>بيانات الدخول الافتراضية:</p>
                <p className="font-mono mt-1">admin@jeddah-ads.com / admin123</p>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </>
  );
}