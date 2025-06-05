import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence, useInView, useSpring, useTransform } from 'framer-motion';
import { FaPhone, FaWhatsapp, FaTruck, FaBoxes, FaShieldAlt, FaClock, FaStar, FaArrowRight, FaHome, FaDolly, FaShippingFast, FaWarehouse, FaHandshake, FaTools, FaPeopleCarry, FaRoute, FaAward, FaMapMarkedAlt, FaHeadset, FaUserTie, FaClipboardCheck, FaTruckLoading, FaBoxOpen, FaCheckCircle, FaCertificate, FaBolt, FaGift, FaBell, FaExclamationTriangle, FaInfoCircle, FaUsers, FaPercent, FaUndoAlt } from 'react-icons/fa';
import { MdVerified, MdLocalOffer, MdSecurity } from 'react-icons/md';
import { AiFillSafetyCertificate } from 'react-icons/ai';
import axios from 'axios';
import Link from 'next/link';

// Component for animated counter
function AnimatedCounter({ value, duration = 2, isPercentage = false }: { value: number; duration?: number; isPercentage?: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  useEffect(() => {
    if (!isInView) return;
    
    const steps = 60; // 60 FPS
    const increment = value / (duration * steps);
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        current = value;
        clearInterval(timer);
      }
      setDisplayValue(Math.round(current));
    }, 1000 / steps);
    
    return () => clearInterval(timer);
  }, [isInView, value, duration]);
  
  const formattedValue = isPercentage
    ? `${displayValue}%`
    : displayValue.toLocaleString('en-US');
  
  return <span ref={ref}>{formattedValue}</span>;
}

// Counter Section Component
function CounterSection() {
  return (
    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 mb-8 border border-yellow-500/20 max-w-4xl mx-auto">
      <div className="grid grid-cols-3 gap-2 md:gap-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center justify-center"
        >
          <div className="text-xl sm:text-2xl md:text-4xl font-bold text-orange-600 mb-1 md:mb-2">
            +<AnimatedCounter value={15000} duration={2.5} />
          </div>
          <div className="text-gray-700 font-semibold text-xs sm:text-sm md:text-base leading-tight">عملية نقل<br className="sm:hidden" /> ناجحة</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center justify-center"
        >
          <div className="text-xl sm:text-2xl md:text-4xl font-bold text-yellow-600 mb-1 md:mb-2">
            <AnimatedCounter value={98} duration={2} isPercentage={true} />
          </div>
          <div className="text-gray-700 font-semibold text-xs sm:text-sm md:text-base leading-tight">نسبة رضا<br className="sm:hidden" /> العملاء</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center justify-center"
        >
          <div className="text-xl sm:text-2xl md:text-4xl font-bold text-red-600 mb-1 md:mb-2">
            <AnimatedCounter value={24} duration={1.5} />/7
          </div>
          <div className="text-gray-700 font-semibold text-xs sm:text-sm md:text-base leading-tight">خدمة طوارئ<br className="sm:hidden" /> متاحة</div>
        </motion.div>
      </div>
    </div>
  );
}

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
              
              {/* شارات الثقة والضمانات */}
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500/10 to-green-600/10 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-green-500/20"
                >
                  <MdVerified className="text-green-600 text-xl" />
                  <span className="font-bold text-green-800">شركات مرخصة من وزارة النقل</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-blue-600/10 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-blue-500/20"
                >
                  <FaUndoAlt className="text-blue-600 text-xl" />
                  <span className="font-bold text-blue-800">ضمان استرجاع 100%</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-purple-600/10 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-purple-500/20"
                >
                  <MdSecurity className="text-purple-600 text-xl" />
                  <span className="font-bold text-purple-800">تأمين شامل على المنقولات</span>
                </motion.div>
              </div>

              {/* عداد الإنجازات */}
              <CounterSection />

              {/* الخدمات المميزة */}
              <div className="flex flex-wrap justify-center gap-3 mb-12">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md"
                >
                  <FaShieldAlt className="text-primary-500" />
                  <span className="font-semibold text-sm">شركات مرخصة</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md"
                >
                  <FaClock className="text-secondary-500" />
                  <span className="font-semibold text-sm">خدمة 24/7</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md"
                >
                  <FaStar className="text-accent-500" />
                  <span className="font-semibold text-sm">ضمان الجودة</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md"
                >
                  <FaCheckCircle className="text-green-500" />
                  <span className="font-semibold text-sm">فك وتركيب مجاني</span>
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
    
                              {/* عروض خاصة */}
                              {index % 3 === 0 && (
                                <div className="mb-3">
                                  <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                                    <FaGift />
                                    <span>خصم 15% للحجز اليوم</span>
                                  </div>
                                </div>
                              )}

                              {/* Contact Buttons */}
                              <div className="space-y-2">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleCall(advertiser.phone)}
                                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200 relative overflow-hidden"
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 animate-pulse opacity-30"></div>
                                  <FaPhone className="animate-bounce" />
                                  <span className="relative">اتصل الآن - رد فوري</span>
                                  <FaBolt className="text-yellow-300 animate-pulse" />
                                </motion.button>
    
                                {advertiser.whatsapp && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleWhatsApp(advertiser.whatsapp!, advertiser.company_name)}
                                    className="w-full flex items-center justify-between gap-3 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200"
                                  >
                                    <div className="flex items-center gap-2">
                                      <FaWhatsapp className="text-xl" />
                                      <span>احصل على عرض سعر مجاني</span>
                                    </div>
                                    <FaGift className="text-yellow-300" />
                                  </motion.button>
                                )}
                              </div>

                              {/* شارة الطوارئ */}
                              {index % 2 === 0 && (
                                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-red-600 font-bold">
                                  <FaExclamationTriangle className="animate-pulse" />
                                  <span>خدمة طوارئ 24/7</span>
                                </div>
                              )}
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
            </motion.div>
          </div>
        </section>

        {/* قسم الضمانات */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-gradient">ضماناتنا لك</span>
              </h2>
              <p className="text-xl text-gray-600">نضمن لك خدمة استثنائية وراحة بال كاملة</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500"
              >
                <div className="flex items-center gap-3 mb-3">
                  <FaCheckCircle className="text-green-500 text-2xl" />
                  <h3 className="font-bold text-lg">ضمان عدم الخدش أو الكسر</h3>
                </div>
                <p className="text-gray-600 text-sm">تعويض فوري عن أي ضرر يحدث لأثاثك أثناء النقل</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500"
              >
                <div className="flex items-center gap-3 mb-3">
                  <FaUsers className="text-blue-500 text-2xl" />
                  <h3 className="font-bold text-lg">فريق محترف ومدرب</h3>
                </div>
                <p className="text-gray-600 text-sm">عمال مدربون على أعلى مستوى للتعامل مع جميع أنواع الأثاث</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-purple-500"
              >
                <div className="flex items-center gap-3 mb-3">
                  <FaPercent className="text-purple-500 text-2xl" />
                  <h3 className="font-bold text-lg">أسعار شفافة بدون رسوم مخفية</h3>
                </div>
                <p className="text-gray-600 text-sm">عرض سعر واضح وثابت دون أي مفاجآت</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-orange-500"
              >
                <div className="flex items-center gap-3 mb-3">
                  <FaClock className="text-orange-500 text-2xl" />
                  <h3 className="font-bold text-lg">التزام بالمواعيد أو خصم 20%</h3>
                </div>
                <p className="text-gray-600 text-sm">نضمن الوصول في الوقت المحدد أو تحصل على خصم فوري</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* دليل المستخدم */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-gradient">دليلك لنقل آمن وسليم</span>
              </h2>
              <p className="text-xl text-gray-600">نصائح مهمة لضمان نقل أثاثك بأمان</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">1</div>
                  <h3 className="font-bold text-lg">كيف تختار شركة النقل المناسبة؟</h3>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                    <span>تحقق من التراخيص والتأمينات</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                    <span>اقرأ تقييمات العملاء السابقين</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                    <span>قارن بين عروض الأسعار</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                    <span>اسأل عن خبرتهم ومعداتهم</span>
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-secondary-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">2</div>
                  <h3 className="font-bold text-lg">نصائح لحماية أثاثك أثناء النقل</h3>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <FaBoxes className="text-blue-500 mt-1 flex-shrink-0" />
                    <span>استخدم مواد تغليف عالية الجودة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaBoxes className="text-blue-500 mt-1 flex-shrink-0" />
                    <span>قم بتفكيك القطع الكبيرة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaBoxes className="text-blue-500 mt-1 flex-shrink-0" />
                    <span>ضع علامات على الصناديق الهشة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaBoxes className="text-blue-500 mt-1 flex-shrink-0" />
                    <span>احتفظ بالأشياء الثمينة معك</span>
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-accent-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">3</div>
                  <h3 className="font-bold text-lg">قائمة التحقق قبل النقل</h3>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <FaClipboardCheck className="text-purple-500 mt-1 flex-shrink-0" />
                    <span>جرد جميع الأغراض وتصويرها</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaClipboardCheck className="text-purple-500 mt-1 flex-shrink-0" />
                    <span>تنظيف الأثاث قبل التغليف</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaClipboardCheck className="text-purple-500 mt-1 flex-shrink-0" />
                    <span>فصل الأجهزة الكهربائية</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaClipboardCheck className="text-purple-500 mt-1 flex-shrink-0" />
                    <span>تجهيز المنزل الجديد</span>
                  </li>
                </ul>
              </motion.div>
            </div>

            {/* نصيحة إضافية */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-12 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 text-center"
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <FaInfoCircle className="text-yellow-600 text-2xl" />
                <h3 className="font-bold text-xl text-yellow-800">نصيحة ذهبية</h3>
              </div>
              <p className="text-yellow-700">
                احجز موعد النقل مسبقاً بأسبوع على الأقل لضمان توفر أفضل الفرق والمعدات
              </p>
            </motion.div>
          </div>
        </section>

        {/* قسم التقييمات - Reviews Section */}
        <section className="py-20 bg-gradient-to-br from-primary-50 via-white to-secondary-50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="text-gradient">آراء عملائنا الكرام</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                تجارب حقيقية من عملاء استخدموا دليلنا للوصول إلى أفضل شركات نقل العفش في جدة
              </p>
              <div className="flex items-center justify-center gap-4 mt-6">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className="text-yellow-400 text-2xl" />
                  ))}
                </div>
                <span className="text-2xl font-bold text-gray-800">4.9</span>
                <span className="text-gray-600">من 2,847 تقييم</span>
              </div>
            </motion.div>

            {/* Reviews Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Review 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-xl p-6 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-bl-full opacity-20"></div>
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src="/images/reviews/mohamed.jpg"
                    alt="محمد الغامدي"
                    className="w-16 h-16 rounded-full object-cover border-3 border-yellow-400"
                  />
                  <div>
                    <h4 className="font-bold text-lg">محمد الغامدي</h4>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className="text-yellow-400 text-sm" />
                      ))}
                    </div>
                  </div>
                  <MdVerified className="text-blue-500 text-2xl mr-auto" />
                </div>
                <p className="text-gray-700 leading-relaxed mb-4">
                  "دليل ممتاز! ساعدني في العثور على شركة نقل محترفة بسرعة. الشركة اللي اخترتها من الدليل كانت دقيقة في المواعيد والتعامل راقي جداً. أنصح الجميع بالاستفادة من هذا الدليل"
                </p>
                <div className="text-sm text-gray-500">منذ أسبوع</div>
              </motion.div>

              {/* Review 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-xl p-6 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-300 to-green-500 rounded-bl-full opacity-20"></div>
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src="/images/reviews/asmaa.webp"
                    alt="أسماء العتيبي"
                    className="w-16 h-16 rounded-full object-cover border-3 border-green-400"
                  />
                  <div>
                    <h4 className="font-bold text-lg">أسماء العتيبي</h4>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className="text-yellow-400 text-sm" />
                      ))}
                    </div>
                  </div>
                  <MdVerified className="text-blue-500 text-2xl mr-auto" />
                </div>
                <p className="text-gray-700 leading-relaxed mb-4">
                  "تجربة رائعة! كنت خايفة على أثاثي لأنه غالي، بس الحمدلله الشركة اللي حصلتها من الدليل كانت محترفة جداً. غلفوا كل شيء بعناية ووصل كله سليم. شكراً لكم على هذا الدليل المفيد"
                </p>
                <div className="text-sm text-gray-500">منذ 3 أيام</div>
              </motion.div>

              {/* Review 3 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-xl p-6 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-300 to-purple-500 rounded-bl-full opacity-20"></div>
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src="/images/reviews/khaled.jpg"
                    alt="خالد الحربي"
                    className="w-16 h-16 rounded-full object-cover border-3 border-purple-400"
                  />
                  <div>
                    <h4 className="font-bold text-lg">خالد الحربي</h4>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className="text-yellow-400 text-sm" />
                      ))}
                    </div>
                  </div>
                  <MdVerified className="text-blue-500 text-2xl mr-auto" />
                </div>
                <p className="text-gray-700 leading-relaxed mb-4">
                  "أفضل دليل لشركات النقل! وفر علي وقت البحث والمقارنة. كل الشركات الموجودة موثوقة ومرخصة. نقلت عفشي من جدة للرياض والحمدلله كل شيء تمام"
                </p>
                <div className="text-sm text-gray-500">منذ أسبوعين</div>
              </motion.div>

              {/* Review 4 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-xl p-6 relative overflow-hidden lg:col-span-1 md:col-span-2"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-300 to-red-500 rounded-bl-full opacity-20"></div>
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src="/images/reviews/doha.jpg"
                    alt="ضحى السالم"
                    className="w-16 h-16 rounded-full object-cover border-3 border-red-400"
                  />
                  <div>
                    <h4 className="font-bold text-lg">ضحى السالم</h4>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className="text-yellow-400 text-sm" />
                      ))}
                    </div>
                  </div>
                  <MdVerified className="text-blue-500 text-2xl mr-auto" />
                </div>
                <p className="text-gray-700 leading-relaxed mb-4">
                  "خدمة ممتازة! الدليل سهل الاستخدام وكل المعلومات واضحة. اتصلت على شركة من الدليل وجاوني بنفس اليوم. الأسعار معقولة والشغل نظيف. ما قصروا والله"
                </p>
                <div className="text-sm text-gray-500">منذ 5 أيام</div>
              </motion.div>

              {/* Review 5 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl shadow-xl p-6 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-300 to-indigo-500 rounded-bl-full opacity-20"></div>
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src="/images/reviews/abdallah.png"
                    alt="عبدالله الشمري"
                    className="w-16 h-16 rounded-full object-cover border-3 border-indigo-400"
                  />
                  <div>
                    <h4 className="font-bold text-lg">عبدالله الشمري</h4>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className="text-yellow-400 text-sm" />
                      ))}
                    </div>
                  </div>
                  <MdVerified className="text-blue-500 text-2xl mr-auto" />
                </div>
                <p className="text-gray-700 leading-relaxed mb-4">
                  "تجربتي كانت ممتازة! الدليل وفر علي عناء البحث. الشركة جات في الوقت المحدد وعندهم معدات حديثة. حتى ساعدوني في الفك والتركيب. يعطيكم العافية"
                </p>
                <div className="text-sm text-gray-500">منذ يومين</div>
              </motion.div>

              {/* Review 6 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-2xl shadow-xl p-6 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-300 to-teal-500 rounded-bl-full opacity-20"></div>
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src="/images/reviews/hagar.jpg"
                    alt="هاجر القحطاني"
                    className="w-16 h-16 rounded-full object-cover border-3 border-teal-400"
                  />
                  <div>
                    <h4 className="font-bold text-lg">هاجر القحطاني</h4>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className={`text-sm ${i === 4 ? 'text-gray-300' : 'text-yellow-400'}`} />
                      ))}
                    </div>
                  </div>
                  <MdVerified className="text-blue-500 text-2xl mr-auto" />
                </div>
                <p className="text-gray-700 leading-relaxed mb-4">
                  "الدليل مفيد جداً والشركات كلها محترمة. بس تأخروا علي شوي عن الموعد المحدد، غير كذا كل شيء كان ممتاز. أنصح بالتواصل مع أكثر من شركة للمقارنة"
                </p>
                <div className="text-sm text-gray-500">منذ شهر</div>
              </motion.div>
            </div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-16 bg-gradient-to-r from-primary-100 to-secondary-100 rounded-2xl p-8"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary-600 mb-2">2,847+</div>
                  <p className="text-gray-700">تقييم إيجابي</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-secondary-600 mb-2">4.9/5</div>
                  <p className="text-gray-700">متوسط التقييم</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-accent-600 mb-2">98%</div>
                  <p className="text-gray-700">نسبة الرضا</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
                  <p className="text-gray-700">عملاء حقيقيون</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Services Features - Updated */}
        <section className="py-16 bg-gray-50">
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