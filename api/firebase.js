import admin from 'firebase-admin';

let credential;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
} else {
  credential = admin.credential.applicationDefault();
}

if (!admin.apps.length) {
  const resolvedProjectId =
    process.env.GCLOUD_PROJECT
    || process.env.VITE_FIREBASE_PROJECT_ID
    || 'leadership-evolution-project';

  admin.initializeApp({
    credential,
    projectId: resolvedProjectId,
  });
}

export const db = admin.firestore();
export const adminAuth = admin.auth();