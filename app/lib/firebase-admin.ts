import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

function assertConfigured() {
  const missing = Object.entries(firebaseAdminConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    const envNames = missing
      .map((key) => (key === "projectId" ? "FIREBASE_PROJECT_ID" : key === "clientEmail" ? "FIREBASE_CLIENT_EMAIL" : "FIREBASE_PRIVATE_KEY"))
      .join(", ");
    throw new Error(
      `Firebase Admin isn't configured: missing ${envNames}. Set these in the environment (build-time env for anything statically generated, like sitemap.ts) before this app can run.`
    );
  }
}

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  assertConfigured();
  return initializeApp({ credential: cert(firebaseAdminConfig) });
}

const app = getAdminApp();

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);