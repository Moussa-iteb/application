const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function sendNotificationToUser(fcmToken, title, body, data = {}) {
  const message = { token: fcmToken, notification: { title, body }, data };
  const response = await admin.messaging().send(message);
  return { success: true, messageId: response };
}

async function sendNotificationToAll(tokens, title, body, data = {}) {
  const message = { tokens, notification: { title, body }, data };
  const response = await admin.messaging().sendEachForMulticast(message);
  return { success: true, successCount: response.successCount, failureCount: response.failureCount };
}

module.exports = { sendNotificationToUser, sendNotificationToAll };