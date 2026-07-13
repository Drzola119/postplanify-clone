import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { createLogger } from "@/lib/log";

const log = createLogger("firebase-client");

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDUuJypP-JqfOZ7s6swLDemSZS9eTCRcOQ",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "postplanify-best.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "postplanify-best",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "postplanify-best.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "683110118105",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:683110118105:web:71457e4f4d25be95c344c8",
};

function createFirebaseApp(): FirebaseApp | null {
  if (!firebaseConfig.apiKey) {
    if (process.env.NODE_ENV !== "production") {
      log.warn("Missing NEXT_PUBLIC_FIREBASE_* env vars. Auth features will be disabled.");
    }
    return null;
  }
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

const app = createFirebaseApp();

export const firebaseApp: FirebaseApp | null = app;
export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;
export const isFirebaseConfigured = app !== null;
