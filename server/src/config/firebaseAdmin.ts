import admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET ?? (projectId ? `${projectId}.appspot.com` : undefined);

if (admin.apps.length === 0) {
  admin.initializeApp({
    // Firebase Admin will read GOOGLE_APPLICATION_CREDENTIALS when running locally.
    // Do not hardcode service account JSON or private keys in source code.
    credential: admin.credential.applicationDefault(),
    projectId,
    storageBucket
  });
}

const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();

export { admin, db, auth, bucket };
