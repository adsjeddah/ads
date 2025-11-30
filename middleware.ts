import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware لمعالجة CORS وطلبات API
 * يعمل قبل وصول الطلب إلى الـ API route
 */
export function middleware(request: NextRequest) {
  // الحصول على الـ response
  const response = NextResponse.next();

  // إضافة CORS headers لجميع الطلبات
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH');
  response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');

  // معالجة OPTIONS preflight request
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH',
        'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  return response;
}

// تطبيق الـ middleware على مسارات الـ API فقط
export const config = {
  matcher: '/api/:path*',
};

