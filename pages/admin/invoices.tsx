import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaMoneyBillWave, FaSearch, FaPlus, FaEdit, FaEye, FaCheckCircle, FaClock, FaExclamationCircle, FaFileInvoice } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Invoice {
  id: number;
  invoice_number: string;
  company_name: string; // Advertiser's company name
  phone: string; // Advertiser's phone
  plan_name: string;
  amount: number; // Invoice amount (same as subscription_total for the main invoice)
  status: string; // 'paid', 'unpaid', 'partial', 'overdue'
  issued_date: string;
  due_date: string;
  subscription_total: number;
  subscription_paid: number;
  subscription_remaining: number;
}

export default function InvoicesManagement() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, paid, unpaid, partial, overdue

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
    } else {
      fetchAllInvoices();
    }
  }, [router]);

  const fetchAllInvoices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/admin/invoices', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = invoice.company_name.toLowerCase().includes(searchTermLower) ||
                         invoice.phone.includes(searchTerm) || // Assuming phone is string
                         invoice.invoice_number.toLowerCase().includes(searchTermLower) ||
                         invoice.plan_name.toLowerCase().includes(searchTermLower);
    
    if (filterStatus === 'all') return matchesSearch;
    // The invoice status from the backend is 'paid', 'unpaid'.
    // 'partial' needs to be derived from subscription_paid and subscription_remaining
    if (filterStatus === 'paid') return matchesSearch && invoice.status === 'paid';
    if (filterStatus === 'unpaid') return matchesSearch && invoice.status === 'unpaid' && invoice.subscription_paid === 0;
    if (filterStatus === 'partial') return matchesSearch && invoice.status === 'unpaid' && invoice.subscription_paid > 0 && invoice.subscription_remaining > 0;
    // 'overdue' status can be added if due_date is passed and status is not 'paid'
    
    return matchesSearch;
  });

  const getInvoiceStatusBadge = (invoice: Invoice) => {
    // Use invoice.status directly if it's comprehensive, or derive
    if (invoice.status === 'paid') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FaCheckCircle className="mr-1" /> مدفوعة
        </span>
      );
    } else if (invoice.subscription_paid > 0 && invoice.subscription_remaining > 0) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <FaClock className="mr-1" /> مدفوعة جزئياً
        </span>
      );
    } else if (invoice.status === 'unpaid') { // Covers case where paid is 0
      // Could add overdue check here: new Date(invoice.due_date) < new Date() && invoice.status !== 'paid'
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <FaExclamationCircle className="mr-1" /> غير مدفوعة
        </span>
      );
    }
    return null;
  };

  return (
    <>
      <Head>
        <title>إدارة الفواتير - لوحة التحكم</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gradient">إدارة فواتير المعلنين</h1>
              <Link href="/admin/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <FaArrowLeft />
                  <span>العودة للوحة التحكم</span>
                </motion.button>
              </Link>
            </div>
          </div>
        </header>

        {/* Filters and Search */}
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="البحث بالاسم أو الهاتف أو البريد..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Filter Status */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">جميع الحالات</option>
                <option value="paid">مدفوعة</option>
                <option value="partial">مدفوعة جزئياً</option>
                <option value="unpaid">غير مدفوعة</option>
                {/* Option for overdue can be added if logic is implemented */}
              </select>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="container mx-auto px-4 pb-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <p className="text-gray-500">لا توجد فواتير تطابق البحث أو الفلتر.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الفاتورة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العميل</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الخطة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الإصدار</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ الإجمالي</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المدفوع</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المتبقي</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInvoices.map((invoice) => (
                      <motion.tr
                        key={invoice.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoice_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          <div>{invoice.company_name}</div>
                          <div className="text-xs text-gray-500">{invoice.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{invoice.plan_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(invoice.issued_date).toLocaleDateString('ar-SA')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{invoice.amount.toFixed(2)} ريال</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">{invoice.subscription_paid.toFixed(2)} ريال</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">{invoice.subscription_remaining.toFixed(2)} ريال</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getInvoiceStatusBadge(invoice)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link href={`/admin/invoices/${invoice.id}`}>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                            >
                              <FaEye />
                              <span>عرض</span>
                            </motion.button>
                          </Link>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}