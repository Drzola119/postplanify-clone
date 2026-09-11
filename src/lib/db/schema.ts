import "server-only";

/**
 * Firestore document shapes — the single source of truth that
 * src/lib/db/* modules and firestore.rules both follow.
 *
 * Dates are stored as Timestamp; here we type them as Date for convenience
 * at the boundary, and convert via Timestamp.fromDate / Timestamp.now in the
 * per-collection modules.
 */

export type PostStatus =
  | "draft"
  | "queued"
  | "scheduled"
  | "publishing"
  | "published"
  | "partially_published"
  | "failed"
  | "archived"
  | "paused";

/**
 * Platform identifiers used throughout trustiify.
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
  | "google_business"
  | "reddit";

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
  /** Media kind sent to UploadPost (text/image/video or a composer mode). */
  mediaType?: string;
  hashtags: string[];
  labels: string[];
  scheduledAt?: Date | string;
  publishedAt?: Date | string;
  firstComment?: string;
  firstCommentByPlatform?: Record<string, string>;
  /** Per-platform alt text keyed by platform id. */
  altTextByPlatform?: Record<string, string>;
  altText: string[];
  collaborators: Array<{ uid: string; handle: string; status?: "invited" | "accepted" | "declined" }>;
  community?: string;
  quoteTweetUrl?: string;
  threadRootId?: string;
  /** Tag-users payload: either a shared string or per-platform list. */
  tagUsers?: string | string[] | Record<string, string[]>;
  /** Feed vs Story placement hint, when the post targets a story slot. */
  feedType?: "feed" | "story";
  /** Story-vs-feed placement collected in the bulk composer. */
  postIn?: "feed" | "story";
  /** YouTube-only — required when "youtube" is in platforms. */
  youtubeTitle?: string;
  youtubeTags?: string;
  /** Pinterest-only — required when "pinterest" is in platforms. */
  pinterestBoard?: string;
  autoAddMusic?: boolean;
  profile?: string;
  /** Carousel / Trial Reel / Document items so the worker can dispatch correctly. */
  carouselItems?: Array<{ url: string }>;
  trialReel?: { url: string };
  document?: { url: string; title: string; mimeType: string };
  /** CDN URL of the user-picked video frame cover. */
  frameCoverUrl?: string;
  /** CDN URL of a custom cover image (e.g. uploaded separately for a video post). */
  customCoverUrl?: string;
  /** Per-platform captions map. Persisted so scheduled queue worker can send correct payload. */
  captionsByPlatform?: Record<string, string>;
  /** True when sameForAll mode was used; helps n8n/worker decide payload shape. */
  sameForAll?: boolean;
  /** Per-platform advanced options snapshot, persisted so scheduled posts don't drift. */
  advancedByPlatform?: Record<string, Record<string, unknown>>;
  workerId?: string | null;
  claimedAt?: Date | null;
  failureReason?: string;
  /** UploadPost identifiers used to reconcile asynchronous/scheduled delivery. */
  uploadPostRequestId?: string;
  uploadPostJobId?: string;
  boostConfig?: BoostConfig;
  /** Asynchronous AI caption generation configuration and status */
  captionGenerationMode?: "automatic" | "manual";
  captionJobId?: string;
  captionJobStatus?: "pending" | "generating" | "ready" | "failed" | "skipped";
  captionFallback?: "hold" | "publish_without_caption";
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
  deletedAt?: Date | null;
}

export type CaptionJobStatus =
  | "pending"
  | "ready_to_run"
  | "processing"
  | "retrying"
  | "completed"
  | "failed"
  | "cancelled"
  | "skipped";

export interface CaptionJobInputSnapshot {
  tone?: string;
  voice?: string | null;
  template?: string | null;
  includeHashtags?: boolean;
  useEmojis?: boolean;
  multiPlatform?: boolean;
  extra?: string;
  platforms?: Array<{ id: string; name: string; charLimit: number }>;
  imageUrl?: string | null;
  videoTitle?: string | null;
  mediaUrls?: string[];
  filename?: string;
}

export interface CaptionJobUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  costInUsdTicks?: number;
  durationMs?: number;
}

export interface CaptionJobDoc {
  id?: string;
  workspaceId: string;
  userId: string;
  postId: string;
  status: CaptionJobStatus;
  priorityScore: number;
  scheduledAt: Date | string;
  generationRecommendedAt: Date | string;
  generationDeadline: Date | string;
  emergencyDeadline: Date | string;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt?: Date | string | null;
  provider: "xai" | "groq";
  model: string;
  idempotencyKey: string;
  promptVersion: string;
  generationConfigHash: string;
  contentHash: string;
  fingerprint: string;
  inputSnapshot: CaptionJobInputSnapshot;
  generatedCaption?: string;
  generatedCaptionsByPlatform?: Record<string, string>;
  workerId?: string | null;
  claimedAt?: Date | string | null;
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
  failedAt?: Date | string | null;
  lastErrorCode?: string | null;
  lastErrorMessage?: string | null;
  usage?: CaptionJobUsage;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerPlatformResult {
  status: "delivered" | "failed" | "pending";
  /** upload-post.com post id, null when status is failed. */
  postId: string | null;
  /** Public URL of the social post returned by UploadPost. */
  postUrl?: string | null;
  /** Public CDN URL of the variant that was delivered to this platform. */
  mediaUrl?: string | null;
  /** ISO timestamp of the successful delivery, null otherwise. */
  deliveredAt?: string | null;
  /** Error code/message when status is failed. */
  error?: { code?: string; message: string } | null;
}

export interface DraftDoc {
  carouselHandoffId?: string;
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
  accountCount?: number;
  comparison?: "none" | "previous_period" | "previous_year" | "week_over_week" | "custom_range";
  platforms?: PlatformId[];
  branding?: { accentColor?: string; footerText?: string };
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
  /** Platform-side id (e.g. Instagram comment id). Used for dedup on ingestion. */
  externalId?: string;
  /** Workspace-scoped stable identity: `${accountKey}:${platform}:${externalId}`. */
  identityKey?: string;
  platform: PlatformId;
  /** Local published-post id (PostDoc) when linked via stable platform post id. */
  postId?: string;
  /** Provider media/post id + permalink for "view original" links. */
  externalPostId?: string;
  postPermalink?: string;
  accountKey?: string;
  authorHandle: string;
  authorName?: string;
  /** Scoped provider author id (recipient for follow-up DMs). */
  authorExternalId?: string;
  body: string;
  sentAt: Date;
  observedAt?: Date;
  direction?: "in" | "out";
  inReplyToId?: string;
  metadata?: Record<string, unknown>;
  sentiment?: "positive" | "neutral" | "negative";
  /** Persisted sentiment provenance: manual edit vs AI classification. */
  sentimentSource?: "manual" | "ai" | "unset";
  labels?: string[];
  /** Shared read state (grill decision: shared, not personal). */
  read?: boolean;
  /** Resolution is separate from delivery (grill decision). */
  resolved?: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  intent?: "support" | "sales" | "feedback" | "spam" | "other";
  topics?: string[];
  replied?: boolean;
  replyId?: string;
  /** Set when the auto-responder sends the reply, so the UI can badge it. */
  autoRepliedByCampaignId?: string;
  analyzed?: boolean;
  /** Origin of the record: manual UI, provider automation, internal automation. */
  origin?: "manual" | "provider-automation" | "internal-automation";
}

export interface ConversationDoc {
  /** Platform-side conversation id (DM thread). Used for dedup. */
  externalId?: string;
  /** Workspace-scoped stable identity: `${accountKey}:${platform}:${externalId}`. */
  identityKey?: string;
  platform: PlatformId;
  accountKey?: string;
  participants: string[];
  /** Scoped provider participant ids (valid DM recipients). */
  participantExternalIds?: string[];
  lastMessageAt: Date;
  /** Last inbound (direction === "in") provider timestamp — DM-window source. */
  lastInboundAt?: Date;
  unreadCount: number;
  /** Shared read state (grill decision). */
  read?: boolean;
  resolved?: boolean;
  createdAt?: Date;
}

export interface MessageDoc {
  externalId?: string;
  fromHandle: string;
  authorName?: string;
  body: string;
  sentAt: Date;
  observedAt?: Date;
  direction: "in" | "out";
  inReplyToId?: string;
  metadata?: Record<string, unknown>;
  /** Set when the auto-responder sends the reply. */
  autoRepliedByCampaignId?: string;
  analyzed?: boolean;
  /** Durable delivery state for outbound messages. */
  deliveryStatus?: "pending" | "processing" | "sent" | "failed" | "delivery-unknown";
  /** Stable application idempotency key for the outbound operation. */
  idempotencyKey?: string;
  origin?: "manual" | "provider-automation" | "internal-automation";
  error?: { code: string; message: string };
}

/**
 * Durable outbound operation (spec §7).
 * Lifecycle: pending → processing → sent, plus failed / cancelled /
 * delivery-unknown (provider may have accepted but confirmation was lost).
 * A local Firestore write is NOT evidence of delivery — only a provider
 * confirmation moves an op to `sent`.
 */
export type OutboundOpKind = "public-reply" | "private-reply" | "dm-send" | "comment-delete";
export type OutboundOpStatus =
  | "pending"
  | "processing"
  | "sent"
  | "failed"
  | "cancelled"
  | "delivery-unknown";

export interface OutboundOpDoc {
  /** Stable app idempotency key: `${kind}:${accountKey}:${platform}:${targetId}:${bodyHash}`. */
  idempotencyKey: string;
  kind: OutboundOpKind;
  platform: PlatformId;
  accountKey: string;
  /** Local comment/conversation id the op acts on. */
  targetId: string;
  /** Provider comment_id / recipient_id used upstream. */
  providerTargetId?: string;
  body?: string;
  status: OutboundOpStatus;
  /** Provider confirmation (message/comment id). */
  providerMessageId?: string;
  providerRecipientId?: string;
  error?: { code: string; message: string; retryable: boolean };
  origin: "manual" | "provider-automation" | "internal-automation";
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Per-account / per-resource sync state (spec §8).
 * Scope id examples: `account:<accountKey>` or `post:<accountKey>:<externalPostId>`.
 */
export interface InboxSyncDoc {
  scope: string;
  accountKey: string;
  platform: PlatformId;
  externalPostId?: string;
  /** Freshness tier driving the adaptive interval. */
  tier?: "hot" | "warm" | "cold";
  lastSuccessAt?: Date;
  lastAttemptAt?: Date;
  nextRunAt?: Date;
  cursor?: string | null;
  lastError?: { code: string; message: string };
  consecutiveFailures?: number;
  updatedAt: Date;
}

/**
 * Provider-managed AutoDM monitor mirror (spec §12, prepared — grill decision).
 * The provider is the source of truth; this doc caches status/logs so the UI
 * can render without hammering the provider, and prevents a second local/n8n
 * comment-to-DM process for posts with an active monitor.
 */
export interface InboxAutodmDoc {
  monitorId: string;
  postUrl: string;
  externalPostId?: string;
  profileUsername: string;
  accountKey?: string;
  status: "running" | "paused" | "resuming" | "stopped" | "expired";
  replyMessagePreview?: string;
  triggerKeywords?: string[];
  stats?: { totalComments: number; newComments: number; successfulReplies: number; failedReplies: number };
  enabledBy?: string;
  lastCheckedAt?: Date;
  expiresAt?: Date;
  updatedAt: Date;
}

export interface DestinationDoc {
  platform: PlatformId | "custom";
  type: "webhook" | "zapier" | "custom";
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  lastDeliveryAt?: Date;
  consecutiveFailures?: number;
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

  // --- Carousel Studio quota counters (M1+) ---
  // Mirrors imageGen/videoGen below. Enforced by `src/lib/billing/quota.ts`.
  /** Total successful carousel generations, never reset. */
  carouselGenUsedLifetime?: number;
  /** Successful generations in the current `carouselGenMonth` bucket. */
  carouselGenUsedThisMonth?: number;
  /** USD spent on carousel generations in the current month bucket. */
  carouselGenCostThisMonthUsd?: number;
  /** YYYY-MM bucket the carousel monthly counters are scoped to. */
  carouselGenMonth?: string;
  /** Server timestamp of the most recent successful carousel generation. */
  carouselGenLastUsedAt?: Date;
  /** Provider that served the most recent carousel generation. */
  carouselGenLastProvider?: string;

  // --- Video Studio quota counters (M1+) ---
  // video-gen/usage.ts has been writing these fields for some time, but
  // they were never declared on the schema — typed here so WorkspaceDoc
  // is the single source of truth. Quota ENFORCEMENT on video is a
  // fast-follow; today only the counters are kept accurate.
  videoGenUsedLifetime?: number;
  videoGenSecondsThisMonth?: number;
  videoGenCostThisMonthUsd?: number;
  videoGenMonth?: string;
  videoGenLastUsedAt?: Date;
  videoGenLastProvider?: string;
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
