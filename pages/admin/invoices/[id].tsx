import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaPrint, FaPaperPlane, FaCheckCircle, FaExclamationCircle, FaClock, FaMoneyBillWave, FaUserTie, FaBuilding, FaPhone, FaEnvelope, FaCalendarAlt } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

interface InvoiceDetail {
  id: number;
  subscription_id: number;
  invoice_number: string;
  amount: number;
  status: string; // 'paid', 'unpaid', 'partial', 'overdue'
  issued_date: string;
  due_date: string;
  paid_date: string | null;
  advertiser_id: number;
  company_name: string;
  phone: string;
  whatsapp: string | null;
  services: string; // This might be better as advertiser's general services
  plan_name: string;
  duration_days: number;
  subscription_total: number;
  subscription_paid: number;
  subscription_remaining: number;
  discount_type: string | null;
  discount_amount: number | null;
  base_price: number | null;
  payments: Payment[];
}

interface Payment {
  id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes: string | null;
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to safely format numbers
  const formatPrice = (price: number | null | undefined): string => {
    if (price === null || price === undefined || isNaN(price)) {
      return '0.00';
    }
    return price.toFixed(2);
  };

  // Helper function to safely format dates
  const formatDate = (date: any): string => {
    if (!date) return '-';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return '-';
      return dateObj.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
    } else if (id) {
      fetchInvoiceDetails();
    }
  }, [router, id]);

  const fetchInvoiceDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await axios.get(`${apiUrl}/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoice(response.data);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      toast.error('خطأ في جلب تفاصيل الفاتورة');
      // router.push('/admin/invoices'); // Redirect if invoice not found or error
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <span className="px-3 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full flex items-center"><FaCheckCircle className="mr-1" /> مدفوعة</span>;
      case 'unpaid':
        return <span className="px-3 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full flex items-center"><FaExclamationCircle className="mr-1" /> غير مدفوعة</span>;
      case 'partial':
        return <span className="px-3 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full flex items-center"><FaClock className="mr-1" /> مدفوعة جزئياً</span>;
      case 'overdue':
        return <span className="px-3 py-1 text-xs font-medium text-orange-800 bg-orange-100 rounded-full flex items-center"><FaExclamationCircle className="mr-1" /> متأخرة</span>;
      default:
        return <span className="px-3 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">{status}</span>;
    }
  };
  
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
        <p className="text-xl text-gray-700 mb-4">لم يتم العثور على الفاتورة.</p>
        <Link href="/admin/invoices">
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
          >
            <FaArrowLeft className="mr-2" /> العودة إلى الفواتير
          </motion.button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>فاتورة رقم {invoice.invoice_number} - لوحة التحكم</title>
      </Head>

      <div className="min-h-screen bg-gray-100 print:bg-white">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40 print:hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gradient">تفاصيل الفاتورة</h1>
              <div className="flex items-center gap-3">
                <Link href={`/admin/advertisers/${invoice.advertiser_id}/invoices`}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <FaArrowLeft />
                    <span>العودة لفواتير المعلن</span>
                  </motion.button>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={handlePrint}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <FaPrint />
                  <span>طباعة</span>
                </motion.button>
              </div>
            </div>
          </div>
        </header>

        {/* Invoice Content */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 lg:p-10 print:shadow-none print:p-0">
            {/* Invoice Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start mb-8 pb-8 border-b border-gray-200 print:flex-row">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-1">فاتورة ضريبية</h2>
                <p className="text-gray-500">رقم الفاتورة: {invoice.invoice_number}</p>
              </div>
              <div className="text-left sm:text-right mt-4 sm:mt-0">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg mb-2">
                  <span className="text-white text-xl font-bold">JA</span>
                </div>
                <p className="text-lg font-semibold text-gray-700">إعلانات جدة</p>
                <p className="text-sm text-gray-500">jeddah-ads.com</p>
              </div>
            </div>

            {/* Advertiser and Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">فاتورة إلى:</h3>
                <p className="text-lg font-bold text-gray-800">{invoice.company_name}</p>
                <p className="text-gray-600 flex items-center mt-1"><FaPhone className="mr-2 text-gray-400" /> {invoice.phone}</p>
                {invoice.whatsapp && <p className="text-gray-600 flex items-center mt-1"><FaUserTie className="mr-2 text-gray-400" /> (واتساب) {invoice.whatsapp}</p>}
              </div>
              <div className="sm:text-right">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">التفاصيل:</h3>
                <p className="text-gray-700"><span className="font-semibold">تاريخ الإصدار:</span> {formatDate(invoice.issued_date)}</p>
                <p className="text-gray-700"><span className="font-semibold">تاريخ الاستحقاق:</span> {formatDate(invoice.due_date)}</p>
                <div className="mt-2">{getStatusBadge(invoice.status)}</div>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-right">
                <thead className="bg-gray-50 print:bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-600 uppercase text-sm">الخدمة</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 uppercase text-sm">المدة</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 uppercase text-sm">السعر الأساسي</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 uppercase text-sm">الخصم</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 uppercase text-sm">الإجمالي الفرعي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-4 text-gray-700">{invoice.plan_name}</td>
                    <td className="px-4 py-4 text-gray-700">{invoice.duration_days} يوم</td>
                    <td className="px-4 py-4 text-gray-700">{formatPrice(invoice.base_price || invoice.subscription_total)} ريال</td>
                    <td className="px-4 py-4 text-gray-700">
                      {invoice.discount_amount && invoice.discount_amount > 0 
                        ? `${formatPrice(invoice.discount_amount)} ريال (${invoice.discount_type === 'percentage' ? '%' : 'مبلغ ثابت'})`
                        : 'لا يوجد'}
                    </td>
                    <td className="px-4 py-4 text-gray-700 font-semibold">{formatPrice(invoice.subscription_total)} ريال</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-full sm:w-1/2 lg:w-1/3">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>الإجمالي الفرعي:</span>
                    <span>{formatPrice(invoice.subscription_total)} ريال</span>
                  </div>
                  {/* VAT/Tax can be added here if needed */}
                  {/* <div className="flex justify-between text-gray-700">
                    <span>ضريبة القيمة المضافة (15%):</span>
                    <span>{formatPrice((invoice.subscription_total || 0) * 0.15)} ريال</span>
                  </div> */}
                  <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t border-gray-200">
                    <span>الإجمالي الكلي:</span>
                    <span>{formatPrice(invoice.subscription_total)} ريال</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>المدفوع:</span>
                    <span>{formatPrice(invoice.subscription_paid)} ريال</span>
                  </div>
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>المتبقي:</span>
                    <span>{formatPrice(invoice.subscription_remaining)} ريال</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payments History */}
            {invoice.payments && invoice.payments.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">سجل الدفعات:</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-gray-50 print:bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 font-semibold text-gray-600 uppercase text-xs">تاريخ الدفعة</th>
                        <th className="px-4 py-2 font-semibold text-gray-600 uppercase text-xs">المبلغ</th>
                        <th className="px-4 py-2 font-semibold text-gray-600 uppercase text-xs">طريقة الدفع</th>
                        <th className="px-4 py-2 font-semibold text-gray-600 uppercase text-xs">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {invoice.payments.map(payment => (
                        <tr key={payment.id}>
                          <td className="px-4 py-3 text-gray-600 text-sm">{formatDate(payment.payment_date)}</td>
                          <td className="px-4 py-3 text-gray-600 text-sm">{formatPrice(payment.amount)} ريال</td>
                          <td className="px-4 py-3 text-gray-600 text-sm">{payment.payment_method}</td>
                          <td className="px-4 py-3 text-gray-600 text-sm">{payment.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Notes and Footer */}
            <div className="pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
              <p>شكراً لتعاملكم معنا!</p>
              <p>إذا كان لديك أي استفسارات بخصوص هذه الفاتورة، يرجى التواصل معنا.</p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}