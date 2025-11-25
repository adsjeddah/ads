import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence, useInView, useSpring, useTransform } from 'framer-motion';
import { FaPhone, FaWhatsapp, FaTruck, FaBoxes, FaShieldAlt, FaClock, FaStar, FaArrowRight, FaHome, FaDolly, FaShippingFast, FaWarehouse, FaHandshake, FaTools, FaPeopleCarry, FaRoute, FaAward, FaMapMarkedAlt, FaHeadset, FaUserTie, FaClipboardCheck, FaTruckLoading, FaBoxOpen, FaCheckCircle, FaCertificate, FaBolt, FaGift, FaBell, FaExclamationTriangle, FaInfoCircle, FaUsers, FaPercent, FaUndoAlt, FaChevronLeft, FaChevronRight, FaArrowLeft, FaBars, FaTimes } from 'react-icons/fa';
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
      text: "دليل بروكر منصة احترافية حقيقية! استخدمته لنقل العفش والنظافة، وكلتا الشركتين كانتا ممتازة. الدليل وفر علي وقت البحث والمقارنة. كل الشركات موثوقة ومرخصة",
      date: "منذ أسبوع",
      service: "نقل عفش + نظافة",
      cost: "2,800 ريال"
    },
    {
      id: 2,
      name: "أسماء العتيبي",
      image: "/images/reviews/asmaa.webp",
      rating: 5,
      text: "تجربة رائعة مع بروكر! كنت محتاجة شركة تنظيف موثوقة، ولقيت أفضل الخيارات في الدليل. الشركة كانت محترفة جداً والخدمة فاقت التوقعات. شكراً بروكر!",
      date: "منذ 3 أيام",
      service: "خدمات نظافة",
      cost: "850 ريال"
    },
    {
      id: 3,
      name: "خالد الحربي",
      image: "/images/reviews/khaled.jpg",
      rating: 5,
      text: "أفضل دليل للخدمات في المملكة! استخدمته لكشف تسربات المياه، والشركة حلت المشكلة بسرعة واحترافية. الأسعار واضحة والتعامل ممتاز. أنصح الجميع باستخدامه",
      date: "منذ أسبوعين",
      service: "كشف تسربات",
      cost: "1,200 ريال"
    },
    {
      id: 4,
      name: "ضحى السالم",
      image: "/images/reviews/doha.jpg",
      rating: 5,
      text: "منصة بروكر سهلة الاستخدام وفعالة! احتجت خدمة مكافحة حشرات عاجلة، ولقيت الشركة المناسبة بسرعة. جاوني بنفس اليوم والخدمة كانت ممتازة. أنصح بالمنصة بقوة",
      date: "منذ 5 أيام",
      service: "مكافحة حشرات",
      cost: "600 ريال"
    },
    {
      id: 5,
      name: "عبدالله الشمري",
      image: "/images/reviews/abdallah.png",
      rating: 5,
      text: "تجربتي مع بروكر كانت ممتازة! استخدمته لأكثر من خدمة: نقل عفش، تنظيف، وكشف تسربات. كل الشركات كانت احترافية ومحترمة. الدليل فعلاً يوفر الوقت والجهد",
      date: "منذ يومين",
      service: "خدمات متنوعة",
      cost: "3,500 ريال"
    },
    {
      id: 6,
      name: "هاجر القحطاني",
      image: "/images/reviews/hagar.jpg",
      rating: 5,
      text: "صراحة منصة رائعة! كنت محتاجة شركة تنظيف موثوقة بعد الانتقال للمنزل الجديد. بروكر ساعدني ألقى أفضل الشركات بأسعار مناسبة. الخدمة كانت احترافية جداً",
      date: "منذ شهر",
      service: "تنظيف شامل",
      cost: "1,400 ريال"
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
            تجارب حقيقية من عملاء استخدموا بروكر للوصول إلى أفضل الشركات الموثوقة في جميع أنحاء المملكة
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



export default function Home() {
  
  
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  
  useEffect(() => {
        // Handle scroll event
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  

  // دالة لخلط ترتيب المعلنين بشكل عشوائي
  

  // الحصول على المعلنين بالترتيب المخلوط
  

  

  

  return (
    <>
      <Head>
        <title>بروكر - دليل الشركات والخدمات في المملكة العربية السعودية</title>
        <meta name="description" content="دليلك الشامل للوصول إلى أفضل الشركات والخدمات في المملكة. نقل عفش، نظافة، كشف تسربات، مكافحة حشرات وغيرها. خدمات موثوقة ومرخصة." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="دليل شركات المملكة, خدمات السعودية, نقل عفش, تنظيف, كشف تسربات, مكافحة حشرات, شركات موثوقة" />
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
                    <FaStar className="text-white text-xl" />
                  </div>
                  <span className={`font-bold text-lg hidden sm:block ${scrolled ? 'text-white' : 'text-gray-900'}`}>بروكر</span>
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
                    <motion.a
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-3 px-4 rounded-lg font-medium transition-colors hover:bg-gray-50 text-gray-700"
                    >
                      <FaHome className="inline-block ml-2" />
                      الرئيسية
                    </motion.a>
                  </Link>
                  
                  <Link href="/advertise">
                    <motion.a
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-3 px-4 rounded-lg font-medium transition-colors hover:bg-gray-50 text-gray-700"
                    >
                      <FaBell className="inline-block ml-2" />
                      أعلن معنا
                    </motion.a>
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
              <h1 className="text-3xl md:text-6xl font-bold mb-3 md:mb-6">
                <span className="text-gradient">بروكر</span>
                <br />
                <span className="text-gray-800">دليلك الشامل للخدمات في المملكة</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-6 md:mb-8">
                نربطك بأفضل الشركات الموثوقة والمرخصة في جميع أنحاء المملكة
              </p>
              
              {/* Services Quick Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap justify-center gap-3 md:gap-4 mb-8 md:mb-12"
              >
                <Link href="/movers">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all text-sm md:text-base cursor-pointer"
                  >
                    <FaTruck />
                    نقل العفش
                  </motion.div>
                </Link>
                <Link href="/cleaning">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all text-sm md:text-base cursor-pointer"
                  >
                    <FaTools />
                    النظافة
                  </motion.div>
                </Link>
                <Link href="/water-leaks">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all text-sm md:text-base cursor-pointer"
                  >
                    <FaShieldAlt />
                    كشف التسربات
                  </motion.div>
                </Link>
                <Link href="/pest-control">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all text-sm md:text-base cursor-pointer"
                  >
                    <FaAward />
                    مكافحة الحشرات
                  </motion.div>
                </Link>
              </motion.div>

              {/* Features Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="mt-8 md:mt-16"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                  {/* Feature 1 */}
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-xl border border-gray-100"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                        <FaShieldAlt className="text-3xl md:text-4xl text-white" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold mb-3 text-gray-800">
                        شركات موثوقة ومرخصة
                      </h3>
                      <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                        جميع الشركات في دليلنا تم فحصها والتأكد من تراخيصها لضمان خدمة آمنة وموثوقة
                      </p>
                    </div>
                  </motion.div>

                  {/* Feature 2 */}
                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-xl border border-gray-100"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                        <FaClock className="text-3xl md:text-4xl text-white" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold mb-3 text-gray-800">
                        خدمة سريعة ومتاحة
                      </h3>
                      <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                        تواصل فوري مع الشركات المتخصصة في جميع أنحاء المملكة على مدار الساعة
                      </p>
                    </div>
                  </motion.div>

                  {/* Feature 3 */}
                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-xl border border-gray-100"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                        <FaStar className="text-3xl md:text-4xl text-white" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold mb-3 text-gray-800">
                        أفضل الأسعار
                      </h3>
                      <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                        قارن بين عروض متعددة واختر الأنسب لميزانيتك بكل شفافية ووضوح
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="text-center mt-8 md:mt-12"
                >
                  <Link href="/advertise">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-8 md:px-12 py-4 md:py-5 rounded-full font-bold text-lg md:text-xl shadow-2xl hover:shadow-3xl transition-all"
                    >
                      <FaBell className="text-2xl animate-pulse" />
                      <span>أعلن عن شركتك الآن</span>
                      <FaArrowLeft />
                    </motion.button>
                  </Link>
                </motion.div>
              </motion.div>
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
                <h3 className="font-bold text-xl mb-4">عن بروكر</h3>
                <p className="text-gray-300 mb-4">
                  دليلك الشامل للوصول إلى أفضل الشركات الموثوقة والمرخصة في جميع أنحاء المملكة. نربطك بمقدمي الخدمات المحترفين في كافة المجالات.
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
              <p className="text-gray-400">جميع الحقوق محفوظة © 2025 بروكر - دليل الشركات في المملكة العربية السعودية</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}