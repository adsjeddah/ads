/**
 * Tracking Utilities - أدوات التتبع المتقدمة
 * 
 * يوفر دوال لاستخراج معلومات التتبع من:
 * - IP Address (الموقع الجغرافي)
 * - User Agent (الجهاز والمتصفح)
 * - Request Headers (المصدر والإحالة)
 * - UTM Parameters (حملات Google Ads)
 */

import { NextApiRequest } from 'next';
import { UAParser } from 'ua-parser-js';

// geoip-lite اختياري - قد لا يعمل على Vercel Serverless
let geoip: any = null;
try {
  geoip = require('geoip-lite');
} catch (error) {
  console.warn('geoip-lite not available, geo location will be skipped');
}

/**
 * استخراج عنوان IP الحقيقي من Request
 * يأخذ في الاعتبار Proxies و Load Balancers
 */
export function getClientIP(req: NextApiRequest): string | null {
  try {
    // Try different headers in order of priority
    const forwarded = req.headers['x-forwarded-for'] as string;
    const real = req.headers['x-real-ip'] as string;
    const cfConnecting = req.headers['cf-connecting-ip'] as string; // Cloudflare
    
    if (forwarded) {
      // x-forwarded-for can contain multiple IPs, take the first one
      return forwarded.split(',')[0].trim();
    }
    
    if (real) {
      return real;
    }
    
    if (cfConnecting) {
      return cfConnecting;
    }
    
    // Fallback to connection remote address
    return req.socket?.remoteAddress || null;
  } catch (error) {
    console.error('Error getting client IP:', error);
    return null;
  }
}

/**
 * استخراج معلومات الموقع الجغرافي من IP
 * ملاحظة: geoip-lite قد لا يعمل على Vercel Serverless
 */
export function getGeoLocationFromIP(ip: string | null) {
  // إذا كان IP محلي
  if (!ip || ip === '::1' || ip === '127.0.0.1') {
    return {
      country: 'Local',
      city: 'Localhost',
      region: null,
      isp: null
    };
  }
  
  // إذا كان geoip غير متاح، أرجع قيم فارغة
  if (!geoip) {
    return {
      country: null,
      city: null,
      region: null,
      isp: null
    };
  }
  
  try {
    const geo = geoip.lookup(ip);
    
    if (geo) {
      return {
        country: geo.country === 'SA' ? 'السعودية' : geo.country,
        city: translateCity(geo.city),
        region: translateRegion(geo.region),
        isp: null // geoip-lite doesn't provide ISP
      };
    }
  } catch (error) {
    console.warn('Error getting geo location:', error);
  }
  
  return {
    country: null,
    city: null,
    region: null,
    isp: null
  };
}

/**
 * ترجمة أسماء المدن للعربية
 */
function translateCity(city: string | null): string | null {
  if (!city) return null;
  
  const cityMap: { [key: string]: string } = {
    'Riyadh': 'الرياض',
    'Jeddah': 'جدة',
    'Mecca': 'مكة المكرمة',
    'Medina': 'المدينة المنورة',
    'Dammam': 'الدمام',
    'Khobar': 'الخبر',
    'Dhahran': 'الظهران',
    'Tabuk': 'تبوك',
    'Buraydah': 'بريدة',
    'Khamis Mushait': 'خميس مشيط',
    'Hail': 'حائل',
    'Najran': 'نجران',
    'Jazan': 'جازان',
    'Jubail': 'الجبيل',
    'Abha': 'أبها',
    'Taif': 'الطائف',
    'Qatif': 'القطيف',
    'Yanbu': 'ينبع'
  };
  
  return cityMap[city] || city;
}

/**
 * ترجمة أسماء المناطق للعربية
 */
function translateRegion(region: string | null): string | null {
  if (!region) return null;
  
  const regionMap: { [key: string]: string } = {
    'Riyadh Region': 'منطقة الرياض',
    'Makkah Region': 'منطقة مكة المكرمة',
    'Eastern Province': 'المنطقة الشرقية',
    'Madinah Region': 'منطقة المدينة المنورة',
    'Asir Region': 'منطقة عسير',
    'Tabuk Region': 'منطقة تبوك',
    'Qassim Region': 'منطقة القصيم',
    'Hail Region': 'منطقة حائل',
    'Najran Region': 'منطقة نجران',
    'Jazan Region': 'منطقة جازان',
    'Al Bahah Region': 'منطقة الباحة',
    'Northern Borders Region': 'منطقة الحدود الشمالية',
    'Al Jawf Region': 'منطقة الجوف'
  };
  
  return regionMap[region] || region;
}

/**
 * استخراج معلومات الجهاز والمتصفح من User Agent
 */
export function getDeviceInfo(userAgent: string | undefined) {
  if (!userAgent) {
    return {
      device_type: null,
      device_vendor: null,
      device_model: null,
      os: null,
      browser: null,
      browser_version: null
    };
  }
  
  try {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    
    // Determine device type
    let deviceType = 'Desktop';
    if (result.device.type === 'mobile') deviceType = 'Mobile';
    else if (result.device.type === 'tablet') deviceType = 'Tablet';
    
    // Format OS name with version
    const osName = result.os.name || null;
    const osVersion = result.os.version || null;
    const os = osName ? `${osName}${osVersion ? ' ' + osVersion : ''}` : null;
    
    // Format browser name with version
    const browserName = result.browser.name || null;
    const browserVersion = result.browser.version || null;
    
    return {
      device_type: deviceType,
      device_vendor: result.device.vendor || null,
      device_model: result.device.model || null,
      os: os,
      browser: browserName,
      browser_version: browserVersion
    };
  } catch (error) {
    console.error('Error parsing user agent:', error);
    return {
      device_type: null,
      device_vendor: null,
      device_model: null,
      os: null,
      browser: null,
      browser_version: null
    };
  }
}

/**
 * استخراج معلومات Referrer (المصدر)
 */
export function getReferrerInfo(req: NextApiRequest): string | null {
  try {
    const referer = req.headers.referer || req.headers.referrer;
    if (!referer) return 'مباشر';
    
    const refererStr = referer as string;
    
    // Check if it's from Google
    if (refererStr.includes('google.com')) return 'Google Search';
    if (refererStr.includes('google.sa')) return 'Google Search (SA)';
    
    // Check if it's from social media
    if (refererStr.includes('facebook.com')) return 'Facebook';
    if (refererStr.includes('twitter.com')) return 'Twitter';
    if (refererStr.includes('instagram.com')) return 'Instagram';
    if (refererStr.includes('linkedin.com')) return 'LinkedIn';
    if (refererStr.includes('tiktok.com')) return 'TikTok';
    if (refererStr.includes('snapchat.com')) return 'Snapchat';
    
    // Check if it's from the same domain
    if (refererStr.includes(req.headers.host || '')) return 'داخلي';
    
    // Return the domain name
    try {
      const url = new URL(refererStr);
      return url.hostname;
    } catch {
      return refererStr;
    }
  } catch (error) {
    console.error('Error getting referrer info:', error);
    return null;
  }
}

/**
 * استخراج UTM Parameters من البيانات المرسلة
 */
export function extractUTMParams(data: any) {
  return {
    utm_source: data.utm_source || null,
    utm_medium: data.utm_medium || null,
    utm_campaign: data.utm_campaign || null,
    utm_term: data.utm_term || null,
    utm_content: data.utm_content || null
  };
}

/**
 * إنشاء معرف جلسة فريد
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * تجميع جميع بيانات التتبع
 */
export function collectTrackingData(
  req: NextApiRequest,
  clientData: any
) {
  const ip = getClientIP(req);
  const geo = getGeoLocationFromIP(ip);
  const device = getDeviceInfo(req.headers['user-agent']);
  const referrer = getReferrerInfo(req);
  const utm = extractUTMParams(clientData);
  
  return {
    // معلومات الموقع
    ip_address: ip,
    country: geo.country,
    city: geo.city,
    region: geo.region,
    isp: geo.isp,
    
    // معلومات الجهاز
    device_type: device.device_type,
    device_vendor: device.device_vendor,
    device_model: device.device_model,
    os: device.os,
    browser: device.browser,
    browser_version: device.browser_version,
    
    // معلومات التصفح
    page_url: clientData.page_url || null,
    referrer: referrer,
    screen_resolution: clientData.screen_resolution || null,
    
    // معلومات تسويقية
    utm_source: utm.utm_source,
    utm_medium: utm.utm_medium,
    utm_campaign: utm.utm_campaign,
    utm_term: utm.utm_term,
    utm_content: utm.utm_content,
    
    // معلومات سلوكية
    session_id: clientData.session_id || generateSessionId(),
    time_on_page: clientData.time_on_page || null,
    is_returning_visitor: clientData.is_returning_visitor || false,
    previous_visits: clientData.previous_visits || 0
  };
}

