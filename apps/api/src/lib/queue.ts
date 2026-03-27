import { Redis } from "ioredis";
import { Queue, Worker, type Job } from "bullmq";
import { runWithTenant } from "./tenant.js";
import { prisma } from "./tenant.js";
import { provisionTenantDemo } from "./provision.js";
import { sendLifecycleNotification } from "./notify.js";
import { PilotAnalyticsService } from "./iteration.js";

const QUEUE_NAME = "vex-main";
const pilotAnalyticsService = new PilotAnalyticsService();

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

export async function enqueueDmsSync(data: { tenantId: string; vendor: string; mode?: "full" | "delta" }): Promise<void> {
  const q = getQueue();
  if (!q) return;
  await q.add("dms-sync", data, { jobId: `dms:${data.tenantId}:${data.vendor}:${data.mode ?? "delta"}` });
}

export async function enqueueRetentionScore(data: { tenantId: string }): Promise<void> {
  const q = getQueue();
  if (!q) return;
  await q.add("retention-score", data, { jobId: `retention:${data.tenantId}` });
}

export async function enqueuePilotSuccessNudge(data: {
  tenantId: string;
  userId: string;
  email?: string;
  phone?: string;
  step: "welcome" | "first_appraisal_24h" | "nps_7d";
}): Promise<void> {
  const q = getQueue();
  if (!q) return;
  await q.add(
    "pilot-success-nudge",
    data,
    { jobId: `pilot-nudge:${data.tenantId}:${data.userId}:${data.step}` }
  );
}

export async function enqueueIterationAnalysis(data: { tenantId: string }): Promise<void> {
  const q = getQueue();
  if (!q) return;
  await q.add("iteration-analysis", data, { jobId: `iteration:${data.tenantId}` });
}

export async function enqueueMarketingCampaignRun(data: { tenantId: string; campaignId: string }): Promise<void> {
  const q = getQueue();
  if (!q) return;
  await q.add("marketing-campaign-run", data, { jobId: `marketing:${data.tenantId}:${data.campaignId}` });
}

export async function enqueuePartnerPayout(data: {
  tenantId: string;
  idempotencyKey: string;
  payoutUsd: number;
}): Promise<void> {
  const q = getQueue();
  if (!q) return;
  await q.add("partner-payout-run", data, { jobId: `partner-payout:${data.tenantId}:${data.idempotencyKey}` });
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
    if (name === "dms-sync") {
      await prisma.eventLog.create({
        data: {
          tenantId,
          type: "job.dms_sync",
          payload: { vendor: String(data.vendor ?? ""), mode: String(data.mode ?? "delta") },
        },
      });
      return;
    }
    if (name === "retention-score") {
      await prisma.eventLog.create({
        data: {
          tenantId,
          type: "job.retention_score",
          payload: { status: "queued" },
        },
      });
      return;
    }
    if (name === "pilot-success-nudge") {
      const step = String(data.step ?? "welcome");
      await prisma.eventLog.create({
        data: {
          tenantId,
          type: "job.pilot_success_nudge",
          payload: { userId: String(data.userId ?? ""), step },
        },
      });
      const toEmail = typeof data.email === "string" ? data.email : null;
      const smsTo = typeof data.phone === "string" ? data.phone : null;
      const msgByStep: Record<string, { subject: string; message: string }> = {
        welcome: {
          subject: "Welcome to Vex pilot",
          message: "Welcome aboard. Your pilot tenant is ready; run your first appraisal to unlock the dashboard.",
        },
        first_appraisal_24h: {
          subject: "Run your first appraisal",
          message: "Quick nudge: teams that run one appraisal in day one convert at much higher rates.",
        },
        nps_7d: {
          subject: "How is your first week?",
          message: "Share feedback and NPS so we can tailor workflows for your dealership.",
        },
      };
      const copy = msgByStep[step] ?? msgByStep.welcome;
      await sendLifecycleNotification({
        type: "ONBOARDING_COMPLETE",
        toEmail,
        smsTo,
        subject: copy.subject,
        message: copy.message,
      });
      return;
    }
    if (name === "iteration-analysis") {
      const metric = await pilotAnalyticsService.buildCohortMetric(tenantId);
      await pilotAnalyticsService.upsertBacklogFromMetric(metric);
      await prisma.eventLog.create({
        data: {
          tenantId,
          type: "job.iteration_analysis",
          payload: metric,
        },
      });
      return;
    }
    if (name === "marketing-campaign-run") {
      await prisma.usageLog.create({
        data: {
          tenantId,
          kind: "marketing_send",
          quantity: 100,
          amountUsd: 0,
          meta: { campaignId: String(data.campaignId ?? "") },
        },
      });
      await prisma.eventLog.create({
        data: {
          tenantId,
          type: "job.marketing_campaign_run",
          payload: { campaignId: String(data.campaignId ?? "") },
        },
      });
      return;
    }
    if (name === "partner-payout-run") {
      await prisma.usageLog.create({
        data: {
          tenantId,
          kind: "partner_payout",
          quantity: 1,
          amountUsd: Number(data.payoutUsd ?? 0),
          meta: { idempotencyKey: String(data.idempotencyKey ?? "") },
        },
      });
      await prisma.eventLog.create({
        data: {
          tenantId,
          type: "job.partner_payout_run",
          payload: {
            idempotencyKey: String(data.idempotencyKey ?? ""),
            payoutUsd: Number(data.payoutUsd ?? 0),
          },
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
