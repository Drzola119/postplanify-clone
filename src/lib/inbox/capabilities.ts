import "server-only";
import { PLATFORMS, type PlatformId } from "@/lib/platforms";

/**
 * Operation-level Inbox capability model.
 *
 * Effective support is computed from four layers (spec §4):
 *   1. provider-documented support (see docs/inbox/capability-matrix.md)
 *   2. connected-account permissions/capabilities (capabilities[], reauth_required, FB page linkage)
 *   3. workspace role (viewer < editor < admin)
 *   4. resource-specific eligibility (7-day private-reply window, 24h DM window, own-post)
 *
 * Statuses are deliberately distinct: "unsupported" (provider can't) vs
 * "disconnected" (no account) vs "permission-required" (reconnect/scope needed)
 * vs "unavailable" (transient) vs "unverified" (docs ambiguous, no live check).
 */

export type InboxOperation =
  | "read-comments"
  | "create-comment"
  | "reply-public"
  | "reply-private"
  | "delete-own-comment"
  | "moderate-comment"
  | "read-conversations"
  | "send-dm"
  | "manage-autodm";

export type SupportStatus =
  | "supported"
  | "unsupported"
  | "disconnected"
  | "permission-required"
  | "temporarily-unavailable"
  | "not-yet-verified";

export interface OperationSupport {
  operation: InboxOperation;
  status: SupportStatus;
  reason: string;
}

/** Provider-documented operation support. V1 scope: Instagram-only (grill decision). */
const PROVIDER_SUPPORT: Record<string, Partial<Record<InboxOperation, true>>> = {
  instagram: {
    "read-comments": true,
    "reply-public": true,
    "reply-private": true,
    "delete-own-comment": true,
    "read-conversations": true,
    "send-dm": true,
    "manage-autodm": true,
  },
  // Documented on the shared comments endpoint but OUT of V1 scope.
  // Represented so the account overview can explain honestly instead of
  // rendering dead send buttons.
  facebook: { "read-comments": true, "reply-public": true, "delete-own-comment": true },
  youtube: { "read-comments": true, "reply-public": true, "delete-own-comment": true },
  linkedin: { "read-comments": true, "reply-public": true, "delete-own-comment": true },
  tiktok: {
    "read-comments": true,
    "create-comment": true,
    "reply-public": true,
    "delete-own-comment": true,
    "moderate-comment": true,
  },
};

export interface ConnectedAccountCapability {
  platform: string;
  /** Raw Upload-Post capabilities[] for this connection (e.g. tiktok "comments"). */
  capabilities?: string[];
  /** Token expired — owner must reconnect. */
  reauthRequired?: boolean;
  /** Whether the Instagram business account has its Facebook Page linkage. */
  hasFacebookPage?: boolean;
  /** Whether the YouTube connection granted youtube.force-ssl. */
  hasYoutubeCommentScope?: boolean;
}

function providerSupports(platform: string, op: InboxOperation): boolean {
  return PROVIDER_SUPPORT[platform]?.[op] === true;
}

function isV1Platform(platform: string): boolean {
  return platform === "instagram";
}

/**
 * Effective per-operation support for one connected account.
 * Pure function — easy to unit test with fixtures.
 */
export function effectiveSupport(
  platform: string,
  account: ConnectedAccountCapability | null,
  op: InboxOperation
): OperationSupport {
  if (!isV1Platform(platform)) {
    if (!providerSupports(platform, op)) {
      return {
        operation: op,
        status: "unsupported",
        reason: `${label(platform)} does not support this operation via Upload-Post.`,
      };
    }
    return {
      operation: op,
      status: "not-yet-verified",
      reason: `${label(platform)} supports this via Upload-Post but is outside the V1 Instagram-only scope.`,
    };
  }
  if (!providerSupports(platform, op)) {
    return {
      operation: op,
      status: "unsupported",
      reason: `Instagram does not support this operation via Upload-Post.`,
    };
  }
  if (!account) {
    return { operation: op, status: "disconnected", reason: "Instagram is not connected." };
  }
  if (account.reauthRequired) {
    return {
      operation: op,
      status: "permission-required",
      reason: "Instagram token expired — reconnect the account.",
    };
  }
  if (
    (op === "reply-private" || op === "send-dm" || op === "manage-autodm" || op === "read-conversations") &&
    account.hasFacebookPage === false
  ) {
    return {
      operation: op,
      status: "permission-required",
      reason: "Instagram messaging needs a business/creator account linked to a Facebook Page.",
    };
  }
  return { operation: op, status: "supported", reason: "Supported." };
}

/** All nine operations for one account — used by the capabilities API + UI gating. */
export function supportMatrix(
  platform: string,
  account: ConnectedAccountCapability | null
): OperationSupport[] {
  const ops: InboxOperation[] = [
    "read-comments",
    "create-comment",
    "reply-public",
    "reply-private",
    "delete-own-comment",
    "moderate-comment",
    "read-conversations",
    "send-dm",
    "manage-autodm",
  ];
  return ops.map((op) => effectiveSupport(platform, account, op));
}

/** Resource-level eligibility: 7-day private-reply window (docs). */
export function privateReplyEligibility(commentSentAt: Date, now = new Date()): SupportStatus {
  const ageMs = now.getTime() - commentSentAt.getTime();
  if (Number.isNaN(ageMs)) return "temporarily-unavailable";
  return ageMs <= 7 * 24 * 60 * 60 * 1000 ? "supported" : "unsupported";
}

/**
 * DM-window eligibility from the last inbound provider timestamp.
 * Our own outbound sends MUST NOT extend the window (grill decision) —
 * callers pass the last inbound (direction === "in") timestamp only.
 * Unknown when we have no inbound timestamp.
 */
export function dmWindowEligibility(
  lastInboundAt: Date | null,
  now = new Date()
): SupportStatus {
  if (!lastInboundAt) return "not-yet-verified";
  const ageMs = now.getTime() - lastInboundAt.getTime();
  if (Number.isNaN(ageMs)) return "not-yet-verified";
  return ageMs <= 24 * 60 * 60 * 1000 ? "supported" : "unsupported";
}

function label(platform: string): string {
  return PLATFORMS.find((p) => p.id === (platform as PlatformId))?.name ?? platform;
}

/** Every canonical platform id — never a hard-coded 9-platform subset. */
export function allPlatformIds(): PlatformId[] {
  return PLATFORMS.map((p) => p.id);
}
