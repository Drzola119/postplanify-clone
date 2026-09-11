import "server-only";
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
  return "csl_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

function generateSlideId(): string {
  return "sld_" + Math.random().toString(36).substring(2, 9);
}

export function createInitialSlides(
  count: number = 5,
  headlines?: string[]
): CarouselSlideItem[] {
  const types: CarouselSlideItem["type"][] = ["hook", "stakes", "value", "receipts", "cta"];
  const slides: CarouselSlideItem[] = [];

  for (let i = 0; i < count; i++) {
    const type = i === 0 ? "hook" : i === count - 1 ? "cta" : (types[i % types.length] ?? "value");
    slides.push({
      id: generateSlideId(),
      index: i,
      type,
      layoutId: type === "hook" ? "centered" : "split",
      headline: headlines?.[i] ?? (i === 0 ? "How to Master Your Craft" : `Key Principle #${i}`),
      subheadline: i === 0 ? "Swipe to discover the 5-step framework" : undefined,
      body: i === 0 ? "" : "Here is the exact actionable insight you can apply immediately to 10x your output.",
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
}): Promise<CarouselDocument> {
  if (!adminDb) throw new Error("Firestore Admin not configured");

  const carouselId = generateId();
  const revisionId = "rev_1";
  const now = Date.now();

  const finalSlides: CarouselSlideItem[] =
    slides && slides.length > 0
      ? slides.map((s, idx) => ({ ...s, id: s.id || generateSlideId(), index: idx }))
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
    caption: "",
    platformOverrides: {},
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

  await docRef.set({
    ...docData,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

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
  await revisionRef.set({
    ...revSnapshot,
    createdAt: FieldValue.serverTimestamp(),
  });

  log.info("Created carousel draft", { workspaceId, carouselId, revisionId });
  return docData;
}

/**
 * Loads a carousel document by ID and confirms workspace ownership.
 */
export async function getCarouselDocument(
  workspaceId: string,
  carouselId: string
): Promise<CarouselDocument | null> {
  if (!adminDb) return null;

  const docRef = adminDb
    .collection("workspaces")
    .doc(workspaceId)
    .collection("carousels")
    .doc(carouselId);

  const snap = await docRef.get();
  if (!snap.exists) return null;

  const data = snap.data() as Record<string, any>;

  // Normalize legacy and current fields
  const doc: CarouselDocument = {
    id: snap.id,
    workspaceId: data.workspaceId || workspaceId,
    title: data.title || "Untitled Carousel",
    description: data.description || "",
    status: data.status || "draft",
    campaignId: data.campaignId || null,
    folderId: data.folderId || null,
    tags: Array.isArray(data.tags) ? data.tags : [],
    aspectRatio: data.aspectRatio || "4:5",
    dimensions: data.dimensions || ASPECT_RATIO_DIMENSIONS[data.aspectRatio as CarouselAspectRatio || "4:5"],
    brandKitId: data.brandKitId || null,
    style: data.style || DEFAULT_CAROUSEL_STYLE,
    slides: Array.isArray(data.slides) && data.slides.length > 0
      ? data.slides.map((s: any, idx: number) => ({
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
          backgroundImageUrl: s.backgroundImageUrl || s.backgroundUrl,
          backgroundOpacity: typeof s.backgroundOpacity === "number" ? s.backgroundOpacity : 0,
          backgroundPosition: s.backgroundPosition || "cover",
          backgroundColor: s.backgroundColor,
          textColor: s.textColor,
          accentColor: s.accentColor,
          displayFont: s.displayFont,
          bodyFont: s.bodyFont,
          textAlign: s.textAlign || "left",
          fontSizeScale: s.fontSizeScale || 1,
          isLocked: Boolean(s.isLocked),
          renderedImageUrl: s.renderedImageUrl || (data.mediaUrls?.[idx]),
          isLegacyFlat: Boolean(s.isLegacyFlat || (!s.headline && data.mediaUrls?.[idx])),
        }))
      : createInitialSlides(data.slideCount || 5),
    slideCount: data.slideCount || (Array.isArray(data.slides) ? data.slides.length : 5),
    caption: data.caption || "",
    platformOverrides: data.platformOverrides || {},
    currentRevisionId: data.currentRevisionId || "rev_1",
    revisionCount: data.revisionCount || 1,
    reviewStatus: data.reviewStatus || "none",
    activeReviewToken: data.activeReviewToken || null,
    approval: data.approval || null,
    scheduling: data.scheduling || {
      postId: data.postId || null,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).getTime() : null,
      publishedAt: data.publishedAt ? new Date(data.publishedAt).getTime() : null,
      platforms: [],
      status: data.status === "scheduled" ? "scheduled" : data.status === "published" ? "published" : "idle",
    },
    analytics: data.analytics || (data.performance ? {
      impressions: data.performance.impressions || 0,
      reach: data.performance.reach || 0,
      likes: data.performance.likes || 0,
      comments: data.performance.comments || 0,
      shares: data.performance.shares || 0,
      saves: data.performance.saves || 0,
      engagementRate: data.performance.engagementRate || 0,
      lastSyncedAt: data.performance.lastSyncedAt || 0,
      syncStatus: "synced",
    } : undefined),
    variantGroupId: data.variantGroupId || null,
    variantLabel: data.variantLabel || null,
    variantWinner: data.variantWinner || null,
    costUsd: data.costUsd || 0,
    mediaUrls: Array.isArray(data.mediaUrls) ? data.mediaUrls : [],
    createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
    updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now(),
    createdBy: data.createdBy || data.uid || "",
    updatedBy: data.updatedBy || "",
  };

  return doc;
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
}: {
  workspaceId: string;
  carouselId: string;
  uid: string;
  updates: Partial<CarouselDocument>;
  createRevision?: boolean;
  revisionLabel?: string;
}): Promise<{ success: boolean; document?: CarouselDocument; newRevisionId?: string; error?: string }> {
  if (!adminDb) return { success: false, error: "Database not configured" };

  const docRef = adminDb
    .collection("workspaces")
    .doc(workspaceId)
    .collection("carousels")
    .doc(carouselId);

  const existing = await getCarouselDocument(workspaceId, carouselId);
  if (!existing) return { success: false, error: "Carousel not found" };

  let nextRevisionId = existing.currentRevisionId;
  let nextRevisionCount = existing.revisionCount || 1;

  if (createRevision) {
    nextRevisionCount += 1;
    nextRevisionId = `rev_${nextRevisionCount}`;
  }

  // If status was approved, and slides/styles changed, invalidate approval to changes_requested / in_review
  let nextReviewStatus = updates.reviewStatus ?? existing.reviewStatus;
  let nextApproval = updates.approval !== undefined ? updates.approval : existing.approval;
  if (
    existing.reviewStatus === "approved" &&
    createRevision &&
    (updates.slides || updates.style || updates.caption)
  ) {
    nextReviewStatus = "in_review";
    nextApproval = null;
  }

  const mergedSlides = updates.slides
    ? updates.slides.map((s, idx) => ({ ...s, id: s.id || generateSlideId(), index: idx }))
    : existing.slides;

  const mergedDoc: CarouselDocument = {
    ...existing,
    ...updates,
    slides: mergedSlides,
    slideCount: mergedSlides.length,
    currentRevisionId: nextRevisionId,
    revisionCount: nextRevisionCount,
    reviewStatus: nextReviewStatus,
    approval: nextApproval,
    updatedAt: Date.now(),
    updatedBy: uid,
  };

  const payload: Record<string, any> = {
    ...mergedDoc,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await docRef.set(payload, { merge: true });

  if (createRevision) {
    const revRef = docRef.collection("revisions").doc(nextRevisionId);
    const revData: CarouselRevisionSnapshot = {
      id: nextRevisionId,
      carouselId,
      revisionNumber: nextRevisionCount,
      createdAt: Date.now(),
      createdBy: { uid },
      label: revisionLabel || `Revision ${nextRevisionCount}`,
      slides: mergedSlides,
      style: mergedDoc.style,
      aspectRatio: mergedDoc.aspectRatio,
      caption: mergedDoc.caption,
      renderedAssetUrls: mergedDoc.mediaUrls,
      reviewStatus: nextReviewStatus,
      approval: nextApproval,
    };
    await revRef.set({
      ...revData,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  log.info("Updated carousel document", { workspaceId, carouselId, revisionId: nextRevisionId });
  return { success: true, document: mergedDoc, newRevisionId: nextRevisionId };
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
    title: asVariantB ? `${existing.title} (Variant B)` : `${existing.title} ${titleSuffix}`,
    aspectRatio: existing.aspectRatio,
    style: existing.style,
    slides: newSlides,
    brandKitId: existing.brandKitId,
    campaignId: existing.campaignId,
    folderId: existing.folderId,
    tags: existing.tags,
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
