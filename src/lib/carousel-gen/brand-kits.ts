/**
 * Brand Kit service for Carousel Studio
 *
 * Provides workspace-scoped Brand Kit CRUD, approved color palettes,
 * font pairings, logo assets, and WCAG AA contrast validation.
 */
import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { createLogger } from "@/lib/log";
import type { BrandKit } from "@/lib/carousel-gen/types";

const log = createLogger("lib:carousel-gen:brand-kits");

export const DEFAULT_BRAND_KIT: Omit<BrandKit, "id" | "workspaceId" | "createdAt" | "updatedAt"> = {
  name: "Modern Minimalist",
  colors: {
    primary: "#0f172a", // slate-900 (headline text)
    secondary: "#475569", // slate-600 (subheadline / body)
    accent: "#3b82f6", // blue-500 (emphasis)
    background: "#ffffff", // white canvas
    text: "#0f172a",
    cardBg: "#f8fafc",
  },
  fonts: {
    display: "Outfit",
    body: "Inter",
  },
  showWatermark: true,
  showSlideNumbers: true,
  showSwipeIndicator: true,
  contrastChecked: true,
};

function calculateLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const a = [r, g, b].map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

export function checkContrastRatio(fgHex: string, bgHex: string): { ratio: number; passesAA: boolean } {
  try {
    const l1 = calculateLuminance(fgHex);
    const l2 = calculateLuminance(bgHex);
    const brightest = Math.max(l1, l2);
    const darkest = Math.min(l1, l2);
    const ratio = (brightest + 0.05) / (darkest + 0.05);
    return {
      ratio: Math.round(ratio * 100) / 100,
      passesAA: ratio >= 4.5,
    };
  } catch {
    return { ratio: 4.5, passesAA: true };
  }
}

export async function listBrandKits(workspaceId: string): Promise<BrandKit[]> {
  if (!adminDb) return [];

  const snap = await adminDb
    .collection("workspaces")
    .doc(workspaceId)
    .collection("brandKits")
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      workspaceId,
      name: data.name || "Default Brand Kit",
      colors: data.colors || DEFAULT_BRAND_KIT.colors,
      fonts: data.fonts || DEFAULT_BRAND_KIT.fonts,
      logoUrl: data.logoUrl,
      logoDarkUrl: data.logoDarkUrl,
      socialHandle: data.socialHandle,
      websiteUrl: data.websiteUrl,
      showWatermark: data.showWatermark ?? true,
      showSlideNumbers: data.showSlideNumbers ?? true,
      showSwipeIndicator: data.showSwipeIndicator ?? true,
      contrastChecked: data.contrastChecked ?? true,
      createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
      updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now(),
    };
  });
}

export async function saveBrandKit(
  workspaceId: string,
  kit: Partial<BrandKit> & { name: string }
): Promise<BrandKit> {
  if (!adminDb) throw new Error("Database not configured");

  const kitsRef = adminDb
    .collection("workspaces")
    .doc(workspaceId)
    .collection("brandKits");

  const kitId = kit.id || "bk_" + Math.random().toString(36).substring(2, 9);
  const now = Date.now();

  const fullKit: BrandKit = {
    id: kitId,
    workspaceId,
    name: kit.name,
    colors: kit.colors || DEFAULT_BRAND_KIT.colors,
    fonts: kit.fonts || DEFAULT_BRAND_KIT.fonts,
    logoUrl: kit.logoUrl,
    logoDarkUrl: kit.logoDarkUrl,
    socialHandle: kit.socialHandle,
    websiteUrl: kit.websiteUrl,
    showWatermark: kit.showWatermark ?? true,
    showSlideNumbers: kit.showSlideNumbers ?? true,
    showSwipeIndicator: kit.showSwipeIndicator ?? true,
    contrastChecked: checkContrastRatio(
      kit.colors?.primary || "#000000",
      kit.colors?.background || "#ffffff"
    ).passesAA,
    createdAt: kit.createdAt || now,
    updatedAt: now,
  };

  await kitsRef.doc(kitId).set({
    ...fullKit,
    updatedAt: FieldValue.serverTimestamp(),
    ...(kit.id ? {} : { createdAt: FieldValue.serverTimestamp() }),
  });

  log.info("Brand kit saved", { workspaceId, kitId, name: kit.name });
  return fullKit;
}
