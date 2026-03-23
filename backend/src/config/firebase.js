import admin from "firebase-admin";

let initialized = false;

function parseServiceAccount() {
  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (inlineJson) {
    return JSON.parse(inlineJson);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error(
      "Firebase Admin credentials are missing. Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
    );
  }

  return {
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKeyRaw.replace(/\\n/g, "\n"),
  };
}

export function initializeFirebaseAdmin() {
  if (initialized && admin.apps.length) {
    return admin.app();
  }

  if (!admin.apps.length) {
    const serviceAccount = parseServiceAccount();
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  initialized = true;
  return admin.app();
}

export async function verifyFirebaseIdToken(idToken) {
  initializeFirebaseAdmin();
  return admin.auth().verifyIdToken(idToken);
}
