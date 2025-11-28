import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Toaster } from 'react-hot-toast'
import { useEffect, memo, useCallback } from 'react'
import { useRouter } from 'next/router'

// Toaster options - مُعرّفة خارج المكون لتجنب إعادة الإنشاء
const toasterOptions = {
  duration: 3000,
  style: {
    background: '#363636',
    color: '#fff',
    borderRadius: '10px',
    padding: '16px',
  },
  success: {
    style: {
      background: '#10b981',
    },
  },
  error: {
    style: {
      background: '#ef4444',
    },
  },
};

// Routes للـ prefetch
const PREFETCH_ROUTES = ['/movers', '/cleaning', '/water-leaks', '/pest-control', '/advertise'];

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // Prefetch routes مرة واحدة فقط
  useEffect(() => {
    // تأخير الـ prefetch قليلاً للسماح للصفحة الحالية بالتحميل أولاً
    const timeoutId = setTimeout(() => {
      PREFETCH_ROUTES.forEach(route => {
        router.prefetch(route);
      });
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Component {...pageProps} />
      <Toaster position="top-center" toastOptions={toasterOptions} />
    </>
  )
}

export default App