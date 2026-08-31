import "server-only";
import { adminDb, FieldValue } from "@/lib/db";
import { CAPTION_CONFIG } from "@/lib/config/caption-config";
import { globalGrokRateLimiter, type RateLimitLease } from "@/lib/ai/rate-limiter";
import { createLogger } from "@/lib/log";

const log = createLogger("rate-limiter-distributed");

export interface DistributedLimiterDoc {
  requestTokens: number;
  tpmTokens: number;
  lastRefillMs: number;
  activeConcurrency: number;
  throttleUntil: number;
  throttleMult: number;
  updatedAt?: unknown;
}

const STATS_DOC_PATH = "adminStats/grokRateLimiter";

/**
 * Distributed Firestore-backed rate limiter for Grok API across multi-instance serverless deployments.
 * Operates via Firestore atomic transactions on `adminStats/grokRateLimiter`.
 * If `ENABLE_DISTRIBUTED_LIMITER` is false or Firestore is unavailable, falls back gracefully to in-memory limiter.
 */
export async function tryAcquireDistributedLease(
  userId: string,
  estimatedTokens = CAPTION_CONFIG.ESTIMATED_TOKENS_PER_REQUEST
): Promise<RateLimitLease> {
  const isDistributedEnabled = process.env.ENABLE_DISTRIBUTED_LIMITER === "true";

  if (!isDistributedEnabled || !adminDb) {
    return globalGrokRateLimiter.tryAcquire(userId, estimatedTokens);
  }

  const docRef = adminDb.doc(STATS_DOC_PATH);
  const now = Date.now();

  try {
    const result = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      let data: DistributedLimiterDoc;

      if (!snap.exists) {
        data = {
          requestTokens: CAPTION_CONFIG.SAFE_RPS,
          tpmTokens: CAPTION_CONFIG.SAFE_TPM,
          lastRefillMs: now,
          activeConcurrency: 0,
          throttleUntil: 0,
          throttleMult: 1,
        };
      } else {
        const raw = snap.data() as Partial<DistributedLimiterDoc>;
        data = {
          requestTokens: typeof raw.requestTokens === "number" ? raw.requestTokens : CAPTION_CONFIG.SAFE_RPS,
          tpmTokens: typeof raw.tpmTokens === "number" ? raw.tpmTokens : CAPTION_CONFIG.SAFE_TPM,
          lastRefillMs: typeof raw.lastRefillMs === "number" ? raw.lastRefillMs : now,
          activeConcurrency: typeof raw.activeConcurrency === "number" ? raw.activeConcurrency : 0,
          throttleUntil: typeof raw.throttleUntil === "number" ? raw.throttleUntil : 0,
          throttleMult: typeof raw.throttleMult === "number" ? raw.throttleMult : 1,
        };
      }

      // 1. Check adaptive throttle
      if (now < data.throttleUntil) {
        return {
          acquired: false,
          retryAfterMs: data.throttleUntil - now,
          reason: "Adaptive backpressure active across cluster due to 429 status code",
        };
      }

      // 2. Check global concurrency
      if (data.activeConcurrency >= CAPTION_CONFIG.MAX_GLOBAL_CONCURRENCY) {
        return {
          acquired: false,
          retryAfterMs: 500,
          reason: `Distributed concurrency limit reached (${data.activeConcurrency}/${CAPTION_CONFIG.MAX_GLOBAL_CONCURRENCY})`,
        };
      }

      // 3. Refill tokens
      const elapsedSec = Math.max(0, (now - data.lastRefillMs) / 1000);
      if (elapsedSec > 0) {
        const addedReq = elapsedSec * CAPTION_CONFIG.SAFE_RPS;
        data.requestTokens = Math.min(CAPTION_CONFIG.SAFE_RPS * 2, data.requestTokens + addedReq);

        const addedTpm = elapsedSec * (CAPTION_CONFIG.SAFE_TPM / 60);
        data.tpmTokens = Math.min(CAPTION_CONFIG.SAFE_TPM, data.tpmTokens + addedTpm);
        data.lastRefillMs = now;
      }

      // 4. Check tokens budget
      if (data.requestTokens < 1) {
        const waitMs = Math.ceil(((1 - data.requestTokens) / CAPTION_CONFIG.SAFE_RPS) * 1000);
        return {
          acquired: false,
          retryAfterMs: Math.max(100, waitMs),
          reason: "Distributed RPS limit budget exhausted",
        };
      }

      if (data.tpmTokens < estimatedTokens) {
        const waitMs = Math.ceil(((estimatedTokens - data.tpmTokens) / (CAPTION_CONFIG.SAFE_TPM / 60)) * 1000);
        return {
          acquired: false,
          retryAfterMs: Math.max(200, waitMs),
          reason: `Distributed TPM budget exhausted (needed ${estimatedTokens}, available ${Math.floor(data.tpmTokens)})`,
        };
      }

      // Deduct budget and increment concurrency
      data.requestTokens -= 1;
      data.tpmTokens -= estimatedTokens;
      data.activeConcurrency += 1;

      tx.set(
        docRef,
        {
          ...data,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { acquired: true };
    });

    if (!result.acquired) {
      return {
        acquired: false,
        retryAfterMs: result.retryAfterMs,
        reason: result.reason,
        release: () => {},
      };
    }

    let released = false;
    const release = (metrics?: { actualTokens?: number; success?: boolean; statusCode?: number }) => {
      if (released) return;
      released = true;

      // Asynchronously release distributed lease in Firestore
      adminDb?.runTransaction(async (tx) => {
        const snap = await tx.get(docRef);
        if (!snap.exists) return;
        const current = snap.data() as DistributedLimiterDoc;

        const newConcurrency = Math.max(0, (current.activeConcurrency || 1) - 1);
        let throttleUntil = current.throttleUntil || 0;
        let throttleMult = current.throttleMult || 1;

        if (metrics?.statusCode === 429) {
          throttleMult = Math.min(8, throttleMult * 2);
          const cooldownMs = Math.min(60_000, 5_000 * throttleMult);
          throttleUntil = Date.now() + cooldownMs;
          log.warn("429 rate limit recorded in distributed rate limiter", {
            cooldownMs,
            throttleMult,
          });
        } else if (metrics?.success) {
          throttleMult = Math.max(1, throttleMult * 0.9);
        }

        let newTpm = current.tpmTokens;
        if (metrics?.actualTokens !== undefined) {
          const delta = metrics.actualTokens - estimatedTokens;
          if (delta > 0) {
            newTpm = Math.max(0, newTpm - delta);
          } else if (delta < 0) {
            newTpm = Math.min(CAPTION_CONFIG.SAFE_TPM, newTpm + Math.abs(delta));
          }
        }

        tx.update(docRef, {
          activeConcurrency: newConcurrency,
          throttleUntil,
          throttleMult,
          tpmTokens: newTpm,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }).catch((err) => {
        log.warn("Failed to release distributed lease transaction", {
          error: err instanceof Error ? err.message : String(err),
        });
      });
    };

    return {
      acquired: true,
      release,
    };
  } catch (err) {
    log.warn("Distributed rate limiter transaction failed; falling back to in-memory limiter", {
      error: err instanceof Error ? err.message : String(err),
    });
    return globalGrokRateLimiter.tryAcquire(userId, estimatedTokens);
  }
}
