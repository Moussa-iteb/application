const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('⚠️ Firebase Admin: missing credentials — notifications disabled');
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey })
      });
      console.log('✅ Firebase Admin initialized');
    } catch (err) {
      console.error('❌ Firebase Admin init error:', err.message);
    }
  }
}

// helper باش نتأكد Firebase مهيأ
function isInitialized() {
  return admin.apps.length > 0;
}

// إرسال notification لـ user واحد
async function sendNotificationToUser(fcmToken, title, body, data = {}) {
  if (!isInitialized()) return { success: false, error: 'Firebase not initialized' };
  try {
    const response = await admin.messaging().send({
      notification: { title, body },
      data,
      token: fcmToken
    });
    console.log('✅ Notification sent:', response);
    return { success: true, response };
  } catch (error) {
    console.error('❌ Notification error:', error.message);
    return { success: false, error: error.message };
  }
}

// إرسال لكل الـ users (broadcast)
async function sendNotificationToAll(tokens, title, body, data = {}) {
  if (!isInitialized()) return { success: false, error: 'Firebase not initialized' };
  if (!tokens.length)   return { success: false, error: 'No tokens provided' };
  try {
    const response = await admin.messaging().sendEachForMulticast({
      notification: { title, body },
      data,
      tokens
    });
    console.log(`✅ Sent: ${response.successCount}, Failed: ${response.failureCount}`);
    return { success: true, successCount: response.successCount, failureCount: response.failureCount };
  } catch (error) {
    console.error('❌ Broadcast error:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendNotificationToUser, sendNotificationToAll };