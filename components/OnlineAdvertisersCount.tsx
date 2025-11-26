import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTruck } from 'react-icons/fa';

interface OnlineAdvertisersCountProps {
  totalAdvertisers: number;
  onlineAdvertisers: number;
}

const OnlineAdvertisersCount: React.FC<OnlineAdvertisersCountProps> = ({
  totalAdvertisers,
  onlineAdvertisers
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // إخفاء وإظهار بشكل دوري (كل 20 ثانية يختفي لمدة 5 ثواني)
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => setIsVisible(true), 5000);
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-40 pointer-events-none">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="bg-white rounded-lg shadow-lg px-2.5 py-1.5 flex items-center gap-1.5 border-r-4 border-green-500 max-w-[160px]"
          >
            <div className="bg-green-100 rounded-full p-1 flex-shrink-0">
              <FaTruck className="text-green-600 text-xs" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-gray-800">{totalAdvertisers}</span>
                <span className="text-[10px] text-gray-600">شركة</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] text-green-600 font-semibold">
                  {onlineAdvertisers} متاحة الآن
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnlineAdvertisersCount;

