import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  FaCalculator, FaHome, FaTruck, FaRoute, FaBoxes,
  FaTools, FaWarehouse, FaBuilding, FaMoneyBillWave,
  FaInfoCircle, FaCheckCircle, FaArrowRight, FaArrowLeft,
  FaClock, FaShieldAlt, FaPhone, FaWhatsapp
} from 'react-icons/fa';
import { MdApartment, MdLocalShipping, MdLocationOn } from 'react-icons/md';

interface Advertiser {
  id: string;
  companyName: string;
  whatsapp: string;
  phone: string;
  status: string;
}

// أسعار واقعية بناءً على السوق السعودي في جدة - نوفمبر 2025
// تم تحديث الأسعار لتكون منطقية وعادلة للعميل ومقدم الخدمة
const PRICING_DATA = {
  // أسعار أساسية لكل نوع غرفة (محدثة حسب متوسط السوق)
  roomTypes: {
    bedroom: { name: 'غرفة نوم', basePrice: 280, items: 15 },       // واقعي: 250-300 ريال
    livingRoom: { name: 'غرفة معيشة', basePrice: 320, items: 20 },  // أكبر حجماً
    kitchen: { name: 'مطبخ', basePrice: 240, items: 25 },           // كثير القطع
    bathroom: { name: 'حمام', basePrice: 100, items: 10 },          // بسيط
    office: { name: 'مكتب', basePrice: 200, items: 12 },            // متوسط
    storage: { name: 'مخزن', basePrice: 150, items: 30 },           // حسب المحتويات
  },
  
  // معاملات المسافة (محدثة لتكون منطقية)
  distanceMultipliers: {
    local: { name: 'داخل المدينة (0-20 كم)', multiplier: 1, baseFee: 0 },
    nearCity: { name: 'أطراف المدينة (20-50 كم)', multiplier: 1.2, baseFee: 150 },      // معقول
    betweenCities: { name: 'بين المدن (50-200 كم)', multiplier: 1.5, baseFee: 400 },    // واقعي
    longDistance: { name: 'مسافات طويلة (+200 كم)', multiplier: 2.0, baseFee: 800 },   // مناسب
  },
  
  // رسوم إضافية للطوابق (محدثة - أقل من السابق)
  floorCharges: {
    ground: { name: 'دور أرضي', charge: 0 },
    first: { name: 'الدور الأول', charge: 50 },           // منطقي
    second: { name: 'الدور الثاني', charge: 100 },        // معقول
    third: { name: 'الدور الثالث', charge: 150 },         // عادل
    higher: { name: 'أعلى من الثالث', charge: 50 },      // لكل دور إضافي
  },
  
  // خدمات إضافية (محدثة - أسعار واقعية)
  additionalServices: {
    packing: { name: 'تغليف احترافي', price: 400 },               // شامل المواد
    dismantleAssemble: { name: 'فك وتركيب', price: 300 },         // حسب الكمية
    storage: { name: 'تخزين مؤقت (شهر)', price: 600 },            // معقول
    insurance: { name: 'تأمين على العفش', price: 200 },          // نسبة من القيمة
    express: { name: 'خدمة سريعة (نفس اليوم)', price: 400 },     // استعجال
    elevator: { name: 'استخدام رافعة أثاث', price: 300 },        // حسب الطوابق
  },
  
  // أحجام الشاحنات (محدثة - أسعار السوق الحالية)
  truckSizes: {
    small: { name: 'شاحنة صغيرة (1-2 غرف)', capacity: 30, basePrice: 250 },      // مناسب
    medium: { name: 'شاحنة متوسطة (3-4 غرف)', capacity: 60, basePrice: 400 },   // واقعي
    large: { name: 'شاحنة كبيرة (5-6 غرف)', capacity: 100, basePrice: 600 },    // عادل
    xlarge: { name: 'شاحنة ضخمة (+6 غرف)', capacity: 150, basePrice: 900 },     // منطقي
  },
};

interface Room {
  type: keyof typeof PRICING_DATA.roomTypes;
  quantity: number;
}

export default function Calculator() {
  const [step, setStep] = useState(1);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [rooms, setRooms] = useState<Room[]>([
    { type: 'bedroom', quantity: 0 },
    { type: 'livingRoom', quantity: 0 },
    { type: 'kitchen', quantity: 0 },
    { type: 'bathroom', quantity: 0 },
    { type: 'office', quantity: 0 },
    { type: 'storage', quantity: 0 },
  ]);
  const [distance, setDistance] = useState<keyof typeof PRICING_DATA.distanceMultipliers>('local');
  const [fromFloor, setFromFloor] = useState<keyof typeof PRICING_DATA.floorCharges>('ground');
  const [toFloor, setToFloor] = useState<keyof typeof PRICING_DATA.floorCharges>('ground');
  const [additionalServices, setAdditionalServices] = useState<string[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    fromCity: '',
    toCity: '',
    preferredDate: '',
  });
  
  const [totalPrice, setTotalPrice] = useState(0);
  const [priceBreakdown, setPriceBreakdown] = useState<any>({});

  // جلب المعلنين النشطين
  useEffect(() => {
    const fetchAdvertisers = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/advertisers?status=active`);
        setAdvertisers(response.data);
      } catch (error) {
        console.error('Error fetching advertisers:', error);
      }
    };
    fetchAdvertisers();
  }, []);

  // حساب السعر الإجمالي
  const calculatePrice = () => {
    let breakdown: any = {
      rooms: 0,
      distance: 0,
      floors: 0,
      services: 0,
      truck: 0,
    };
    
    // حساب تكلفة الغرف
    let totalItems = 0;
    rooms.forEach(room => {
      if (room.quantity > 0) {
        const roomPrice = PRICING_DATA.roomTypes[room.type].basePrice * room.quantity;
        breakdown.rooms += roomPrice;
        totalItems += PRICING_DATA.roomTypes[room.type].items * room.quantity;
      }
    });
    
    // تحديد حجم الشاحنة المطلوبة
    let truckType: keyof typeof PRICING_DATA.truckSizes = 'small';
    if (totalItems > 100) truckType = 'xlarge';
    else if (totalItems > 60) truckType = 'large';
    else if (totalItems > 30) truckType = 'medium';
    
    breakdown.truck = PRICING_DATA.truckSizes[truckType].basePrice;
    breakdown.truckType = PRICING_DATA.truckSizes[truckType].name;
    
    // تطبيق معامل المسافة
    const distanceData = PRICING_DATA.distanceMultipliers[distance];
    breakdown.distance = distanceData.baseFee;
    const distanceMultiplier = distanceData.multiplier;
    
    // حساب رسوم الطوابق
    breakdown.floors = PRICING_DATA.floorCharges[fromFloor].charge + 
                      PRICING_DATA.floorCharges[toFloor].charge;
    
    // حساب الخدمات الإضافية
    additionalServices.forEach(service => {
      breakdown.services += PRICING_DATA.additionalServices[service as keyof typeof PRICING_DATA.additionalServices].price;
    });
    
    // الحساب النهائي
    const baseTotal = breakdown.rooms + breakdown.truck + breakdown.floors + breakdown.services;
    const finalTotal = (baseTotal * distanceMultiplier) + breakdown.distance;
    
    breakdown.total = Math.round(finalTotal);
    setPriceBreakdown(breakdown);
    setTotalPrice(breakdown.total);
  };

  useEffect(() => {
    calculatePrice();
  }, [rooms, distance, fromFloor, toFloor, additionalServices]);

  const updateRoomQuantity = (type: keyof typeof PRICING_DATA.roomTypes, quantity: number) => {
    setRooms(rooms.map(room => 
      room.type === type ? { ...room, quantity: Math.max(0, quantity) } : room
    ));
  };

  const toggleService = (service: string) => {
    setAdditionalServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handleSubmit = () => {
    if (advertisers.length === 0) {
      alert('عذراً، لا توجد شركات متاحة حالياً');
      return;
    }

    // الحصول على آخر معلن تم التوجيه إليه من localStorage
    const lastAdvertiserIndex = parseInt(localStorage.getItem('lastAdvertiserIndex') || '0');
    
    // حساب المعلن التالي باستخدام round-robin
    const nextAdvertiserIndex = (lastAdvertiserIndex + 1) % advertisers.length;
    const selectedAdvertiser = advertisers[nextAdvertiserIndex];
    
    // حفظ المعلن الحالي في localStorage
    localStorage.setItem('lastAdvertiserIndex', nextAdvertiserIndex.toString());
    
    // إنشاء رسالة WhatsApp
    const message = `
طلب عرض سعر نقل عفش من دليل شركات نقل العفش:

📋 بيانات العميل:
الاسم: ${customerInfo.name}
الهاتف: ${customerInfo.phone}

📍 تفاصيل النقل:
من: ${customerInfo.fromCity}
إلى: ${customerInfo.toCity}
التاريخ المفضل: ${customerInfo.preferredDate}

💰 السعر التقديري: ${totalPrice} ريال

📦 تفاصيل المحتويات:
${rooms.filter(r => r.quantity > 0).map(r => `- ${PRICING_DATA.roomTypes[r.type].name}: ${r.quantity}`).join('\n')}

🏢 الطوابق:
من الطابق: ${PRICING_DATA.floorCharges[fromFloor].name}
إلى الطابق: ${PRICING_DATA.floorCharges[toFloor].name}

✨ خدمات إضافية:
${additionalServices.length > 0
  ? additionalServices.map(s => `- ${PRICING_DATA.additionalServices[s as keyof typeof PRICING_DATA.additionalServices].name}`).join('\n')
  : 'لا توجد خدمات إضافية'}

📞 يرجى التواصل مع العميل في أقرب وقت
    `.trim();
    
    // فتح WhatsApp للمعلن المختار
    const whatsappNumber = selectedAdvertiser.whatsapp.replace(/\D/g, ''); // إزالة أي رموز غير رقمية
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    
    // رسالة تأكيد للعميل
    alert(`تم إرسال طلبك إلى ${selectedAdvertiser.companyName}. سيتم التواصل معك قريباً!`);
  };

  return (
    <>
      <Head>
        <title>حاسبة تكلفة نقل العفش | دليل شركات نقل العفش في جدة</title>
        <meta name="description" content="احسب تكلفة نقل عفشك بدقة مع حاسبتنا الذكية. أسعار محدثة وشفافة لجميع خدمات النقل في السعودية." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
                <FaArrowRight />
                <span>العودة للرئيسية</span>
              </Link>
              <h1 className="text-2xl font-bold text-gray-800">حاسبة تكلفة نقل العفش</h1>
            </div>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`flex items-center ${s < 4 ? 'flex-1' : ''}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all
                      ${step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                  >
                    {s}
                  </div>
                  {s < 4 && (
                    <div className={`flex-1 h-1 mx-2 transition-all
                      ${step > s ? 'bg-primary-600' : 'bg-gray-200'}`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className={step >= 1 ? 'text-primary-600 font-semibold' : 'text-gray-500'}>
                محتويات المنزل
              </span>
              <span className={step >= 2 ? 'text-primary-600 font-semibold' : 'text-gray-500'}>
                تفاصيل النقل
              </span>
              <span className={step >= 3 ? 'text-primary-600 font-semibold' : 'text-gray-500'}>
                خدمات إضافية
              </span>
              <span className={step >= 4 ? 'text-primary-600 font-semibold' : 'text-gray-500'}>
                ملخص وحجز
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Step 1: محتويات المنزل */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <FaHome className="text-primary-600" />
                  حدد محتويات منزلك
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {rooms.map((room) => {
                    const roomData = PRICING_DATA.roomTypes[room.type];
                    return (
                      <div key={room.type} className="border rounded-lg p-4 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg">{roomData.name}</h3>
                          <span className="text-sm text-gray-500">
                            ~{roomData.items} قطعة
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateRoomQuantity(room.type, room.quantity - 1)}
                            className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={room.quantity}
                            onChange={(e) => updateRoomQuantity(room.type, parseInt(e.target.value) || 0)}
                            className="w-20 text-center border rounded-lg py-2"
                            min="0"
                          />
                          <button
                            onClick={() => updateRoomQuantity(room.type, room.quantity + 1)}
                            className="w-10 h-10 rounded-full bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 flex justify-between">
                  <div></div>
                  <button
                    onClick={() => setStep(2)}
                    className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-all flex items-center gap-2"
                  >
                    التالي
                    <FaArrowLeft />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: تفاصيل النقل */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <FaTruck className="text-primary-600" />
                  تفاصيل النقل
                </h2>

                {/* المسافة */}
                <div className="mb-6">
                  <label className="block text-lg font-semibold mb-3">المسافة المتوقعة</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(PRICING_DATA.distanceMultipliers).map(([key, value]) => (
                      <label
                        key={key}
                        className={`border rounded-lg p-4 cursor-pointer transition-all
                          ${distance === key ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}`}
                      >
                        <input
                          type="radio"
                          name="distance"
                          value={key}
                          checked={distance === key}
                          onChange={(e) => setDistance(e.target.value as keyof typeof PRICING_DATA.distanceMultipliers)}
                          className="sr-only"
                        />
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{value.name}</span>
                          {value.baseFee > 0 && (
                            <span className="text-sm text-gray-600">+{value.baseFee} ريال</span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* الطوابق */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-lg font-semibold mb-3">من الطابق</label>
                    <select
                      value={fromFloor}
                      onChange={(e) => setFromFloor(e.target.value as keyof typeof PRICING_DATA.floorCharges)}
                      className="w-full border rounded-lg px-4 py-3"
                    >
                      {Object.entries(PRICING_DATA.floorCharges).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value.name} {value.charge > 0 && `(+${value.charge} ريال)`}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-lg font-semibold mb-3">إلى الطابق</label>
                    <select
                      value={toFloor}
                      onChange={(e) => setToFloor(e.target.value as keyof typeof PRICING_DATA.floorCharges)}
                      className="w-full border rounded-lg px-4 py-3"
                    >
                      {Object.entries(PRICING_DATA.floorCharges).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value.name} {value.charge > 0 && `(+${value.charge} ريال)`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="text-gray-600 hover:text-gray-800 px-6 py-3 flex items-center gap-2"
                  >
                    <FaArrowRight />
                    السابق
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-all flex items-center gap-2"
                  >
                    التالي
                    <FaArrowLeft />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: خدمات إضافية */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <FaTools className="text-primary-600" />
                  خدمات إضافية
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(PRICING_DATA.additionalServices).map(([key, service]) => (
                    <label
                      key={key}
                      className={`border rounded-lg p-4 cursor-pointer transition-all
                        ${additionalServices.includes(key) ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}`}
                    >
                      <input
                        type="checkbox"
                        checked={additionalServices.includes(key)}
                        onChange={() => toggleService(key)}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center
                            ${additionalServices.includes(key) ? 'border-primary-600 bg-primary-600' : 'border-gray-400'}`}>
                            {additionalServices.includes(key) && (
                              <FaCheckCircle className="text-white text-xs" />
                            )}
                          </div>
                          <span className="font-semibold">{service.name}</span>
                        </div>
                        <span className="text-sm text-gray-600">+{service.price} ريال</span>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="mt-8 flex justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="text-gray-600 hover:text-gray-800 px-6 py-3 flex items-center gap-2"
                  >
                    <FaArrowRight />
                    السابق
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-all flex items-center gap-2"
                  >
                    التالي
                    <FaArrowLeft />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: ملخص وحجز */}
            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* ملخص التكلفة */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <FaMoneyBillWave className="text-primary-600" />
                    ملخص التكلفة
                  </h2>

                  <div className="space-y-3">
                    {priceBreakdown.rooms > 0 && (
                      <div className="flex justify-between py-2 border-b">
                        <span>تكلفة الغرف والمحتويات</span>
                        <span className="font-semibold">{priceBreakdown.rooms} ريال</span>
                      </div>
                    )}
                    
                    {priceBreakdown.truck > 0 && (
                      <div className="flex justify-between py-2 border-b">
                        <span>الشاحنة ({priceBreakdown.truckType})</span>
                        <span className="font-semibold">{priceBreakdown.truck} ريال</span>
                      </div>
                    )}
                    
                    {priceBreakdown.distance > 0 && (
                      <div className="flex justify-between py-2 border-b">
                        <span>رسوم المسافة</span>
                        <span className="font-semibold">{priceBreakdown.distance} ريال</span>
                      </div>
                    )}
                    
                    {priceBreakdown.floors > 0 && (
                      <div className="flex justify-between py-2 border-b">
                        <span>رسوم الطوابق</span>
                        <span className="font-semibold">{priceBreakdown.floors} ريال</span>
                      </div>
                    )}
                    
                    {priceBreakdown.services > 0 && (
                      <div className="flex justify-between py-2 border-b">
                        <span>خدمات إضافية</span>
                        <span className="font-semibold">{priceBreakdown.services} ريال</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between py-3 text-xl font-bold text-primary-600">
                      <span>الإجمالي التقديري</span>
                      <span>{totalPrice} ريال</span>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800 flex items-start gap-2">
                      <FaInfoCircle className="mt-0.5 flex-shrink-0" />
                      <span>
                        هذا السعر تقديري وقد يختلف بناءً على المعاينة الفعلية. 
                        الأسعار محدثة حسب متوسط السوق في جدة والسعودية (نوفمبر 2025).
                      </span>
                    </p>
                  </div>
                </div>

                {/* نموذج البيانات */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold mb-4">بيانات التواصل</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">الاسم الكريم</label>
                      <input
                        type="text"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder="أدخل اسمك"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">رقم الجوال</label>
                      <input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder="05XXXXXXXX"
                        dir="ltr"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">من مدينة</label>
                      <input
                        type="text"
                        value={customerInfo.fromCity}
                        onChange={(e) => setCustomerInfo({...customerInfo, fromCity: e.target.value})}
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder="مثال: جدة"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">إلى مدينة</label>
                      <input
                        type="text"
                        value={customerInfo.toCity}
                        onChange={(e) => setCustomerInfo({...customerInfo, toCity: e.target.value})}
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder="مثال: الرياض"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">التاريخ المفضل للنقل</label>
                      <input
                        type="date"
                        value={customerInfo.preferredDate}
                        onChange={(e) => setCustomerInfo({...customerInfo, preferredDate: e.target.value})}
                        className="w-full border rounded-lg px-4 py-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(3)}
                    className="text-gray-600 hover:text-gray-800 px-6 py-3 flex items-center gap-2"
                  >
                    <FaArrowRight />
                    السابق
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
                  >
                    <FaWhatsapp />
                    احصل على عرض سعر
                  </button>
                </div>
              </motion.div>
            )}

            {/* Live Price Display */}
            {totalPrice > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-auto bg-primary-600 text-white rounded-xl shadow-2xl p-4 z-40"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm opacity-90">السعر التقديري</p>
                    <p className="text-2xl font-bold">{totalPrice} ريال</p>
                  </div>
                  <FaCalculator className="text-3xl opacity-50" />
                </div>
              </motion.div>
            )}
          </div>

          {/* معلومات إضافية */}
          <div className="max-w-4xl mx-auto mt-12">
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaShieldAlt className="text-primary-600" />
                لماذا نستخدم هذه الحاسبة؟
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold mb-2">دقة في التسعير</h4>
                  <p className="text-sm text-gray-600">
                    أسعار محدثة بناءً على متوسط السوق السعودي الحالي
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold mb-2">شفافية كاملة</h4>
                  <p className="text-sm text-gray-600">
                    تفاصيل واضحة لكل عنصر في التكلفة دون رسوم مخفية
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold mb-2">توفير الوقت</h4>
                  <p className="text-sm text-gray-600">
                    احصل على تقدير فوري دون الحاجة لانتظار عروض الأسعار
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}