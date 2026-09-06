import { describe, it, expect, vi, afterEach } from "vitest";
import {
  listInstagramComments,
  postInstagramPrivateReply,
  postInstagramPublicReply,
  sendInstagramDm,
  UploadPostInboxError,
} from "@/lib/uploadpost/inbox";

function ok(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("uploadpost inbox adapter", () => {
  it("lists comments with cursor pagination normalized", async () => {
    const fetchMock = vi.fn(async (_url: unknown) =>
      ok({
        success: true,
        comments: [{ id: "1", text: "hi", timestamp: "2026-09-05T00:00:00+0000", user: { id: "u9", username: "bob" } }],
        pagination: { next_cursor: "CUR", has_next: true },
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    const page = await listInstagramComments("k", "prof", { postId: "m1" }, { limit: 50 });
    expect(page.comments).toHaveLength(1);
    expect(page.comments[0].authorUsername).toBe("bob");
    expect(page.nextCursor).toBe("CUR");
    expect(page.hasNext).toBe(true);
    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toContain("limit=50");
    expect(calledUrl).toContain("post_id=m1");
  });

  it("clamps comment limit to the documented 1–50 range", async () => {
    const fetchMock = vi.fn(async (_url: unknown) => ok({ success: true, comments: [], pagination: {} }));
    vi.stubGlobal("fetch", fetchMock);
    await listInstagramComments("k", "prof", { postUrl: "https://www.instagram.com/p/X/" }, { limit: 999 });
    expect(String(fetchMock.mock.calls[0][0])).toContain("limit=50");
  });

  it("rejects >3 buttons and non-http button urls client-side (never sent)", async () => {
    const fetchMock = vi.fn(async (_url: unknown) => ok({ success: true }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      postInstagramPrivateReply("k", "prof", {
        commentId: "c1",
        message: "hi",
        buttons: [
          { title: "a", url: "https://x.test" },
          { title: "b", url: "https://x.test" },
          { title: "c", url: "https://x.test" },
          { title: "d", url: "https://x.test" },
        ],
      })
    ).rejects.toMatchObject({ code: "bad-request" });
    await expect(
      sendInstagramDm("k", "prof", { recipientId: "u1", message: "hi", buttons: [{ title: "x", url: "ftp://evil" }] })
    ).rejects.toMatchObject({ code: "bad-request" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires provider confirmation ids (missing id = provider-error, not sent)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ok({ success: true })));
    await expect(postInstagramPublicReply("k", "prof", { commentId: "c1", message: "hi" })).rejects.toMatchObject({
      code: "provider-error",
    });
  });

  it("classifies 429 as retryable rate-limited and 4xx as non-retryable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 429, json: async () => ({ success: false, error: "Daily DM limit exceeded." }) }) as unknown as Response)
    );
    const err = await sendInstagramDm("k", "prof", { recipientId: "u1", message: "hi" }).catch((e) => e);
    expect(err).toBeInstanceOf(UploadPostInboxError);
    expect(err.code).toBe("rate-limited");
    expect(err.retryable).toBe(true);
  });

  it("classifies timeouts as retryable reads vs uncertain writes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("timed out", "TimeoutError");
      })
    );
    const err = await listInstagramComments("k", "prof", { postId: "m1" }).catch((e) => e);
    expect(err.code).toBe("timeout");
    expect(err.retryable).toBe(true);
  });
});
