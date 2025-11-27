import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="ar" dir="rtl">
      <Head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NVDNTSRV');`,
          }}
        />
        {/* End Google Tag Manager */}

        {/* Google Ads (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-933899057" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'AW-933899057');

// Google Ads Conversion Tracking - Phone Click
function gtag_report_conversion(url) {
  var callback = function () {
    if (typeof(url) != 'undefined') {
      window.location = url;
    }
  };
  gtag('event', 'conversion', {
    'send_to': 'AW-933899057/dd0DCO6e4ccbELHWqL0D',
    'value': 1.0,
    'currency': 'USD',
    'event_callback': callback
  });
  return false;
}`,
          }}
        />
        {/* End Google Ads */}

        {/* 🚀 Performance Optimization */}
        {/* DNS Prefetch & Preconnect للموارد الخارجية */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        
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
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NVDNTSRV"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}