import "server-only";
import { randomUUID } from "node:crypto";
import { cleanDocument } from "./document-utils";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { createLogger } from "@/lib/log";
import {
  type CarouselDocument,
  type CarouselSlideItem,
  type CarouselRevisionSnapshot,
  type CarouselStyle,
  type CarouselAspectRatio,
  ASPECT_RATIO_DIMENSIONS,
} from "@/lib/carousel-gen/types";
import { DEFAULT_CAROUSEL_STYLE } from "@/lib/carousel-gen/styles";

const log = createLogger("lib:carousel-gen:document-service");

function generateId(): string {
  return "csl_" + randomUUID();
}

function generateSlideId(): string {
  return "sld_" + randomUUID();
}

export function createInitialSlides(
  count: number = 5,
  headlines?: string[],
): CarouselSlideItem[] {
  const types: CarouselSlideItem["type"][] = [
    "hook",
    "stakes",
    "value",
    "receipts",
    "cta",
  ];
  const slides: CarouselSlideItem[] = [];

  for (let i = 0; i < count; i++) {
    const type =
      i === 0
        ? "hook"
        : i === count - 1
          ? "cta"
          : (types[i % types.length] ?? "value");
    slides.push({
      id: generateSlideId(),
      index: i,
      type,
      layoutId: type === "hook" ? "centered" : "split",
      headline:
        headlines?.[i] ??
        (i === 0 ? "How to Master Your Craft" : `Key Principle #${i}`),
      subheadline:
        i === 0 ? "Swipe to discover the 5-step framework" : undefined,
      body:
        i === 0
          ? ""
          : "Here is the exact actionable insight you can apply immediately to 10x your output.",
      textAlign: "left",
      backgroundOpacity: 0,
      isLocked: false,
    });
  }
  return slides;
}

/**
 * Creates or initialises a new carousel document in Firestore.
 */
export async function createCarouselDraft({
  workspaceId,
  uid,
  title = "Untitled Carousel",
  aspectRatio = "4:5",
  style = DEFAULT_CAROUSEL_STYLE,
  slides,
  brandKitId,
  campaignId,
  folderId,
  tags = [],
  caption = "",
  brandSnapshot = null,
  platformOverrides = {},
  showSlideNumbers = true,
}: {
  workspaceId: string;
  uid: string;
  title?: string;
  aspectRatio?: CarouselAspectRatio;
  style?: CarouselStyle;
  slides?: CarouselSlideItem[];
  brandKitId?: string | null;
  campaignId?: string | null;
  folderId?: string | null;
  tags?: string[];
  caption?: string;
  brandSnapshot?: CarouselDocument["brandSnapshot"];
  platformOverrides?: CarouselDocument["platformOverrides"];
  showSlideNumbers?: boolean;
}): Promise<CarouselDocument> {
  if (!adminDb) throw new Error("Firestore Admin not configured");

  const carouselId = generateId();
  const revisionId = "rev_1";
  const now = Date.now();

  const finalSlides: CarouselSlideItem[] =
    slides && slides.length > 0
      ? slides.map((s, idx) => ({
          ...s,
          id: s.id || generateSlideId(),
          index: idx,
        }))
      : createInitialSlides(5);

  const docData: CarouselDocument = {
    id: carouselId,
    workspaceId,
    title,
    description: "",
    status: "draft",
    campaignId: campaignId ?? null,
    folderId: folderId ?? null,
    tags,
    aspectRatio,
    dimensions: ASPECT_RATIO_DIMENSIONS[aspectRatio],
    brandKitId: brandKitId ?? null,
    style,
    slides: finalSlides,
    slideCount: finalSlides.length,
    caption,
    brandSnapshot,
    showSlideNumbers,
    platformOverrides,
    currentRevisionId: revisionId,
    revisionCount: 1,
    reviewStatus: "none",
    activeReviewToken: null,
    approval: null,
    scheduling: {
      platforms: [],
      status: "idle",
    },
    mediaUrls: [],
    createdAt: now,
    updatedAt: now,
    createdBy: uid,
    updatedBy: uid,
  };

  const docRef = adminDb
    .collection("workspaces")
    .doc(workspaceId)
    .collection("carousels")
    .doc(carouselId);

  const batch = adminDb.batch();
  batch.set(
    docRef,
    cleanDocument({
      ...docData,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }),
  );

  // Record Initial Revision
  const revisionRef = docRef.collection("revisions").doc(revisionId);
  const revSnapshot: CarouselRevisionSnapshot = {
    id: revisionId,
    carouselId,
    revisionNumber: 1,
    createdAt: now,
    createdBy: { uid },
    label: "Initial Draft",
    slides: finalSlides,
    style,
    aspectRatio,
    caption: "",
    renderedAssetUrls: [],
    reviewStatus: "none",
  };
  batch.set(
    revisionRef,
    cleanDocument({
      ...docData,
      ...revSnapshot,
      caption,
      createdAt: FieldValue.serverTimestamp(),
    }),
  );
  await batch.commit();

  log.info("Created carousel draft", { workspaceId, carouselId, revisionId });
  return cleanDocument(docData);
}

/**
 * Loads a carousel document by ID and confirms workspace ownership.
 */
export async function getCarouselDocument(
  workspaceId: string,
  carouselId: string,
): Promise<CarouselDocument | null> {
  if (!adminDb) return null;

  const docRef = adminDb
    .collection("workspaces")
    .doc(workspaceId)
    .collection("carousels")
    .doc(carouselId);

  const snap = await docRef.get();
  if (!snap.exists) return null;

  return normalizeCarousel(snap.id, workspaceId, snap.data()!);
}

export function normalizeCarousel(
  id: string,
  workspaceId: string,
  raw: Record<string, unknown>,
): CarouselDocument {
  const data = raw as Partial<CarouselDocument> & {
    uid?: string;
    postId?: string;
    performance?: NonNullable<CarouselDocument["analytics"]>;
  };

  // Normalize legacy and current fields
  const doc: CarouselDocument = {
    ...data,
    id,
    workspaceId: data.workspaceId || workspaceId,
    title: data.title || "Untitled Carousel",
    description: data.description || "",
    status: data.status || "draft",
    campaignId: data.campaignId || null,
    folderId: data.folderId || null,
    tags: Array.isArray(data.tags) ? data.tags : [],
    aspectRatio: data.aspectRatio || "4:5",
    dimensions:
      data.dimensions ||
      ASPECT_RATIO_DIMENSIONS[
        (data.aspectRatio as CarouselAspectRatio) || "4:5"
      ],
    brandKitId: data.brandKitId || null,
    style: data.style || DEFAULT_CAROUSEL_STYLE,
    slides:
      Array.isArray(data.slides) && data.slides.length > 0
        ? data.slides.map((s, idx: number) => ({
            ...s,
            id: s.id || `slide_${idx}`,
            index: typeof s.index === "number" ? s.index : idx,
            type: s.type || (idx === 0 ? "hook" : "value"),
            layoutId: s.layoutId || "centered",
            headline: s.headline || "",
            subheadline: s.subheadline,
            body: s.body,
            quoteAuthor: s.quoteAuthor,
            statsValue: s.statsValue,
            statsLabel: s.statsLabel,
            comparisonItems: s.comparisonItems,
            bulletPoints: s.bulletPoints,
            backgroundImageUrl: s.backgroundImageUrl,
            backgroundOpacity:
              typeof s.backgroundOpacity === "number" ? s.backgroundOpacity : 0,
            backgroundPosition: s.backgroundPosition || "cover",
            backgroundColor: s.backgroundColor,
            textColor: s.textColor,
            accentColor: s.accentColor,
            displayFont: s.displayFont,
            bodyFont: s.bodyFont,
            textAlign: s.textAlign || "left",
            fontSizeScale: s.fontSizeScale || 1,
            isLocked: Boolean(s.isLocked),
            renderedImageUrl: s.renderedImageUrl || data.mediaUrls?.[idx],
            isLegacyFlat: Boolean(
              s.isLegacyFlat || (!s.headline && data.mediaUrls?.[idx]),
            ),
          }))
        : data.mediaUrls?.length
          ? data.mediaUrls.map((url, index) => ({
              id: `legacy_${id}_${index}`,
              index,
              type: index === 0 ? ("hook" as const) : ("value" as const),
              headline: "",
              renderedImageUrl: url,
              isLegacyFlat: true,
            }))
          : createInitialSlides(data.slideCount || 5),
    slideCount:
      data.slideCount || (Array.isArray(data.slides) ? data.slides.length : 5),
    caption: data.caption || "",
    platformOverrides: data.platformOverrides || {},
    currentRevisionId: data.currentRevisionId || "rev_1",
    revisionCount: data.revisionCount || 1,
    reviewStatus: data.reviewStatus || "none",
    activeReviewToken: data.activeReviewToken || null,
    approval: data.approval || null,
    scheduling: data.scheduling || {
      postId: data.postId || null,
      scheduledAt: toMillis(raw.scheduledAt),
      publishedAt: toMillis(raw.publishedAt),
      platforms: [],
      status:
        data.status === "scheduled"
          ? "scheduled"
          : data.status === "published"
            ? "published"
            : "idle",
    },
    analytics:
      data.analytics ||
      (data.performance
        ? {
            impressions: data.performance.impressions || 0,
            reach: data.performance.reach || 0,
            likes: data.performance.likes || 0,
            comments: data.performance.comments || 0,
            shares: data.performance.shares || 0,
            saves: data.performance.saves || 0,
            engagementRate: data.performance.engagementRate || 0,
            lastSyncedAt: data.performance.lastSyncedAt || 0,
            syncStatus: "synced",
          }
        : undefined),
    variantGroupId: data.variantGroupId || null,
    variantLabel: data.variantLabel || null,
    variantWinner: data.variantWinner || null,
    costUsd: data.costUsd || 0,
    mediaUrls: Array.isArray(data.mediaUrls) ? data.mediaUrls : [],
    createdAt: toMillis(raw.createdAt) || Date.now(),
    updatedAt: toMillis(raw.updatedAt) || Date.now(),
    createdBy: data.createdBy || data.uid || "",
    updatedBy: data.updatedBy || "",
  };

  return cleanDocument(doc);
}

/**
 * Saves updates to a carousel document with optimistic concurrency check,
 * and creates a new immutable revision snapshot if material edits occurred.
 */
export async function updateCarouselDocument({
  workspaceId,
  carouselId,
  uid,
  updates,
  createRevision = false,
  revisionLabel,
  expectedRevisionId,
}: {
  workspaceId: string;
  carouselId: string;
  uid: string;
  updates: Partial<CarouselDocument>;
  createRevision?: boolean;
  revisionLabel?: string;
  expectedRevisionId?: string;
}): Promise<{
  success: boolean;
  document?: CarouselDocument;
  newRevisionId?: string;
  error?: string;
}> {
  if (!adminDb) return { success: false, error: "Database not configured" };

  const docRef = adminDb
    .collection("workspaces")
    .doc(workspaceId)
    .collection("carousels")
    .doc(carouselId);

  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    if (!snap.exists) return { success: false, error: "Carousel not found" };
    const existing = normalizeCarousel(carouselId, workspaceId, snap.data()!);
    if (
      expectedRevisionId &&
      expectedRevisionId !== existing.currentRevisionId
    ) {
      return { success: false, error: "conflict" };
    }
    const contentKeys = [
      "title",
      "slides",
      "style",
      "caption",
      "aspectRatio",
      "brandKitId",
      "brandSnapshot",
      "showSlideNumbers",
      "platformOverrides",
    ] as const;
    const material = contentKeys.some(
      (key) =>
        key in updates &&
        JSON.stringify(updates[key]) !== JSON.stringify(existing[key]),
    );
    const revise = material || createRevision;
    const nextRevisionCount = existing.revisionCount + (revise ? 1 : 0);
    const nextRevisionId = revise
      ? `rev_${nextRevisionCount}_${randomUUID()}`
      : existing.currentRevisionId;
    const document = cleanDocument({
      ...existing,
      ...updates,
      slides: (updates.slides ?? existing.slides).map((slide, index) => ({
        ...slide,
        index,
      })),
      slideCount: (updates.slides ?? existing.slides).length,
      dimensions:
        ASPECT_RATIO_DIMENSIONS[updates.aspectRatio ?? existing.aspectRatio],
      status:
        material && ["scheduled", "published"].includes(existing.status)
          ? "draft"
          : (updates.status ?? existing.status),
      currentRevisionId: nextRevisionId,
      revisionCount: nextRevisionCount,
      reviewStatus:
        material && existing.reviewStatus === "approved"
          ? "in_review"
          : existing.reviewStatus,
      approval: material ? null : existing.approval,
      mediaUrls: material ? [] : (updates.mediaUrls ?? existing.mediaUrls),
      updatedAt: Date.now(),
      updatedBy: uid,
    } satisfies CarouselDocument);
    tx.set(
      docRef,
      cleanDocument({ ...document, updatedAt: FieldValue.serverTimestamp() }),
      { merge: true },
    );
    if (revise)
      tx.set(
        docRef.collection("revisions").doc(nextRevisionId),
        cleanDocument({
          ...document,
          id: nextRevisionId,
          carouselId,
          revisionNumber: nextRevisionCount,
          createdBy: { uid },
          createdAt: FieldValue.serverTimestamp(),
          label: revisionLabel || "Saved changes",
          renderedAssetUrls: document.mediaUrls,
        }),
      );
    return { success: true, document, newRevisionId: nextRevisionId };
  });
}

/**
 * Duplicates an existing carousel into an isolated independent draft.
 */
export async function duplicateCarouselDocument({
  workspaceId,
  carouselId,
  uid,
  titleSuffix = "(Copy)",
  asVariantB = false,
}: {
  workspaceId: string;
  carouselId: string;
  uid: string;
  titleSuffix?: string;
  asVariantB?: boolean;
}): Promise<CarouselDocument> {
  const existing = await getCarouselDocument(workspaceId, carouselId);
  if (!existing) throw new Error("Source carousel not found");

  const newSlides = existing.slides.map((s, idx) => ({
    ...s,
    id: generateSlideId(),
    index: idx,
  }));

  const variantGroupId = asVariantB
    ? existing.variantGroupId || existing.id
    : null;

  // If creating Variant B, also mark original as Variant A if not already
  if (asVariantB && !existing.variantGroupId) {
    await updateCarouselDocument({
      workspaceId,
      carouselId: existing.id,
      uid,
      updates: {
        variantGroupId: existing.id,
        variantLabel: "A",
      },
    });
  }

  const created = await createCarouselDraft({
    workspaceId,
    uid,
    title: asVariantB
      ? `${existing.title} (Variant B)`
      : `${existing.title} ${titleSuffix}`,
    aspectRatio: existing.aspectRatio,
    style: existing.style,
    slides: newSlides,
    brandKitId: existing.brandKitId,
    campaignId: existing.campaignId,
    folderId: existing.folderId,
    tags: existing.tags,
    caption: existing.caption,
    brandSnapshot: existing.brandSnapshot,
    platformOverrides: existing.platformOverrides,
    showSlideNumbers: existing.showSlideNumbers,
  });

  if (asVariantB) {
    await updateCarouselDocument({
      workspaceId,
      carouselId: created.id,
      uid,
      updates: {
        variantGroupId,
        variantLabel: "B",
      },
    });
    created.variantGroupId = variantGroupId;
    created.variantLabel = "B";
  }

  return created;
}

function toMillis(value: unknown): number {
  if (typeof value === "number") return value;
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof value.toMillis === "function"
  )
    return value.toMillis();
  return value instanceof Date ? value.getTime() : 0;
}
