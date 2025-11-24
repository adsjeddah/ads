/**
 * 🌐 صفحة ديناميكية للقطاعات والمدن
 * 
 * المسارات المدعومة:
 * ==================
 * /jeddah/movers
 * /jeddah/cleaning
 * /jeddah/water-leaks
 * /jeddah/pest-control
 * 
 * /riyadh/movers
 * /riyadh/cleaning
 * ... إلخ
 * 
 * /dammam/movers
 * /dammam/cleaning
 * ... إلخ
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { GetStaticPaths, GetStaticProps } from 'next';
import axios from 'axios';
import { FaPhone, FaWhatsapp, FaCheckCircle, FaStar } from 'react-icons/fa';

// تعريف البيانات الأساسية
const CITIES = {
  jeddah: { name_ar: 'جدة', name_en: 'Jeddah', emoji: '🏙️' },
  riyadh: { name_ar: 'الرياض', name_en: 'Riyadh', emoji: '🌆' },
  dammam: { name_ar: 'الدمام', name_en: 'Dammam', emoji: '🏖️' }
};

const CATEGORIES = {
  movers: { 
    name_ar: 'نقل العفش', 
    name_en: 'Moving Services',
    icon: '🚛',
    description: 'خدمات نقل العفش والأثاث المنزلي والمكتبي'
  },
  cleaning: { 
    name_ar: 'النظافة', 
    name_en: 'Cleaning Services',
    icon: '🧹',
    description: 'خدمات التنظيف المنزلي والتجاري'
  },
  'water-leaks': { 
    name_ar: 'كشف تسربات المياه', 
    name_en: 'Water Leak Detection',
    icon: '💧',
    description: 'خدمات كشف وإصلاح تسربات المياه'
  },
  'pest-control': { 
    name_ar: 'مكافحة الحشرات', 
    name_en: 'Pest Control',
    icon: '🪲',
    description: 'خدمات مكافحة الحشرات والقوارض'
  }
};

interface Advertiser {
  id: string;
  company_name: string;
  phone: string;
  whatsapp?: string;
  services?: string;
  icon_url?: string;
  status: string;
  sector?: string;
  coverage_type?: string;
  coverage_cities?: string[];
  is_trusted?: boolean;
}

interface PageProps {
  city: string;
  category: string;
  cityData: typeof CITIES[keyof typeof CITIES];
  categoryData: typeof CATEGORIES[keyof typeof CATEGORIES];
}

export default function CityCategory({ city, category, cityData, categoryData }: PageProps) {
  const router = useRouter();
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdvertisers();
  }, [city, category]);

  const fetchAdvertisers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/advertisers`, {
        params: {
          sector: category,
          city: city,
          status: 'active'
        }
      });
      
      // فلترة المعلنين حسب المدينة والقطاع
      const filtered = response.data.filter((adv: Advertiser) => {
        const matchesSector = adv.sector === category;
        const matchesCity = 
          adv.coverage_type === 'kingdom' || 
          adv.coverage_type === 'both' ||
          (adv.coverage_type === 'city' && adv.coverage_cities?.includes(city));
        
        return matchesSector && matchesCity && adv.status === 'active';
      });
      
      setAdvertisers(filtered);
    } catch (error) {
      console.error('Error fetching advertisers:', error);
      setAdvertisers([]);
    } finally {
      setLoading(false);
    }
  };

  // SEO Meta
  const pageTitle = `${categoryData.name_ar} في ${cityData.name_ar} | بروكر`;
  const pageDescription = `دليل شركات ${categoryData.name_ar} في مدينة ${cityData.name_ar}. ${categoryData.description}. أفضل الخدمات المعتمدة والموثوقة.`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={`${categoryData.name_ar}, ${cityData.name_ar}, ${categoryData.name_en}, ${cityData.name_en}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 opacity-40" />
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
          
          <div className="relative container mx-auto px-4 py-8 md:py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              {/* الأيقونات والعنوان */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-5xl">{cityData.emoji}</span>
                <span className="text-5xl">{categoryData.icon}</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-6">
                <span className="text-gradient">دليل شركات {categoryData.name_ar}</span>
                <br />
                <span className="text-gray-800">في مدينة {cityData.name_ar}</span>
              </h1>

              <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                {categoryData.description}
              </p>

              {/* Advertisers Section */}
              <div className="mt-4 md:mt-12">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                        <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4" />
                        <div className="h-6 bg-gray-200 rounded mb-3" />
                        <div className="h-4 bg-gray-200 rounded mb-2" />
                        <div className="h-10 bg-gray-200 rounded" />
                      </div>
                    ))}
                  </div>
                ) : advertisers.length > 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
                  >
                    {advertisers.map((advertiser, index) => (
                      <motion.div
                        key={advertiser.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-primary-300"
                      >
                        {/* Advertiser Card */}
                        <div className="p-6">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-2xl">
                              {advertiser.icon_url || '🚛'}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-800 mb-1">
                                {advertiser.company_name}
                              </h3>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <FaStar key={i} className="text-yellow-400 text-sm" />
                                ))}
                                <span className="text-xs text-gray-600 mr-1">(5.0)</span>
                              </div>
                            </div>
                            {advertiser.is_trusted && (
                              <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                <FaCheckCircle /> موثوق
                              </div>
                            )}
                          </div>
                          
                          {advertiser.services && (
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                              {advertiser.services}
                            </p>
                          )}
                          
                          <div className="flex gap-2">
                            <a
                              href={`tel:${advertiser.phone}`}
                              className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-all flex items-center justify-center gap-2 font-semibold"
                            >
                              <FaPhone /> اتصال
                            </a>
                            {advertiser.whatsapp && (
                              <a
                                href={`https://wa.me/${advertiser.whatsapp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2 font-semibold"
                              >
                                <FaWhatsapp /> واتساب
                              </a>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-12 text-center"
                  >
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">
                      لا توجد شركات متاحة حالياً
                    </h3>
                    <p className="text-gray-600 mb-6">
                      لا توجد شركات {categoryData.name_ar} في {cityData.name_ar} في الوقت الحالي.
                      <br />
                      يرجى المحاولة لاحقاً أو تصفح مدن أخرى.
                    </p>
                    <Link
                      href="/"
                      className="inline-block px-8 py-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      العودة للصفحة الرئيسية
                    </Link>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-12 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              هل تريد الإعلان عن خدماتك؟
            </h2>
            <p className="text-lg mb-6 opacity-90">
              انضم إلى منصتنا واحصل على عملاء جدد
            </p>
            <a
              href="/"
              className="inline-block bg-white text-primary-600 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
            >
              ابدأ الآن
            </a>
          </div>
        </section>
      </div>
    </>
  );
}

// ============ Static Site Generation ============

export const getStaticPaths: GetStaticPaths = async () => {
  const cities = Object.keys(CITIES);
  const categories = Object.keys(CATEGORIES);
  
  const paths = cities.flatMap(city =>
    categories.map(category => ({
      params: { city, category }
    }))
  );

  return {
    paths,
    fallback: false // 404 for undefined routes
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const city = params?.city as string;
  const category = params?.category as string;

  // Validate
  if (!CITIES[city as keyof typeof CITIES] || !CATEGORIES[category as keyof typeof CATEGORIES]) {
    return { notFound: true };
  }

  return {
    props: {
      city,
      category,
      cityData: CITIES[city as keyof typeof CITIES],
      categoryData: CATEGORIES[category as keyof typeof CATEGORIES]
    },
    revalidate: 60 // Revalidate every 60 seconds
  };
};

