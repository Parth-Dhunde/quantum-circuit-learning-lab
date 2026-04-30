import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";

import { auth, hasFirebaseEnv } from "../firebaseConfig";
import { useCircuitStore } from "../store/useCircuitStore";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        useCircuitStore.getState().resetForLogout();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, password) {
        if (!auth || !hasFirebaseEnv) throw new Error("Firebase is not configured. Please check frontend/.env.");
        await signInWithEmailAndPassword(auth, email, password);
      },
      async signup(email, password) {
        if (!auth || !hasFirebaseEnv) throw new Error("Firebase is not configured. Please check frontend/.env.");
        await createUserWithEmailAndPassword(auth, email, password);
      },
      async loginWithGoogle() {
        if (!auth || !hasFirebaseEnv) throw new Error("Firebase is not configured. Please check frontend/.env.");
        await signInWithPopup(auth, googleProvider);
      },
      async logout() {
        if (!auth || !hasFirebaseEnv) return;
        await signOut(auth);
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
