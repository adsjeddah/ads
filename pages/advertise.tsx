import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaClock, FaStar, FaRocket, FaArrowRight, FaPhone, FaEnvelope, FaUser, FaBuilding, FaWhatsapp } from 'react-icons/fa'; // Added FaWhatsapp
import axios from 'axios';
import toast from 'react-hot-toast';

interface Plan {
  id: number;
  name: string;
  duration_days: number;
  price: number;
  features: string;
}

export default function Advertise() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    phone: '',
    whatsapp: '', // Replaced email with whatsapp
    message: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/plans`);
      // De-duplicate plans based on name and price to avoid repetition
      const uniquePlans = response.data.reduce((acc: Plan[], current: Plan) => {
        const x = acc.find(item => item.name === current.name && item.price === current.price);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);
      setPlans(uniquePlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('حدث خطأ أثناء تحميل خطط الأسعار.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlan) {
      toast.error('يرجى اختيار خطة الإعلان');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/ad-requests`, {
        ...formData,
        plan_id: selectedPlan
      });
      
      toast.success('تم إرسال طلبك بنجاح! سنتواصل معك قريباً');
      setFormData({
        company_name: '',
        contact_name: '',
        phone: '',
        whatsapp: '', // Changed from email
        message: ''
      });
      setSelectedPlan(null);
    } catch (error) {
      toast.error('حدث خطأ في إرسال الطلب. يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  // Function to convert Arabic numerals to English
  const convertArabicToEnglish = (str: string): string => {
    const arabicNumbers = '٠١٢٣٤٥٦٧٨٩';
    const englishNumbers = '0123456789';
    
    return str.split('').map(char => {
      const index = arabicNumbers.indexOf(char);
      return index !== -1 ? englishNumbers[index] : char;
    }).join('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let value = e.target.value;
    
    // Convert Arabic numerals to English for phone and WhatsApp fields
    if (e.target.name === 'phone' || e.target.name === 'whatsapp') {
      value = convertArabicToEnglish(value);
    }
    
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const getPlanIcon = (index: number) => {
    const icons = [FaClock, FaStar, FaRocket, FaCheckCircle];
    const Icon = icons[index % icons.length];
    return <Icon />;
  };

  const getPlanGradient = (index: number) => {
    const gradients = [
      'from-blue-400 to-blue-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-indigo-400 to-indigo-600'
    ];
    return gradients[index % gradients.length];
  };

  return (
    <>
      <Head>
        <title>أعلن معنا - دليل شركات نقل العفش في جدة</title>
        <meta name="description" content="انضم إلى دليل شركات نقل العفش في جدة واحصل على عملاء جدد يومياً" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-2xl font-bold text-gradient cursor-pointer"
                >
                  دليل نقل العفش - جدة
                </motion.div>
              </Link>
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <span>العودة للرئيسية</span>
                  <FaArrowRight className="rotate-180" />
                </motion.button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 via-secondary-600/10 to-accent-600/10"></div>
          <div className="relative container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-4xl mx-auto"
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="text-gradient">انضم إلى أكبر دليل</span>
                <br />
                <span className="text-gray-800">لشركات نقل العفش في جدة</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8">
                احصل على عملاء جدد يومياً من خلال إعلانات Google المُحسّنة
                <br />
                وزد من أرباحك بنسبة تصل إلى 300%
              </p>
              
              <div className="flex flex-wrap justify-center gap-6 text-lg">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-lg"
                >
                  <FaCheckCircle className="text-green-500" />
                  <span>ظهور مضمون في النتائج الأولى</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-lg"
                >
                  <FaCheckCircle className="text-green-500" />
                  <span>عملاء مستهدفين</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-lg"
                >
                  <FaCheckCircle className="text-green-500" />
                  <span>نتائج فورية</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Pricing Plans */}
        <section className="py-20 bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-gradient">خطط الأسعار</span>
              </h2>
              <p className="text-xl text-gray-600">اختر الخطة المناسبة لشركتك</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative cursor-pointer ${
                    selectedPlan === plan.id ? 'ring-4 ring-primary-500' : ''
                  }`}
                >
                  <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-full">
                    {/* Plan Header */}
                    <div className={`bg-gradient-to-br ${getPlanGradient(index)} text-white p-6`}>
                      <div className="text-4xl mb-4">{getPlanIcon(index)}</div>
                      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                      <div className="text-4xl font-bold">
                        {plan.price} <span className="text-lg">ريال</span>
                      </div>
                    </div>

                    {/* Plan Features */}
                    <div className="p-6">
                      <ul className="space-y-3">
                        {(Array.isArray(plan.features) ? plan.features : plan.features.split(',')).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">{typeof feature === 'string' ? feature.trim() : feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-full mt-6 py-3 rounded-lg font-semibold transition-all ${
                          selectedPlan === plan.id
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {selectedPlan === plan.id ? 'تم الاختيار ✓' : 'اختر هذه الخطة'}
                      </motion.button>
                    </div>

                    {/* Popular Badge */}
                    {index === 1 && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                        الأكثر طلباً
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 text-white p-8 text-center">
                  <h2 className="text-3xl font-bold mb-2">سجل شركتك الآن</h2>
                  <p className="text-lg opacity-90">املأ البيانات وسنتواصل معك خلال 24 ساعة</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        <FaBuilding className="inline ml-2" />
                        اسم الشركة
                      </label>
                      <input
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="شركة نقل العفش المتميزة"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        <FaUser className="inline ml-2" />
                        اسم المسؤول
                      </label>
                      <input
                        type="text"
                        name="contact_name"
                        value={formData.contact_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="أحمد محمد"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        <FaPhone className="inline ml-2" />
                        رقم الجوال
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="05XXXXXXXX"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        <FaWhatsapp className="inline ml-2" />
                        رقم الواتساب
                      </label>
                      <input
                        type="tel"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="05XXXXXXXX"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      رسالة إضافية (اختياري)
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                      placeholder="أخبرنا المزيد عن شركتك وخدماتك..."
                    />
                  </div>

                  {selectedPlan && (
                    <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-300 rounded-lg p-4">
                      <p className="text-green-800 font-semibold">
                        الخطة المختارة: {plans.find(p => p.id === selectedPlan)?.name}
                      </p>
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={loading || !selectedPlan}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
                      loading || !selectedPlan
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:shadow-xl'
                    }`}
                  >
                    {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold mb-4">لماذا تعلن معنا؟</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <div className="text-6xl text-primary-500 mb-4">10x</div>
                <h3 className="text-xl font-bold mb-2">زيادة في العملاء</h3>
                <p className="text-gray-600">متوسط زيادة عدد العملاء للشركات المعلنة لدينا</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="text-6xl text-secondary-500 mb-4">#1</div>
                <h3 className="text-xl font-bold mb-2">في نتائج البحث</h3>
                <p className="text-gray-600">موقعنا محسّن للظهور في النتائج الأولى لجوجل</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="text-6xl text-accent-500 mb-4">24/7</div>
                <h3 className="text-xl font-bold mb-2">دعم مستمر</h3>
                <p className="text-gray-600">فريق دعم متخصص لمساعدتك في أي وقت</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8">
          <div className="container mx-auto px-4 text-center">
            <p>جميع الحقوق محفوظة © 2024 دليل شركات نقل العفش في جدة</p>
          </div>
        </footer>
      </div>
    </>
  );
}