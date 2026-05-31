const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function sendNotificationToUser(fcmToken, title, body, data = {}) {
  // ✅ FCM exige que toutes les valeurs dans data soient des strings
  const stringData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, String(v)])
  );

  const message = {
    token: fcmToken,
    notification: { title, body },
    data: stringData,  // ← contient userId en string
  };

  const response = await admin.messaging().send(message);
  return { success: true, messageId: response };
}

async function sendNotificationToAll(tokens, title, body, data = {}) {
  const stringData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, String(v)])
  );

  const message = {
    tokens,
    notification: { title, body },
    data: stringData,  // ← vide pour "tous"
  };

  const response = await admin.messaging().sendEachForMulticast(message);
  return {
    success:      true,
    successCount: response.successCount,
    failureCount: response.failureCount,
  };
}

module.exports = { sendNotificationToUser, sendNotificationToAll };