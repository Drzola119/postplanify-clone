import "server-only";
import { CAPTION_CONFIG } from "@/lib/config/caption-config";

export interface RateLimiterStatus {
  activeGlobalConcurrency: number;
  maxGlobalConcurrency: number;
  availableRequestTokens: number;
  availableTpmTokens: number;
  isThrottled: boolean;
  throttleCooldownRemainingMs: number;
  activeUsersCount: number;
  isDistributed: boolean;
}

export interface RateLimitLease {
  acquired: boolean;
  retryAfterMs?: number;
  reason?: string;
  release: (metrics?: { actualTokens?: number; success?: boolean; statusCode?: number }) => void;
}

class GlobalGrokRateLimiter {
  private activeConcurrency = 0;
  private activeUsers = new Map<string, number>();

  // Request Rate Limiting (Token Bucket)
  private requestTokens: number;
  private lastRequestRefillTime: number;

  // Token Rate Limiting (TPM Token Bucket)
  private tpmTokens: number;
  private lastTpmRefillTime: number;

  // 429 Adaptive Throttling
  private throttleUntil = 0;
  private throttleBackoffMultiplier = 1;

  constructor() {
    this.requestTokens = CAPTION_CONFIG.SAFE_RPS;
    this.lastRequestRefillTime = Date.now();

    this.tpmTokens = CAPTION_CONFIG.SAFE_TPM;
    this.lastTpmRefillTime = Date.now();
  }

  private refillTokens(): void {
    const now = Date.now();

    // Refill request tokens (RPS)
    const elapsedRequestSec = (now - this.lastRequestRefillTime) / 1000;
    if (elapsedRequestSec > 0) {
      const addedRequestTokens = elapsedRequestSec * CAPTION_CONFIG.SAFE_RPS;
      this.requestTokens = Math.min(CAPTION_CONFIG.SAFE_RPS * 2, this.requestTokens + addedRequestTokens);
      this.lastRequestRefillTime = now;
    }

    // Refill TPM tokens
    const elapsedTpmSec = (now - this.lastTpmRefillTime) / 1000;
    if (elapsedTpmSec > 0) {
      const addedTpmTokens = elapsedTpmSec * (CAPTION_CONFIG.SAFE_TPM / 60);
      this.tpmTokens = Math.min(CAPTION_CONFIG.SAFE_TPM, this.tpmTokens + addedTpmTokens);
      this.lastTpmRefillTime = now;
    }
  }

  /**
   * Attempts to acquire a rate limit and concurrency lease for an outbound Grok call.
   */
  public tryAcquire(userId: string, estimatedTokens = CAPTION_CONFIG.ESTIMATED_TOKENS_PER_REQUEST): RateLimitLease {
    const now = Date.now();

    // 1. Check adaptive 429 throttle
    if (now < this.throttleUntil) {
      const retryAfterMs = this.throttleUntil - now;
      return {
        acquired: false,
        retryAfterMs,
        reason: "Adaptive backpressure active due to recent 429 rate limit",
        release: () => {},
      };
    }

    // 2. Check global concurrency
    if (this.activeConcurrency >= CAPTION_CONFIG.MAX_GLOBAL_CONCURRENCY) {
      return {
        acquired: false,
        retryAfterMs: 500,
        reason: `Global concurrency limit reached (${this.activeConcurrency}/${CAPTION_CONFIG.MAX_GLOBAL_CONCURRENCY})`,
        release: () => {},
      };
    }

    // 3. Check per-user concurrency
    const userActive = this.activeUsers.get(userId) ?? 0;
    if (userActive >= CAPTION_CONFIG.MAX_PER_USER_CONCURRENCY) {
      return {
        acquired: false,
        retryAfterMs: 1_000,
        reason: `Per-user concurrency ceiling reached (${userActive}/${CAPTION_CONFIG.MAX_PER_USER_CONCURRENCY})`,
        release: () => {},
      };
    }

    // 4. Refill and check token buckets
    this.refillTokens();

    if (this.requestTokens < 1) {
      const waitMs = Math.ceil(((1 - this.requestTokens) / CAPTION_CONFIG.SAFE_RPS) * 1000);
      return {
        acquired: false,
        retryAfterMs: Math.max(100, waitMs),
        reason: "Global RPS limit budget exhausted",
        release: () => {},
      };
    }

    if (this.tpmTokens < estimatedTokens) {
      const waitMs = Math.ceil(((estimatedTokens - this.tpmTokens) / (CAPTION_CONFIG.SAFE_TPM / 60)) * 1000);
      return {
        acquired: false,
        retryAfterMs: Math.max(200, waitMs),
        reason: `Global TPM budget exhausted (needed ${estimatedTokens}, available ${Math.floor(this.tpmTokens)})`,
        release: () => {},
      };
    }

    // Deduct tokens and increment concurrency
    this.requestTokens -= 1;
    this.tpmTokens -= estimatedTokens;
    this.activeConcurrency += 1;
    this.activeUsers.set(userId, userActive + 1);

    let released = false;

    const release = (metrics?: { actualTokens?: number; success?: boolean; statusCode?: number }) => {
      if (released) return;
      released = true;

      // Decrement concurrency
      this.activeConcurrency = Math.max(0, this.activeConcurrency - 1);
      const curUser = this.activeUsers.get(userId) ?? 1;
      if (curUser <= 1) {
        this.activeUsers.delete(userId);
      } else {
        this.activeUsers.set(userId, curUser - 1);
      }

      // Reconcile actual tokens
      if (metrics?.actualTokens !== undefined) {
        const delta = metrics.actualTokens - estimatedTokens;
        if (delta > 0) {
          // Used more than estimated -> deduct difference
          this.tpmTokens = Math.max(0, this.tpmTokens - delta);
        } else if (delta < 0) {
          // Used less than estimated -> credit back difference
          this.tpmTokens = Math.min(CAPTION_CONFIG.SAFE_TPM, this.tpmTokens + Math.abs(delta));
        }
      }

      // Handle 429 adaptive throttling
      if (metrics?.statusCode === 429) {
        this.throttleBackoffMultiplier = Math.min(8, this.throttleBackoffMultiplier * 2);
        const cooldownMs = Math.min(60_000, 5_000 * this.throttleBackoffMultiplier);
        this.throttleUntil = Date.now() + cooldownMs;
        console.warn(`[GrokRateLimiter] 429 encountered. Throttling global throughput for ${cooldownMs}ms (mult: ${this.throttleBackoffMultiplier})`);
      } else if (metrics?.success) {
        // Gradually recover backoff multiplier on success
        this.throttleBackoffMultiplier = Math.max(1, this.throttleBackoffMultiplier * 0.9);
      }
    };

    return {
      acquired: true,
      release,
    };
  }

  /**
   * Helper that waits until a lease can be acquired (with timeout).
   */
  public async waitForLease(
    userId: string,
    estimatedTokens = CAPTION_CONFIG.ESTIMATED_TOKENS_PER_REQUEST,
    maxWaitMs = 15_000
  ): Promise<RateLimitLease> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const lease = this.tryAcquire(userId, estimatedTokens);
      if (lease.acquired) return lease;

      const waitTime = Math.min(1_000, lease.retryAfterMs ?? 500);
      if (Date.now() - startTime + waitTime > maxWaitMs) break;

      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    return {
      acquired: false,
      reason: `Timed out waiting for Grok rate limiter lease after ${maxWaitMs}ms`,
      release: () => {},
    };
  }

  public getStatus(): RateLimiterStatus {
    this.refillTokens();
    const now = Date.now();
    return {
      activeGlobalConcurrency: this.activeConcurrency,
      maxGlobalConcurrency: CAPTION_CONFIG.MAX_GLOBAL_CONCURRENCY,
      availableRequestTokens: Math.floor(this.requestTokens),
      availableTpmTokens: Math.floor(this.tpmTokens),
      isThrottled: now < this.throttleUntil,
      throttleCooldownRemainingMs: Math.max(0, this.throttleUntil - now),
      activeUsersCount: this.activeUsers.size,
      isDistributed: process.env.ENABLE_DISTRIBUTED_LIMITER === "true",
    };
  }

  /** Reset internal state for testing */
  public _reset(): void {
    this.activeConcurrency = 0;
    this.activeUsers.clear();
    this.requestTokens = CAPTION_CONFIG.SAFE_RPS;
    this.lastRequestRefillTime = Date.now();
    this.tpmTokens = CAPTION_CONFIG.SAFE_TPM;
    this.lastTpmRefillTime = Date.now();
    this.throttleUntil = 0;
    this.throttleBackoffMultiplier = 1;
  }
}

// Global singleton instance across server lifetime
export const globalGrokRateLimiter = new GlobalGrokRateLimiter();
