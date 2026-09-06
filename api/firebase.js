import admin from 'firebase-admin';

// Every server endpoint that touches Firestore or Auth comes through here.
// When the service account is missing, the Google client fails deep inside
// itself with "Could not load the default credentials", which names nothing
// and reads like our bug. Say what is actually wrong, once, at load.
function resolveCredential() {
  const raw = String(process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();

  if (!raw) {
    console.error(
      'FIREBASE_SERVICE_ACCOUNT is not set. Every admin call — payment confirmation, '
      + 'the Stripe webhook, password reset, the scheduled mail and the admin console — '
      + 'will fail until it holds the service-account JSON from the Firebase console '
      + '(Project settings -> Service accounts -> Generate new private key).'
    );
    return admin.credential.applicationDefault();
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error(
      'FIREBASE_SERVICE_ACCOUNT is set but is not valid JSON. It must be the whole '
      + 'service-account file, not an API key or a fragment of one.'
    );
    return admin.credential.applicationDefault();
  }

  // A web API key pasted here parses as a string, and a half-copied file is
  // missing the two fields that actually sign requests.
  if (!parsed || typeof parsed !== 'object' || !parsed.client_email || !parsed.private_key) {
    console.error(
      'FIREBASE_SERVICE_ACCOUNT parsed but has no client_email/private_key, so it is '
      + 'not a service-account JSON. A web API key is not the same thing.'
    );
    return admin.credential.applicationDefault();
  }

  return admin.credential.cert(parsed);
}

if (!admin.apps.length) {
  const resolvedProjectId =
    process.env.GCLOUD_PROJECT
    || process.env.VITE_FIREBASE_PROJECT_ID
    || 'leadership-evolution-project';

  admin.initializeApp({
    credential: resolveCredential(),
    projectId: resolvedProjectId,
  });
}

export const db = admin.firestore();
export const adminAuth = admin.auth();
