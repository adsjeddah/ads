import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="ar" dir="rtl">
      <Head>
        {/* 🚀 Performance Optimization */}
        {/* DNS Prefetch & Preconnect للموارد الخارجية */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Meta Tags */}
        <meta name="description" content="بروكر - دليلك الشامل للشركات والخدمات في المملكة العربية السعودية" />
        <meta name="keywords" content="دليل شركات السعودية, نقل عفش, نظافة, كشف تسربات, مكافحة حشرات, خدمات المملكة" />
        <meta property="og:title" content="بروكر - دليل الشركات في المملكة" />
        <meta property="og:description" content="دليلك الشامل للوصول إلى أفضل الشركات الموثوقة في المملكة العربية السعودية" />
        <meta property="og:type" content="website" />
        <meta name="theme-color" content="#3b82f6" />
        
        {/* فرض استخدام الأرقام الإنجليزية */}
        <meta httpEquiv="Content-Language" content="ar" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}