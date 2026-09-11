import { adminDb } from "@/lib/firebase/admin";
import { FieldPath } from "firebase-admin/firestore";
import { requireCarouselAccess } from "@/lib/carousel-gen/access";
import { jsonOk, jsonError } from "@/lib/validation/helpers";
function millis(v: unknown): number {
  if (typeof v === "number") return v;
  if (
    v &&
    typeof v === "object" &&
    "toMillis" in v &&
    typeof v.toMillis === "function"
  )
    return v.toMillis();
  return 0;
}
export async function GET(request: Request) {
  const session = await requireCarouselAccess(false);
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database unavailable");
  try {
    const p = new URL(request.url).searchParams;
    const q = (p.get("q") || "").trim().toLowerCase();
    const status = p.get("status") || "all";
    const folder = p.get("folder") || "";
    const brand = p.get("brand") || "";
    const platform = p.get("platform") || "";
    const from = Number(p.get("from") || 0);
    const to = Number(p.get("to") || 0);
    const offset = Math.max(0, Number(p.get("offset") || 0) || 0);
    // Scan lightweight metadata in bounded batches: title substring searches and counts
    // include legacy records without requiring a destructive search-index migration.
    const collection = adminDb.collection(
      `workspaces/${session.workspaceId}/carousels`,
    );
    const rows: Record<string, unknown>[] = [];
    let cursor: string | undefined;
    while (true) {
      if (request.signal.aborted) throw Error("Request cancelled");
      let query = collection
        .orderBy(FieldPath.documentId())
        .select(
          "postId",
          "currentRevisionId",
          "title",
          "status",
          "reviewStatus",
          "slideCount",
          "aspectRatio",
          "folderId",
          "campaignId",
          "brandKitId",
          "tags",
          "createdAt",
          "updatedAt",
          "scheduledAt",
          "publishedAt",
          "scheduling",
          "performance",
          "performanceSync",
          "performanceByPlatform",
          "variantGroupId",
          "variantLabel",
          "costUsd",
        )
        .limit(250);
      if (cursor) query = query.startAfter(cursor);
      const page = await query.get();
      for (const d of page.docs) {
        const v = d.data();
        rows.push({
          ...v,
          id: d.id,
          title: v.title || "Untitled carousel",
          status:
            v.status === "archived"
              ? "archived"
              : v.status === "scheduled" || v.status === "published"
                ? v.status
                : v.reviewStatus === "in_review" ||
                    v.reviewStatus === "changes_requested"
                  ? "in_review"
                  : "draft",
          createdAt: millis(v.createdAt),
          updatedAt: millis(v.updatedAt),
          slideCount: v.slideCount || 0,
        });
      }
      if (page.size < 250) break;
      cursor = page.docs.at(-1)!.id;
    }
    // Delivery records are the source of truth, including reconciliation writes.
    const linked = rows.filter(
      (r) => typeof r.postId === "string" && /^[a-zA-Z0-9_-]+$/.test(r.postId),
    );
    for (let i = 0; i < linked.length; i += 100) {
      const group = linked.slice(i, i + 100);
      const posts = await adminDb.getAll(
        ...group.map((r) =>
          adminDb!.doc(`workspaces/${session.workspaceId}/posts/${r.postId}`),
        ),
      );
      posts.forEach((post, index) => {
        const data = post.data();
        if (!data) return;
        const row = group[index];
        const sameRevision =
          !data.carouselRevisionId ||
          data.carouselRevisionId === row.currentRevisionId;
        row.deliveryStatus = sameRevision
          ? data.status
          : `previous_revision_${data.status}`;
        row.perPlatformResults = data.perPlatformResults || {};
        if (row.status !== "archived" && sameRevision) {
          row.status =
            data.status === "published"
              ? "published"
              : data.status === "scheduled"
                ? "scheduled"
                : row.reviewStatus === "in_review"
                  ? "in_review"
                  : "draft";
        }
      });
    }
    const filtered = rows.filter(
      (r) =>
        (!q || String(r.title).toLowerCase().includes(q)) &&
        (!folder || r.folderId === folder) &&
        (!brand || r.brandKitId === brand) &&
        (!from || Number(r.updatedAt) >= from) &&
        (!to || Number(r.updatedAt) <= to) &&
        (!platform ||
          JSON.stringify(r.scheduling || {}).includes(`"${platform}"`)),
    );
    const counts = Object.fromEntries(
      ["all", "draft", "in_review", "scheduled", "published", "archived"].map(
        (key) => [
          key,
          key === "all"
            ? filtered.length
            : filtered.filter((r) => r.status === key).length,
        ],
      ),
    );
    const result = filtered.filter(
      (r) => status === "all" || r.status === status,
    );
    result.sort((a, b) =>
      p.get("sort") === "engagement"
        ? Number(
            (b.performance as { engagementRate?: number })?.engagementRate ??
              -1,
          ) -
          Number(
            (a.performance as { engagementRate?: number })?.engagementRate ??
              -1,
          )
        : Number(b[p.get("sort") === "newest" ? "createdAt" : "updatedAt"]) -
          Number(a[p.get("sort") === "newest" ? "createdAt" : "updatedAt"]),
    );
    return jsonOk({
      items: result.slice(offset, offset + 24),
      counts,
      total: result.length,
      nextOffset: offset + 24 < result.length ? offset + 24 : null,
    });
  } catch (e) {
    return jsonError(
      500,
      e instanceof Error ? e.message : "Could not load carousels",
    );
  }
}
