import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { normalizeCarousel } from "@/lib/carousel-gen/document-service";
import { renderCarouselSlide } from "@/lib/carousel-gen/render-document";
import {
  exportCarouselToPdf,
  exportCarouselToZip,
} from "@/lib/carousel-gen/export-service";
import { isPublicAddress, safeFetch } from "@/lib/carousel-gen/safe-fetch";
import { ASPECT_RATIO_DIMENSIONS } from "@/lib/carousel-gen/types";

const deck = normalizeCarousel("test", "ws", {
  title: "Export fixture",
  caption: "A caption with context.",
  slides: [
    {
      id: "one",
      index: 0,
      type: "hook",
      headline: "Make every slide count",
      body: "Clear ideas. Consistent design.",
      backgroundColor: "#ffffff",
      textColor: "#111827",
    },
    {
      id: "two",
      index: 1,
      type: "cta",
      headline: "Keep the next step clear",
      textColor: "#111827",
      backgroundColor: "#ffffff",
    },
  ],
});

describe("Production renderer and export fidelity", () => {
  it("renders every supported ratio at exact PNG dimensions", async () => {
    for (const [ratio, dimensions] of Object.entries(ASPECT_RATIO_DIMENSIONS)) {
      const output = await renderCarouselSlide(
        { ...deck, aspectRatio: ratio as keyof typeof ASPECT_RATIO_DIMENSIONS },
        0,
      );
      if (process.env.CAROUSEL_QA_DIR) {
        await mkdir(process.env.CAROUSEL_QA_DIR, { recursive: true });
        await writeFile(
          path.join(
            process.env.CAROUSEL_QA_DIR,
            `slide-${ratio.replace(":", "-")}.png`,
          ),
          output.png,
        );
      }
      expect(output.png.readUInt32BE(16)).toBe(dimensions.width);
      expect(output.png.readUInt32BE(20)).toBe(dimensions.height);
      expect(output.issues).toEqual([]);
    }
  }, 60000);
  it("exports the same rendered pixels in ordered PNGs and a two-page PDF", async () => {
    const rendered = await Promise.all(
      deck.slides.map((_, i) => renderCarouselSlide(deck, i)),
    );
    const urls = rendered.map(
      (r) => `data:image/png;base64,${r.png.toString("base64")}`,
    );
    const zip = await JSZip.loadAsync(
      await (await exportCarouselToZip(deck, urls)).arrayBuffer(),
    );
    expect(
      await zip.file("Export_fixture/01-hook.png")!.async("uint8array"),
    ).toEqual(new Uint8Array(rendered[0].png));
    expect(
      await zip.file("Export_fixture/02-cta.png")!.async("uint8array"),
    ).toEqual(new Uint8Array(rendered[1].png));
    expect(
      await zip.file("Export_fixture/post-caption.txt")!.async("string"),
    ).toContain(deck.caption);
    const pdf = Buffer.from(
      await (await exportCarouselToPdf(deck, urls)).arrayBuffer(),
    ).toString("latin1");
    expect(pdf.match(/\/Type \/Page\b/g)).toHaveLength(2);
    expect(pdf).toContain("/MediaBox [0 0 810. 1012.5]");
  }, 60000);
  it("detects rendered overflow and rejects incomplete export sets", async () => {
    const output = await renderCarouselSlide(
      {
        ...deck,
        slides: [
          {
            ...deck.slides[0],
            body: "Many words that do not fit. ".repeat(150),
          },
        ],
      },
      0,
    );
    expect(output.issues.length).toBeGreaterThan(0);
    await expect(exportCarouselToZip(deck, [])).rejects.toThrow("every slide");
  }, 60000);
});

describe("Untrusted image and URL ingestion", () => {
  it.each([
    "127.0.0.2",
    "169.254.1.1",
    "10.1.2.3",
    "192.168.3.4",
    "172.16.0.1",
    "100.64.0.1",
    "::1",
    "::ffff:127.0.0.1",
    "fc00::1",
    "fe80::1",
    "0.0.0.0",
    "224.0.0.1",
  ])("rejects non-public address %s", (address) =>
    expect(isPublicAddress(address)).toBe(false),
  );
  it.each(["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"])(
    "accepts public address %s",
    (address) => expect(isPublicAddress(address)).toBe(true),
  );
  it("rejects private URLs and embedded credentials before issuing a request", async () => {
    await expect(safeFetch("http://127.0.0.2/admin")).rejects.toThrow(
      "Private network",
    );
    await expect(safeFetch("http://[::1]/admin")).rejects.toThrow(
      "Private network",
    );
    await expect(
      safeFetch("https://user:password@example.com"),
    ).rejects.toThrow("Unsupported URL");
  });
});
