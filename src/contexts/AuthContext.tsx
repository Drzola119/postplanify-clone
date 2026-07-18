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
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
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
  sendPasswordReset: (email: string) => Promise<void>;
  reauthenticate: (password: string) => Promise<void>;
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
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Mint/refresh the httpOnly server session cookie so every /api/*
        // route is authorized. The Firebase client SDK persists the user in
        // IndexedDB across reloads, but the server `pp_session` cookie is NOT
        // persisted client-side — it must be re-issued on each app load, or
        // protected API routes 401 even though the client looks "logged in".
        try {
          const idToken = await u.getIdToken();
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });
        } catch {
          // Client-side auth still works; protected APIs may 401 until the
          // next successful exchange. Don't block the UI on this.
        }
        setStatus("authenticated");
      } else {
        setStatus("unauthenticated");
      }
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
      async sendPasswordReset(email) {
        if (!auth) throw new Error("Firebase is not configured");
        await sendPasswordResetEmail(auth, email);
      },
      async reauthenticate(password) {
        if (!auth || !auth.currentUser || !auth.currentUser.email) {
          throw new Error("No authenticated user");
        }
        const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
        await reauthenticateWithCredential(auth.currentUser, credential);
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
