import { describe, it, expect } from "vitest";
import { isDbAvailable, requireDb } from "@/lib/db";
import { MissingServerSecretError } from "@/lib/security/server-config";
import { createMockFirestore, type MockFirestore } from "../fixtures/firestore-mock";

describe("db/index", () => {
  it("isDbAvailable returns false when admin SDK is not configured", () => {
    expect(isDbAvailable()).toBe(false);
  });

  it("requireDb throws MissingServerSecretError when admin SDK is not configured", () => {
    expect(() => requireDb()).toThrow(MissingServerSecretError);
    try {
      requireDb();
    } catch (e) {
      const err = e as MissingServerSecretError;
      expect(err.secret).toBe("FIREBASE_ADMIN_DB");
      expect(err.name).toBe("MissingServerSecretError");
    }
  });

  it("in-memory mock supports basic CRUD + queries", async () => {
    const mock: MockFirestore = createMockFirestore();
    mock.reset();

    await mock.doc("workspaces/w1/posts/p1").set({ title: "hello", status: "draft" });

    const snap = await mock.doc("workspaces/w1/posts/p1").get();
    expect(snap.exists).toBe(true);
    expect(snap.data()?.title).toBe("hello");

    await mock.doc("workspaces/w1/posts/p1").update({ status: "published" });
    const updated = await mock.doc("workspaces/w1/posts/p1").get();
    expect(updated.data()?.status).toBe("published");

    const q = mock.collection("workspaces/w1/posts").where("status", "==", "published");
    const qs = await q.get();
    expect(qs.size).toBe(1);

    await mock.doc("workspaces/w1/posts/p1").delete();
    const after = await mock.doc("workspaces/w1/posts/p1").get();
    expect(after.exists).toBe(false);
  });

  it("mock supports batch writes + transactions", async () => {
    const mock = createMockFirestore();
    mock.reset();

    const batch = mock.batch();
    batch.set(mock.doc("a/1"), { v: 1 });
    batch.set(mock.doc("a/2"), { v: 2 });
    await batch.commit();

    const a1 = await mock.doc("a/1").get();
    const a2 = await mock.doc("a/2").get();
    expect(a1.data()?.v).toBe(1);
    expect(a2.data()?.v).toBe(2);

    const txResult = await mock.runTransaction(async (tx) => {
      const snap = await tx.get(mock.doc("a/1"));
      tx.update(mock.doc("a/1"), { v: (snap.data()?.v as number) + 1 });
      return snap.data()?.v;
    });
    expect(txResult).toBe(1);
    const after = await mock.doc("a/1").get();
    expect(after.data()?.v).toBe(2);
  });
});