import { describe, it, expect, vi, beforeEach } from "vitest";
import { bulkCreatePosts, updatePost } from "@/lib/db/posts";
import * as captionJobsDb from "@/lib/db/caption-jobs";

import type { PlatformId } from "@/lib/platforms";

const mockBatchUpdate = vi.fn();
const mockBatchCommit = vi.fn();
const mockBatchSet = vi.fn();

let mockCaptionJobsQueryDocs: Array<{ ref: unknown; data: () => Record<string, unknown> }> = [];

vi.mock("@/lib/db", () => {
  return {
    adminDb: {
      collection: vi.fn(() => ({
        doc: vi.fn((id?: string) => ({
          id: id || "generated_post_id",
          update: vi.fn(),
          set: vi.fn(),
        })),
        where: vi.fn().mockReturnThis(),
        get: vi.fn(async () => ({
          empty: mockCaptionJobsQueryDocs.length === 0,
          docs: mockCaptionJobsQueryDocs,
        })),
      })),
      batch: vi.fn(() => ({
        set: mockBatchSet,
        update: mockBatchUpdate,
        commit: mockBatchCommit,
      })),
    },
    FieldValue: {
      serverTimestamp: vi.fn(() => new Date()),
    },
  };
});

describe("lib/db/posts - Bulk Creation Atomicity & Rescheduling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCaptionJobsQueryDocs = [];
  });

  it("bulkCreatePosts creates background caption jobs non-blockingly for automatic mode", async () => {
    const createJobSpy = vi.spyOn(captionJobsDb, "createCaptionJob").mockResolvedValue("caption_job_123");

    const items = [
      {
        caption: "",
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
        platforms: ["instagram"] as PlatformId[],
        captionGenerationMode: "automatic" as const,
      },
      {
        caption: "Manual caption already provided",
        scheduledAt: new Date(Date.now() + 7200_000).toISOString(),
        platforms: ["twitter"] as PlatformId[],
        captionGenerationMode: "manual" as const,
      },
    ];

    await bulkCreatePosts("ws_1", "user_1", items);

    expect(mockBatchCommit).toHaveBeenCalled();

    // Exactly 1 job created for the automatic post with empty caption
    expect(createJobSpy).toHaveBeenCalledTimes(1);
    expect(createJobSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "ws_1",
        userId: "user_1",
      })
    );
  });

  it("updatePost recalculates deadlines and priority score on reschedule without resetting caption", async () => {
    const jobDocRef = { id: "job_resched_1" };
    mockCaptionJobsQueryDocs = [
      {
        ref: jobDocRef,
        data: () => ({
          id: "job_resched_1",
          createdAt: new Date().toISOString(),
          attempts: 0,
          status: "pending",
        }),
      },
    ];

    const newDate = new Date(Date.now() + 10 * 3600_000).toISOString();
    await updatePost("ws_1", "post_1", {
      scheduledAt: newDate,
    });

    expect(mockBatchUpdate).toHaveBeenCalledWith(
      jobDocRef,
      expect.objectContaining({
        scheduledAt: newDate,
      })
    );
    expect(mockBatchCommit).toHaveBeenCalled();
  });
});
