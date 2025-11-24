/**
 * مكون اختيار التغطية الجغرافية والباقات
 * يدعم:
 * - تغطية المملكة
 * - تغطية مدينة محددة
 * - تغطية المملكة + مدينة
 * - اختيار باقات متعددة
 * - حساب المجموع الكلي
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaGlobe, 
  FaMapMarkerAlt, 
  FaCheckCircle, 
  FaInfoCircle,
  FaBox,
  FaPlus
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

export default function CoverageAndPackageSelector({ 
  plans, 
  onSelectionChange,
  initialCoverageType = null 
}: Props) {
  const [coverageType, setCoverageType] = useState<CoverageType>(initialCoverageType);
  const [selectedPackages, setSelectedPackages] = useState<SelectedPackage[]>([]);
  const [availableCities] = useState(['jeddah']); // يمكن توسيعها لاحقاً

  // فلترة الباقات حسب النوع
  const kingdomPlans = plans.filter(p => p.plan_type === 'kingdom');
  const cityPlans = plans.filter(p => p.plan_type === 'city' || !p.plan_type);

  // حساب المجموع الكلي
  const totalAmount = selectedPackages.reduce((sum, pkg) => sum + pkg.plan.price, 0);

  useEffect(() => {
    onSelectionChange(selectedPackages);
  }, [selectedPackages, onSelectionChange]);

  // إعادة تعيين الباقات المختارة عند تغيير نوع التغطية
  useEffect(() => {
    setSelectedPackages([]);
  }, [coverageType]);

  const handlePackageSelect = (plan: Plan, coverage: 'kingdom' | 'city', city?: string) => {
    // التحقق من عدم التكرار
    const exists = selectedPackages.find(
      pkg => pkg.plan_id === plan.id && pkg.coverage_type === coverage && pkg.city === city
    );

    if (exists) {
      // إزالة الباقة
      setSelectedPackages(prev => 
        prev.filter(pkg => !(pkg.plan_id === plan.id && pkg.coverage_type === coverage && pkg.city === city))
      );
    } else {
      // إضافة الباقة
      const newPackage: SelectedPackage = {
        plan_id: plan.id,
        plan: plan,
        coverage_type: coverage,
        city: city
      };
      setSelectedPackages(prev => [...prev, newPackage]);
    }
  };

  const isPackageSelected = (planId: string, coverage: 'kingdom' | 'city', city?: string) => {
    return selectedPackages.some(
      pkg => pkg.plan_id === planId && pkg.coverage_type === coverage && pkg.city === city
    );
  };

  return (
    <div className="space-y-6">
      {/* اختيار نوع التغطية */}
      <div>
        <label className="block text-gray-700 font-bold text-lg mb-4">
          <FaGlobe className="inline ml-2" /> اختر نوع التغطية الجغرافية
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* تغطية المملكة */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCoverageType('kingdom')}
            className={`cursor-pointer p-6 rounded-xl border-2 transition-all ${
              coverageType === 'kingdom'
                ? 'border-primary-500 bg-primary-50 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <FaGlobe className={`text-3xl mt-1 ${
                coverageType === 'kingdom' ? 'text-primary-600' : 'text-gray-400'
              }`} />
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">المملكة بالكامل</h3>
                <p className="text-sm text-gray-600">
                  ظهور الإعلان في الصفحة الرئيسية لجميع زوار المملكة
                </p>
                {coverageType === 'kingdom' && (
                  <div className="mt-2 flex items-center gap-1 text-green-600 text-sm font-semibold">
                    <FaCheckCircle />
                    <span>محدد</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* تغطية مدينة محددة */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCoverageType('city')}
            className={`cursor-pointer p-6 rounded-xl border-2 transition-all ${
              coverageType === 'city'
                ? 'border-secondary-500 bg-secondary-50 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <FaMapMarkerAlt className={`text-3xl mt-1 ${
                coverageType === 'city' ? 'text-secondary-600' : 'text-gray-400'
              }`} />
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">مدينة محددة</h3>
                <p className="text-sm text-gray-600">
                  ظهور الإعلان في صفحة مدينة واحدة (مثل جدة)
                </p>
                {coverageType === 'city' && (
                  <div className="mt-2 flex items-center gap-1 text-green-600 text-sm font-semibold">
                    <FaCheckCircle />
                    <span>محدد</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* تغطية المملكة + مدينة */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCoverageType('both')}
            className={`cursor-pointer p-6 rounded-xl border-2 transition-all ${
              coverageType === 'both'
                ? 'border-accent-500 bg-accent-50 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex flex-col gap-1">
                <FaGlobe className={`text-2xl ${
                  coverageType === 'both' ? 'text-accent-600' : 'text-gray-400'
                }`} />
                <FaMapMarkerAlt className={`text-xl ${
                  coverageType === 'both' ? 'text-accent-600' : 'text-gray-400'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">المملكة + مدينة</h3>
                <p className="text-sm text-gray-600">
                  ظهور الإعلان في الصفحة الرئيسية ومدينة محددة
                </p>
                <div className="mt-1 text-xs text-orange-600 font-semibold">
                  ⭐ الأكثر شعبية
                </div>
                {coverageType === 'both' && (
                  <div className="mt-2 flex items-center gap-1 text-green-600 text-sm font-semibold">
                    <FaCheckCircle />
                    <span>محدد</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* عرض الباقات المتاحة */}
      <AnimatePresence mode="wait">
        {coverageType && (
          <motion.div
            key={coverageType}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* باقات المملكة */}
            {(coverageType === 'kingdom' || coverageType === 'both') && (
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaGlobe className="text-primary-500" />
                  باقات المملكة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {kingdomPlans.map((plan) => (
                    <motion.div
                      key={`kingdom-${plan.id}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePackageSelect(plan, 'kingdom')}
                      className={`cursor-pointer p-5 rounded-xl border-2 transition-all ${
                        isPackageSelected(plan.id, 'kingdom')
                          ? 'border-primary-500 bg-primary-50 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-bold text-gray-800">{plan.name}</h4>
                        {isPackageSelected(plan.id, 'kingdom') && (
                          <FaCheckCircle className="text-green-500 text-xl flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-3xl font-bold text-primary-600">
                          {plan.price.toLocaleString('ar-SA')}
                        </span>
                        <span className="text-gray-600">ريال</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        المدة: <span className="font-semibold">{plan.duration_days} يوم</span>
                      </div>
                      {plan.features && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="space-y-1">
                            {(Array.isArray(plan.features) ? plan.features : plan.features.split('\n'))
                              .slice(0, 3)
                              .map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                                  <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* باقات المدن */}
            {(coverageType === 'city' || coverageType === 'both') && (
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-secondary-500" />
                  باقات المدن
                </h3>
                
                {/* اختيار المدينة */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    اختر المدينة
                  </label>
                  <div className="flex gap-3">
                    {availableCities.map((city) => (
                      <div
                        key={city}
                        className="px-4 py-2 bg-secondary-100 text-secondary-800 rounded-lg font-semibold"
                      >
                        {city === 'jeddah' ? 'جدة' : city}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {cityPlans.map((plan) => (
                    <motion.div
                      key={`city-${plan.id}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePackageSelect(plan, 'city', 'jeddah')}
                      className={`cursor-pointer p-5 rounded-xl border-2 transition-all ${
                        isPackageSelected(plan.id, 'city', 'jeddah')
                          ? 'border-secondary-500 bg-secondary-50 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-bold text-gray-800">{plan.name}</h4>
                        {isPackageSelected(plan.id, 'city', 'jeddah') && (
                          <FaCheckCircle className="text-green-500 text-xl flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-3xl font-bold text-secondary-600">
                          {plan.price.toLocaleString('ar-SA')}
                        </span>
                        <span className="text-gray-600">ريال</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        المدة: <span className="font-semibold">{plan.duration_days} يوم</span>
                      </div>
                      {plan.features && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="space-y-1">
                            {(Array.isArray(plan.features) ? plan.features : plan.features.split('\n'))
                              .slice(0, 3)
                              .map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                                  <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* ملخص الباقات المختارة */}
            {selectedPackages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-xl border-2 border-green-200"
              >
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaBox className="text-green-600" />
                  الباقات المختارة ({selectedPackages.length})
                </h3>
                <div className="space-y-3 mb-4">
                  {selectedPackages.map((pkg, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white p-3 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {pkg.coverage_type === 'kingdom' ? (
                          <FaGlobe className="text-primary-500 text-xl" />
                        ) : (
                          <FaMapMarkerAlt className="text-secondary-500 text-xl" />
                        )}
                        <div>
                          <div className="font-semibold text-gray-800">{pkg.plan.name}</div>
                          <div className="text-xs text-gray-600">
                            {pkg.coverage_type === 'kingdom' ? 'المملكة' : `${pkg.city === 'jeddah' ? 'جدة' : pkg.city}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-lg text-gray-800">
                          {pkg.plan.price.toLocaleString('ar-SA')} ر.س
                        </div>
                        <div className="text-xs text-gray-600">{pkg.plan.duration_days} يوم</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* المجموع الكلي */}
                <div className="border-t-2 border-green-300 pt-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">المجموع الكلي</div>
                    <div className="text-xs text-gray-500 mt-1">
                      قبل الخصومات والضريبة
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {totalAmount.toLocaleString('ar-SA')} ر.س
                  </div>
                </div>
              </motion.div>
            )}

            {/* رسالة تنبيهية */}
            {selectedPackages.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <FaInfoCircle className="text-blue-500 text-xl mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <strong>ملاحظة:</strong> يرجى اختيار باقة واحدة على الأقل للمتابعة. 
                  يمكنك اختيار عدة باقات في نفس الوقت للحصول على تغطية أوسع.
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

