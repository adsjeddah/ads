/**
 * 🎯 مكون اختيار القطاع (Sector Selector)
 * 
 * الاستخدام:
 * =======
 * Step 1 قبل اختيار الباقات
 * اختيار القطاع يحدد الباقات المتاحة
 * 
 * القطاعات:
 * =========
 * - نقل العفش (movers)
 * - النظافة (cleaning)
 * - كشف تسربات المياه (water-leaks)
 * - مكافحة الحشرات (pest-control)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { FaTruck, FaBroom, FaTint, FaBug, FaCheckCircle } from 'react-icons/fa';

export type SectorType = 'movers' | 'cleaning' | 'water-leaks' | 'pest-control' | null;

interface Sector {
  id: SectorType;
  name_ar: string;
  name_en: string;
  description: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
}

const SECTORS: Sector[] = [
  {
    id: 'movers',
    name_ar: 'نقل العفش',
    name_en: 'Moving Services',
    description: 'خدمات نقل العفش والأثاث المنزلي والمكتبي',
    icon: FaTruck,
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 'cleaning',
    name_ar: 'النظافة',
    name_en: 'Cleaning Services',
    description: 'خدمات التنظيف المنزلي والتجاري',
    icon: FaBroom,
    color: 'green',
    gradient: 'from-green-500 to-emerald-600'
  },
  {
    id: 'water-leaks',
    name_ar: 'كشف تسربات المياه',
    name_en: 'Water Leak Detection',
    description: 'خدمات كشف وإصلاح تسربات المياه',
    icon: FaTint,
    color: 'cyan',
    gradient: 'from-cyan-500 to-blue-500'
  },
  {
    id: 'pest-control',
    name_ar: 'مكافحة الحشرات',
    name_en: 'Pest Control',
    description: 'خدمات مكافحة الحشرات والقوارض',
    icon: FaBug,
    color: 'red',
    gradient: 'from-red-500 to-orange-600'
  }
];

interface Props {
  selectedSector: SectorType;
  onSectorChange: (sector: SectorType) => void;
}

export default function SectorSelector({ selectedSector, onSectorChange }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-xl shadow-lg">
          1
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            اختر القطاع
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            حدد نوع الخدمة التي يقدمها المعلن
          </p>
        </div>
      </div>

      {/* Sectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {SECTORS.map((sector) => {
          const IconComponent = sector.icon;
          const isSelected = selectedSector === sector.id;
          
          return (
            <motion.div
              key={sector.id}
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSectorChange(sector.id as SectorType)}
              className={`
                cursor-pointer rounded-xl border-2 transition-all overflow-hidden
                ${isSelected 
                  ? `border-${sector.color}-500 shadow-xl ring-2 ring-${sector.color}-200` 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
                }
              `}
            >
              {/* Header with Gradient */}
              <div className={`bg-gradient-to-br ${sector.gradient} p-6 text-white text-center`}>
                <div className="flex justify-center mb-3">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white bg-opacity-20 backdrop-blur-sm">
                    <IconComponent className="text-4xl" />
                  </div>
                </div>
                <h3 className="font-bold text-xl mb-1">{sector.name_ar}</h3>
                <p className="text-xs opacity-90">{sector.name_en}</p>
              </div>

              {/* Body */}
              <div className="p-4 bg-white">
                <p className="text-sm text-gray-600 leading-relaxed min-h-[40px]">
                  {sector.description}
                </p>
                
                {isSelected && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold text-sm"
                  >
                    <FaCheckCircle />
                    <span>محدد</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info Message */}
      {!selectedSector && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-5 flex items-start gap-4">
          <div className="text-blue-500 text-3xl mt-1">
            👆
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-lg text-gray-800 mb-2">
              يرجى اختيار القطاع
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              اختر القطاع الذي ينتمي إليه المعلن لعرض الباقات المناسبة. 
              سيتم عرض الباقات الخاصة بالقطاع المحدد فقط في الخطوة التالية.
            </p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {selectedSector && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 flex items-start gap-4"
        >
          <div className="text-green-500 text-3xl">
            ✅
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-lg text-gray-800 mb-1">
              تم اختيار القطاع بنجاح!
            </h4>
            <p className="text-sm text-gray-700">
              <strong>{SECTORS.find(s => s.id === selectedSector)?.name_ar}</strong> - 
              انتقل للخطوة التالية لاختيار التغطية الجغرافية والباقات
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

