import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasFirebaseEnv = Object.values(firebaseConfig).every((value) => typeof value === "string" && value.trim().length > 0);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (hasFirebaseEnv) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} else if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.error("Firebase config is incomplete. Add VITE_FIREBASE_* values to frontend/.env and restart Vite.");
}

export { app, auth, hasFirebaseEnv };
