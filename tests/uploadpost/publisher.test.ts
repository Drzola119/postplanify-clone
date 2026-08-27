import { afterEach, describe, expect, it, vi } from "vitest";
import {
  normalizeUploadPostResults,
  getUploadPostStatus,
  publishToUploadPost,
  toUploadPostPlatform,
} from "@/lib/uploadpost/publisher";

afterEach(() => vi.restoreAllMocks());

describe("UploadPost publisher", () => {
  it("maps the UI twitter id to UploadPost x", () => {
    expect(toUploadPostPlatform("twitter")).toBe("x");
    expect(toUploadPostPlatform("instagram")).toBe("instagram");
  });

  it("requires a result for every requested platform", () => {
    expect(normalizeUploadPostResults({ results: { instagram: { success: true } } }, ["instagram", "facebook"])).toEqual({
      instagram: { ok: true },
      facebook: { ok: false, error: "No result returned for this platform" },
    });
  });

  it("does not count an unconnected/skipped platform as delivered", () => {
    expect(normalizeUploadPostResults({ results: { instagram: { skipped: true } } }, ["instagram"])?.instagram.ok).toBe(false);
  });

  it("sends required profile, media, idempotency and platform fields", async () => {
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const form = init?.body as FormData;
      expect(form.get("user")).toBe("workspace-profile");
      expect(form.get("photos[]")).toBe("https://cdn.test/image.jpg");
      expect(form.getAll("platform[]")).toEqual(["instagram", "x"]);
      expect(form.get("x_title")).toBe("Tweet caption");
      expect(init?.headers).toMatchObject({ "Idempotency-Key": "request-1" });
      return new Response(JSON.stringify({
        success: true,
        results: {
          instagram: { success: true, post_id: "ig1" },
          x: { success: true, post_id: "x1" },
        },
      }), { status: 200, headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await publishToUploadPost({
      apiKey: "key",
      username: "workspace-profile",
      platforms: ["instagram", "twitter"],
      caption: "Shared",
      captionsByPlatform: { instagram: "Shared", twitter: "Tweet caption" },
      mediaUrls: ["https://cdn.test/image.jpg"],
      mediaType: "image",
      requestId: "request-1",
    });
    expect(result.deliveryConfirmed).toBe(true);
    expect(result.results?.twitter.postId).toBe("x1");
  });

  it("treats request_id-only responses as accepted, not delivered", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      success: true,
      request_id: "async-1",
      message: "Upload initiated successfully in background.",
    }), { status: 200, headers: { "content-type": "application/json" } })));
    const result = await publishToUploadPost({
      apiKey: "key",
      username: "profile",
      platforms: ["instagram"],
      caption: "caption",
      mediaUrls: ["https://cdn.test/image.jpg"],
      mediaType: "image",
    });
    expect(result.accepted).toBe(true);
    expect(result.deliveryConfirmed).toBe(false);
    expect(result.requestId).toBe("async-1");
  });

  it("throws on an HTTP 200 body with success false", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ success: false, message: "user missing" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })));
    await expect(publishToUploadPost({
      apiKey: "key",
      username: "profile",
      platforms: ["instagram"],
      caption: "caption",
      mediaUrls: [],
    })).rejects.toThrow(/user missing/);
  });

  it("only marks UploadPost status completed/failed as final", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "processing", request_id: "r1" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "completed", request_id: "r1", results: [{ platform: "instagram", success: true }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect((await getUploadPostStatus({ apiKey: "key", requestId: "r1", platforms: ["instagram"] })).final).toBe(false);
    const completed = await getUploadPostStatus({ apiKey: "key", requestId: "r1", platforms: ["instagram"] });
    expect(completed.final).toBe(true);
    expect(completed.results?.instagram.ok).toBe(true);
  });
});
