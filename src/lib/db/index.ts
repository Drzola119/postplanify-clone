import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { MissingServerSecretError } from "@/lib/security/server-config";

export { adminDb };
export type { Firestore } from "firebase-admin/firestore";
export {
  FieldValue,
  Timestamp,
  FieldPath,
  Filter,
} from "firebase-admin/firestore";

export function requireDb() {
  if (!adminDb) {
    throw new MissingServerSecretError("FIREBASE_ADMIN_DB");
  }
  return adminDb;
}

export function isDbAvailable(): boolean {
  return adminDb !== null;
}