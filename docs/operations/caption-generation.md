# Caption Generation Pipeline — Operational Runbook

## Overview
PostPlanify's asynchronous AI caption generation pipeline decouples bulk scheduling from Grok/Groq AI execution. Posts with `captionGenerationMode: "automatic"` are saved immediately to Firestore, and background `captionJobs` are scheduled according to publish deadlines, queue depth, and strict tenant rate limits.

---

## 1. Architecture & Execution Model

```
User Bulk Schedules 100 Posts (captionGenerationMode: "automatic")
   │
   ├─► Immediate: Firestore batch sets 100 posts with captionJobStatus: "pending"
   ├─► Non-blocking: 100 captionJobs created in /captionJobs collection
   │
   ▼
Caption Worker Loop (every 5s tick via instrumentation.ts / cron)
   ├─► 1. Reap stuck claims (claimedAt > 5m ago)
   ├─► 2. Reconcile orphan posts (collectionGroup query)
   ├─► 3. Dynamic Lookahead Window based on queue pressure:
   │      - Low pressure (<30 pending): 30 min lookahead
   │      - Medium pressure (30-100 pending): 90 min lookahead
   │      - High pressure (>100 pending): 4 hour lookahead
   ├─► 4. Fair DRR Scheduling across tenants (Max 10 global concurrency)
   ├─► 5. Distributed Token Bucket Rate Limiter (20 RPS / 100,000 TPM across cluster)
   ├─► 6. GrokGateway Execution (xAI Grok-2 with automatic Groq Llama-3.3 fallback)
   └─► 7. Batch updates post caption and marks captionJob: "completed"
```

---

## 2. Environment Variables & Defaults

| Variable | Default | Description |
|---|---|---|
| `ENABLE_ASYNC_CAPTIONS` | `true` | Enables background caption job worker and queue processing |
| `ENABLE_DISTRIBUTED_LIMITER` | `true` | Uses Firestore transaction-backed distributed limiter on `adminStats/grokRateLimiter` |
| `CAPTION_WORKER_INTERVAL_MS` | `5000` | Worker tick polling interval (5 seconds) |
| `CAPTION_TARGET_BUFFER_MINUTES` | `30` | Target time caption must be ready before scheduled post time |
| `CAPTION_LOOKAHEAD_MINUTES` | `30` | Base lookahead window for eligible jobs |
| `CAPTION_MAX_GLOBAL_CONCURRENCY` | `10` | Global concurrency cap across all workers |
| `CAPTION_MAX_USER_CONCURRENCY` | `2` | Per-tenant concurrency cap to prevent noisy neighbors |
| `CAPTION_GLOBAL_SAFE_RPS` | `20` | Maximum token bucket rate limit per second |
| `CAPTION_GLOBAL_SAFE_TPM` | `100000` | Maximum tokens per minute cap |
| `CAPTION_STUCK_CLAIM_TIMEOUT_MS` | `300000` | Claim lease duration before worker reaps stuck jobs (5 min) |
| `XAI_API_KEY` | `""` | Primary xAI API key |
| `XAI_CAPTION_MODEL` | `grok-2-latest` | Default xAI caption generation model |
| `XAI_VISION_MODEL` | `grok-2-vision-latest` | Vision model for image/media captions |
| `GROQ_API_KEY` | `""` | Fallback Groq API key |
| `GROQ_FALLBACK_MODEL` | `llama-3.3-70b-versatile` | Fallback model for 429/503 xAI outages |

---

## 3. Observability & Health Monitoring

### Health Endpoint
`GET /api/queue/caption-health`
- **Authentication**: Admin or Internal Cron header (`x-cron-key`)
- **Metrics returned**:
  - `queueDepth`: Total pending/processing jobs
  - `oldestPendingJobAgeMs`: Age in milliseconds of oldest waiting job
  - `postsWithin30mBufferWithoutCaption`: Emergency buffer deficit count
  - `postsWithin10mBufferWithoutCaption`: Critical buffer deficit count
  - `activeConcurrency`: Current active leases
  - `isDistributed`: Status of distributed limiter
  - `isThrottled`: True if cluster is under adaptive 429 backpressure

### Admin Listing Endpoint
`GET /api/admin/caption-jobs?status=pending&limit=50`
- Lists real-time caption jobs sorted by `priorityScore` and `scheduledAt`.

---

## 4. Emergency & Fallback Behaviors

1. **Primary Provider (xAI) Outage or 429**:
   - `GrokGateway` catches 429/503 and dynamically triggers exponential backoff on `GlobalGrokRateLimiter` across the cluster.
   - Automatically falls back to Groq (`llama-3.3-70b-versatile`).
2. **Scheduled Post Publish Threshold (`captionFallback: "hold" | "emergency"`):
   - If a post reaches its publish time and its caption generation is still pending or failed:
     - `hold` (default): Holds the post in queue for 1 tick to allow generation retry.
     - `emergency`: Generates an immediate fallback summary from post metadata or publishes with existing manual draft caption.
3. **Orphan Posts (Missing `captionJobs`)**:
   - The reconciliation worker running every tick scans for automatic posts missing `/captionJobs` documents and recreates them idempotently.
