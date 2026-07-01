import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";

import { auth, hasFirebaseEnv } from "../firebaseConfig";
import { useCircuitStore } from "../store/useCircuitStore";
import { logDev, logDevError } from "../utils/logDev";

type GoogleLoginResult = {
  redirected: boolean;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<GoogleLoginResult>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const googleProvider = new GoogleAuthProvider();

function ensureOnline(): void {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("You appear to be offline. Please check your internet connection.");
  }
}

function mapNetworkError(error: unknown): Error | null {
  if (!(error instanceof Error)) return null;
  const msg = error.message.toLowerCase();
  if (
    msg.includes("network") ||
    msg.includes("failed to fetch") ||
    msg.includes("fetch failed") ||
    msg.includes("internet")
  ) {
    return new Error("Network error. Please check your internet connection and try again.");
  }
  return null;
}

function mapFirebaseAuthError(error: unknown, fallback: string): Error {
  const networkError = mapNetworkError(error);
  if (networkError) return networkError;

  if (!error || typeof error !== "object" || !("code" in error)) {
    return new Error(error instanceof Error ? error.message : fallback);
  }

  const code = String((error as { code?: string }).code);

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return new Error("Invalid email or password.");
    case "auth/too-many-requests":
      return new Error("Too many attempts. Please try again later.");
    case "auth/invalid-email":
      return new Error("Please enter a valid email address.");
    case "auth/email-already-in-use":
      return new Error("This email is already registered. Please login or continue with Google.");
    case "auth/weak-password":
      return new Error("Password should be at least 6 characters long.");
    case "auth/popup-closed-by-user":
      return new Error("Sign-in popup was closed. Please try again.");
    case "auth/popup-blocked":
      return new Error("Popup was blocked. Redirecting to Google sign-in...");
    case "auth/cancelled-popup-request":
      return new Error("Sign-in was interrupted. Please try again.");
    case "auth/network-request-failed":
      return new Error("Network error. Please check your internet connection and try again.");
    case "auth/user-disabled":
      return new Error("This account has been disabled. Please contact support.");
    case "auth/operation-not-allowed":
      return new Error("This sign-in method is not enabled. Please contact support.");
    default:
      return new Error((error as { message?: string }).message || fallback);
  }
}

function ensureFirebaseConfigured(): void {
  if (!auth || !hasFirebaseEnv) {
    throw new Error("Firebase is not configured. Please check frontend/.env.");
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    let active = true;

    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          logDev("Google redirect sign-in completed.");
        }
      })
      .catch((error) => {
        logDevError("Google redirect sign-in failed:", error);
      });

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (!active) return;
      setUser(nextUser);

      if (!nextUser) {
        useCircuitStore.getState().resetForLogout();
      }

      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,

      async login(email, password) {
        ensureFirebaseConfigured();
        ensureOnline();

        try {
          await signInWithEmailAndPassword(auth!, email, password);
        } catch (error) {
          throw mapFirebaseAuthError(error, "Login failed.");
        }
      },

      async signup(email, password) {
        ensureFirebaseConfigured();
        ensureOnline();

        try {
          await createUserWithEmailAndPassword(auth!, email, password);
        } catch (error) {
          throw mapFirebaseAuthError(error, "Signup failed.");
        }
      },

      async loginWithGoogle() {
        ensureFirebaseConfigured();
        ensureOnline();

        try {
          await signInWithPopup(auth!, googleProvider);
          return { redirected: false };
        } catch (error) {
          const code =
            error && typeof error === "object" && "code" in error
              ? String((error as { code?: string }).code)
              : "";

          if (code === "auth/popup-blocked") {
            logDev("Popup blocked — falling back to redirect sign-in.");
            await signInWithRedirect(auth!, googleProvider);
            return { redirected: true };
          }

          throw mapFirebaseAuthError(error, "Google login failed.");
        }
      },

      async resetPassword(email) {
        ensureFirebaseConfigured();
        ensureOnline();

        try {
          await sendPasswordResetEmail(auth!, email);
        } catch (error) {
          throw mapFirebaseAuthError(error, "Could not send reset email. Please try again.");
        }
      },

      async logout() {
        if (!auth || !hasFirebaseEnv) return;

        try {
          await signOut(auth);
        } catch (error) {
          throw mapFirebaseAuthError(error, "Logout failed.");
        }
      },
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
