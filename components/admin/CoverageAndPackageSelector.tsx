/**
 * 🎯 مكون اختيار التغطية الجغرافية والباقات - النظام الذكي المتدرج
 * 
 * النظام الجديد:
 * ============
 * Step 1: اختيار نوع التغطية (مملكة / مدينة / كلاهما)
 * Step 2: عرض الباقات المناسبة فقط بشكل ديناميكي
 * Step 3: ملخص تلقائي ومباشر
 * 
 * المزايا:
 * ========
 * ✅ Progressive Disclosure - كشف تدريجي
 * ✅ واجهة نظيفة غير مزدحمة
 * ✅ خطوات واضحة ومنطقية
 * ✅ قابلية توسع عالية (مدن + قطاعات)
 * ✅ تجربة مستخدم احترافية
 * 
 * البنية القابلة للتوسع:
 * ===================
 * - إضافة مدن جديدة بسهولة
 * - إضافة قطاعات جديدة (سباكة، نظافة، إلخ)
 * - دعم باقات ديناميكية
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaGlobe, 
  FaMapMarkerAlt, 
  FaCheckCircle, 
  FaInfoCircle,
  FaBox,
  FaStar,
  FaArrowDown,
  FaCheck
} from 'react-icons/fa';

export type CoverageType = 'kingdom' | 'city' | 'both' | null;

export interface Plan {
  id: string;
  name: string;
  description?: string;
  duration_days: number;
  price: number;
  features?: string | string[];
  plan_type?: 'kingdom' | 'city';
  city?: string;
  is_active?: boolean;
}

export interface SelectedPackage {
  plan_id: string;
  plan: Plan;
  coverage_type: 'kingdom' | 'city';
  city?: string;
}

interface Props {
  plans: Plan[];
  onSelectionChange: (packages: SelectedPackage[]) => void;
  initialCoverageType?: CoverageType;
}

// قائمة المدن المتاحة (قابلة للتوسع)
const AVAILABLE_CITIES = [
  { id: 'jeddah', name: 'جدة', emoji: '🏙️' },
  // يمكن إضافة المزيد لاحقاً:
  // { id: 'riyadh', name: 'الرياض', emoji: '🌆' },
  // { id: 'makkah', name: 'مكة المكرمة', emoji: '🕋' },
  // { id: 'dammam', name: 'الدمام', emoji: '🏖️' },
];

export default function CoverageAndPackageSelector({ 
  plans, 
  onSelectionChange,
  initialCoverageType = null 
}: Props) {
  // ============ State Management ============
  const [coverageType, setCoverageType] = useState<CoverageType>(initialCoverageType);
  const [selectedKingdomPlan, setSelectedKingdomPlan] = useState<Plan | null>(null);
  const [selectedCityPlan, setSelectedCityPlan] = useState<Plan | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('jeddah');

  // ============ Plans Filtering ============
  const kingdomPlans = plans.filter(p => p.plan_type === 'kingdom' && p.is_active !== false);
  const cityPlans = plans.filter(p => (p.plan_type === 'city' || !p.plan_type) && p.is_active !== false);

  // ============ Calculations ============
  const totalAmount = (selectedKingdomPlan?.price || 0) + (selectedCityPlan?.price || 0);
  
  // التحقق من اكتمال الاختيارات
  const isKingdomStepComplete = coverageType !== 'kingdom' && coverageType !== 'both' || selectedKingdomPlan !== null;
  const isCityStepComplete = coverageType !== 'city' && coverageType !== 'both' || (selectedCityPlan !== null && selectedCity !== null);
  const isAllComplete = isKingdomStepComplete && isCityStepComplete && coverageType !== null;

  // ============ Effects ============
  useEffect(() => {
    // بناء مصفوفة الباقات المختارة
    const packages: SelectedPackage[] = [];
    
    if (selectedKingdomPlan) {
      packages.push({
        plan_id: selectedKingdomPlan.id,
        plan: selectedKingdomPlan,
        coverage_type: 'kingdom'
      });
    }
    
    if (selectedCityPlan && selectedCity) {
      packages.push({
        plan_id: selectedCityPlan.id,
        plan: selectedCityPlan,
        coverage_type: 'city',
        city: selectedCity
      });
    }
    
    onSelectionChange(packages);
  }, [selectedKingdomPlan, selectedCityPlan, selectedCity, onSelectionChange]);

  // إعادة تعيين الباقات عند تغيير نوع التغطية
  useEffect(() => {
    setSelectedKingdomPlan(null);
    setSelectedCityPlan(null);
  }, [coverageType]);

  // ============ Handlers ============
  const handleCoverageTypeChange = (type: CoverageType) => {
    setCoverageType(type);
  };

  const handleKingdomPlanSelect = (plan: Plan) => {
    setSelectedKingdomPlan(plan);
  };

  const handleCityPlanSelect = (plan: Plan) => {
    setSelectedCityPlan(plan);
  };

  // ============ Render ============
  return (
    <div className="space-y-8">
      {/* ==================== STEP 1: اختيار نوع التغطية ==================== */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-500 text-white font-bold text-lg">
            1
          </div>
          <h2 className="text-xl font-bold text-gray-800">
            اختر نوع التغطية الجغرافية
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* المملكة فقط */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCoverageTypeChange('kingdom')}
            className={`cursor-pointer p-6 rounded-xl border-2 transition-all ${
              coverageType === 'kingdom'
                ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 shadow-xl ring-2 ring-primary-200'
                : 'border-gray-200 hover:border-primary-300 bg-white hover:shadow-md'
            }`}
          >
            <div className="text-center">
              <div className="mb-3 flex justify-center">
                <FaGlobe className={`text-5xl ${
                  coverageType === 'kingdom' ? 'text-primary-600' : 'text-gray-400'
                }`} />
              </div>
              <h3 className="font-bold text-xl mb-2">المملكة بالكامل</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                ظهور الإعلان في الصفحة الرئيسية<br/>لجميع زوار المملكة
              </p>
              {coverageType === 'kingdom' && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold text-sm"
                >
                  <FaCheck />
                  <span>محدد</span>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* مدينة محددة */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCoverageTypeChange('city')}
            className={`cursor-pointer p-6 rounded-xl border-2 transition-all ${
              coverageType === 'city'
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-xl ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-blue-300 bg-white hover:shadow-md'
            }`}
          >
            <div className="text-center">
              <div className="mb-3 flex justify-center">
                <FaMapMarkerAlt className={`text-5xl ${
                  coverageType === 'city' ? 'text-blue-600' : 'text-gray-400'
                }`} />
              </div>
              <h3 className="font-bold text-xl mb-2">مدينة محددة</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                ظهور الإعلان في صفحة مدينة<br/>واحدة محددة (مثل جدة)
              </p>
              {coverageType === 'city' && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold text-sm"
                >
                  <FaCheck />
                  <span>محدد</span>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* المملكة + مدينة */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCoverageTypeChange('both')}
            className={`cursor-pointer p-6 rounded-xl border-2 transition-all relative ${
              coverageType === 'both'
                ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-amber-100 shadow-xl ring-2 ring-orange-200'
                : 'border-gray-200 hover:border-orange-300 bg-white hover:shadow-md'
            }`}
          >
            {/* شارة الأكثر شعبية */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                <FaStar className="text-yellow-300" />
                الأكثر شعبية
              </span>
            </div>
            
            <div className="text-center">
              <div className="mb-3 flex justify-center items-center gap-2">
                <FaGlobe className={`text-4xl ${
                  coverageType === 'both' ? 'text-orange-600' : 'text-gray-400'
                }`} />
                <span className="text-2xl font-bold text-gray-400">+</span>
                <FaMapMarkerAlt className={`text-4xl ${
                  coverageType === 'both' ? 'text-orange-600' : 'text-gray-400'
                }`} />
              </div>
              <h3 className="font-bold text-xl mb-2">المملكة + مدينة</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                ظهور الإعلان في الصفحة الرئيسية<br/>ومدينة محددة للتغطية الشاملة
              </p>
              {coverageType === 'both' && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold text-sm"
                >
                  <FaCheck />
                  <span>محدد</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ==================== STEP 2: الباقات (ديناميكية حسب الاختيار) ==================== */}
      <AnimatePresence mode="wait">
        {coverageType && (
          <motion.div
            key={coverageType}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* ========== باقات المملكة (إذا اختار kingdom أو both) ========== */}
            {(coverageType === 'kingdom' || coverageType === 'both') && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg ${
                    selectedKingdomPlan 
                      ? 'bg-green-500 text-white' 
                      : 'bg-primary-500 text-white'
                  }`}>
                    {selectedKingdomPlan ? <FaCheck /> : '2'}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <FaGlobe className="text-primary-500" />
                      اختر باقة المملكة
                      {coverageType === 'both' && <span className="text-sm text-red-600">(مطلوبة)</span>}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      ظهور الإعلان في prokr.net لجميع زوار المملكة
                    </p>
                  </div>
                </div>

                {/* Kingdom Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {kingdomPlans.length > 0 ? (
                    kingdomPlans.map((plan) => (
                      <motion.div
                        key={`kingdom-${plan.id}`}
                        whileHover={{ scale: 1.03, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleKingdomPlanSelect(plan)}
                        className={`cursor-pointer p-5 rounded-xl border-2 transition-all ${
                          selectedKingdomPlan?.id === plan.id
                            ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-blue-50 shadow-xl ring-2 ring-primary-200'
                            : 'border-gray-200 hover:border-primary-300 bg-white hover:shadow-lg'
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-bold text-lg text-gray-800">{plan.name}</h4>
                          {selectedKingdomPlan?.id === plan.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              <FaCheckCircle className="text-green-500 text-2xl flex-shrink-0" />
                            </motion.div>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-4 min-h-[40px]">{plan.description}</p>

                        {/* Price */}
                        <div className="bg-primary-50 rounded-lg p-3 mb-3">
                          <div className="flex items-baseline justify-center gap-2">
                            <span className="text-4xl font-bold text-primary-600">
                              {plan.price.toLocaleString('ar-SA')}
                            </span>
                            <span className="text-gray-700 font-semibold">ريال</span>
                          </div>
                          <div className="text-center text-sm text-gray-600 mt-1">
                            <FaBox className="inline ml-1" />
                            المدة: <span className="font-semibold">{plan.duration_days} يوم</span>
                          </div>
                        </div>

                        {/* Features */}
                        {plan.features && (
                          <div className="space-y-2">
                            {(Array.isArray(plan.features) ? plan.features : plan.features.split('\n'))
                              .slice(0, 3)
                              .map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                                  <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                          </div>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-8 text-gray-500">
                      <FaInfoCircle className="inline text-3xl mb-2" />
                      <p>لا توجد باقات متاحة حالياً</p>
                    </div>
                  )}
                </div>

                {/* Arrow Indicator for 'both' option */}
                {coverageType === 'both' && selectedKingdomPlan && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center mb-6"
                  >
                    <FaArrowDown className="text-4xl text-primary-500 animate-bounce" />
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ========== باقات المدن (إذا اختار city أو both) ========== */}
            {(coverageType === 'city' || coverageType === 'both') && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: coverageType === 'both' ? 0.2 : 0.1 }}
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg ${
                    selectedCityPlan 
                      ? 'bg-green-500 text-white' 
                      : 'bg-blue-500 text-white'
                  }`}>
                    {selectedCityPlan ? <FaCheck /> : (coverageType === 'both' ? '3' : '2')}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <FaMapMarkerAlt className="text-blue-500" />
                      اختر باقة المدينة
                      {coverageType === 'both' && <span className="text-sm text-red-600">(مطلوبة)</span>}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      ظهور الإعلان في صفحة مدينة محددة (مثل prokr.net/jeddah/movers)
                    </p>
                  </div>
                </div>

                {/* City Selector */}
                <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    🏙️ اختر المدينة:
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {AVAILABLE_CITIES.map((city) => (
                      <motion.button
                        key={city.id}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCity(city.id)}
                        className={`px-5 py-3 rounded-lg font-bold text-lg transition-all ${
                          selectedCity === city.id
                            ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300'
                            : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        <span className="ml-2">{city.emoji}</span>
                        {city.name}
                        {selectedCity === city.id && (
                          <FaCheckCircle className="inline mr-2 text-green-300" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* City Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {cityPlans.length > 0 ? (
                    cityPlans.map((plan) => (
                      <motion.div
                        key={`city-${plan.id}`}
                        whileHover={{ scale: 1.03, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCityPlanSelect(plan)}
                        className={`cursor-pointer p-5 rounded-xl border-2 transition-all ${
                          selectedCityPlan?.id === plan.id
                            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-xl ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-blue-300 bg-white hover:shadow-lg'
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-bold text-lg text-gray-800">{plan.name}</h4>
                          {selectedCityPlan?.id === plan.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              <FaCheckCircle className="text-green-500 text-2xl flex-shrink-0" />
                            </motion.div>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-4 min-h-[40px]">{plan.description}</p>

                        {/* Price */}
                        <div className="bg-blue-50 rounded-lg p-3 mb-3">
                          <div className="flex items-baseline justify-center gap-2">
                            <span className="text-4xl font-bold text-blue-600">
                              {plan.price.toLocaleString('ar-SA')}
                            </span>
                            <span className="text-gray-700 font-semibold">ريال</span>
                          </div>
                          <div className="text-center text-sm text-gray-600 mt-1">
                            <FaBox className="inline ml-1" />
                            المدة: <span className="font-semibold">{plan.duration_days} يوم</span>
                          </div>
                        </div>

                        {/* Features */}
                        {plan.features && (
                          <div className="space-y-2">
                            {(Array.isArray(plan.features) ? plan.features : plan.features.split('\n'))
                              .slice(0, 3)
                              .map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                                  <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                          </div>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-8 text-gray-500">
                      <FaInfoCircle className="inline text-3xl mb-2" />
                      <p>لا توجد باقات متاحة حالياً</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ========== ملخص الباقات المختارة ========== */}
            {(selectedKingdomPlan || selectedCityPlan) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-300 rounded-2xl p-6 shadow-xl"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500 text-white">
                    <FaCheckCircle className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      📦 ملخص الباقات المختارة
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      مراجعة الباقات قبل الانتقال للخطوات التالية
                    </p>
                  </div>
                </div>

                {/* Selected Packages */}
                <div className="space-y-3 mb-5">
                  {/* Kingdom Package */}
                  {selectedKingdomPlan && (
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="bg-white rounded-xl p-4 shadow-md border-l-4 border-primary-500"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-100">
                            <FaGlobe className="text-primary-600 text-2xl" />
                          </div>
                          <div>
                            <div className="font-bold text-lg text-gray-800">
                              {selectedKingdomPlan.name}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                              <FaGlobe className="text-primary-500" />
                              <span>تغطية المملكة</span>
                              <span className="text-gray-400">•</span>
                              <span>{selectedKingdomPlan.duration_days} يوم</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="text-2xl font-bold text-primary-600">
                            {selectedKingdomPlan.price.toLocaleString('ar-SA')}
                          </div>
                          <div className="text-sm text-gray-600">ريال</div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* City Package */}
                  {selectedCityPlan && (
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white rounded-xl p-4 shadow-md border-l-4 border-blue-500"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
                            <FaMapMarkerAlt className="text-blue-600 text-2xl" />
                          </div>
                          <div>
                            <div className="font-bold text-lg text-gray-800">
                              {selectedCityPlan.name}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                              <FaMapMarkerAlt className="text-blue-500" />
                              <span>
                                {AVAILABLE_CITIES.find(c => c.id === selectedCity)?.name || selectedCity}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span>{selectedCityPlan.duration_days} يوم</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="text-2xl font-bold text-blue-600">
                            {selectedCityPlan.price.toLocaleString('ar-SA')}
                          </div>
                          <div className="text-sm text-gray-600">ريال</div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Total Amount */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold opacity-90">المجموع الكلي</div>
                      <div className="text-sm opacity-75 mt-1">
                        قبل الخصومات والضريبة
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-4xl font-bold">
                        {totalAmount.toLocaleString('ar-SA')}
                      </div>
                      <div className="text-lg font-semibold">ريال سعودي</div>
                    </div>
                  </div>
                </div>

                {/* Success Badge */}
                {isAllComplete && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.4 }}
                    className="mt-4 text-center"
                  >
                    <span className="inline-flex items-center gap-2 px-5 py-2 bg-green-100 text-green-800 rounded-full font-bold">
                      <FaCheckCircle className="text-xl" />
                      تم اختيار جميع الباقات المطلوبة بنجاح!
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ========== رسائل تنبيهية وإرشادية ========== */}
            {!selectedKingdomPlan && !selectedCityPlan && coverageType && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-5 flex items-start gap-4"
              >
                <FaInfoCircle className="text-blue-500 text-3xl mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-gray-800 mb-2">
                    👆 يرجى اختيار الباقات المطلوبة
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {coverageType === 'kingdom' && 'اختر باقة واحدة من باقات المملكة للمتابعة.'}
                    {coverageType === 'city' && 'اختر المدينة ثم اختر باقة واحدة من باقات المدن للمتابعة.'}
                    {coverageType === 'both' && 'يجب اختيار باقة واحدة من المملكة وباقة واحدة من المدن للحصول على التغطية الشاملة.'}
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

