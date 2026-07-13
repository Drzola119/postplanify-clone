import "server-only";

/**
 * Firestore document shapes — the single source of truth that
 * src/lib/db/* modules and firestore.rules both follow.
 *
 * Dates are stored as Timestamp; here we type them as Date for convenience
 * at the boundary, and convert via Timestamp.fromDate / Timestamp.now in the
 * per-collection modules.
 */

export type PostStatus = "draft" | "queued" | "scheduled" | "publishing" | "published" | "failed" | "archived";
export type PlatformId = "bluesky" | "instagram" | "tiktok" | "youtube" | "pinterest" | "twitter" | "linkedin" | "threads" | "facebook";

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
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
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

export interface CommentDoc {
  platform: PlatformId;
  postId?: string;
  authorHandle: string;
  body: string;
  sentAt: Date;
  sentiment?: "positive" | "neutral" | "negative";
  replied?: boolean;
  replyId?: string;
}

export interface ConversationDoc {
  platform: PlatformId;
  participants: string[];
  lastMessageAt: Date;
  unreadCount: number;
}

export interface MessageDoc {
  fromHandle: string;
  body: string;
  sentAt: Date;
  direction: "in" | "out";
}

export interface DestinationDoc {
  platform: PlatformId | "custom";
  type: "webhook" | "zapier" | "custom";
  url: string;
  secret?: string;
  active: boolean;
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
}

export interface LinkInBioDoc {
  uid: string;
  username: string;
  bio: string;
  blocks: Array<{ type: string; data: Record<string, unknown> }>;
  theme: string;
  socials: Record<string, string>;
  updatedAt: Date;
  createdAt: Date;
}