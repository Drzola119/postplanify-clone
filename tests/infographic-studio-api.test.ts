import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createMockFirestore } from "./fixtures/firestore-mock";
import { newDocument } from "@/lib/infographic-studio/document";

const state = vi.hoisted(() => ({
  session: { uid: "u1", workspaceId: "w1", email: null } as
    { uid: string; workspaceId: string; email: null } | Response,
}));
const fs = createMockFirestore();
vi.mock("@/lib/firebase/admin", () => ({
  get adminDb() {
    return fs;
  },
}));
vi.mock("@/lib/auth/session-context", () => ({
  requireSession: async () => state.session,
}));
const generated = vi.hoisted(() => vi.fn());
vi.mock("@/lib/image-gen", () => ({
  generateInfographic: generated,
  ImageGenExhaustedError: class extends Error {},
  buildInfographicPrompt: () => "server prompt",
  buildAdsInfographicPrompt: () => "server prompt",
  buildIdeogramJsonPrompt: () => ({}),
}));
vi.mock("@/lib/image-gen/prompt-styles", () => ({
  findStyle: () => ({ id: "test-style" }),
}));
const persist = vi.hoisted(() => vi.fn());
vi.mock("@/lib/image-gen/asset-saver", () => ({
  persistGeneratedImage: persist,
}));
vi.mock("@/lib/infographic-studio/export", () => ({
  exportDocument: async () => ({ svg: "<svg/>", png: Buffer.from("PNG") }),
}));
const projects = await import("@/app/api/infographics/projects/route");
const project = await import("@/app/api/infographics/projects/[id]/route");
const generation = await import("@/app/api/infographics/generate/route");
const exportsRoute =
  await import("@/app/api/infographics/projects/[id]/export/route");
const imageHistory = await import("@/app/api/infographics/image-history/route");
const assets = await import("@/app/api/infographics/assets/[id]/route");
const req = (body: unknown) =>
  new NextRequest("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
const context = (id: string) => ({ params: Promise.resolve({ id }) });
beforeEach(async () => {
  vi.restoreAllMocks();
  fs.reset();
  generated.mockReset();
  persist.mockReset();
  state.session = { uid: "u1", workspaceId: "w1", email: null };
  await fs.doc("workspaces/w1/members/u1").set({ role: "owner" });
  generated.mockResolvedValue({
    provider: "test",
    model: "test",
    assetId: "a1",
    assetUrl: "https://cdn.example/image.png",
    width: 1080,
    height: 1350,
    costUsd: 0,
    durationMs: 10,
  });
});
describe("studio HTTP boundaries", () => {
  it("rejects anonymous API calls and cross-workspace assets", async () => {
    state.session = new Response(null, { status: 401 });
    expect(
      (
        await projects.GET(
          new Request("http://localhost/api/infographics/projects"),
        )
      ).status,
    ).toBe(401);
    state.session = { uid: "u1", workspaceId: "w1", email: null };
    await fs
      .doc("workspaces/w2/mediaAssets/foreign")
      .set({ mime: "image/png" });
    expect(
      (await assets.GET(new Request("http://localhost"), context("foreign")))
        .status,
    ).toBe(404);
  });
  it("rejects viewer writes and stale HTTP saves; duplicate preserves snapshots", async () => {
    const first = await (
      await projects.POST(req({ document: newDocument() }))
    ).json();
    const p = first.project;
    expect(
      (
        await project.PATCH(
          req({
            document: { ...p.document, title: "Changed" },
            revision: p.revision,
          }),
          context(p.id),
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await project.PATCH(
          req({ document: p.document, revision: p.revision }),
          context(p.id),
        )
      ).status,
    ).toBe(409);
    const copy = await (
      await project.POST(req({ action: "duplicate" }), context(p.id))
    ).json();
    expect(copy.project.id).not.toBe(p.id);
    expect(copy.project.document.brand).toEqual(p.document.brand);
    await fs.doc("workspaces/w1/members/u1").set({ role: "viewer" });
    expect((await projects.POST(req({ document: newDocument() }))).status).toBe(
      403,
    );
  });
  it("deduplicates paid generation and persists explicitly flattened history", async () => {
    const body = {
      operationId: "f159aaba-2026-4130-856c-985e600cd679",
      tool: "instant",
      topic: "Useful facts",
      provider: "auto",
      aspectRatio: "3:4",
      context: { styleId: "test-style" },
    };
    expect((await generation.POST(req(body))).status).toBe(200);
    expect((await generation.POST(req(body))).status).toBe(200);
    expect(generated).toHaveBeenCalledTimes(1);
    const history = await (
      await imageHistory.GET(
        new Request(
          "http://localhost/api/infographics/image-history?tool=instant",
        ),
      )
    ).json();
    expect(history.mode).toBe("image");
    expect(history.items).toHaveLength(1);
    const restored = await (
      await imageHistory.POST(
        req({ tool: "instant", operationId: body.operationId }),
      )
    ).json();
    expect(restored.result.restoredFrom).toBe(body.operationId);
    expect(restored.result.operationId).not.toBe(body.operationId);
    expect(generated).toHaveBeenCalledTimes(1);
  });
  it("fails before paid generation when operation persistence is unavailable", async () => {
    vi.spyOn(fs, "runTransaction").mockRejectedValueOnce(
      new Error("database unavailable"),
    );
    const response = await generation.POST(
      req({
        operationId: "f159aaba-2026-4130-856c-985e600cd679",
        tool: "instant",
        topic: "Useful facts",
        provider: "auto",
        aspectRatio: "3:4",
        context: { styleId: "test-style" },
      }),
    );
    expect(response.status).toBe(503);
    expect(generated).not.toHaveBeenCalled();
  });
  it("reuses a saved export and returns a recovery URL after upload-only success", async () => {
    const doc = newDocument();
    doc.brief.confirmed = true;
    const { project: p } = await (
      await projects.POST(req({ document: doc }))
    ).json();
    persist.mockImplementation(async () => {
      await fs
        .doc("workspaces/w1/mediaAssets/exported")
        .set({ mime: "image/png" });
      return { assetId: "exported", cdnUrl: "https://cdn.example/export.png" };
    });
    const body = { revision: 1, format: "png", save: true };
    expect((await exportsRoute.POST(req(body), context(p.id))).status).toBe(
      200,
    );
    expect((await exportsRoute.POST(req(body), context(p.id))).status).toBe(
      200,
    );
    expect(persist).toHaveBeenCalledTimes(1);
    await project.PATCH(
      req({ document: { ...doc, title: "New title" }, revision: 1 }),
      context(p.id),
    );
    persist.mockResolvedValueOnce({
      assetId: "",
      cdnUrl: "https://cdn.example/recovery.png",
    });
    const response = await exportsRoute.POST(
      req({ ...body, revision: 2 }),
      context(p.id),
    );
    expect(response.status).toBe(503);
    expect((await response.json()).recoveryUrl).toContain("recovery.png");
  });
});
