import admin from 'firebase-admin';

let credential;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
} else {
  credential = admin.credential.applicationDefault();
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential,
    projectId: process.env.GCLOUD_PROJECT || process.env.VITE_FIREBASE_PROJECT_ID,
  });
}

export const db = admin.firestore();