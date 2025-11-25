import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  useEffect(() => {
    // 🚀 Performance Optimizations
    
    // Register Service Worker for caching
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(err =>
        console.error('Service Worker registration failed:', err)
      );
    }

    // ⚡ Prefetch important routes للتحميل الأسرع
    const importantRoutes = ['/movers', '/cleaning', '/water-leaks', '/pest-control', '/advertise'];
    importantRoutes.forEach(route => {
      router.prefetch(route);
    });
    
    // 📊 Google Analytics (إذا كنت تستخدمه)
    // يمكنك إضافة tracking للزوار من Google Ads هنا
    
  }, [router]);

  return (
    <>
      <Component {...pageProps} />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000, // تقليل المدة قليلاً
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
        }}
      />
    </>
  )
}