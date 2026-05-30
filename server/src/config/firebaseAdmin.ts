import admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;

if (admin.apps.length === 0) {
  admin.initializeApp({
    // Firebase Admin will read GOOGLE_APPLICATION_CREDENTIALS when running locally.
    // Do not hardcode service account JSON or private keys in source code.
    credential: admin.credential.applicationDefault(),
    projectId
  });
}

const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };
