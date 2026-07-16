import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the security resolver so we control what `resolvers.engineBaseUrl`
// and `resolvers.engineApiKey` return without depending on real env vars.
const engineBaseUrl = vi.fn<(h: Headers) => string | undefined>(() => "http://engine.local:3000");
const engineApiKey = vi.fn<(h: Headers) => string | undefined>(() => undefined);

vi.mock("@/lib/security/server-config", () => ({
  resolvers: {
    engineBaseUrl: (h: Headers) => engineBaseUrl(h),
    engineApiKey: (h: Headers) => engineApiKey(h),
    uploadPostApiKey: vi.fn(),
  },
}));

import {
  startOutpaintJob,
  getOutpaintJob,
  EngineError,
} from "@/lib/images/engine-client";

const TEST_ID_TOKEN = "test-firebase-id-token";

function fakeFetchResponse(opts: {
  status?: number;
  ok?: boolean;
  json?: unknown;
  text?: string;
}): Response {
  const status = opts.status ?? 200;
  const ok = opts.ok ?? (status >= 200 && status < 300);
  const body =
    opts.json !== undefined
      ? JSON.stringify(opts.json)
      : (opts.text ?? "{}");
  return new Response(body, {
    status,
    headers: { "content-type": opts.json !== undefined ? "application/json" : "text/plain" },
  });
}

describe("engine-client — startOutpaintJob", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    engineBaseUrl.mockReturnValue("http://engine.local:3000");
    engineApiKey.mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("posts to <base>/api/images/outpaint as multipart/form-data", async () => {
    fetchMock.mockResolvedValue(
      fakeFetchResponse({
        json: {
          jobId: "job_123",
          status: "pending",
          platforms: ["instagram", "x"],
          ratioGroups: [],
          estimatedVariants: 2,
          skipDelivery: true,
        },
      })
    );

    await startOutpaintJob({
      sourceBuffer: Buffer.from([0xff, 0xd8, 0xff]),
      mimeType: "image/jpeg",
      platforms: ["instagram", "twitter"],
      skipDelivery: true,
      idToken: TEST_ID_TOKEN,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://engine.local:3000/api/images/outpaint");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
  });

  it("forwards the Firebase ID token as `Authorization: Bearer …`", async () => {
    fetchMock.mockResolvedValue(
      fakeFetchResponse({
        json: {
          jobId: "job_456",
          status: "pending",
          platforms: [],
          ratioGroups: [],
          estimatedVariants: 0,
          skipDelivery: false,
        },
      })
    );

    await startOutpaintJob({
      sourceBuffer: Buffer.from([1, 2, 3]),
      mimeType: "image/png",
      platforms: ["linkedin"],
      idToken: TEST_ID_TOKEN,
    });

    const headers = (fetchMock.mock.calls[0] as [string, RequestInit])[1]
      .headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${TEST_ID_TOKEN}`);
  });

  it("appends X-Engine-Api-Key when the resolver provides one", async () => {
    engineApiKey.mockReturnValue("hmac-shared-secret-xyz");
    fetchMock.mockResolvedValue(
      fakeFetchResponse({
        json: {
          jobId: "job_789",
          status: "pending",
          platforms: [],
          ratioGroups: [],
          estimatedVariants: 0,
          skipDelivery: false,
        },
      })
    );

    await startOutpaintJob({
      sourceBuffer: Buffer.from([1]),
      mimeType: "image/jpeg",
      platforms: ["instagram"],
      idToken: TEST_ID_TOKEN,
    });

    const headers = (fetchMock.mock.calls[0] as [string, RequestInit])[1]
      .headers as Record<string, string>;
    expect(headers["X-Engine-Api-Key"]).toBe("hmac-shared-secret-xyz");
  });

  it("translates `twitter` → `x` in the platforms field", async () => {
    fetchMock.mockResolvedValue(
      fakeFetchResponse({
        json: {
          jobId: "job_aaa",
          status: "pending",
          platforms: [],
          ratioGroups: [],
          estimatedVariants: 0,
          skipDelivery: false,
        },
      })
    );

    await startOutpaintJob({
      sourceBuffer: Buffer.from([1]),
      mimeType: "image/jpeg",
      platforms: ["instagram", "twitter", "linkedin"],
      idToken: TEST_ID_TOKEN,
    });

    const body = (fetchMock.mock.calls[0] as [string, RequestInit])[1]
      .body as FormData;
    expect(body.get("platforms")).toBe(
      JSON.stringify(["instagram", "x", "linkedin"])
    );
  });

  it("appends `skipDelivery=true` when skipDelivery is true", async () => {
    fetchMock.mockResolvedValue(
      fakeFetchResponse({
        json: {
          jobId: "job_skip",
          status: "pending",
          platforms: [],
          ratioGroups: [],
          estimatedVariants: 0,
          skipDelivery: true,
        },
      })
    );

    await startOutpaintJob({
      sourceBuffer: Buffer.from([1]),
      mimeType: "image/jpeg",
      platforms: ["instagram"],
      skipDelivery: true,
      idToken: TEST_ID_TOKEN,
    });

    const body = (fetchMock.mock.calls[0] as [string, RequestInit])[1]
      .body as FormData;
    expect(body.get("skipDelivery")).toBe("true");
  });

  it("omits skipDelivery, postCaption, providerOverride, promptMode when not provided", async () => {
    fetchMock.mockResolvedValue(
      fakeFetchResponse({
        json: {
          jobId: "job_minimal",
          status: "pending",
          platforms: [],
          ratioGroups: [],
          estimatedVariants: 0,
          skipDelivery: false,
        },
      })
    );

    await startOutpaintJob({
      sourceBuffer: Buffer.from([1]),
      mimeType: "image/jpeg",
      platforms: ["instagram"],
      idToken: TEST_ID_TOKEN,
    });

    const body = (fetchMock.mock.calls[0] as [string, RequestInit])[1]
      .body as FormData;
    expect(body.get("skipDelivery")).toBeNull();
    expect(body.get("postCaption")).toBeNull();
    expect(body.get("providerOverride")).toBeNull();
    expect(body.get("promptMode")).toBeNull();
  });

  it("appends the image file with the correct mime type", async () => {
    fetchMock.mockResolvedValue(
      fakeFetchResponse({
        json: {
          jobId: "job_img",
          status: "pending",
          platforms: [],
          ratioGroups: [],
          estimatedVariants: 0,
          skipDelivery: false,
        },
      })
    );

    await startOutpaintJob({
      sourceBuffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      mimeType: "image/png",
      platforms: ["instagram"],
      idToken: TEST_ID_TOKEN,
    });

    const body = (fetchMock.mock.calls[0] as [string, RequestInit])[1]
      .body as FormData;
    const file = body.get("image");
    expect(file).toBeInstanceOf(Blob);
    expect((file as Blob).type).toBe("image/png");
  });

  it("returns parsed engine result on 2xx", async () => {
    fetchMock.mockResolvedValue(
      fakeFetchResponse({
        json: {
          jobId: "job_ok",
          status: "pending",
          platforms: ["instagram", "x"],
          ratioGroups: [
            { ratioKey: "4x5", ratio: "4:5", platforms: ["instagram"] },
            { ratioKey: "16x9", ratio: "16:9", platforms: ["x"] },
          ],
          estimatedVariants: 2,
          skipDelivery: true,
        },
      })
    );

    const result = await startOutpaintJob({
      sourceBuffer: Buffer.from([1]),
      mimeType: "image/jpeg",
      platforms: ["instagram", "twitter"],
      skipDelivery: true,
      idToken: TEST_ID_TOKEN,
    });

    expect(result).toEqual({
      jobId: "job_ok",
      status: "pending",
      platforms: ["instagram", "x"],
      ratioGroups: [
        { ratioKey: "4x5", ratio: "4:5", platforms: ["instagram"] },
        { ratioKey: "16x9", ratio: "16:9", platforms: ["x"] },
      ],
      estimatedVariants: 2,
      skipDelivery: true,
    });
  });

  it("throws EngineError on non-2xx response", async () => {
    fetchMock.mockResolvedValue(
      fakeFetchResponse({
        status: 502,
        json: { error: "engine broken" },
      })
    );

    await expect(
      startOutpaintJob({
        sourceBuffer: Buffer.from([1]),
        mimeType: "image/jpeg",
        platforms: ["instagram"],
        idToken: TEST_ID_TOKEN,
      })
    ).rejects.toMatchObject({
      name: "EngineError",
      status: 502,
      body: { error: "engine broken" },
    });
  });

  it("throws EngineError with status 502 on fetch network failure", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(
      startOutpaintJob({
        sourceBuffer: Buffer.from([1]),
        mimeType: "image/jpeg",
        platforms: ["instagram"],
        idToken: TEST_ID_TOKEN,
      })
    ).rejects.toMatchObject({
      name: "EngineError",
      status: 502,
      message: expect.stringContaining("Engine unreachable"),
    });
  });

  it("throws EngineError with status 500 when ADSIFY_ENGINE_URL is unset", async () => {
    engineBaseUrl.mockReturnValue(undefined);

    await expect(
      startOutpaintJob({
        sourceBuffer: Buffer.from([1]),
        mimeType: "image/jpeg",
        platforms: ["instagram"],
        idToken: TEST_ID_TOKEN,
      })
    ).rejects.toMatchObject({
      name: "EngineError",
      status: 500,
      message: expect.stringContaining("ADSIFY_ENGINE_URL not configured"),
    });
  });

  it("throws EngineError when 2xx response has no jobId", async () => {
    fetchMock.mockResolvedValue(
      fakeFetchResponse({
        status: 200,
        json: { status: "ok" },
      })
    );

    await expect(
      startOutpaintJob({
        sourceBuffer: Buffer.from([1]),
        mimeType: "image/jpeg",
        platforms: ["instagram"],
        idToken: TEST_ID_TOKEN,
      })
    ).rejects.toMatchObject({
      name: "EngineError",
      message: expect.stringContaining("without jobId"),
    });
  });
});

describe("engine-client — getOutpaintJob", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    engineBaseUrl.mockReturnValue("http://engine.local:3000");
    engineApiKey.mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("GETs <base>/api/images/outpaint/<jobId>", async () => {
    fetchMock.mockResolvedValue(
      fakeFetchResponse({
        json: {
          jobId: "job_xyz",
          status: "complete",
          platforms: ["instagram", "x"],
          variants: [
            {
              variantId: "v1",
              ratioKey: "4x5",
              platforms: ["instagram"],
              status: "complete",
              publicUrl: "https://cdn.example.com/v1.jpg",
              provider: "openai",
              model: "gpt-image-2",
              width: 1080,
              height: 1350,
            },
            {
              variantId: "v2",
              ratioKey: "16x9",
              platforms: ["x"],
              status: "complete",
              publicUrl: "https://cdn.example.com/v2.jpg",
              provider: "google",
              model: "gemini-2.5-flash-image-lite",
              width: 1600,
              height: 900,
            },
          ],
        },
      })
    );

    const result = await getOutpaintJob("job_xyz", TEST_ID_TOKEN);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://engine.local:3000/api/images/outpaint/job_xyz");
    expect(init.method).toBe("GET");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      `Bearer ${TEST_ID_TOKEN}`
    );

    expect(result.jobId).toBe("job_xyz");
    expect(result.status).toBe("complete");
    expect(result.platforms).toEqual(["instagram", "twitter"]); // x → twitter
    expect(result.variants).toHaveLength(2);
    // Each variant's platforms are translated back to trustiify ids.
    expect(result.variants[0]?.platforms).toEqual(["instagram"]);
    expect(result.variants[1]?.platforms).toEqual(["twitter"]);
    // Variant data otherwise unchanged.
    expect(result.variants[0]?.publicUrl).toBe("https://cdn.example.com/v1.jpg");
    expect(result.variants[1]?.ratioKey).toBe("16x9");
  });

  it("URL-encodes the jobId", async () => {
    fetchMock.mockResolvedValue(
      fakeFetchResponse({ json: { jobId: "a/b", status: "complete", platforms: [], variants: [] } })
    );
    await getOutpaintJob("a/b", TEST_ID_TOKEN);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://engine.local:3000/api/images/outpaint/a%2Fb"
    );
  });

  it("throws EngineError(404) when engine returns 404", async () => {
    fetchMock.mockResolvedValue(fakeFetchResponse({ status: 404, json: { error: "not found" } }));

    await expect(getOutpaintJob("missing", TEST_ID_TOKEN)).rejects.toMatchObject({
      name: "EngineError",
      status: 404,
      message: "Outpaint job not found",
    });
  });

  it("throws EngineError(502) on fetch network failure", async () => {
    fetchMock.mockRejectedValue(new Error("socket hang up"));
    await expect(getOutpaintJob("x", TEST_ID_TOKEN)).rejects.toMatchObject({
      name: "EngineError",
      status: 502,
      message: expect.stringContaining("Engine unreachable"),
    });
  });

  it("returns empty variants array when engine omits it", async () => {
    fetchMock.mockResolvedValue(
      fakeFetchResponse({ json: { jobId: "j", status: "pending", platforms: [] } })
    );

    const result = await getOutpaintJob("j", TEST_ID_TOKEN);
    expect(result.variants).toEqual([]);
  });
});

describe("EngineError", () => {
  it("is an Error subclass with status + body", () => {
    const err = new EngineError(500, { foo: "bar" }, "boom");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("EngineError");
    expect(err.status).toBe(500);
    expect(err.body).toEqual({ foo: "bar" });
    expect(err.message).toBe("boom");
  });
});