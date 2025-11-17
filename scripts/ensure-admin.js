const admin = require('firebase-admin');

const serviceAccount = {
  type: "service_account",
  project_id: "jeddah-ads-46daa",
  private_key_id: "9c13d327f1558de5572fe59e0fc268c22310b630",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDADALQPh6H8WS0\nTu0R4yfjSFsST5g6fCLPCot4KJO6MJmRGGa3WT4xp+imyPMS+CN5j+XUDUQqu2c9\n2ZuNUZd7207hiTv+fVMm8jUSKp6Aav5kDoJ+p1vRcOI3+/n1wP5ED4eViOfFcOZQ\nTBvFBHRwhsknWVZqkl4t56CtKgN8+E1UCzb/S7Ihk8Kqkbuw5E4KzwWYdGLKlz7G\nORFe1cpvfrv8JSRWGPieOEN7KXuFOLmYAtkHGJb4xD3INr2/+2jQXjfpcpEEm05a\nZLgw2aKQVoNUK9FId0yqMVTOWfypSvSeVFJBSQmTtPjCb7XVntqBp2qWbb+6cXQ5\nIUS8Jeo1AgMBAAECggEAAyrKNWvqLEMKvLRlEYuWu6yxHAZkSw0RiceDRHqrDiHh\nVD2cB2GMz2M4iKYPPUkKm55dYAew+pMZH2qHjQAqY0zT5tatWzHu+Ar8QOh4ovvr\nZiXc/+fGY0nSi3jCbhLP3OT7cqJmgTmZOzTUyExPbSymGW9HJ+yATdYcxBul9rB6\nmh1G5akD1hubT7cqpyQ/fYjQ5sV24r9XlYWTdgtf3qTpnNR1xemmeZPNILH8Frc3\nuf+6IAcBQPj9urRO7Whn+BuQXWhjVw6Z8+oQR0d3mz1LvSWQpWgTIUZx1aNlcGf6\nwT1AfwRU1CSo41Ak/gw0AEKPV9XAJFJSewELvDKnaQKBgQD0Oq5xegslwapDcSFT\n8529SW3PnhOVw1Lsq24WH6XGrtsIVDsodJ+VYWjwSGjO8y6vQO970XvrJVbd/yYc\njQ0KPlSKnsmB9fWtj7NFU53k7A0cy00ENfl8FUSOMXV1ikfGJXD1ND79fb8Ws0BD\np/GBeYpMAxwvcdZ+x4/EDQpP+QKBgQDJTYAWXS8xSuC+5Xov6XyaqbaWf2gxH8R2\nbd3cqB9r/+FPaBN50mmGXtvh9cfPtA4HLu6lzlssAxwYrKcNBkUOebm3e7xgaXoh\nBYkyLDoyBdf9MQI4pX8djQS5so6K1trnSIi8JVoJjVjxSLcJEno4cHFguVAA0I76\neNUaP/5zHQKBgQCogFQatrk6M4PlRAhag5oxHphExit9CGYOI7iwSuV1Tu6PsI2g\nO9ZemfZs0Yh+QAnVoFeadc2pTvm/8Gm7CRYWGyr4+NTOdYQrWxm0mxw09SeW1i0s\n2pBmq8XA1R7VGbKrYumsQ3+yJS/R2ZpdE2Hsko54Iy0vDruOfOETwmt7AQKBgQCg\nERAYuGAeQfwTz0Upc++wy+J0KTsgVLJTuWkBXG4f4oe2LHvQEo/2WNdfBaCsd+/v\nplH9Zej5Rj/BHwh2QtYGfKRAUhOoVjbWqyA81Q4xWJQ2sBGkGXTKeqeXQXQ20kGe\nRv7zHIBLuClRMxDYFek5l6+Pycrj2vLWF97b0KbzwQKBgAy5upslV1B4kqYT2yte\nLzkGuz26C00BCV1bK8LutFBbdQK5km6BPnbu/sK2YwdibfP3ez5f0MuLV4xqjQ9b\nuAyXL3RJcDMLaJaBfahTdWXQ0D/FcdlZEsHtIUIWoKsAfOFay8XuVDICVnXELvUc\n1ab76QwVWp5Zra2E6N0IhTOq\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@jeddah-ads-46daa.iam.gserviceaccount.com",
  client_id: "104978395095700860228",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40jeddah-ads-46daa.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// إضافة المدير إلى مجموعة admins
async function ensureAdmin() {
  const adminUid = 'huc6w7W9oQS7sHseNhePEcDSLhp1';
  const adminEmail = 'admin@yourdomain.com';
  
  try {
    // التحقق من وجود المدير
    const adminDoc = await db.collection('admins').doc(adminUid).get();
    
    if (!adminDoc.exists) {
      await db.collection('admins').doc(adminUid).set({
        email: adminEmail,
        name: 'Admin',
        role: 'super_admin',
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Admin added successfully');
    } else {
      console.log('✅ Admin already exists');
    }
    
    // التحقق من المدير في Authentication
    try {
      const userRecord = await admin.auth().getUser(adminUid);
      console.log('✅ Admin exists in Authentication:', userRecord.email);
    } catch (authError) {
      console.log('⚠️  Admin not found in Authentication');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

ensureAdmin();