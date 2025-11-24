import { auth } from '../firebase';

/**
 * الحصول على Token صالح (يحدّثه تلقائياً إذا انتهى)
 * @param forceRefresh إجبار التحديث حتى لو لم ينتهِ
 * @returns Token صالح أو null
 */
export async function getValidToken(forceRefresh: boolean = false): Promise<string | null> {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      console.warn('No authenticated user found');
      return null;
    }
    
    // الحصول على token محدّث
    const token = await user.getIdToken(forceRefresh);
    
    // تحديث localStorage
    localStorage.setItem('token', token);
    
    return token;
  } catch (error) {
    console.error('Error getting valid token:', error);
    return null;
  }
}

/**
 * التحقق من أن المستخدم مسجل دخول وإعادة التوجيه إذا لم يكن
 * @param router Next.js router instance
 */
export function requireAuth(router: any) {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) {
    router.push('/admin/login');
    return false;
  }
  
  return true;
}

/**
 * تسجيل الخروج وإزالة جميع البيانات
 * @param router Next.js router instance
 */
export async function logout(router: any) {
  try {
    await auth.signOut();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/admin/login');
  } catch (error) {
    console.error('Error during logout:', error);
    // حذف البيانات حتى لو فشل signOut
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/admin/login');
  }
}

/**
 * معالج أخطاء Authentication
 * يعيد توجيه المستخدم لصفحة Login إذا كان الخطأ 401
 */
export function handleAuthError(error: any, router: any) {
  if (error.response?.status === 401 || 
      error.response?.status === 403 ||
      error.message?.includes('Invalid or expired token')) {
    console.warn('Authentication failed, redirecting to login...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/admin/login');
    return true;
  }
  return false;
}

/**
 * إنشاء headers مع token محدّث للاستخدام مع axios
 * @param forceRefresh إجبار تحديث التوكن
 * @returns headers object أو null إذا لم يكن هناك user
 */
export async function getAuthHeaders(forceRefresh: boolean = false): Promise<{ Authorization: string } | null> {
  const token = await getValidToken(forceRefresh);
  
  if (!token) {
    return null;
  }
  
  return {
    Authorization: `Bearer ${token}`
  };
}

