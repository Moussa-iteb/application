const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function sendNotificationToUser(fcmToken, title, body, data = {}) {
  const stringData = Object.fromEntries(
    Object.entries({ title, body, ...data }).map(([k, v]) => [k, String(v)])
  );

  const message = {
    token: fcmToken,
    data: stringData,          // ✅ seulement data — pas de bloc notification
    android: { priority: 'high' }
  };

  const response = await admin.messaging().send(message);
  return { success: true, messageId: response };
}

async function sendNotificationToAll(tokens, title, body, data = {}) {
  const stringData = Object.fromEntries(
    Object.entries({ title, body, ...data }).map(([k, v]) => [k, String(v)])
  );

  const message = {
    tokens,
    data: stringData,          // ✅ seulement data — pas de bloc notification
    android: { priority: 'high' }
  };

  const response = await admin.messaging().sendEachForMulticast(message);
  return {
    success:      true,
    successCount: response.successCount,
    failureCount: response.failureCount,
  };
}

module.exports = { sendNotificationToUser, sendNotificationToAll };