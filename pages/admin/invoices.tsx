import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * صفحة الفواتير - Redirect
 * تم نقل محتوى هذه الصفحة إلى /admin/dashboard?tab=invoices
 */
export default function InvoicesRedirect() {
  const router = useRouter();

  useEffect(() => {
    // إعادة توجيه فورية لصفحة Dashboard مع tab الفواتير
    router.replace('/admin/dashboard?tab=invoices');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">جاري التحويل إلى صفحة الفواتير...</p>
      </div>
    </div>
  );
}
