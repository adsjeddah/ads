/**
 * Client-Side Tracking Utilities
 * 
 * دوال لجمع بيانات التتبع من جهة العميل (المتصفح)
 */

/**
 * جمع جميع بيانات التتبع من المتصفح
 */
export function collectClientData() {
  return {
    // معلومات الصفحة
    page_url: typeof window !== 'undefined' ? window.location.href : null,
    screen_resolution: typeof window !== 'undefined' && window.screen 
      ? `${window.screen.width}x${window.screen.height}` 
      : null,
    
    // UTM Parameters من URL
    ...extractUTMFromURL(),
    
    // Session و Visitor tracking
    session_id: getOrCreateSessionId(),
    is_returning_visitor: isReturningVisitor(),
    previous_visits: getPreviousVisits(),
    
    // وقت البقاء في الصفحة (سيتم حسابه عند النقر)
    time_on_page: null
  };
}

/**
 * استخراج UTM Parameters من URL
 */
export function extractUTMFromURL(): {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
} {
  if (typeof window === 'undefined') {
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null
    };
  }

  const urlParams = new URLSearchParams(window.location.search);
  
  const utmParams = {
    utm_source: urlParams.get('utm_source'),
    utm_medium: urlParams.get('utm_medium'),
    utm_campaign: urlParams.get('utm_campaign'),
    utm_term: urlParams.get('utm_term'),
    utm_content: urlParams.get('utm_content')
  };
  
  // حفظ UTM في localStorage للاستخدام لاحقاً
  if (utmParams.utm_source || utmParams.utm_medium || utmParams.utm_campaign) {
    try {
      localStorage.setItem('utm_params', JSON.stringify(utmParams));
    } catch (e) {
      // Ignore localStorage errors
    }
  }
  
  // إذا لم يكن هناك UTM في URL، جرب قراءته من localStorage
  if (!utmParams.utm_source && !utmParams.utm_medium && !utmParams.utm_campaign) {
    try {
      const saved = localStorage.getItem('utm_params');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }
  
  return utmParams;
}

/**
 * الحصول على أو إنشاء Session ID
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';

  try {
    // تحقق من وجود session_id في sessionStorage
    let sessionId = sessionStorage.getItem('session_id');
    
    if (!sessionId) {
      // إنشاء session_id جديد
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    
    return sessionId;
  } catch (e) {
    // إذا فشل sessionStorage، أنشئ session_id مؤقت
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * التحقق من كون الزائر عائد أم جديد
 */
export function isReturningVisitor(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const visited = localStorage.getItem('has_visited');
    return visited === 'true';
  } catch (e) {
    return false;
  }
}

/**
 * الحصول على عدد الزيارات السابقة
 */
export function getPreviousVisits(): number {
  if (typeof window === 'undefined') return 0;

  try {
    const visits = localStorage.getItem('visit_count');
    return visits ? parseInt(visits, 10) : 0;
  } catch (e) {
    return 0;
  }
}

/**
 * تسجيل الزيارة
 */
export function recordVisit(): void {
  if (typeof window === 'undefined') return;

  try {
    // وضع علامة أن المستخدم زار الموقع
    localStorage.setItem('has_visited', 'true');
    
    // زيادة عدد الزيارات
    const currentVisits = getPreviousVisits();
    localStorage.setItem('visit_count', (currentVisits + 1).toString());
  } catch (e) {
    // Ignore localStorage errors
  }
}

/**
 * حساب الوقت المستغرق في الصفحة
 */
let pageLoadTime: number | null = null;

export function startTimeTracking(): void {
  if (typeof window !== 'undefined') {
    pageLoadTime = Date.now();
  }
}

export function getTimeOnPage(): number | null {
  if (typeof window === 'undefined' || !pageLoadTime) return null;
  
  const timeSpent = Math.floor((Date.now() - pageLoadTime) / 1000); // بالثواني
  return timeSpent;
}

/**
 * جمع البيانات عند النقرة/المكالمة
 */
export function collectEventData() {
  const baseData = collectClientData();
  
  return {
    ...baseData,
    time_on_page: getTimeOnPage()
  };
}

/**
 * تهيئة التتبع عند تحميل الصفحة
 */
export function initializeTracking(): void {
  if (typeof window === 'undefined') return;
  
  // بدء تتبع الوقت
  startTimeTracking();
  
  // تسجيل الزيارة
  recordVisit();
  
  // الحصول على أو إنشاء Session ID
  getOrCreateSessionId();
  
  // استخراج وحفظ UTM Parameters
  extractUTMFromURL();
}

