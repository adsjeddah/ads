import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence, useInView, useSpring, useTransform } from 'framer-motion';
import { FaPhone, FaWhatsapp, FaTruck, FaBoxes, FaShieldAlt, FaClock, FaStar, FaArrowRight, FaHome, FaDolly, FaShippingFast, FaWarehouse, FaHandshake, FaTools, FaPeopleCarry, FaRoute, FaAward, FaMapMarkedAlt, FaHeadset, FaUserTie, FaClipboardCheck, FaTruckLoading, FaBoxOpen, FaCheckCircle, FaCertificate, FaBolt, FaGift, FaBell, FaExclamationTriangle, FaInfoCircle, FaUsers, FaPercent, FaUndoAlt, FaChevronLeft, FaChevronRight, FaArrowLeft, FaBars, FaTimes, FaMapMarkerAlt } from 'react-icons/fa';
import { MdVerified, MdLocalOffer, MdSecurity } from 'react-icons/md';
import { AiFillSafetyCertificate } from 'react-icons/ai';
import axios from 'axios';
import Link from 'next/link';
import OnlineAdvertisersCount from '../../components/OnlineAdvertisersCount';
import LiveOrderNotifications from '../../components/LiveOrderNotifications';


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

// Reviews Section Component with Slider and Advanced Animations
function ReviewsSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const reviewsRef = useRef(null);
  const isInView = useInView(reviewsRef, { once: true });

  const reviews = [
    {
      id: 1,
      name: "محمد الغامدي",
      image: "/images/reviews/mohamed.jpg",
      rating: 5,
      text: "دليل ممتاز! ساعدني في العثور على شركة نقل محترفة بسرعة. الشركة اللي اخترتها من الدليل كانت دقيقة في المواعيد والتعامل راقي جداً. أنصح الجميع بالاستفادة من هذا الدليل",
      date: "منذ أسبوع",
      service: "نقل داخل المملكة",
      cost: "1,200 ريال"
    },
    {
      id: 2,
      name: "أسماء العتيبي",
      image: "/images/reviews/asmaa.webp",
      rating: 5,
      text: "تجربة رائعة! كنت خايفة على أثاثي لأنه غالي، بس الحمدلله الشركة اللي حصلتها من الدليل كانت محترفة جداً. غلفوا كل شيء بعناية ووصل كله سليم",
      date: "منذ 3 أيام",
      service: "نقل أثاث فاخر",
      cost: "2,500 ريال"
    },
    {
      id: 3,
      name: "خالد الحربي",
      image: "/images/reviews/khaled.jpg",
      rating: 5,
      text: "أفضل دليل لشركات النقل! وفر علي وقت البحث والمقارنة. كل الشركات الموجودة موثوقة ومرخصة. نقلت عفشي داخل المملكة والحمدلله كل شيء تمام",
      date: "منذ أسبوعين",
      service: "نقل بين المدن",
      cost: "3,800 ريال"
    },
    {
      id: 4,
      name: "ضحى السالم",
      image: "/images/reviews/doha.jpg",
      rating: 5,
      text: "خدمة ممتازة! الدليل سهل الاستخدام وكل المعلومات واضحة. اتصلت على شركة من الدليل وجاوني بنفس اليوم. الأسعار معقولة والشغل نظيف",
      date: "منذ 5 أيام",
      service: "نقل عاجل",
      cost: "1,500 ريال"
    },
    {
      id: 5,
      name: "عبدالله الشمري",
      image: "/images/reviews/abdallah.png",
      rating: 5,
      text: "تجربتي كانت ممتازة! الدليل وفر علي عناء البحث. الشركة جات في الوقت المحدد وعندهم معدات حديثة. حتى ساعدوني في الفك والتركيب",
      date: "منذ يومين",
      service: "نقل مع فك وتركيب",
      cost: "1,800 ريال"
    },
    {
      id: 6,
      name: "هاجر القحطاني",
      image: "/images/reviews/hagar.jpg",
      rating: 4,
      text: "الدليل مفيد جداً والشركات كلها محترمة. بس تأخروا علي شوي عن الموعد المحدد، غير كذا كل شيء كان ممتاز",
      date: "منذ شهر",
      service: "نقل شقة كاملة",
      cost: "2,200 ريال"
    },
    {
      id: 7,
      name: "علي المالكي",
      image: "/images/reviews/ali.jpg",
      rating: 5,
      text: "والله ما قصروا! شركة محترمة وأسعار منافسة. الدليل هذا وفر علي وقت وجهد كبير في البحث عن شركة موثوقة",
      date: "منذ 4 أيام",
      service: "نقل مكتب",
      cost: "2,000 ريال"
    },
    {
      id: 8,
      name: "مهند الزهراني",
      image: "/images/reviews/mohanad.jpg",
      rating: 5,
      text: "أنصح الجميع بهذا الدليل. شركات مرخصة ومضمونة وأسعار واضحة. نقلت عفشي مرتين وكل مرة أختار من هنا",
      date: "منذ أسبوع",
      service: "نقل متكرر",
      cost: "1,600 ريال"
    },
    {
      id: 9,
      name: "أسامة العمري",
      image: "/images/reviews/osama.png",
      rating: 5,
      text: "تجربة ممتازة من البداية للنهاية. الشركة جات بالوقت وشغلهم نظيف ومرتب. ما شاء الله تبارك الله",
      date: "منذ 10 أيام",
      service: "نقل فيلا",
      cost: "4,500 ريال"
    },
    {
      id: 10,
      name: "هاني السبيعي",
      image: "/images/reviews/hany.jpg",
      rating: 5,
      text: "الحمدلله كل شيء وصل بالسلامة. شركة أمينة وموظفين محترمين. الدليل ساعدني أختار الشركة المناسبة",
      date: "منذ 6 أيام",
      service: "نقل أجهزة حساسة",
      cost: "1,900 ريال"
    },
    {
      id: 11,
      name: "العتيبي",
      image: "/images/reviews/otibi.jpg",
      rating: 5,
      text: "ما شاء الله تبارك الله، خدمة ممتازة وأسعار معقولة. الدليل يستاهل كل الشكر والتقدير",
      date: "منذ أسبوعين",
      service: "نقل عفش كامل",
      cost: "2,300 ريال"
    },
    {
      id: 12,
      name: "مروان القرني",
      image: "/images/reviews/marawan.webp",
      rating: 5,
      text: "تعاملت مع شركة من الدليل ووجدت الاحترافية والأمانة. كل التفاصيل واضحة والخدمة سريعة",
      date: "منذ 3 أسابيع",
      service: "نقل مستعجل",
      cost: "1,700 ريال"
    },
    {
      id: 13,
      name: "ريهانا المطيري",
      image: "/images/reviews/rihana.webp",
      rating: 5,
      text: "أشكركم على هذا الدليل الرائع. وفر علي وقت طويل في البحث والمقارنة. الشركة كانت ممتازة",
      date: "منذ شهر",
      service: "نقل أثاث مكتبي",
      cost: "2,100 ريال"
    }
  ];

  const handleSlideChange = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % reviews.length);
      setDirection(1);
    }, 4000);
    return () => clearInterval(interval);
  }, [reviews.length]);

  return (
    <section className="py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden" ref={reviewsRef}>
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5"></div>
        <motion.div
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-transparent to-secondary-600/20"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-6 py-2 rounded-full text-sm font-bold mb-6"
          >
            <FaStar className="animate-spin-slow" />
            <span>تقييمات حقيقية 100%</span>
            <FaStar className="animate-spin-slow" />
          </motion.div>
          
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-white">
            <motion.span
              initial={{ opacity: 0, x: -50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.5 }}
            >
              ماذا يقول
            </motion.span>
            <motion.span
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.7 }}
              className="text-gradient"
            >
              {" "}عملاؤنا الكرام
            </motion.span>
          </h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.9 }}
            className="text-xl text-gray-300 max-w-3xl mx-auto"
          >
            تجارب حقيقية من عملاء استخدموا دليلنا للوصول إلى أفضل شركات مكافحة الحشرات في المملكة
          </motion.p>
        </motion.div>

        {/* Main Review Display */}
        <div className="max-w-4xl mx-auto mb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-gray-700/50 shadow-2xl"
            >
              {reviews[currentSlide] && (
                <>
                  {/* Large Quote */}
                  <div className="text-6xl text-primary-400/20 mb-6">"</div>
                  
                  {/* Review Content */}
                  <p className="text-xl md:text-2xl text-gray-100 leading-relaxed mb-8 font-medium">
                    {reviews[currentSlide].text}
                  </p>
                  
                  {/* Reviewer Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img
                        src={reviews[currentSlide].image}
                        alt={reviews[currentSlide].name}
                        className="w-16 h-16 rounded-full object-cover ring-4 ring-primary-400/30"
                      />
                      <div>
                        <h4 className="font-bold text-xl text-white">{reviews[currentSlide].name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <FaStar
                                key={i}
                                className={`text-sm ${i < reviews[currentSlide].rating ? 'text-yellow-400' : 'text-gray-600'}`}
                              />
                            ))}
                          </div>
                          <span className="text-gray-400 text-sm">• {reviews[currentSlide].date}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-400">{reviews[currentSlide].service}</div>
                      <div className="text-lg font-bold text-green-400">{reviews[currentSlide].cost}</div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Customer Avatars */}
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 1.2 }}
            className="flex flex-col items-center"
          >
            {/* Avatar Grid */}
            <div className="flex items-center justify-center -space-x-3 mb-6">
              {reviews.map((review, index) => (
                <motion.button
                  key={review.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 1.3 + index * 0.05 }}
                  onClick={() => handleSlideChange(index)}
                  className={`relative group transition-all duration-300 ${
                    index === currentSlide ? 'z-20 scale-110' : 'z-10 hover:z-20 hover:scale-105'
                  }`}
                >
                  <div className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-3 transition-all duration-300 ${
                    index === currentSlide
                      ? 'border-primary-400 ring-4 ring-primary-400/30'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}>
                    <Image
                      src={review.image}
                      alt={review.name}
                      width={56}
                      height={56}
                      className="object-cover"
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJalmRDtvfEREJh3EhQp4CjzjpJAJG/qzcjEpbCvdd2yHjLSR4BPaGHsVbnZ3xqtRgOIZ//2Q=="
                    />
                  </div>
                  {index === currentSlide && (
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5"
                    >
                      <MdVerified className="text-white text-xs" />
                    </motion.div>
                  )}
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {review.name}
                    </div>
                    <div className="w-2 h-2 bg-gray-900 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.8 }}
              className="flex items-center gap-6 text-gray-400"
            >
              <div className="flex items-center gap-2">
                <FaUsers className="text-primary-400" />
                <span className="text-sm"><AnimatedCounter value={2847} />+ عميل سعيد</span>
              </div>
              <div className="w-px h-4 bg-gray-700"></div>
              <div className="flex items-center gap-2">
                <FaStar className="text-yellow-400" />
                <span className="text-sm">4.9 متوسط التقييم</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 2 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { icon: FaUsers, value: 2847, label: "عميل سعيد", color: "from-blue-500 to-blue-600" },
            { icon: FaStar, value: 4.9, label: "متوسط التقييم", color: "from-yellow-500 to-orange-500", decimal: true },
            { icon: FaCheckCircle, value: 98, label: "نسبة الرضا", color: "from-green-500 to-green-600", percentage: true },
            { icon: FaTruck, value: 15000, label: "عملية نقل", color: "from-purple-500 to-purple-600" }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 2.2 + index * 0.1, type: "spring" }}
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-2xl p-6 text-center border border-gray-700/50"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${stat.color} rounded-full flex items-center justify-center`}
              >
                <stat.icon className="text-white text-2xl" />
              </motion.div>
              <div className="text-3xl font-bold text-white mb-2">
                {stat.decimal ? (
                  stat.value
                ) : stat.percentage ? (
                  <><AnimatedCounter value={stat.value} isPercentage={true} /></>
                ) : (
                  <><AnimatedCounter value={stat.value} />+</>
                )}
              </div>
              <p className="text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}

// Counter Section Component with Live Updates
function CounterSection() {
  // Live counter that increases over time
  const [successfulMoves, setSuccessfulMoves] = useState(() => {
    // Get initial value from localStorage or start at 15000
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('successfulMoves');
      if (stored) {
        const { value, timestamp } = JSON.parse(stored);
        // Calculate how many minutes passed since last visit
        const minutesPassed = Math.floor((Date.now() - timestamp) / (60 * 1000));
        // Add 1-2 moves per 1-2 minutes that passed (simulate growth during absence)
        const estimatedGrowth = Math.floor(minutesPassed / 1.5) * 1.5;
        return Math.floor(value + estimatedGrowth);
      }
    }
    return 15000;
  });

  useEffect(() => {
    // Save to localStorage whenever value changes
    if (typeof window !== 'undefined') {
      localStorage.setItem('successfulMoves', JSON.stringify({
        value: successfulMoves,
        timestamp: Date.now()
      }));
    }
  }, [successfulMoves]);

  useEffect(() => {
    // Set up random interval to increase counter (60-120 seconds)
    const getRandomInterval = () => {
      return (60 + Math.random() * 60) * 1000; // 60-120 seconds in milliseconds
    };

    const timeoutId = setTimeout(() => {
      // Increase by 1 or 2 randomly
      const increase = Math.random() > 0.5 ? 2 : 1;
      setSuccessfulMoves(prev => prev + increase);
    }, getRandomInterval());

    return () => clearTimeout(timeoutId);
  }, [successfulMoves]);

  return (
    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-sm rounded-2xl p-3 md:p-5 mb-2 md:mb-6 border border-yellow-500/20 max-w-3xl mx-auto">
      <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center justify-center"
        >
          <motion.div 
            key={successfulMoves}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5 }}
            className="text-lg sm:text-xl md:text-3xl font-bold text-orange-600 mb-1"
          >
            +<AnimatedCounter value={successfulMoves} duration={2.5} />
          </motion.div>
          <div className="text-gray-700 font-semibold text-xs sm:text-sm leading-tight">عملية نقل<br className="sm:hidden" /> ناجحة</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center justify-center"
        >
          <div className="text-lg sm:text-xl md:text-3xl font-bold text-yellow-600 mb-1">
            <AnimatedCounter value={98} duration={2} isPercentage={true} />
          </div>
          <div className="text-gray-700 font-semibold text-xs sm:text-sm leading-tight">نسبة رضا<br className="sm:hidden" /> العملاء</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center justify-center"
        >
          <div className="text-lg sm:text-xl md:text-3xl font-bold text-red-600 mb-1">
            <AnimatedCounter value={24} duration={1.5} />/7
          </div>
          <div className="text-gray-700 font-semibold text-xs sm:text-sm leading-tight">خدمة طوارئ<br className="sm:hidden" /> متاحة</div>
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

export default function PestControlIndex() {
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [shuffledAdvertisers, setShuffledAdvertisers] = useState<Advertiser[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
    
    // Handle scroll event
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchAdvertisers = async () => {
    try {
      // 🆕 الصفحة الرئيسية: مكافحة الحشرات في المملكة فقط
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/advertisers`, {
        params: {
          status: 'active',
          sector: 'pest-control' // فقط مكافحة الحشرات
        }
      });
      
      // فلترة إضافية: فقط معلني المملكة أو كلاهما
      const kingdomAdvertisers = response.data.filter((adv: any) => 
        adv.coverage_type === 'kingdom' || adv.coverage_type === 'both'
      );
      
      setAdvertisers(kingdomAdvertisers);
      // خلط الإعلانات مرة واحدة عند تحميل البيانات
      const shuffled = shuffleAdvertisers(kingdomAdvertisers);
      setShuffledAdvertisers(shuffled);
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

  // الحصول على المعلنين بالترتيب المخلوط
  const getRotatedAdvertisers = () => {
    return shuffledAdvertisers;
  };

  // تتبع المشاهدة عند ظهور المعلن على الشاشة
  const trackView = async (advertiserId: string) => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/statistics/record`, {
        advertiserId,
        type: 'view'
      });
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };

  // استخدام useRef لتتبع المشاهدات المسجلة
  const viewsTrackedRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    if (shuffledAdvertisers.length > 0) {
      shuffledAdvertisers.forEach(advertiser => {
        if (!viewsTrackedRef.current.has(advertiser.id)) {
          viewsTrackedRef.current.add(advertiser.id);
          trackView(advertiser.id);
        }
      });
    }
  }, [shuffledAdvertisers]);

  const handleCall = (phone: string, advertiserId: string) => {
    // تسجيل المكالمة مباشرة باستخدام sendBeacon (الأكثر موثوقية)
    const apiUrl = '/api/statistics/record';
    const payload = {
      type: 'call',
      advertiserId,
      phone,
      page_url: window.location.href,
      timestamp: new Date().toISOString()
    };
    
    // استخدام sendBeacon أولاً (يعمل حتى عند التنقل)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(apiUrl, blob);
      console.log('📞 Call tracked via sendBeacon:', advertiserId);
    } else {
      // fallback: استخدام fetch مع keepalive
      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(err => console.error('Failed to track call:', err));
    }
    
    // فتح تطبيق الاتصال فوراً
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (whatsapp: string, companyName: string) => {
    const message = encodeURIComponent(`مرحباً، أريد الاستفسار عن خدمات مكافحة الحشرات - ${companyName}`);
    window.open(`https://wa.me/${whatsapp}?text=${message}`, '_blank');
  };

  return (
    <>
      <Head>
        <title>دليل شركات مكافحة الحشرات في المملكة | أفضل خدمات مكافحة الآفات</title>
        <meta name="description" content="اعثر على أفضل شركات مكافحة الحشرات في المملكة. خدمات احترافية، أسعار منافسة، وضمان سلامة أثاثك." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Mobile Navigation Header */}
        <header className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/10 backdrop-blur-md shadow-lg'
            : 'bg-white/95 backdrop-blur-sm shadow-sm'
        }`}>
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                    <FaTruck className="text-white text-xl" />
                  </div>
                  <span className={`font-bold text-lg hidden sm:block ${scrolled ? 'text-white' : 'text-gray-900'}`}>دليل مكافحة الحشرات</span>
                </motion.div>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/" className={`hover:text-primary-400 transition-colors font-medium ${scrolled ? 'text-gray-300' : 'text-gray-700'}`}>
                  الرئيسية
                </Link>
                <Link href="/advertise" className={`hover:text-primary-400 transition-colors font-medium ${scrolled ? 'text-gray-300' : 'text-gray-700'}`}>
                  أعلن معنا
                </Link>
                <a href="#reviews" className={`hover:text-primary-400 transition-colors font-medium ${scrolled ? 'text-gray-300' : 'text-gray-700'}`}>
                  آراء العملاء
                </a>
                <a href="#contact" className={`hover:text-primary-400 transition-colors font-medium ${scrolled ? 'text-gray-300' : 'text-gray-700'}`}>
                  اتصل بنا
                </a>
              </nav>

              {/* Mobile Controls */}
              <div className="flex items-center gap-2 md:hidden">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className={`p-2 rounded-lg transition-colors ${
                    scrolled
                      ? 'hover:bg-white/10'
                      : 'hover:bg-gray-100'
                  }`}
                  aria-label="Toggle mobile menu"
                >
                  {isMobileMenuOpen ? (
                    <FaTimes className={`text-2xl ${scrolled ? 'text-white' : 'text-gray-700'}`} />
                  ) : (
                    <FaBars className={`text-2xl ${scrolled ? 'text-white' : 'text-gray-700'}`} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden border-t bg-white border-gray-100"
              >
                <nav className="container mx-auto px-4 py-4">
                  <Link href="/">
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-3 px-4 rounded-lg font-medium transition-colors hover:bg-gray-50 text-gray-700 cursor-pointer"
                    >
                      <FaHome className="inline-block ml-2" />
                      الرئيسية
                    </motion.div>
                  </Link>
                  
                  <Link href="/advertise">
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-3 px-4 rounded-lg font-medium transition-colors hover:bg-gray-50 text-gray-700 cursor-pointer"
                    >
                      <FaBell className="inline-block ml-2" />
                      أعلن معنا
                    </motion.div>
                  </Link>
                  
                  <motion.a
                    href="#reviews"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-3 px-4 rounded-lg font-medium transition-colors hover:bg-gray-50 text-gray-700"
                  >
                    <FaStar className="inline-block ml-2" />
                    آراء العملاء
                  </motion.a>
                  
                  <motion.a
                    href="#contact"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-3 px-4 rounded-lg font-medium transition-colors hover:bg-gray-50 text-gray-700"
                  >
                    <FaPhone className="inline-block ml-2" />
                    اتصل بنا
                  </motion.a>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-secondary-600/20 to-accent-600/20 animate-gradient"></div>
          <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5"></div>
          
          <div className="relative container mx-auto px-4 py-8 md:py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-6">
                <span className="text-gradient">دليل شركات مكافحة الحشرات</span>
                <br />
                <span className="text-gray-800">في المملكة العربية السعودية</span>
              </h1>

              {/* Advertisers Section - Priority Display */}
              <div className="mt-4 md:mt-12"> {/* Reduced margin on mobile for above the fold */}
                {loading ? (
                  <div className="flex justify-center items-center py-10"> {/* Reduced py for hero section */}
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-500"></div> {/* Adjusted spinner size */}
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="advertisers-grid"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6"
                    >
                      {getRotatedAdvertisers().map((advertiser, index) => (
                        <motion.div
                          key={advertiser.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-secondary-500/20 to-accent-500/20 rounded-lg md:rounded-2xl blur-xl"></div>
                          <div className="relative bg-white rounded-lg md:rounded-2xl shadow-xl overflow-hidden">
                            {/* Header with gradient */}
                            <div className="h-1.5 md:h-2 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 animate-gradient-x bg-[length:200%_100%]"></div>
                            
                            <div className="p-2 md:p-4">
                              {/* Company Icon/Logo & Name */}
                              <div className="flex items-center justify-center gap-2 md:gap-3 mb-1.5 md:mb-2">
                                {advertiser.icon_url && iconComponents[advertiser.icon_url] ? (
                                  <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 flex-shrink-0">
                                    {React.createElement(iconComponents[advertiser.icon_url], {
                                      className: `text-lg md:text-3xl ${iconColors[advertiser.icon_url] || 'text-primary-600'}`
                                    })}
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center text-white text-base md:text-2xl font-bold shadow-md flex-shrink-0">
                                    {advertiser.company_name.charAt(0)}
                                  </div>
                                )}
                                
                                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
                                  {advertiser.company_name}
                                </h3>
                              </div>
    
                              {/* Services */}
                              {advertiser.services && (
                                <div className="mb-2 text-center hidden md:block"> {/* إخفاء الخدمات على الموبايل */}
                                  <p className="text-base text-gray-600 leading-relaxed line-clamp-2">
                                    {advertiser.services.split('،').map(s => s.trim()).join(' • ')}
                                  </p>
                                </div>
                              )}
    
                              {/* Contact Buttons */}
                              <div className="space-y-1.5 md:space-y-2">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleCall(advertiser.phone, advertiser.id)}
                                  className="w-full flex items-center justify-center gap-1 md:gap-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white py-1.5 md:py-2.5 px-2 md:px-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200 relative overflow-hidden text-[13px] md:text-lg"
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 animate-pulse opacity-30"></div>
                                  <FaPhone className="relative animate-bounce text-base md:text-lg" />
                                  <span className="relative font-bold tracking-wider text-2xl md:text-xl" dir="ltr">
                                    {advertiser.phone}
                                  </span>
                                  <FaBolt className="relative text-yellow-300 animate-pulse text-base md:text-lg" />
                                </motion.button>
                              </div>
                            </div>
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
              {/* End of Advertisers Section */}

              {/* City Selection - Moved After Advertisers */}
              <div className="mt-12 mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">اختر مدينتك</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  <Link href="/pest-control/jeddah">
                    <motion.div
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="bg-white rounded-xl shadow-lg p-6 text-center cursor-pointer border-2 border-transparent hover:border-primary-500 transition-all"
                    >
                      <FaMapMarkerAlt className="text-4xl text-primary-500 mx-auto mb-3" />
                      <h3 className="text-xl font-bold text-gray-800">جدة</h3>
                      <p className="text-sm text-gray-600 mt-2">شركات مكافحة الحشرات في جدة</p>
                    </motion.div>
                  </Link>

                  <Link href="/pest-control/riyadh">
                    <motion.div
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="bg-white rounded-xl shadow-lg p-6 text-center cursor-pointer border-2 border-transparent hover:border-primary-500 transition-all"
                    >
                      <FaMapMarkerAlt className="text-4xl text-secondary-500 mx-auto mb-3" />
                      <h3 className="text-xl font-bold text-gray-800">الرياض</h3>
                      <p className="text-sm text-gray-600 mt-2">شركات مكافحة الحشرات في الرياض</p>
                    </motion.div>
                  </Link>

                  <Link href="/pest-control/dammam">
                    <motion.div
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="bg-white rounded-xl shadow-lg p-6 text-center cursor-pointer border-2 border-transparent hover:border-primary-500 transition-all"
                    >
                      <FaMapMarkerAlt className="text-4xl text-accent-500 mx-auto mb-3" />
                      <h3 className="text-xl font-bold text-gray-800">الدمام</h3>
                      <p className="text-sm text-gray-600 mt-2">شركات مكافحة الحشرات في الدمام</p>
                    </motion.div>
                  </Link>
                </div>
              </div>

            </motion.div>
          </div>
        </section>

        {/* عداد الإنجازات - Counter Section */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            <CounterSection />
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
                  <h3 className="font-bold text-lg">ضمان القضاء الكامل</h3>
                </div>
                <p className="text-gray-600 text-sm">نستخدم أحدث المبيدات الفعّالة والآمنة للقضاء التام على الحشرات</p>
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
                <p className="text-gray-600 text-sm">فنيون متخصصون في مكافحة جميع أنواع الحشرات والقوارض</p>
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
                  <h3 className="font-bold text-lg">مواد آمنة ومعتمدة</h3>
                </div>
                <p className="text-gray-600 text-sm">نستخدم مبيدات معتمدة من وزارة الصحة وآمنة على الأطفال والحيوانات</p>
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
                <span className="text-gradient">دليلك للحماية من الحشرات</span>
              </h2>
              <p className="text-xl text-gray-600">نصائح مهمة للوقاية والتخلص من الحشرات</p>
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
                  <h3 className="font-bold text-lg">قبل المكافحة</h3>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                    <span>حدد نوع الحشرات الموجودة (صراصير، نمل، بق، إلخ)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                    <span>نظف المنزل وأزل بقايا الطعام</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                    <span>أغلق الثقوب والشقوق التي قد تدخل منها الحشرات</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                    <span>ابعد الأطفال والحيوانات الأليفة عن منطقة الرش</span>
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
                  <h3 className="font-bold text-lg">أثناء عملية المكافحة</h3>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <FaBoxes className="text-blue-500 mt-1 flex-shrink-0" />
                    <span>اترك المنزل لمدة 2-4 ساعات بعد الرش</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaBoxes className="text-blue-500 mt-1 flex-shrink-0" />
                    <span>غطِ أواني الطعام والمشروبات</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaBoxes className="text-blue-500 mt-1 flex-shrink-0" />
                    <span>أغلق النوافذ أثناء الرش</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaBoxes className="text-blue-500 mt-1 flex-shrink-0" />
                    <span>اتبع تعليمات فريق المكافحة بدقة</span>
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
                  <h3 className="font-bold text-lg">بعد المكافحة</h3>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <FaClipboardCheck className="text-purple-500 mt-1 flex-shrink-0" />
                    <span>هوّ المنزل جيداً قبل العودة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaClipboardCheck className="text-purple-500 mt-1 flex-shrink-0" />
                    <span>لا تنظف الأسطح المرشوشة لمدة أسبوع</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaClipboardCheck className="text-purple-500 mt-1 flex-shrink-0" />
                    <span>راقب ظهور أي حشرات وأبلغ الشركة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaClipboardCheck className="text-purple-500 mt-1 flex-shrink-0" />
                    <span>احجز جلسة متابعة بعد شهر للتأكد</span>
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
                المكافحة الدورية كل 3-6 أشهر تمنع عودة الحشرات وتحافظ على صحة عائلتك
              </p>
            </motion.div>
          </div>
        </section>

        {/* قسم التقييمات الاحترافي - Ultra Professional Reviews Section */}
        <section id="reviews">
          <ReviewsSection />
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-primary-600 via-secondary-600 to-accent-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                هل تملك شركة تقدم خدمات في المملكة؟
              </h2>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                انضم إلى دليل الشركات الأول في المملكة واحصل على عملاء جدد يومياً
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
        <footer id="contact" className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {/* About Section */}
              <div className="text-center md:text-right">
                <h3 className="font-bold text-xl mb-4">عن الدليل</h3>
                <p className="text-gray-300 mb-4">
                  دليل شامل لأفضل شركات مكافحة الحشرات في المملكة، نساعدك في العثور على الشركة المناسبة لاحتياجاتك.
                </p>
              </div>
              
              {/* Quick Links */}
              <div className="text-center">
                <h3 className="font-bold text-xl mb-4">روابط سريعة</h3>
                <div className="space-y-2">
                  <Link href="/advertise" legacyBehavior>
                    <a className="block hover:text-primary-400 transition-colors">أعلن معنا</a>
                  </Link>
                  <Link href="/privacy" legacyBehavior>
                    <a className="block hover:text-primary-400 transition-colors">سياسة الخصوصية</a>
                  </Link>
                  <Link href="/terms" legacyBehavior>
                    <a className="block hover:text-primary-400 transition-colors">الشروط والأحكام</a>
                  </Link>
                </div>
              </div>
              
              {/* Contact Info */}
              <div className="text-center md:text-left">
                <h3 className="font-bold text-xl mb-4">تواصل معنا</h3>
                <div className="space-y-3">
                  <a href="tel:+966548923300" className="flex items-center justify-center md:justify-start gap-2 hover:text-primary-400 transition-colors">
                    <FaPhone className="text-primary-400" />
                    <span dir="ltr">+966 54 892 3300</span>
                  </a>
                  <a href="https://wa.me/966548923300" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center md:justify-start gap-2 hover:text-primary-400 transition-colors">
                    <FaWhatsapp className="text-green-400 text-xl" />
                    <span>واتساب</span>
                  </a>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <FaClock className="text-primary-400" />
                    <span>متاحون 24/7</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-800 pt-8 text-center">
              <p className="text-gray-400">جميع الحقوق محفوظة © 2025 دليل شركات مكافحة الحشرات في المملكة</p>
            </div>
          </div>
        </footer>

        {/* عدد المعلنين المتاحين - يمين */}
        <OnlineAdvertisersCount
          totalAdvertisers={20}
          onlineAdvertisers={14}
        />

        {/* إشعارات الطلبات المباشرة - يسار */}
        <LiveOrderNotifications
          city="riyadh"
          service="pest-control"
        />
      </div>
    </>
  );
}