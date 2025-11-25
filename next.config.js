/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  
  // 🚀 تحسينات الأداء لـ Google Ads
  experimental: {
    optimizePackageImports: ['framer-motion', 'react-icons'], // تحسين imports
  },
  
  // ⚡ تحسين الصور
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 86400, // 24 ساعة
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // 🎯 Headers للـ Caching
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|webp|avif|ico|css|js)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // 📦 Webpack Optimization
  webpack: (config, { dev, isServer }) => {
    // تحسينات webpack للإنتاج
    if (!dev && !isServer) {
      // Code Splitting محسّن
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // React & Next.js
          framework: {
            name: 'framework',
            test: /[\\/]node_modules[\\/](react|react-dom|next|scheduler)[\\/]/,
            priority: 40,
            enforce: true,
          },
          // مكتبات الـ UI الثقيلة
          lib: {
            test: /[\\/]node_modules[\\/](framer-motion|react-icons)[\\/]/,
            name: 'lib',
            priority: 30,
          },
          // Commons
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
          // Shared
          shared: {
            name: 'shared',
            minChunks: 3,
            priority: 10,
            reuseExistingChunk: true,
          },
        },
        maxInitialRequests: 25,
        minSize: 20000,
      };
      
      // Tree shaking محسّن
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }
    
    return config;
  },
}

module.exports = nextConfig