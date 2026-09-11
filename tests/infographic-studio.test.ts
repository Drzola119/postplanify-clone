import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockFirestore } from "./fixtures/firestore-mock";
import {
  documentSchema,
  newDocument,
  sampleDocument,
  templates,
  templateIssues,
  prepareOutline,
} from "@/lib/infographic-studio/document";
import { renderDocument } from "@/lib/infographic-studio/render";
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
const { saveProject, readProject, access, claimOperation } =
  await import("@/lib/infographic-studio/server");
const session = { uid: "u1", workspaceId: "w1", email: null };
beforeEach(async () => {
  fs.reset();
  state.session = session;
  await fs.doc("workspaces/w1/members/u1").set({ role: "owner" });
});
describe("studio document and rendering", () => {
  it.each(templates)(
    "renders %s with real structured text and deterministic output",
    (template) => {
      const d = sampleDocument(template);
      expect(documentSchema.safeParse(d).success).toBe(true);
      const a = renderDocument(d);
      expect(a.svg).toContain("<text");
      expect(a.svg).toBe(renderDocument(d).svg);
      expect(a.issues).toEqual([]);
    },
  );
  it("escapes markup, prevents arbitrary dimensions and duplicate block identifiers", () => {
    const d = newDocument();
    d.title = '<script>alert("x")</script>';
    expect(renderDocument(d).svg).not.toContain("<script>");
    expect(documentSchema.safeParse({ ...d, width: 9999999 }).success).toBe(
      false,
    );
    expect(
      documentSchema.safeParse({ ...d, blocks: [d.blocks[0], d.blocks[0]] })
        .success,
    ).toBe(false);
  });
  it("preserves supplied text, refuses silent truncation and flags unconfirmed numeric data", () => {
    const d = newDocument();
    d.brief.content = "Provided fact one\nProvided fact two";
    expect(prepareOutline(d).blocks[1]).toMatchObject({
      text: "Provided fact two",
    });
    d.brief.content = "a".repeat(601);
    expect(() => prepareOutline(d)).toThrow();
    d.blocks = [
      {
        id: "s",
        type: "statistic",
        title: "Sales",
        value: 10,
        unit: "units",
        confirmed: false,
        icon: "circle",
      },
    ];
    expect(templateIssues(d)).not.toEqual([]);
  });
  it("blocks overflow, detects incompatible template changes, and renders Arabic direction", () => {
    const d = sampleDocument("checklist");
    d.blocks = Array.from({ length: 8 }, (_, i) => ({
      id: `b${i}`,
      type: "paragraph",
      text: "long text ".repeat(60),
      icon: "circle",
    }));
    expect(renderDocument(d).issues.join()).toContain("overflows");
    expect(
      templateIssues(sampleDocument("checklist"), "comparison"),
    ).not.toEqual([]);
    d.language = "ar";
    d.title = "مرحبا 2026";
    expect(renderDocument(d).svg).toContain('font-family="StudioArabic"');
  });
});
describe("studio persistence and authorization", () => {
  it("rejects anonymous, non-member and viewer writes", async () => {
    state.session = new Response(null, { status: 401 });
    expect(((await access()) as Response).status).toBe(401);
    state.session = session;
    await fs.doc("workspaces/w1/members/u1").delete();
    await expect(access()).rejects.toMatchObject({ status: 403 });
    await fs.doc("workspaces/w1/members/u1").set({ role: "viewer" });
    await expect(access(true)).rejects.toMatchObject({ status: 403 });
  });
  it("rejects cross-workspace references and stale saves", async () => {
    const first = await saveProject(session, { document: newDocument() });
    await expect(readProject("w2", first.id)).rejects.toMatchObject({
      status: 404,
    });
    await saveProject(session, {
      id: first.id,
      revision: 1,
      document: { ...first.document, title: "Updated" },
    });
    await expect(
      saveProject(session, {
        id: first.id,
        revision: 1,
        document: first.document,
      }),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      saveProject(session, {
        document: { ...first.document, artworkAssetId: "foreign" },
      }),
    ).rejects.toMatchObject({ status: 400 });
  });
  it("retains exactly 20 immutable versions and never removes media", async () => {
    let p = await saveProject(session, { document: newDocument() });
    await fs.doc("workspaces/w1/mediaAssets/kept").set({ mime: "image/png" });
    for (let i = 0; i < 22; i++)
      p = await saveProject(session, {
        id: p.id,
        revision: p.revision,
        document: { ...p.document, title: `Title ${i}` },
      });
    expect(fs.dump().filter((d) => d.path.includes("/versions/"))).toHaveLength(
      20,
    );
    expect((await fs.doc("workspaces/w1/mediaAssets/kept").get()).exists).toBe(
      true,
    );
    expect(
      (
        await saveProject(session, {
          id: p.id,
          revision: p.revision,
          document: p.document,
        })
      ).revision,
    ).toBe(p.revision);
  });
  it("claims repeated operations once and rejects changed inputs", async () => {
    expect(
      (await claimOperation(session, "op-1", { text: "one" })).existing,
    ).toBeNull();
    expect(
      (await claimOperation(session, "op-1", { text: "one" })).existing?.status,
    ).toBe("running");
    await expect(
      claimOperation(session, "op-1", { text: "two" }),
    ).rejects.toMatchObject({ status: 409 });
  });
});
describe("bundled typography and export", () => {
  it("renders PNG and standalone SVG for English, French and Arabic", async () => {
    const { exportDocument } = await import("@/lib/infographic-studio/export");
    for (const [language, title] of [
      ["en", "A clear story"],
      ["fr", "Une idée à partager"],
      ["ar", "خطوات واضحة 2026"],
    ] as const) {
      const d = newDocument();
      d.language = language;
      d.title = title;
      d.blocks = [
        { id: "one", type: "paragraph", text: title, icon: "circle" },
      ];
      const result = await exportDocument("w1", d);
      const { PNG } = await import("pngjs");
      const { data: pixels, width } = PNG.sync.read(result.png);
      let ink = 0;
      for (let y = 64; y < 160; y++)
        for (let x = 64; x < 1016; x++) {
          const i = (y * width + x) * 4;
          if (pixels[i] < 100 && pixels[i + 1] < 100 && pixels[i + 2] < 100)
            ink++;
        }
      expect(
        ink,
        `${language} title must actually appear in the PNG`,
      ).toBeGreaterThan(1000);
      if (process.env.STUDIO_REVIEW_DIR) {
        const { mkdir, writeFile } = await import("node:fs/promises");
        const { join } = await import("node:path");
        await mkdir(process.env.STUDIO_REVIEW_DIR, { recursive: true });
        await writeFile(
          join(process.env.STUDIO_REVIEW_DIR, `export-${language}.png`),
          result.png,
        );
        await writeFile(
          join(process.env.STUDIO_REVIEW_DIR, `export-${language}.svg`),
          result.svg,
        );
      }
      expect(result.png.subarray(1, 4).toString()).toBe("PNG");
      expect(result.png.readUInt32BE(16)).toBe(d.width);
      expect(result.svg).toContain("data:font/ttf;base64,");
      expect(result.svg).toContain(title);
    }
  }, 30000);
});
