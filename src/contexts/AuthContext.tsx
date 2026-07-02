"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  createUserWithEmailAndPassword,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase/config";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "disabled";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setStatus("disabled");
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setStatus(u ? "authenticated" : "unauthenticated");
    });
    return () => unsub();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      async signInWithEmail(email, password) {
        if (!auth) throw new Error("Firebase is not configured");
        await signInWithEmailAndPassword(auth, email, password);
      },
      async signUpWithEmail(email, password, displayName) {
        if (!auth) throw new Error("Firebase is not configured");
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(cred.user, { displayName });
        }
      },
      async signInWithGoogle() {
        if (!auth) throw new Error("Firebase is not configured");
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      },
      async signOut() {
        if (!auth) return;
        await fbSignOut(auth);
        await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
      },
      async getIdToken() {
        if (!auth || !auth.currentUser) return null;
        return auth.currentUser.getIdToken();
      },
    }),
    [status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
