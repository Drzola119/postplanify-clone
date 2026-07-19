import "server-only";
import { adminDb } from "@/lib/db";
import type { LinkInBioDoc } from "@/lib/db/schema";

const SERVER_TIMESTAMP = { _methodName: "serverTimestamp" } as const;

function userBiosCollection(uid: string) {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.collection(`users/${uid}/linkInBios`);
}

function publicCollection() {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.collection("linkInBiosPublic");
}

function analyticsCollection(username: string) {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.collection(`linkInBiosAnalytics/${username}/clicks`);
}

export interface LinkInBioItem {
  username: string;
  bio: string;
  blocks: Array<{ type: string; data: Record<string, unknown> }>;
  theme: string;
  socials: Record<string, string>;
  avatarUrl?: string;
  updatedAt: string;
  createdAt: string;
}

export async function getByUsername(username: string): Promise<LinkInBioItem | null> {
  const snap = await publicCollection().doc(username).get();
  if (!snap.exists) return null;
  const data = snap.data() as LinkInBioDoc;
  return serialize(data);
}

export async function getByUidAndUsername(uid: string, username: string): Promise<LinkInBioItem | null> {
  const snap = await userBiosCollection(uid).doc(username).get();
  if (!snap.exists) return null;
  const data = snap.data() as LinkInBioDoc;
  return serialize(data);
}

export async function listForUser(uid: string): Promise<LinkInBioItem[]> {
  const snap = await userBiosCollection(uid).orderBy("updatedAt", "desc").get();
  return snap.docs.map((d) => serialize(d.data() as LinkInBioDoc));
}

export async function saveBio(
  uid: string,
  input: {
    username: string;
    bio: string;
    blocks: Array<{ type: string; data: Record<string, unknown> }>;
    theme: string;
    socials: Record<string, string>;
    avatarUrl?: string;
  }
): Promise<void> {
  const payload = {
    uid,
    username: input.username,
    bio: input.bio,
    blocks: input.blocks,
    theme: input.theme,
    socials: input.socials,
    avatarUrl: input.avatarUrl,
    updatedAt: SERVER_TIMESTAMP,
    createdAt: SERVER_TIMESTAMP,
  };

  // Write to user-private + public mirror.
  await userBiosCollection(uid).doc(input.username).set(payload, { merge: true });
  await publicCollection().doc(input.username).set(payload, { merge: true });
}

export async function deleteBio(uid: string, username: string): Promise<void> {
  await userBiosCollection(uid).doc(username).delete();
  await publicCollection().doc(username).delete();
}

export async function getAnalytics(
  username: string,
  days: number = 30
): Promise<{ clicks: number; views: number; byDay: Array<{ date: string; clicks: number; views: number }> }> {
  const snap = await analyticsCollection(username).orderBy("date", "desc").limit(days).get();
  const byDay = snap.docs.map((d) => {
    const data = d.data() as { date: string; clicks?: number; views?: number };
    return { date: data.date, clicks: data.clicks ?? 0, views: data.views ?? 0 };
  });
  const clicks = byDay.reduce((s, d) => s + d.clicks, 0);
  const views = byDay.reduce((s, d) => s + d.views, 0);
  return { clicks, views, byDay: byDay.reverse() };
}

export async function recordClick(username: string, blockId: string | null): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const ref = analyticsCollection(username).doc(today);
  await ref.set(
    {
      date: today,
      clicks: { _methodName: "increment", _operand: 1 },
      ...(blockId ? { byBlockId: { [blockId]: { _methodName: "increment", _operand: 1 } } } : {}),
    },
    { merge: true }
  );
}

export async function recordView(username: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const ref = analyticsCollection(username).doc(today);
  await ref.set(
    {
      date: today,
      views: { _methodName: "increment", _operand: 1 },
    },
    { merge: true }
  );
}

function serialize(data: LinkInBioDoc): LinkInBioItem {
  return {
    username: data.username,
    bio: data.bio ?? "",
    blocks: data.blocks ?? [],
    theme: data.theme ?? "default",
    socials: data.socials ?? {},
    avatarUrl: data.avatarUrl,
    updatedAt: toIso(data.updatedAt),
    createdAt: toIso(data.createdAt),
  };
}

function toIso(v: unknown): string {
  if (!v) return new Date().toISOString();
  if (typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object" && v && "_methodName" in v) return new Date().toISOString();
  if (typeof v === "object" && v && "toDate" in v && typeof (v as { toDate: () => Date }).toDate === "function") {
    return (v as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof v === "object" && v && "seconds" in v) {
    const s = (v as { seconds: number }).seconds;
    return new Date(s * 1000).toISOString();
  }
  return new Date().toISOString();
}
