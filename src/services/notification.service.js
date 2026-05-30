const admin = require('firebase-admin');

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  // Fix Railway : remplace les \n littéraux par de vrais sauts de ligne
  const formattedKey = privateKey?.includes('\\n') 
    ? privateKey.replace(/\\n/g, '\n')
    : privateKey;
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);
console.log('PRIVATE_KEY starts with:', process.env.FIREBASE_PRIVATE_KEY?.substring(0, 30));
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: formattedKey,
    }),
  });
}