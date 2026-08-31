import { describe, it, expect, vi, beforeEach } from "vitest";
import { reconcileMissingCaptionJobs } from "@/lib/queue/caption-reconcile";
import * as captionJobsDb from "@/lib/db/caption-jobs";

let mockPostsDocs: Array<{ id: string; ref: { path: string; update: unknown }; data: () => Record<string, unknown> }> = [];
let mockExistingJobDocs: Array<{ id: string; data: () => Record<string, unknown> }> = [];

vi.mock("@/lib/db", () => {
  return {
    adminDb: {
      collectionGroup: vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn(async () => ({
          docs: mockPostsDocs,
        })),
      })),
      collection: vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn(async () => ({
          empty: mockExistingJobDocs.length === 0,
          docs: mockExistingJobDocs,
        })),
      })),
    },
    FieldValue: {
      serverTimestamp: vi.fn(() => new Date()),
    },
  };
});

describe("lib/queue/caption-reconcile - reconcileMissingCaptionJobs", () => {
  beforeEach(() => {
    mockPostsDocs = [];
    mockExistingJobDocs = [];
    vi.restoreAllMocks();
  });

  it("reconciles orphan post that has no active caption job in Firestore", async () => {
    const postUpdateMock = vi.fn();
    mockPostsDocs = [
      {
        id: "post_orphan_1",
        ref: {
          path: "workspaces/ws_rec_1/posts/post_orphan_1",
          update: postUpdateMock,
        },
        data: () => ({
          workspaceId: "ws_rec_1",
          userId: "user_rec_1",
          status: "scheduled",
          captionGenerationMode: "automatic",
          captionJobStatus: "pending",
          scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
          platforms: ["instagram", "twitter"],
          mediaUrls: ["https://cdn.example.com/img.jpg"],
        }),
      },
    ];

    const createJobSpy = vi.spyOn(captionJobsDb, "createCaptionJob").mockResolvedValue("job_created_rec_1");

    const result = await reconcileMissingCaptionJobs(50);

    expect(result.reconciledCount).toBe(1);
    expect(createJobSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "ws_rec_1",
        postId: "post_orphan_1",
      })
    );
    expect(postUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        captionJobId: "job_created_rec_1",
        captionJobStatus: "pending",
      })
    );
  });

  it("links existing active job if found without creating a duplicate", async () => {
    const postUpdateMock = vi.fn();
    mockPostsDocs = [
      {
        id: "post_existing_1",
        ref: {
          path: "workspaces/ws_rec_1/posts/post_existing_1",
          update: postUpdateMock,
        },
        data: () => ({
          workspaceId: "ws_rec_1",
          userId: "user_rec_1",
          status: "scheduled",
          captionGenerationMode: "automatic",
          captionJobStatus: "pending",
          captionJobId: undefined,
          scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
        }),
      },
    ];

    mockExistingJobDocs = [
      {
        id: "existing_job_999",
        data: () => ({ id: "existing_job_999", status: "pending" }),
      },
    ];

    const createJobSpy = vi.spyOn(captionJobsDb, "createCaptionJob");

    const result = await reconcileMissingCaptionJobs(50);

    expect(result.reconciledCount).toBe(0);
    expect(createJobSpy).not.toHaveBeenCalled();
    expect(postUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        captionJobId: "existing_job_999",
      })
    );
  });
});
