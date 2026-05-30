const admin = require('firebase-admin');

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  // Fix Railway : remplace les \n littéraux par de vrais sauts de ligne
  const formattedKey = privateKey?.includes('\\n') 
    ? privateKey.replace(/\\n/g, '\n')
    : privateKey;

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: formattedKey,
    }),
  });
}