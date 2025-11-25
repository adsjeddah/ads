/**
 * Script لعرض البيانات المحفوظة في Google Sheets
 * مفيد للمراجعة السريعة للأرشيف
 */

const { google } = require('googleapis');

// بيانات الاعتماد
const credentials = {
  type: "service_account",
  project_id: "review-saudimoving",
  private_key_id: "9e5dcb6b7bb0882bef53bf3f4269e04311b966a5",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQClD6cJXUMwdGYY\nhfb7LjJD6cjCEsPrL7Qq+7tq74yXVLMC3VevNHSeXicgerBXprJKUsMOk/qFivwg\n7Uqw5cCXB0G+sD65SXeEEIDkIYhpTKaYC09ckT2tT6/LCDwufExeSTbKfcs5wqIK\nJseDJ9/rjg68VjXIT/URlQoCL6htmv+aJ7pZt69IOVyNUlBfDJ8iIwI5uce19roF\no6zyaVLaKqhhfXU+hsEQCjIJ7hlMMDCSOPSZ3nkmIQ4Ri2Opx1iA5kggaU7In4g8\naotQgBYJ0Hl9KIp75oDrWz3ugaZVCdFvcoC28iH4s4noVL6kMTT9ify5mr7hG53X\n53872qfRAgMBAAECggEAA2MYVuQFNRvWXSohQNNDBcto1WQEMDHOPSmQQCgClw0O\nZVXRxE8hFioxca8C1Qb0gVDvHr/2SUI/spSb+UL7BOkJtiuGBfsAywLPBPS+iLFM\nI9zrjSc6gEbH1onojj2lEDQ+vcCqExkwMQwjAPPTBPw+ciqaDO5ocCrCRfw2CmsL\njt9sw+ul020danXJQHsdUw9ayaeBnwmqO40c7GuLdHolA+oG8kB0Kct+oTZpiP3p\n4S1qZGTBbtGGaanUOKM29sO4eCl8wswqz3eQxoj8ubxBlM+5hEn5pKzBsdJ6IAHF\nBLgSLZv64P/L8loU5hbNTY+cO7sEUPzjgK0EVDw24QKBgQDPbf3MFc8K+B716NDC\nsK4SGFEOxrIYTM2E41Vy7Z68/D0aLtZY2QiQaolYzdC4GnUZt0GMl/gYkV0R1g+r\nqMqC6XE/QUSWtXYcIkbz+WHPmy+wkNcfe15GbiBxEz/SzoD9Qo0wwgW3WppOb9Xt\nOlATzQWCHQYmaRxA6Z0hHpeQqQKBgQDLtfRhz3U0x9mE1PIL5rWEqT4il87wD4sA\nC99pSOHVOGR/wE2K0IZkP+rMF6c3HJQ/u7klWt09y4BlVm+3aE0E7mps3R8F4IpL\nRYA3usjBM9e009SbglODHS5riWb0xx4g1BOe46p9yMTRmm/sIFzqK53N1BXvXcjD\nhYa98YDO6QKBgQDDw1/Ca1ayWIcHuAjFpW8y/qYJVvafvmQ8JTzwsVedrkSQYGHF\nCldtzE4BdISmK7oWYgBICuiHbzEx8x9o92zgbiaF9zgfL/TfCm6CNPrdru0sKxYL\nzSelOqv9a5hRgLj1zAhqWsKAT87Pdfak4+LNPTIUoQW73Hlgvdmgdzm9uQKBgAPc\nTOdVoSkA6JRl3LhxBNugwXayXc+a282CbBd4tB7wVKc/I7kPvpxDwdVgVWDr/7s9\neYLFuA+lvact/iwBpAQF6Kprfl0EJlrK1GU5+vf+XYYlxY+05pRDh0+uaO8WnvGM\nU1rdgauklGZMgPZ+noQpk3IFJO1GX7mk3CrZWtGRAoGBAMudUWToorVw854tQVPf\n1BpWDNcY4NAM39iR7dpdVnOtXm/ToaDim/GXOIUsYsNrM/b5MKdt6qeKb2pZJfRk\nodJpPcI2Ys4rmjggJpYTkkh79v/2XgZXJhQ3Uebjlx626q9C7vihUUSicggu123w\njTB8CK30qk70HTncaLU0KmmO\n-----END PRIVATE KEY-----\n",
  client_email: "prokr-leads@review-saudimoving.iam.gserviceaccount.com",
  client_id: "117619319309604167059",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/prokr-leads%40review-saudimoving.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

const SPREADSHEET_ID = '1pN_pwoOuujKBIp4Ca04Z_fovuix5VMtJ3h4rFFY3wno';

async function viewSheetData() {
  try {
    console.log('📖 جاري قراءة بيانات Google Sheets...\n');
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // قراءة جميع البيانات
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:J',
    });
    
    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      console.log('⚠️ لا توجد بيانات في الشيت');
      return;
    }
    
    // عرض العناوين
    console.log('📋 العناوين:');
    console.log('─'.repeat(100));
    console.log(rows[0].join(' | '));
    console.log('─'.repeat(100));
    
    // عرض البيانات
    console.log(`\n📊 عدد المعلنين المحفوظين: ${rows.length - 1}\n`);
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      console.log(`${i}. ${row[1]} (${row[2]}) - ${row[3]} - ${row[4]}`);
      console.log(`   الباقة: ${row[5]} | المدفوع: ${row[6]} ريال | المتبقي: ${row[7]} ريال`);
      console.log(`   من ${row[8]} إلى ${row[9]}`);
      console.log('');
    }
    
    console.log('─'.repeat(100));
    console.log(`\n✅ تم عرض جميع البيانات بنجاح!`);
    console.log(`📝 رابط الشيت: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit\n`);
    
  } catch (error) {
    console.error('❌ خطأ في قراءة البيانات:', error);
    throw error;
  }
}

// تشغيل الوظيفة
viewSheetData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

