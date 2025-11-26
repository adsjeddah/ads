import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaMapMarkerAlt, FaClock, FaTimes } from 'react-icons/fa';

interface NotificationData {
  name: string;
  action: string;
  neighborhood: string;
  timeAgo: string;
}

interface LiveOrderNotificationsProps {
  city: string; // 'riyadh' | 'jeddah' | 'dammam'
  service: string; // 'movers' | 'cleaning' | 'water-leaks' | 'pest-control'
}

const LiveOrderNotifications: React.FC<LiveOrderNotificationsProps> = ({
  city,
  service
}) => {
  const [currentNotification, setCurrentNotification] = useState<NotificationData | null>(null);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    // التحقق من localStorage إذا كان المستخدم قد أخفى الإشعارات
    const hidden = localStorage.getItem('hideOrderNotifications');
    if (hidden === 'true') {
      setIsHidden(true);
    }
  }, []);

  // بيانات الأسماء السعودية
  const saudiNames = [
    'محمد أحمد', 'عبدالله خالد', 'سعد العتيبي', 'فهد المطيري', 'عثمان أحمد',
    'ناصر السعيد', 'سلطان القحطاني', 'بندر العمري', 'طلال الشمري', 'ماجد الدوسري',
    'راشد الزهراني', 'تركي الحربي', 'خالد العنزي', 'فيصل الشهري', 'عبدالعزيز السهلي'
  ];

  // أحياء حسب المدن
  const neighborhoods: { [key: string]: string[] } = {
    riyadh: [
      'الملقا', 'العليا', 'النخيل', 'الياسمين', 'الربوة', 'الروضة',
      'المروج', 'الصحافة', 'الندى', 'النرجس', 'العقيق', 'الورود'
    ],
    jeddah: [
      'الشاطئ', 'الصفا', 'الروضة', 'البوادي', 'الحمدانية', 'النعيم',
      'الزهراء', 'المرجان', 'أبحر', 'السلامة', 'الثغر', 'الواحة'
    ],
    dammam: [
      'الفيصلية', 'الشاطئ', 'الفرسان', 'الأمانة', 'النور', 'الجلوية',
      'الشعلة', 'الضباب', 'الأثير', 'الصدفة', 'المريكبات', 'الخليج'
    ]
  };

  // أفعال حسب نوع الخدمة
  const serviceActions: { [key: string]: string[] } = {
    'movers': [
      'حجز موعد لنقل الأثاث',
      'طلب عرض سعر للنقل',
      'حجز خدمة نقل عفش',
      'استفسار عن النقل'
    ],
    'cleaning': [
      'حجز خدمة تنظيف',
      'طلب تنظيف منزل',
      'حجز تنظيف شقة',
      'طلب عرض سعر للتنظيف'
    ],
    'water-leaks': [
      'طلب كشف تسربات',
      'حجز فحص التسربات',
      'طلب معاينة عاجلة',
      'استفسار عن كشف التسريبات'
    ],
    'pest-control': [
      'طلب رش مبيدات',
      'حجز خدمة مكافحة حشرات',
      'طلب معاينة للرش',
      'حجز مكافحة القوارض'
    ]
  };

  // توليد إشعار عشوائي
  const generateRandomNotification = (): NotificationData => {
    const randomName = saudiNames[Math.floor(Math.random() * saudiNames.length)];
    const cityNeighborhoods = neighborhoods[city] || neighborhoods.riyadh;
    const randomNeighborhood = cityNeighborhoods[Math.floor(Math.random() * cityNeighborhoods.length)];
    const actions = serviceActions[service] || serviceActions.movers;
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    const randomMinutes = Math.floor(Math.random() * 45) + 5; // من 5 إلى 50 دقيقة

    return {
      name: randomName,
      action: randomAction,
      neighborhood: randomNeighborhood,
      timeAgo: `منذ ${randomMinutes} د`
    };
  };

  useEffect(() => {
    if (isHidden) return;

    // عرض أول إشعار بعد 3 ثواني
    const initialTimer = setTimeout(() => {
      setCurrentNotification(generateRandomNotification());
    }, 3000);

    return () => clearTimeout(initialTimer);
  }, [isHidden]);

  useEffect(() => {
    if (currentNotification && !isHidden) {
      // تدوير الإشعارات كل 10 ثواني
      const interval = setInterval(() => {
        setCurrentNotification(null);
        
        setTimeout(() => {
          setCurrentNotification(generateRandomNotification());
        }, 300);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [currentNotification, isHidden]);

  const handleHide = () => {
    setIsHidden(true);
    setCurrentNotification(null);
    localStorage.setItem('hideOrderNotifications', 'true');
  };

  if (isHidden) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <AnimatePresence mode="wait">
        {currentNotification && (
          <motion.div
            key={currentNotification.name + currentNotification.timeAgo}
            initial={{ opacity: 0, x: -100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="bg-white rounded-lg shadow-lg px-3 py-2 max-w-[240px] border-r-4 border-blue-500 relative"
          >
            {/* زر الإخفاء */}
            <button
              onClick={handleHide}
              className="absolute -top-1 -right-1 bg-gray-600 hover:bg-gray-700 text-white rounded-full w-4 h-4 flex items-center justify-center transition-colors pointer-events-auto"
              title="إخفاء"
            >
              <FaTimes className="text-[8px]" />
            </button>
            <div className="flex items-start gap-2">
              <div className="bg-green-100 rounded-full p-1.5 flex-shrink-0 mt-0.5">
                <FaCheckCircle className="text-green-600 text-xs" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs font-bold text-gray-800 truncate">
                    {currentNotification.name}
                  </span>
                </div>
                <p className="text-[10px] text-gray-600 leading-tight mb-1">
                  {currentNotification.action}
                </p>
                <div className="flex items-center justify-between text-[9px] text-gray-500">
                  <div className="flex items-center gap-1">
                    <FaMapMarkerAlt className="text-blue-500 text-[9px]" />
                    <span className="truncate max-w-[90px]">{currentNotification.neighborhood}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaClock className="text-gray-400 text-[8px]" />
                    <span className="whitespace-nowrap">{currentNotification.timeAgo}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Progress bar */}
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-green-500 rounded-bl-lg"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 9.7, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveOrderNotifications;

