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

  it("reads UploadPost status error_message and platform_post_id fields", () => {
    expect(normalizeUploadPostResults({
      results: [
        { platform: "instagram", success: false, error_message: "Invalid media type" },
        { platform: "facebook", success: true, platform_post_id: "fb-123" },
      ],
    }, ["instagram", "facebook"])).toEqual({
      instagram: { ok: false, error: "Invalid media type" },
      facebook: { ok: true, postId: "fb-123" },
    });
  });

  it("maps photo feed media types to UploadPost's platform-specific enums", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const form = init?.body as FormData;
      expect(form.get("media_type")).toBe("IMAGE");
      expect(form.get("facebook_media_type")).toBe("POSTS");
      return new Response(JSON.stringify({
        success: true,
        results: {
          instagram: { success: true },
          facebook: { success: true },
        },
      }), { status: 200 });
    }));

    await publishToUploadPost({
      apiKey: "key",
      username: "profile",
      platforms: ["instagram", "facebook"],
      caption: "Photo feed",
      mediaUrls: ["https://cdn.test/image.jpg"],
      mediaType: "image",
      advancedByPlatform: {
        instagram: { instagram_media_type: "FEED" },
        facebook: { facebook_media_type: "FEED" },
      },
    });
  });

  it("keeps valid story media types for Instagram and Facebook photos", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const form = init?.body as FormData;
      expect(form.get("media_type")).toBe("STORIES");
      expect(form.get("facebook_media_type")).toBe("STORIES");
      return new Response(JSON.stringify({
        success: true,
        results: {
          instagram: { success: true },
          facebook: { success: true },
        },
      }), { status: 200 });
    }));

    await publishToUploadPost({
      apiKey: "key",
      username: "profile",
      platforms: ["instagram", "facebook"],
      caption: "Photo story",
      mediaUrls: ["https://cdn.test/image.jpg"],
      mediaType: "image",
      advancedByPlatform: {
        instagram: { instagram_media_type: "STORIES" },
        facebook: { facebook_media_type: "STORIES" },
      },
    });
  });

  it("maps X Community options to Upload-Post's documented fields", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const form = init?.body as FormData;
      expect(form.get("community_id")).toBe("1493446837214187523");
      expect(form.get("share_with_followers")).toBe("true");
      return new Response(JSON.stringify({
        success: true,
        results: { x: { success: true } },
      }), { status: 200 });
    }));

    await publishToUploadPost({
      apiKey: "key",
      username: "profile",
      platforms: ["twitter"],
      caption: "Hello community",
      mediaUrls: [],
      advancedByPlatform: {
        twitter: {
          twitter_community: "1493446837214187523",
          twitter_share_with_followers: true,
        },
      },
    });
  });

  it("sends required profile, media, idempotency and platform fields", async () => {
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const form = init?.body as FormData;
      expect(form.get("user")).toBe("workspace-profile");
      expect(form.get("photos[]")).toBe("https://cdn.test/image.jpg");
      expect(form.getAll("platform[]")).toEqual(["instagram", "x"]);
      expect(form.get("instagram_title")).toBe("Shared");
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

  it("caps a shared TikTok photo title at 90 characters", async () => {
    const caption = "A".repeat(120);
    vi.stubGlobal("fetch", vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const form = init?.body as FormData;
      const tiktokTitle = String(form.get("tiktok_title"));
      expect(Array.from(tiktokTitle)).toHaveLength(90);
      expect(tiktokTitle.endsWith("…")).toBe(true);
      expect(Array.from(String(form.get("title")))).toHaveLength(90);
      return new Response(JSON.stringify({
        success: true,
        results: { tiktok: { success: true, post_id: "tt1" } },
      }), { status: 200, headers: { "content-type": "application/json" } });
    }));

    const result = await publishToUploadPost({
      apiKey: "key",
      username: "workspace-profile",
      platforms: ["tiktok"],
      caption,
      captionsByPlatform: { tiktok: caption },
      mediaUrls: ["https://cdn.test/image.jpg"],
      mediaType: "image",
      requestId: "request-tiktok-photo",
    });

    expect(result.deliveryConfirmed).toBe(true);
  });

  it("caps the Pinterest title while retaining the full Pin description", async () => {
    const caption = "P".repeat(370);
    vi.stubGlobal("fetch", vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const form = init?.body as FormData;
      expect(Array.from(String(form.get("pinterest_title")))).toHaveLength(100);
      expect(Array.from(String(form.get("title")))).toHaveLength(100);
      expect(form.get("pinterest_description")).toBe(caption);
      return new Response(JSON.stringify({
        success: true,
        results: { pinterest: { success: true, post_id: "pin-1" } },
      }), { status: 200, headers: { "content-type": "application/json" } });
    }));

    await publishToUploadPost({
      apiKey: "key",
      username: "workspace-profile",
      platforms: ["pinterest"],
      caption,
      mediaUrls: ["https://cdn.test/image.jpg"],
      mediaType: "image",
    });
  });

  it("does not apply the photo limit to TikTok video titles", async () => {
    const caption = "V".repeat(120);
    vi.stubGlobal("fetch", vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const form = init?.body as FormData;
      expect(form.get("tiktok_title")).toBe(caption);
      return new Response(JSON.stringify({
        success: true,
        results: { tiktok: { success: true, post_id: "tt-video-1" } },
      }), { status: 200, headers: { "content-type": "application/json" } });
    }));

    await publishToUploadPost({
      apiKey: "key",
      username: "workspace-profile",
      platforms: ["tiktok"],
      caption,
      mediaUrls: ["https://cdn.test/video.mp4"],
      mediaType: "video",
    });
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
