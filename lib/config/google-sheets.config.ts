/**
 * تكوين Google Sheets
 * يحتوي على بيانات الاعتماد ومعلومات الاتصال
 */

export const GOOGLE_SHEETS_CONFIG = {
  // معرف الشيت
  SPREADSHEET_ID: '1pN_pwoOuujKBIp4Ca04Z_fovuix5VMtJ3h4rFFY3wno',
  
  // اسم الورقة
  SHEET_NAME: 'Sheet1',
  
  // نطاق البيانات (من A إلى J)
  DATA_RANGE: 'Sheet1!A:J',
  
  // بيانات الاعتماد (Service Account)
  CREDENTIALS: {
    type: "service_account",
    project_id: process.env.GOOGLE_SHEETS_PROJECT_ID || "review-saudimoving",
    private_key_id: process.env.GOOGLE_SHEETS_PRIVATE_KEY_ID || "9e5dcb6b7bb0882bef53bf3f4269e04311b966a5",
    private_key: (process.env.GOOGLE_SHEETS_PRIVATE_KEY || 
      "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQClD6cJXUMwdGYY\nhfb7LjJD6cjCEsPrL7Qq+7tq74yXVLMC3VevNHSeXicgerBXprJKUsMOk/qFivwg\n7Uqw5cCXB0G+sD65SXeEEIDkIYhpTKaYC09ckT2tT6/LCDwufExeSTbKfcs5wqIK\nJseDJ9/rjg68VjXIT/URlQoCL6htmv+aJ7pZt69IOVyNUlBfDJ8iIwI5uce19roF\no6zyaVLaKqhhfXU+hsEQCjIJ7hlMMDCSOPSZ3nkmIQ4Ri2Opx1iA5kggaU7In4g8\naotQgBYJ0Hl9KIp75oDrWz3ugaZVCdFvcoC28iH4s4noVL6kMTT9ify5mr7hG53X\n53872qfRAgMBAAECggEAA2MYVuQFNRvWXSohQNNDBcto1WQEMDHOPSmQQCgClw0O\nZVXRxE8hFioxca8C1Qb0gVDvHr/2SUI/spSb+UL7BOkJtiuGBfsAywLPBPS+iLFM\nI9zrjSc6gEbH1onojj2lEDQ+vcCqExkwMQwjAPPTBPw+ciqaDO5ocCrCRfw2CmsL\njt9sw+ul020danXJQHsdUw9ayaeBnwmqO40c7GuLdHolA+oG8kB0Kct+oTZpiP3p\n4S1qZGTBbtGGaanUOKM29sO4eCl8wswqz3eQxoj8ubxBlM+5hEn5pKzBsdJ6IAHF\nBLgSLZv64P/L8loU5hbNTY+cO7sEUPzjgK0EVDw24QKBgQDPbf3MFc8K+B716NDC\nsK4SGFEOxrIYTM2E41Vy7Z68/D0aLtZY2QiQaolYzdC4GnUZt0GMl/gYkV0R1g+r\nqMqC6XE/QUSWtXYcIkbz+WHPmy+wkNcfe15GbiBxEz/SzoD9Qo0wwgW3WppOb9Xt\nOlATzQWCHQYmaRxA6Z0hHpeQqQKBgQDLtfRhz3U0x9mE1PIL5rWEqT4il87wD4sA\nC99pSOHVOGR/wE2K0IZkP+rMF6c3HJQ/u7klWt09y4BlVm+3aE0E7mps3R8F4IpL\nRYA3usjBM9e009SbglODHS5riWb0xx4g1BOe46p9yMTRmm/sIFzqK53N1BXvXcjD\nhYa98YDO6QKBgQDDw1/Ca1ayWIcHuAjFpW8y/qYJVvafvmQ8JTzwsVedrkSQYGHF\nCldtzE4BdISmK7oWYgBICuiHbzEx8x9o92zgbiaF9zgfL/TfCm6CNPrdru0sKxYL\nzSelOqv9a5hRgLj1zAhqWsKAT87Pdfak4+LNPTIUoQW73Hlgvdmgdzm9uQKBgAPc\nTOdVoSkA6JRl3LhxBNugwXayXc+a282CbBd4tB7wVKc/I7kPvpxDwdVgVWDr/7s9\neYLFuA+lvact/iwBpAQF6Kprfl0EJlrK1GU5+vf+XYYlxY+05pRDh0+uaO8WnvGM\nU1rdgauklGZMgPZ+noQpk3IFJO1GX7mk3CrZWtGRAoGBAMudUWToorVw854tQVPf\n1BpWDNcY4NAM39iR7dpdVnOtXm/ToaDim/GXOIUsYsNrM/b5MKdt6qeKb2pZJfRk\nodJpPcI2Ys4rmjggJpYTkkh79v/2XgZXJhQ3Uebjlx626q9C7vihUUSicggu123w\njTB8CK30qk70HTncaLU0KmmO\n-----END PRIVATE KEY-----\n"
    ).replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL || "prokr-leads@review-saudimoving.iam.gserviceaccount.com",
    client_id: process.env.GOOGLE_SHEETS_CLIENT_ID || "117619319309604167059",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/prokr-leads%40review-saudimoving.iam.gserviceaccount.com",
    universe_domain: "googleapis.com"
  },
  
  // العناوين
  HEADERS: [
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
  ],
  
  // خريطة القطاعات
  SECTOR_MAP: {
    'movers': 'نقل العفش',
    'cleaning': 'النظافة',
    'water-leaks': 'كشف تسربات المياه',
    'pest-control': 'مكافحة الحشرات'
  } as const
};

