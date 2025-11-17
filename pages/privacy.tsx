import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa';

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>سياسة الخصوصية - دليل شركات نقل العفش في جدة</title>
        <meta name="description" content="سياسة الخصوصية لموقع دليل شركات نقل العفش في جدة." />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-2xl font-bold text-gradient cursor-pointer"
                >
                  دليل نقل العفش - جدة
                </motion.div>
              </Link>
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <span>العودة للرئيسية</span>
                  <FaArrowRight className="rotate-180" />
                </motion.button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-8 md:p-12"
          >
            <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">سياسة الخصوصية</h1>
            
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed" dir="rtl">
              <p>آخر تحديث: 1 يوليو 2025</p>

              <p>نحن في "دليل شركات نقل العفش في جدة" (المشار إليه فيما يلي بـ "الموقع") نلتزم بحماية خصوصية زوارنا ومستخدمينا. توضح سياسة الخصوصية هذه كيف نجمع ونستخدم ونحمي معلوماتك الشخصية.</p>

              <h2 className="text-2xl font-semibold mt-6 mb-3">1. المعلومات التي نجمعها</h2>
              <p>قد نجمع الأنواع التالية من المعلومات:</p>
              <ul>
                <li><strong>معلومات شخصية:</strong> مثل الاسم، عنوان البريد الإلكتروني، رقم الهاتف، اسم الشركة، وذلك عند تسجيلك كمعلن أو إرسال طلب إعلان.</li>
                <li><strong>معلومات غير شخصية:</strong> مثل عنوان IP، نوع المتصفح، نظام التشغيل، الصفحات التي تزورها، وتواريخ وأوقات الزيارة. يتم جمع هذه المعلومات تلقائيًا من خلال ملفات تعريف الارتباط (Cookies) وتقنيات تتبع مشابهة.</li>
              </ul>

              <h2 className="text-2xl font-semibold mt-6 mb-3">2. كيف نستخدم معلوماتك</h2>
              <p>نستخدم المعلومات التي نجمعها للأغراض التالية:</p>
              <ul>
                <li>لتوفير وتشغيل وصيانة خدمات الموقع.</li>
                <li>لتحسين وتخصيص وتوسيع خدمات الموقع.</li>
                <li>لفهم وتحليل كيفية استخدامك للموقع.</li>
                <li>لتطوير منتجات وخدمات وميزات ووظائف جديدة.</li>
                <li>للتواصل معك، إما مباشرة أو من خلال أحد شركائنا، بما في ذلك لخدمة العملاء، لتزويدك بالتحديثات والمعلومات الأخرى المتعلقة بالموقع، ولأغراض تسويقية وترويجية (بموافقتك).</li>
                <li>لمعالجة معاملاتك وإدارة اشتراكاتك.</li>
                <li>لإرسال رسائل بريد إلكتروني إليك.</li>
                <li>للعثور على ومنع الاحتيال.</li>
              </ul>

              <h2 className="text-2xl font-semibold mt-6 mb-3">3. مشاركة معلوماتك</h2>
              <p>نحن لا نبيع أو نتاجر أو نؤجر معلوماتك الشخصية لأطراف ثالثة. قد نشارك معلوماتك في الحالات التالية:</p>
              <ul>
                <li><strong>مع مزودي الخدمة:</strong> قد نشارك معلوماتك مع أطراف ثالثة تقدم خدمات نيابة عنا، مثل معالجة الدفع، تحليل البيانات، خدمات التسويق، خدمات البريد الإلكتروني، وخدمات الاستضافة.</li>
                <li><strong>للامتثال القانوني:</strong> قد نكشف عن معلوماتك إذا طُلب منا ذلك بموجب القانون أو استجابة لطلبات صالحة من السلطات العامة (مثل محكمة أو وكالة حكومية).</li>
                <li><strong>لحماية حقوقنا:</strong> قد نكشف عن معلوماتك عندما نعتقد بحسن نية أن الكشف ضروري لحماية حقوقنا أو ممتلكاتنا أو سلامتنا أو سلامة الآخرين، أو للتحقيق في الاحتيال أو الرد على طلب حكومي.</li>
              </ul>

              <h2 className="text-2xl font-semibold mt-6 mb-3">4. ملفات تعريف الارتباط (Cookies)</h2>
              <p>يستخدم موقعنا ملفات تعريف الارتباط لتحسين تجربتك. ملفات تعريف الارتباط هي ملفات نصية صغيرة يتم تخزينها على جهازك. يمكنك التحكم في استخدام ملفات تعريف الارتباط من خلال إعدادات متصفحك.</p>

              <h2 className="text-2xl font-semibold mt-6 mb-3">5. أمن البيانات</h2>
              <p>نتخذ تدابير أمنية معقولة لحماية معلوماتك الشخصية من الوصول غير المصرح به أو الاستخدام أو الكشف أو التغيير أو الإتلاف. ومع ذلك، لا توجد طريقة نقل عبر الإنترنت أو طريقة تخزين إلكتروني آمنة بنسبة 100%.</p>

              <h2 className="text-2xl font-semibold mt-6 mb-3">6. روابط لمواقع أخرى</h2>
              <p>قد يحتوي موقعنا على روابط لمواقع أخرى لا يتم تشغيلها من قبلنا. إذا نقرت على رابط لطرف ثالث، فسيتم توجيهك إلى موقع هذا الطرف الثالث. ننصحك بشدة بمراجعة سياسة الخصوصية لكل موقع تزوره.</p>

              <h2 className="text-2xl font-semibold mt-6 mb-3">7. خصوصية الأطفال</h2>
              <p>خدماتنا ليست موجهة للأطفال دون سن 13 عامًا. نحن لا نجمع عن قصد معلومات تعريف شخصية من الأطفال دون سن 13 عامًا. إذا اكتشفت أن طفلاً دون سن 13 عامًا قد زودنا بمعلومات شخصية، فيرجى الاتصال بنا.</p>

              <h2 className="text-2xl font-semibold mt-6 mb-3">8. التغييرات على سياسة الخصوصية هذه</h2>
              <p>قد نقوم بتحديث سياسة الخصوصية الخاصة بنا من وقت لآخر. سنقوم بإعلامك بأي تغييرات عن طريق نشر سياسة الخصوصية الجديدة على هذه الصفحة. يُنصح بمراجعة سياسة الخصوصية هذه بشكل دوري لأي تغييرات.</p>

              <h2 className="text-2xl font-semibold mt-6 mb-3">9. اتصل بنا</h2>
              <p>إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يمكنك الاتصال بنا عبر البريد الإلكتروني: [أدخل عنوان بريد إلكتروني للدعم هنا]</p>
            </div>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8 mt-12">
          <div className="container mx-auto px-4 text-center">
            <p>جميع الحقوق محفوظة © {new Date().getFullYear()} دليل شركات نقل العفش في جدة</p>
          </div>
        </footer>
      </div>
    </>
  );
}