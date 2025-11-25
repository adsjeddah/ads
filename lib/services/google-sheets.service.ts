import { google } from 'googleapis';
import { GOOGLE_SHEETS_CONFIG } from '../config/google-sheets.config';

/**
 * خدمة حفظ بيانات المعلنين في Google Sheets
 * هذه الخدمة للأرشفة فقط ولا تُستخدم في العمليات الحسابية
 */
export class GoogleSheetsService {
  private static sheets: any;
  private static SPREADSHEET_ID = GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID;
  
  /**
   * تهيئة الاتصال بـ Google Sheets API
   */
  private static async initializeSheets() {
    if (this.sheets) {
      return this.sheets;
    }

    try {
      const auth = new google.auth.GoogleAuth({
        credentials: GOOGLE_SHEETS_CONFIG.CREDENTIALS as any,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      return this.sheets;
    } catch (error) {
      console.error('❌ خطأ في تهيئة Google Sheets:', error);
      throw error;
    }
  }

  /**
   * إضافة معلن جديد إلى Google Sheets (للأرشفة فقط)
   */
  static async addAdvertiserToArchive(data: {
    advertiser_id: string;
    company_name: string;
    phone: string;
    sector: string;
    coverage_type: string;
    coverage_cities?: string[];
    packages: Array<{
      plan_name: string;
      start_date: string;
      end_date: string;
      total_amount: number;
      paid_amount: number;
    }>;
  }): Promise<void> {
    try {
      const sheets = await this.initializeSheets();
      
      // تنسيق البيانات حسب المطلوب
      const addedDate = new Date().toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      // تحديد القطاع بالعربي
      const sectorMap: { [key: string]: string } = {
        'movers': 'نقل العفش',
        'cleaning': 'النظافة',
        'water-leaks': 'كشف تسربات المياه',
        'pest-control': 'مكافحة الحشرات'
      };
      const sectorAr = sectorMap[data.sector] || data.sector;
      
      // تحديد المنطقة الجغرافية
      let geographicArea = '';
      if (data.coverage_type === 'kingdom') {
        geographicArea = 'المملكة كاملة';
      } else if (data.coverage_type === 'city' && data.coverage_cities) {
        geographicArea = data.coverage_cities.join(', ');
      } else if (data.coverage_type === 'both') {
        geographicArea = 'المملكة + مدن محددة';
      }
      
      // إضافة صف لكل باقة (في حالة الباقات المتعددة)
      const rows = [];
      
      if (data.packages && data.packages.length > 0) {
        for (const pkg of data.packages) {
          const remaining = pkg.total_amount - pkg.paid_amount;
          
          rows.push([
            addedDate,                    // تاريخ اضافة المعلن
            data.company_name,            // اسم المعلن
            data.phone,                   // رقم الهاتف
            sectorAr,                     // نوع الخدمة او القطاع
            geographicArea,               // المنطقة الجغرافية
            pkg.plan_name,                // الباقة
            pkg.paid_amount.toString(),   // الدفعة المقدمة
            remaining.toString(),         // المتبقي
            new Date(pkg.start_date).toLocaleDateString('ar-EG'), // بداية الاعلان
            new Date(pkg.end_date).toLocaleDateString('ar-EG')    // انتهاء الاعلان
          ]);
        }
      } else {
        // في حالة عدم وجود باقات (للتوافق مع النظام القديم)
        rows.push([
          addedDate,
          data.company_name,
          data.phone,
          sectorAr,
          geographicArea,
          '-',
          '0',
          '0',
          '-',
          '-'
        ]);
      }
      
      // إضافة الصفوف إلى Google Sheets
      await sheets.spreadsheets.values.append({
        spreadsheetId: this.SPREADSHEET_ID,
        range: 'Sheet1!A:J', // من العمود A إلى J
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: rows,
        },
      });
      
      console.log(`✅ تم حفظ المعلن ${data.company_name} في Google Sheets (${rows.length} صف/صفوف)`);
    } catch (error: any) {
      // نسجل الخطأ فقط ولا نوقف العملية لأن هذا مجرد أرشيف
      console.error('⚠️ خطأ في حفظ المعلن في Google Sheets (الأرشيف):', error.message);
      console.error('التفاصيل:', error);
      // لا نرمي الخطأ لأن الأرشيف ليس ضرورياً لعمل النظام
    }
  }

  /**
   * تهيئة الشيت بإضافة عناوين الأعمدة (يُستخدم مرة واحدة فقط)
   */
  static async initializeHeaders(): Promise<void> {
    try {
      const sheets = await this.initializeSheets();
      
      const headers = [
        'تاريخ اضافة المعلن',
        'اسم المعلن',
        'رقم الهاتف',
        'نوع الخدمة او القطاع',
        'المنطقة الجغرافية',
        'الباقة',
        'الدفعة المقدمة',
        'المتبقي',
        'بداية الاعلان',
        'انتهاء الاعلان'
      ];
      
      // التحقق من وجود بيانات في الصف الأول
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: this.SPREADSHEET_ID,
        range: 'Sheet1!A1:J1',
      });
      
      // إذا كان الصف الأول فارغاً، نضيف العناوين
      if (!response.data.values || response.data.values.length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: this.SPREADSHEET_ID,
          range: 'Sheet1!A1:J1',
          valueInputOption: 'RAW',
          requestBody: {
            values: [headers],
          },
        });
        
        console.log('✅ تم تهيئة عناوين الأعمدة في Google Sheets');
      } else {
        console.log('ℹ️ العناوين موجودة مسبقاً في Google Sheets');
      }
    } catch (error: any) {
      console.error('❌ خطأ في تهيئة عناوين Google Sheets:', error.message);
      throw error;
    }
  }
}

