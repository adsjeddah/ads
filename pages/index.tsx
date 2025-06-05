import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPhone, FaWhatsapp, FaTruck, FaBoxes, FaShieldAlt, FaClock, FaStar, FaArrowRight, FaHome, FaDolly, FaShippingFast, FaWarehouse, FaHandshake, FaTools, FaPeopleCarry, FaRoute, FaAward, FaMapMarkedAlt, FaHeadset, FaUserTie, FaClipboardCheck, FaTruckLoading, FaBoxOpen } from 'react-icons/fa';
import axios from 'axios';
import Link from 'next/link';

interface Advertiser {
  id: string;
  company_name: string;
  phone: string;
  whatsapp?: string;
  services?: string;
  icon_url?: string;
}

export default function Home() {
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [rotationKey, setRotationKey] = useState(0);

  // تعريف الأيقونات المتاحة
  const iconComponents: { [key: string]: any } = {
    'truck': FaTruck,
    'boxes': FaBoxes,
    'home': FaHome,
    'dolly': FaDolly,
    'shipping-fast': FaShippingFast,
    'warehouse': FaWarehouse,
    'handshake': FaHandshake,
    'tools': FaTools,
    'people-carry': FaPeopleCarry,
    'route': FaRoute,
    'clock': FaClock,
    'shield-alt': FaShieldAlt,
    'award': FaAward,
    'star': FaStar,
    'map-marked-alt': FaMapMarkedAlt,
    'headset': FaHeadset,
    'user-tie': FaUserTie,
    'clipboard-check': FaClipboardCheck,
    'truck-loading': FaTruckLoading,
    'box-open': FaBoxOpen,
  };

  const iconColors: { [key: string]: string } = {
    'truck': 'text-blue-600',
    'boxes': 'text-amber-600',
    'home': 'text-green-600',
    'dolly': 'text-purple-600',
    'shipping-fast': 'text-red-600',
    'warehouse': 'text-indigo-600',
    'handshake': 'text-teal-600',
    'tools': 'text-orange-600',
    'people-carry': 'text-pink-600',
    'route': 'text-cyan-600',
    'clock': 'text-yellow-600',
    'shield-alt': 'text-gray-600',
    'award': 'text-yellow-500',
    'star': 'text-yellow-400',
    'map-marked-alt': 'text-green-500',
    'headset': 'text-blue-500',
    'user-tie': 'text-gray-700',
    'clipboard-check': 'text-green-700',
    'truck-loading': 'text-red-700',
    'box-open': 'text-amber-700',
  };

  useEffect(() => {
    fetchAdvertisers();
  }, []);

  useEffect(() => {
    // تدوير الإعلانات كل 10 ثواني
    const interval = setInterval(() => {
      setRotationKey(prev => prev + 1);
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAdvertisers = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/advertisers?status=active`);
      setAdvertisers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching advertisers:', error);
      setLoading(false);
    }
  };

  // دالة لخلط ترتيب المعلنين بشكل عشوائي
  const shuffleAdvertisers = (ads: Advertiser[]) => {
    const shuffled = [...ads];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // الحصول على المعلنين بترتيب عشوائي
  const getRotatedAdvertisers = () => {
    if (advertisers.length === 0) return [];
    // استخدام rotationKey كـ seed للحصول على ترتيب مختلف في كل دورة
    return shuffleAdvertisers(advertisers);
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (whatsapp: string, companyName: string) => {
    const message = encodeURIComponent(`مرحباً، أريد الاستفسار عن خدمات نقل العفش - ${companyName}`);
    window.open(`https://wa.me/${whatsapp}?text=${message}`, '_blank');
  };

  return (
    <>
      <Head>
        <title>دليل شركات نقل العفش في جدة | أفضل خدمات نقل الأثاث</title>
        <meta name="description" content="اعثر على أفضل شركات نقل العفش في جدة. خدمات احترافية، أسعار منافسة، وضمان سلامة أثاثك." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-secondary-600/20 to-accent-600/20 animate-gradient"></div>
          <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5"></div>
          
          <div className="relative container mx-auto px-4 py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                <span className="text-gradient">دليل شركات نقل العفش</span>
                <br />
                <span className="text-gray-800">في مدينة جدة</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                نوفر لك أفضل شركات نقل الأثاث المعتمدة والموثوقة في جدة
                <br />
                مع ضمان الجودة والأسعار المنافسة
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg"
                >
                  <FaShieldAlt className="text-primary-500" />
                  <span className="font-semibold">شركات مرخصة</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg"
                >
                  <FaClock className="text-secondary-500" />
                  <span className="font-semibold">خدمة 24/7</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg"
                >
                  <FaStar className="text-accent-500" />
                  <span className="font-semibold">ضمان الجودة</span>
                </motion.div>
              </div>

              {/* Advertisers Section - MOVED HERE */}
              <div className="mt-12"> {/* Added margin top for spacing */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="text-center mb-12"
                >
                  <h2 className="text-4xl md:text-5xl font-bold mb-4">
                    <span className="text-gradient">شركات نقل العفش المميزة</span>
                  </h2>
                  <p className="text-xl text-gray-600">اختر الشركة المناسبة لاحتياجاتك</p>
                </motion.div>

                {loading ? (
                  <div className="flex justify-center items-center py-10"> {/* Reduced py for hero section */}
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-500"></div> {/* Adjusted spinner size */}
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={rotationKey}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                      {getRotatedAdvertisers().map((advertiser, index) => (
                        <motion.div
                          key={advertiser.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ y: -10 }}
                          className="relative group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-secondary-500/20 to-accent-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                          <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden card-hover">
                            {/* Header with gradient */}
                            <div className="h-2 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500"></div>
                            
                            <div className="p-4 md:p-6"> {/* Reduced padding */}
                              {/* Company Icon/Logo */}
                              <div className="flex justify-center mb-3"> {/* Reduced margin */}
                                {advertiser.icon_url && iconComponents[advertiser.icon_url] ? (
                                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-gray-100"> {/* Reduced size & border */}
                                    {React.createElement(iconComponents[advertiser.icon_url], {
                                      className: `text-3xl md:text-4xl ${iconColors[advertiser.icon_url] || 'text-primary-600'}` // Reduced icon size
                                    })}
                                  </div>
                                ) : (
                                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold shadow-md"> {/* Reduced size */}
                                    {advertiser.company_name.charAt(0)}
                                  </div>
                                )}
                              </div>
    
                              {/* Company Name */}
                              <h3 className="text-lg md:text-xl font-bold text-center mb-2 text-gray-800"> {/* Reduced font size & margin */}
                                {advertiser.company_name}
                              </h3>
    
                              {/* Services */}
                              {advertiser.services && (
                                <div className="mb-3 text-center"> {/* Reduced margin, centered text for potential one-liner */}
                                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-2"> {/* Smaller text, limit to 2 lines */}
                                    {advertiser.services.split('،').map(s => s.trim()).join(' • ')}
                                  </p>
                                </div>
                              )}
    
                              {/* Contact Buttons */}
                              <div className="space-y-2"> {/* Reduced space between buttons */}
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleCall(advertiser.phone)}
                                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                                >
                                  <FaPhone />
                                  <span>اتصل الآن</span>
                                  {/* Phone number text removed from button */}
                                </motion.button>
    
                                {advertiser.whatsapp && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleWhatsApp(advertiser.whatsapp!, advertiser.company_name)}
                                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                                  >
                                    <FaWhatsapp className="text-xl" />
                                    <span>واتساب</span>
                                    {/* WhatsApp number text was not here, so it's fine */}
                                  </motion.button>
                                )}
                              </div>
                            </div>

                            {/* Premium Badge */}
                            {index === 0 && ( // Assuming the first advertiser is premium or apply other logic
                              <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg flex items-center gap-1">
                                <FaStar className="text-xs" />
                                <span>مميز</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                )}

                {advertisers.length === 0 && !loading && (
                  <div className="text-center py-10"> {/* Reduced py */}
                    <p className="text-xl text-gray-500">لا توجد شركات متاحة حالياً</p> {/* Adjusted text size */}
                  </div>
                )}
              </div>
              {/* End of Moved Advertisers Section */}

              <Link href="/advertise">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary text-lg flex items-center gap-2 mx-auto mt-12" /* Added margin top */
                >
                  <span>أعلن معنا</span>
                  <FaArrowRight />
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Services Features */}
        <section className="py-16 bg-white/50 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-3xl">
                  <FaTruck />
                </div>
                <h3 className="text-xl font-bold mb-2">نقل آمن ومضمون</h3>
                <p className="text-gray-600">جميع الشركات المعتمدة لدينا توفر ضمان كامل على سلامة أثاثك</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full flex items-center justify-center text-white text-3xl">
                  <FaBoxes />
                </div>
                <h3 className="text-xl font-bold mb-2">تغليف احترافي</h3>
                <p className="text-gray-600">استخدام أفضل مواد التغليف لحماية الأثاث من الخدوش والكسر</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center text-white text-3xl">
                  <FaClock />
                </div>
                <h3 className="text-xl font-bold mb-2">دقة في المواعيد</h3>
                <p className="text-gray-600">الالتزام بالمواعيد المحددة مع العملاء دون تأخير</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-primary-600 via-secondary-600 to-accent-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                هل تملك شركة نقل عفش في جدة؟
              </h2>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                انضم إلى دليلنا واحصل على عملاء جدد يومياً
              </p>
              <Link href="/advertise">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-primary-600 px-8 py-4 rounded-lg font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-200"
                >
                  سجل شركتك الآن
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <p className="mb-4">جميع الحقوق محفوظة © 2025 دليل شركات نقل العفش في جدة</p>
              <div className="flex justify-center gap-6">
                <Link href="/privacy" legacyBehavior><a className="hover:text-primary-400 transition-colors">سياسة الخصوصية</a></Link>
                <Link href="/terms" legacyBehavior><a className="hover:text-primary-400 transition-colors">الشروط والأحكام</a></Link>
                {/* Admin login link removed for public view */}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}