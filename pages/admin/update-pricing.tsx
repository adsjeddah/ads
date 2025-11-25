import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FaSync, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

// السياسة الجديدة للأسعار
const NEW_PRICING = {
  city: {
    week: 400,
    two_weeks: 800,
    month: 1500
  },
  kingdom: {
    week: 850,
    two_weeks: 1600,
    month: 3000
  }
};

interface Plan {
  id: string;
  name: string;
  sector: string;
  coverage_area: string;
  city?: string;
  duration_days: number;
  price: number;
  newPrice?: number;
}

export default function UpdatePricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const plansRef = collection(db, 'plans');
      const snapshot = await getDocs(plansRef);
      
      const plansData: Plan[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const plan: Plan = {
          id: doc.id,
          name: data.name,
          sector: data.sector || 'غير محدد',
          coverage_area: data.coverage_area || 'غير محدد',
          city: data.city,
          duration_days: data.duration_days,
          price: data.price
        };

        // تحديد السعر الجديد
        let coverageType: 'city' | 'kingdom' | null = null;
        let duration: 'week' | 'two_weeks' | 'month' | null = null;

        // تحديد نوع التغطية
        if (data.coverage_area === 'city' || data.city) {
          coverageType = 'city';
        } else if (data.coverage_area === 'kingdom') {
          coverageType = 'kingdom';
        }

        // تحديد المدة
        if (data.duration_days === 7) {
          duration = 'week';
        } else if (data.duration_days === 14) {
          duration = 'two_weeks';
        } else if (data.duration_days === 30) {
          duration = 'month';
        }

        // الحصول على السعر الجديد
        if (coverageType && duration) {
          plan.newPrice = NEW_PRICING[coverageType][duration];
        }

        plansData.push(plan);
      });

      setPlans(plansData);
    } catch (error) {
      console.error('Error fetching plans:', error);
      alert('خطأ في جلب الباقات');
    } finally {
      setLoading(false);
    }
  };

  const updateAllPrices = async () => {
    if (!confirm('هل أنت متأكد من تحديث جميع الأسعار؟\nهذا سيؤثر على جميع الباقات في قاعدة البيانات!')) {
      return;
    }

    setUpdating(true);
    let success = 0;
    let failed = 0;

    try {
      for (const plan of plans) {
        if (plan.newPrice !== undefined && plan.newPrice !== plan.price) {
          try {
            const planRef = doc(db, 'plans', plan.id);
            await updateDoc(planRef, {
              price: plan.newPrice,
              updated_at: serverTimestamp()
            });
            success++;
          } catch (error) {
            console.error(`Error updating plan ${plan.id}:`, error);
            failed++;
          }
        }
      }

      setResults({ success, failed });
      alert(`تم تحديث ${success} باقة بنجاح!\nفشل تحديث ${failed} باقة.`);
      
      // إعادة جلب الباقات
      await fetchPlans();
    } catch (error) {
      console.error('Error updating prices:', error);
      alert('خطأ في تحديث الأسعار');
    } finally {
      setUpdating(false);
    }
  };

  const plansToUpdate = plans.filter(p => p.newPrice !== undefined && p.newPrice !== p.price);

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔄 تحديث أسعار الباقات الإعلانية
          </h1>
          <p className="text-gray-600">
            هذه الصفحة تتيح لك تحديث أسعار جميع الباقات حسب السياسة الجديدة
          </p>
        </div>

        {/* السياسة الجديدة */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* باقات المدن */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              🏙️ باقات المدن
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white/20 rounded p-3">
                <span>أسبوع (7 أيام)</span>
                <span className="font-bold text-xl">{NEW_PRICING.city.week} ريال</span>
              </div>
              <div className="flex justify-between items-center bg-white/20 rounded p-3">
                <span>أسبوعين (14 يوم)</span>
                <span className="font-bold text-xl">{NEW_PRICING.city.two_weeks} ريال</span>
              </div>
              <div className="flex justify-between items-center bg-white/20 rounded p-3">
                <span>شهر (30 يوم)</span>
                <span className="font-bold text-xl">{NEW_PRICING.city.month} ريال</span>
              </div>
            </div>
          </div>

          {/* باقات المملكة */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              🌍 باقات المملكة
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white/20 rounded p-3">
                <span>أسبوع (7 أيام)</span>
                <span className="font-bold text-xl">{NEW_PRICING.kingdom.week} ريال</span>
              </div>
              <div className="flex justify-between items-center bg-white/20 rounded p-3">
                <span>أسبوعين (14 يوم)</span>
                <span className="font-bold text-xl">{NEW_PRICING.kingdom.two_weeks} ريال</span>
              </div>
              <div className="flex justify-between items-center bg-white/20 rounded p-3">
                <span>شهر (30 يوم)</span>
                <span className="font-bold text-xl">{NEW_PRICING.kingdom.month} ريال</span>
              </div>
            </div>
          </div>
        </div>

        {/* ملخص */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-100 rounded">
              <div className="text-3xl font-bold text-gray-800">{plans.length}</div>
              <div className="text-gray-600">إجمالي الباقات</div>
            </div>
            <div className="text-center p-4 bg-yellow-100 rounded">
              <div className="text-3xl font-bold text-yellow-800">{plansToUpdate.length}</div>
              <div className="text-yellow-800">تحتاج تحديث</div>
            </div>
            <div className="text-center p-4 bg-green-100 rounded">
              <div className="text-3xl font-bold text-green-800">
                {plans.length - plansToUpdate.length}
              </div>
              <div className="text-green-800">محدثة مسبقاً</div>
            </div>
          </div>
        </div>

        {/* زر التحديث */}
        {plansToUpdate.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
            <button
              onClick={updateAllPrices}
              disabled={updating}
              className={`
                px-8 py-4 rounded-lg text-white font-bold text-lg
                flex items-center justify-center mx-auto space-x-2 space-x-reverse
                ${updating 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
                }
              `}
            >
              {updating ? (
                <>
                  <FaSync className="animate-spin ml-2" />
                  <span>جاري التحديث...</span>
                </>
              ) : (
                <>
                  <FaCheckCircle className="ml-2" />
                  <span>تحديث جميع الأسعار ({plansToUpdate.length} باقة)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* قائمة الباقات */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            📋 قائمة الباقات
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <FaSync className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
              <p>جاري تحميل الباقات...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 border">الاسم</th>
                    <th className="p-3 border">القطاع</th>
                    <th className="p-3 border">التغطية</th>
                    <th className="p-3 border">المدينة</th>
                    <th className="p-3 border">المدة</th>
                    <th className="p-3 border">السعر الحالي</th>
                    <th className="p-3 border">السعر الجديد</th>
                    <th className="p-3 border">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map(plan => {
                    const needsUpdate = plan.newPrice !== undefined && plan.newPrice !== plan.price;
                    
                    return (
                      <tr key={plan.id} className={needsUpdate ? 'bg-yellow-50' : ''}>
                        <td className="p-3 border">{plan.name}</td>
                        <td className="p-3 border">{plan.sector}</td>
                        <td className="p-3 border">{plan.coverage_area}</td>
                        <td className="p-3 border">{plan.city || 'المملكة'}</td>
                        <td className="p-3 border">{plan.duration_days} يوم</td>
                        <td className="p-3 border font-bold">{plan.price} ريال</td>
                        <td className="p-3 border font-bold text-green-600">
                          {plan.newPrice !== undefined ? `${plan.newPrice} ريال` : '-'}
                        </td>
                        <td className="p-3 border">
                          {needsUpdate ? (
                            <span className="inline-flex items-center text-yellow-600">
                              <FaExclamationTriangle className="ml-1" />
                              يحتاج تحديث
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-green-600">
                              <FaCheckCircle className="ml-1" />
                              محدث
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

