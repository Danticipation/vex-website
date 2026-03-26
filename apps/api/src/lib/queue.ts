import { Redis } from "ioredis";
import { Queue, Worker, type Job } from "bullmq";
import { runWithTenant } from "./tenant.js";
import { prisma } from "./tenant.js";
import { provisionTenantDemo } from "./provision.js";

const QUEUE_NAME = "vex-main";

function newConnection(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  return new Redis(url, { maxRetriesPerRequest: null });
}

let queueInstance: Queue | null = null;
let queueConn: Redis | null = null;

function getQueue(): Queue | null {
  if (!process.env.REDIS_URL) return null;
  if (!queueInstance) {
    queueConn = newConnection();
    if (!queueConn) return null;
    queueInstance = new Queue(QUEUE_NAME, {
      connection: queueConn,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: { count: 2000 },
        removeOnFail: { count: 5000 },
      },
    });
  }
  return queueInstance;
}

export async function enqueueAppraisalPdfGenerate(data: {
  tenantId: string;
  appraisalId: string;
  requestedByUserId?: string;
}): Promise<void> {
  const q = getQueue();
  if (!q) return;
  await q.add(
    "appraisal-pdf-generate",
    data,
    { jobId: `pdf:${data.tenantId}:${data.appraisalId}` }
  );
}

export async function enqueueValuationCacheWarm(data: { tenantId: string; cacheKeyHint?: string }): Promise<void> {
  const q = getQueue();
  if (!q) return;
  await q.add(
    "valuation-cache-warm",
    data,
    { jobId: `warm:${data.tenantId}:${data.cacheKeyHint ?? "all"}` }
  );
}

export async function enqueueStripeSync(data: { tenantId: string; stripeCustomerId?: string }): Promise<void> {
  const q = getQueue();
  if (!q) return;
  await q.add("stripe-sync", data, { jobId: `stripe:${data.tenantId}:${data.stripeCustomerId ?? "default"}` });
}

export async function enqueueAnalyticsRollup(data: { tenantId: string; window?: "hour" | "day" }): Promise<void> {
  const q = getQueue();
  if (!q) return;
  await q.add(
    "analytics-rollup",
    { tenantId: data.tenantId, window: data.window ?? "day" },
    { jobId: `rollup:${data.tenantId}:${data.window ?? "day"}` }
  );
}

export async function enqueueProvisionTenant(data: { tenantId: string; tier: string; email: string }): Promise<void> {
  const q = getQueue();
  if (!q) return;
  await q.add("provision-tenant", data, { jobId: `provision:${data.tenantId}` });
}

let workerInstance: Worker | null = null;

async function processJob(job: Job): Promise<void> {
  const name = job.name;
  const data = job.data as Record<string, unknown>;
  const tenantId = data.tenantId as string;
  if (!tenantId) throw new Error("missing tenantId on job");

  await runWithTenant(tenantId, async () => {
    if (name === "appraisal-pdf-generate") {
      await prisma.eventLog.create({
        data: {
          tenantId,
          type: "job.appraisal_pdf_generate",
          payload: {
            appraisalId: String(data.appraisalId ?? ""),
            requestedByUserId: data.requestedByUserId != null ? String(data.requestedByUserId) : null,
            note: "PDF generation is async; CRM may still render client-side PDF for instant UX.",
          },
        },
      });
      return;
    }
    if (name === "valuation-cache-warm") {
      await prisma.eventLog.create({
        data: {
          tenantId,
          type: "job.valuation_cache_warm",
          payload: { cacheKeyHint: data.cacheKeyHint != null ? String(data.cacheKeyHint) : null },
        },
      });
      return;
    }
    if (name === "stripe-sync") {
      await prisma.eventLog.create({
        data: {
          tenantId,
          type: "job.stripe_sync",
          payload: { stripeCustomerId: data.stripeCustomerId != null ? String(data.stripeCustomerId) : null },
        },
      });
      return;
    }
    if (name === "analytics-rollup") {
      await prisma.eventLog.create({
        data: {
          tenantId,
          type: "job.analytics_rollup",
          payload: { window: String(data.window ?? "day") },
        },
      });
      return;
    }
    if (name === "provision-tenant") {
      await provisionTenantDemo({
        tenantId,
        tier: String(data.tier ?? "STARTER"),
        email: String(data.email ?? ""),
      });
      await prisma.eventLog.create({
        data: {
          tenantId,
          type: "job.provision_tenant",
          payload: { tier: String(data.tier ?? "STARTER"), email: String(data.email ?? "") },
        },
      });
      return;
    }
    throw new Error(`unknown job name: ${name}`);
  });
}

/**
 * Starts BullMQ workers (single cluster mode). Idempotent processors write to `EventLog` for audit.
 * Per-tenant concurrency cap: 50 concurrent jobs globally (tune in ops).
 */
export function startQueueWorkers(): void {
  if (!process.env.REDIS_URL) {
    console.warn(JSON.stringify({ queues: "disabled", reason: "REDIS_URL not set" }));
    return;
  }
  if (workerInstance) return;

  const conn = newConnection();
  if (!conn) return;

  workerInstance = new Worker(
    QUEUE_NAME,
    async (job) => {
      await processJob(job);
    },
    {
      connection: conn,
      concurrency: Number(process.env.QUEUE_WORKER_CONCURRENCY ?? 50),
    }
  );

  workerInstance.on("failed", (job, err) => {
    console.error(
      JSON.stringify({
        queue: "job_failed",
        id: job?.id,
        name: job?.name,
        message: err instanceof Error ? err.message : String(err),
      })
    );
  });
}
