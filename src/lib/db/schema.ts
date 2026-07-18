import "server-only";

/**
 * Firestore document shapes — the single source of truth that
 * src/lib/db/* modules and firestore.rules both follow.
 *
 * Dates are stored as Timestamp; here we type them as Date for convenience
 * at the boundary, and convert via Timestamp.fromDate / Timestamp.now in the
 * per-collection modules.
 */

export type PostStatus = "draft" | "queued" | "scheduled" | "publishing" | "published" | "partially_published" | "failed" | "archived" | "paused";
/**
 * Platform identifiers used throughout trustiify. Includes the 9 most
 * common platforms surfaced in the composer UI plus 3 extras (discord,
 * telegram, google_business) supported via upload-post.com. Engine uses
 * "x" instead of "twitter"; trustiify PlatformId keeps "twitter" for
 * UI consistency. Engine-client translates at the boundary.
 */
export type PlatformId =
  | "bluesky"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "pinterest"
  | "twitter"
  | "linkedin"
  | "threads"
  | "facebook"
  | "discord"
  | "telegram"
  | "google_business";

export type BoostStatus = "draft" | "active" | "completed" | "paused";

export interface BoostConfig {
  status: BoostStatus;
  budgetCents?: number;
  durationDays?: number;
  startedAt?: Date;
  endsAt?: Date;
  audienceHint?: string;
}

export interface WorkspaceMember {
  role: "owner" | "admin" | "editor" | "viewer";
  joinedAt: Date;
}

export interface PostDoc {
  authorUid: string;
  status: PostStatus;
  caption: string;
  platforms: PlatformId[];
  mediaUrls: string[];
  hashtags: string[];
  labels: string[];
  scheduledAt?: Date | string;
  publishedAt?: Date | string;
  firstComment?: string;
  altText: string[];
  collaborators: Array<{ uid: string; handle: string; status?: "invited" | "accepted" | "declined" }>;
  community?: string;
  quoteTweetUrl?: string;
  threadRootId?: string;
  workerId?: string;
  claimedAt?: Date;
  failureReason?: string;
  boostConfig?: BoostConfig;
  /**
   * Per-platform delivery results populated when a post is published via
   * the AI outpainting flow. Each entry records the platform-specific
   * upload-post.com post id and status. The aggregate PostDoc.status
   * reflects the overall outcome (published only when ALL platforms
   * succeeded; partially_published otherwise).
   */
  perPlatformResults?: Record<string, PerPlatformResult>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface PerPlatformResult {
  status: "delivered" | "failed" | "pending";
  /** upload-post.com post id, null when status is failed. */
  postId: string | null;
  /** Public CDN URL of the variant that was delivered to this platform. */
  mediaUrl?: string | null;
  /** ISO timestamp of the successful delivery, null otherwise. */
  deliveredAt?: string | null;
  /** Error code/message when status is failed. */
  error?: { code?: string; message: string } | null;
}

export interface DraftDoc {
  authorUid: string;
  caption?: string;
  platforms: PlatformId[];
  mediaItems: Array<{ id: string; url: string; type?: "image" | "video"; name?: string; size?: number; width?: number; height?: number; duration?: number }>;
  sameForAll: boolean;
  selected: Record<string, unknown>;
  collaborators: Array<{ uid: string; handle: string; status?: "invited" | "accepted" | "declined" }>;
  customCoverUrl?: string;
  frameCoverUrl?: string;
  activeMediaId?: string;
  firstComment?: string;
  quoteTweetUrl?: string;
  community?: string;
  tagUsers: string[];
  updatedAt: Date;
  createdAt: Date;
}

export interface MediaAssetDoc {
  workspaceId: string;
  url: string;
  storedPath: string;
  mime: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  uploadedBy: string;
  uploadedAt: Date;
  tags: string[];
  folder: "posts" | "brands" | "avatars" | "assets";
  deletedAt?: Date;
}

export interface LabelDoc {
  name: string;
  color: string;
  createdAt: Date;
}

export interface HashtagSetDoc {
  name: string;
  hashtags: string[];
  platform?: PlatformId;
  createdAt: Date;
}

export interface ReportDoc {
  name: string;
  template: string;
  dateRange: { from: Date; to: Date };
  status: "pending" | "ready" | "failed";
  downloadUrl?: string;
  generatedAt?: Date;
  createdAt: Date;
}

export interface ReportScheduleDoc {
  reportId?: string;
  name: string;
  cron: string;
  recipients: string[];
  paused: boolean;
  createdAt: Date;
}

export interface ApiKeyDoc {
  name: string;
  hashedToken: string;
  encryptedToken: string;
  scopes: string[];
  lastUsedAt?: Date;
  createdAt: Date;
  revokedAt?: Date;
}

export interface ImageGenProviderKeyDoc {
  provider: "gemini-flash-lite-image" | "gpt-image-2" | "ideogram-4" | "gemini-flash-image";
  encryptedToken: string;
  /** Last 4 chars of the key, for UI display. Never the full key. */
  last4: string;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface ImageGenLogDoc {
  workspaceId: string;
  uid: string;
  provider: "gemini-flash-lite-image" | "gpt-image-2" | "ideogram-4" | "gemini-flash-image";
  model: string;
  /** Key source — always "platform"; all generations are platform-billed. */
  keySource: "platform";
  /** USD cost estimated for this generation. */
  costUsd: number;
  /** Aspect ratio key the user requested. */
  aspectRatio: string;
  /** Tool that triggered the generation. */
  tool?: "instant" | "ads";
  /** Infographic style id used (for analytics). */
  styleId?: string;
  /** Wall-clock ms the successful provider took. */
  durationMs: number;
  /** Image dimensions. */
  width?: number;
  height?: number;
  /** Width of the input prompt in characters (for usage telemetry). */
  promptChars?: number;
  /** True when the router fell back from the user's first-choice provider. */
  fellBack: boolean;
  /** Provider the user originally asked for (when fellBack = true). */
  requestedProvider?: string;
  createdAt: Date;
}

export interface CommentDoc {
  /** Platform-side id (e.g. Twitter comment id). Used for dedup on event ingestion. */
  externalId?: string;
  platform: PlatformId;
  postId?: string;
  authorHandle: string;
  authorName?: string;
  body: string;
  sentAt: Date;
  direction?: "in" | "out";
  inReplyToId?: string;
  metadata?: Record<string, unknown>;
  sentiment?: "positive" | "neutral" | "negative";
  intent?: "support" | "sales" | "feedback" | "spam" | "other";
  topics?: string[];
  replied?: boolean;
  replyId?: string;
  /** Set when the auto-responder sends the reply, so the UI can badge it. */
  autoRepliedByCampaignId?: string;
  analyzed?: boolean;
}

export interface ConversationDoc {
  /** Platform-side conversation id (DM thread). Used for dedup. */
  externalId?: string;
  platform: PlatformId;
  participants: string[];
  lastMessageAt: Date;
  unreadCount: number;
  createdAt?: Date;
}

export interface MessageDoc {
  externalId?: string;
  fromHandle: string;
  authorName?: string;
  body: string;
  sentAt: Date;
  direction: "in" | "out";
  inReplyToId?: string;
  metadata?: Record<string, unknown>;
  /** Set when the auto-responder sends the reply. */
  autoRepliedByCampaignId?: string;
  analyzed?: boolean;
}

export interface DestinationDoc {
  platform: PlatformId | "custom";
  type: "webhook" | "zapier" | "custom";
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  lastDeliveryAt?: Date;
  createdAt: Date;
}

export interface WebhookDoc {
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  lastDeliveryAt?: Date;
  createdAt: Date;
}

export interface AnalyticsDailyPlatformDoc {
  followers: number;
  engagementRate: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  date: string;
}

export interface WorkspaceDoc {
  name: string;
  ownerUid: string;
  plan: "free" | "pro" | "team" | "enterprise";
  settings: Record<string, unknown>;
  createdAt: Date;
  /** Total successful AI infographic generations, never reset. */
  imageGenUsedLifetime?: number;
  /** Successful generations in the current `imageGenMonth` bucket. */
  imageGenUsedThisMonth?: number;
  /** YYYY-MM bucket the monthly counter is scoped to. */
  imageGenMonth?: string;
  /** Server timestamp of the most recent successful generation. */
  imageGenLastUsedAt?: Date;
  /** Provider that served the most recent generation. */
  imageGenLastProvider?: string;
  /** Estimated USD cost of the most recent generation. */
  imageGenLastCostUsd?: number;
}

export interface LinkInBioDoc {
  uid: string;
  username: string;
  bio: string;
  blocks: Array<{ type: string; data: Record<string, unknown> }>;
  theme: string;
  socials: Record<string, string>;
  avatarUrl?: string;
  updatedAt: Date;
  createdAt: Date;
}