const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
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