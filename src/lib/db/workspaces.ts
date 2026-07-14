import "server-only";
import { adminDb } from "@/lib/firebase/admin";

const SERVER_TIMESTAMP = { _methodName: "serverTimestamp" } as const;

export interface WorkspaceLite {
  id: string;
  name: string;
  ownerUid: string;
  plan: "free" | "pro" | "team" | "enterprise";
}

export async function getWorkspace(wid: string): Promise<WorkspaceLite | null> {
  if (!adminDb) return null;
  const snap = await adminDb.doc(`workspaces/${wid}`).get();
  if (!snap.exists) return null;
  const data = snap.data() as Record<string, unknown>;
  return {
    id: wid,
    name: (data.name as string) ?? "",
    ownerUid: (data.ownerUid as string) ?? "",
    plan: (data.plan as WorkspaceLite["plan"]) ?? "free",
  };
}

export async function listWorkspacesForUser(uid: string): Promise<WorkspaceLite[]> {
  if (!adminDb) return [];
  let membersSnap = null;
  try {
    membersSnap = await adminDb
      .collectionGroup("members")
      .where("__name__", "==", uid)
      .get();
  } catch (err) {
    // Ignore synchronous validation errors or missing index errors
  }

  // Fallback: scan user's known workspace subcollection (when workspaceId is
  // stored on the user doc). Firestore collection-group queries need an index
  // we don't ship yet, so the more reliable path is via user doc.
  const userSnap = await adminDb.doc(`users/${uid}`).get().catch(() => null);
  const data = userSnap?.data() as Record<string, unknown> | undefined;
  const primary = data?.primaryWorkspaceId as string | undefined;

  const out: WorkspaceLite[] = [];
  if (primary) {
    const ws = await getWorkspace(primary);
    if (ws) out.push(ws);
  }
  return out;
}

export async function createWorkspace(input: { name: string; ownerUid: string; plan?: WorkspaceLite["plan"] }): Promise<string> {
  if (!adminDb) throw new Error("adminDb not configured");
  const ref = adminDb.collection("workspaces").doc();
  const data = {
    name: input.name,
    ownerUid: input.ownerUid,
    plan: input.plan ?? "free",
    settings: {},
    createdAt: SERVER_TIMESTAMP,
  };
  await ref.set(data);
  await ref.collection("members").doc(input.ownerUid).set({
    role: "owner",
    joinedAt: SERVER_TIMESTAMP,
  });
  await adminDb.doc(`users/${input.ownerUid}`).set(
    { primaryWorkspaceId: ref.id },
    { merge: true }
  );
  return ref.id;
}

export async function ensureDefaultWorkspace(uid: string, email: string | null): Promise<string> {
  if (!adminDb) throw new Error("adminDb not configured");
  const userRef = adminDb.doc(`users/${uid}`);
  const userSnap = await userRef.get();
  const data = userSnap.data() as Record<string, unknown> | undefined;
  if (data?.primaryWorkspaceId) return data.primaryWorkspaceId as string;

  const ref = adminDb.collection("workspaces").doc();
  const batch = adminDb.batch();
  batch.set(ref, {
    name: email ? email.split("@")[0] : "My Workspace",
    ownerUid: uid,
    plan: "free",
    settings: {},
    createdAt: SERVER_TIMESTAMP,
  });
  batch.set(ref.collection("members").doc(uid), {
    role: "owner",
    joinedAt: SERVER_TIMESTAMP,
  });
  batch.set(userRef, {
    uid,
    email,
    primaryWorkspaceId: ref.id,
    createdAt: SERVER_TIMESTAMP,
  }, { merge: true });
  await batch.commit();
  return ref.id;
}