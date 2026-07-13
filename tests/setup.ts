import { vi } from "vitest";

// The "server-only" package throws at build time when imported in the wrong
// environment. It's a no-op in Node test runs; stub it so vitest can load
// any module that imports "server-only" without crashing.
vi.mock("server-only", () => ({}));

// Stub Firebase Admin so unit tests don't need real credentials.
vi.mock("@/lib/firebase/admin", () => ({
  adminApp: null,
  adminAuth: null,
  adminDb: null,
  SESSION_COOKIE: "pp_session",
  SESSION_MAX_AGE_MS: 60 * 60 * 24 * 5 * 1000,
  createSessionCookie: vi.fn(async () => null),
  verifySessionCookie: vi.fn(async () => null),
  getCurrentUser: vi.fn(async () => null),
}));

// Stub firebase-admin/firestore at module level so any db/* import works.
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: vi.fn(() => null),
  FieldValue: {
    serverTimestamp: vi.fn(() => ({ _methodName: "serverTimestamp" })),
    increment: vi.fn((n: number) => ({ _methodName: "increment", _operand: n })),
    arrayUnion: vi.fn((...vals: unknown[]) => ({ _methodName: "arrayUnion", _values: vals })),
    arrayRemove: vi.fn((...vals: unknown[]) => ({ _methodName: "arrayRemove", _values: vals })),
    delete: vi.fn(() => ({ _methodName: "delete" })),
  },
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: vi.fn((d: Date) => ({ seconds: d.getTime() / 1000, nanoseconds: 0 })),
  },
  FieldPath: vi.fn((...segments: string[]) => ({ segments })),
  Filter: class {},
  serverTimestamp: vi.fn(() => ({ _methodName: "serverTimestamp" })),
}));

// Provide required env vars so security module doesn't throw in dev mode.
if (!process.env.NODE_ENV) (process.env as Record<string, string>).NODE_ENV = "test";
process.env.ALLOW_CLIENT_OVERRIDES = "1";
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "test-key";
process.env.FIREBASE_PROJECT_ID = "postplanify-test";