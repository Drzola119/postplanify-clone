import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ ai: vi.fn() }));
vi.mock("@/lib/carousel-gen/access", () => ({
  requireCarouselAccess: async () => ({ uid: "u", workspaceId: "ws" }),
}));
vi.mock("@/lib/security/server-config", () => ({
  resolvers: { groqApiKey: () => "test-key" },
}));
vi.mock("@/lib/carousel-gen/ai-actions", () => ({ carouselAi: mocks.ai }));
import { POST } from "@/app/api/carousels/refine/route";
const slide = {
  id: "slide_1",
  index: 0,
  type: "hook",
  headline: "Introduction",
  body: "A clear explanation",
  backgroundColor: "#ffffff",
  textAlign: "left",
};
const post = (body: Record<string, unknown>) =>
  POST(
    new Request("https://test/api/carousels/refine", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
beforeEach(() => {
  mocks.ai.mockReset();
});
describe("Real per-slide AI route", () => {
  it("uses translated model output while preserving identity and design", async () => {
    mocks.ai.mockResolvedValue({
      headline: "مقدمة",
      body: "شرح واضح",
      bulletPoints: ["نقطة واحدة"],
    });
    const response = await post({
      slide,
      action: "translate",
      targetLanguage: "ar",
    });
    expect(response.status).toBe(200);
    expect((await response.json()).slide).toMatchObject({
      id: "slide_1",
      backgroundColor: "#ffffff",
      headline: "مقدمة",
      body: "شرح واضح",
      textAlign: "right",
      bulletPoints: ["نقطة واحدة"],
    });
    expect(mocks.ai).toHaveBeenCalledOnce();
  });
  it("does not call the paid provider for locked slides", async () => {
    expect(
      (await post({ slide: { ...slide, isLocked: true }, action: "rewrite" }))
        .status,
    ).toBe(409);
    expect(mocks.ai).not.toHaveBeenCalled();
  });
  it("reports provider failures rather than returning unchanged text as success", async () => {
    mocks.ai.mockRejectedValue(Error("Provider unavailable"));
    const response = await post({ slide, action: "rewrite" });
    expect(response.status).toBe(422);
    expect((await response.json()).error.message).toBe("Provider unavailable");
  });
});
