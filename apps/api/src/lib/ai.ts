import type { InsightsInput, InsightsOutput } from "@vex/shared";
import { insightsInputSchema, insightsOutputSchema } from "@vex/shared";
import { prisma } from "./tenant.js";

const inferenceWindow = new Map<string, { day: string; count: number }>();

function canInfer(tenantId: string): boolean {
  const day = new Date().toISOString().slice(0, 10);
  const row = inferenceWindow.get(tenantId);
  if (!row || row.day !== day) {
    inferenceWindow.set(tenantId, { day, count: 1 });
    return true;
  }
  if (row.count >= 20) return false;
  row.count += 1;
  inferenceWindow.set(tenantId, row);
  return true;
}

function vinSafe(v: unknown): unknown {
  if (typeof v !== "string") return v;
  if (v.length < 6) return "***";
  return `${v.slice(0, 3)}********${v.slice(-3)}`;
}

export class DealerInsightsService {
  async infer(inputRaw: InsightsInput): Promise<InsightsOutput> {
    const input = insightsInputSchema.parse(inputRaw);
    if (!canInfer(input.tenantId)) {
      const fallback = insightsOutputSchema.parse({
        model: input.model,
        score: 50,
        explanation: { reason: "daily_inference_limit_reached" },
        source: "rule_based",
      });
      return fallback;
    }

    const row = await prisma.usageLog.aggregate({
      where: { tenantId: input.tenantId, createdAt: { gte: new Date(Date.now() - 30 * 86400_000) } },
      _sum: { quantity: true },
    });
    const usage = Number(row._sum.quantity ?? 0);

    let output: InsightsOutput;
    if (input.model === "PredictiveValuationTrend") {
      output = insightsOutputSchema.parse({
        model: input.model,
        trend: Math.max(-20, Math.min(20, usage / 25 - 5)),
        score: Math.max(20, Math.min(95, 60 + usage / 20)),
        explanation: { methodology: "linear_regression_like_heuristic", usage },
        source: "rule_based",
      });
    } else if (input.model === "LeadScore") {
      const leads = await prisma.lead.count();
      output = insightsOutputSchema.parse({
        model: input.model,
        score: Math.max(10, Math.min(99, 40 + leads * 3)),
        explanation: { leads, anonymizedVin: vinSafe((input.payload as { vin?: string }).vin) },
        source: "rule_based",
      });
    } else {
      output = insightsOutputSchema.parse({
        model: input.model,
        score: Math.max(5, Math.min(95, 70 - usage / 30)),
        explanation: { churnRiskBand: usage < 10 ? "high" : usage < 50 ? "medium" : "low", usage },
        source: "rule_based",
      });
    }

    await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        action: "AI_INFERENCE",
        entity: "Insights",
        payload: {
          model: input.model,
          input: {
            tenantId: input.tenantId,
            model: input.model,
            payload: { vin: vinSafe((input.payload as { vin?: string }).vin) },
          },
          output: {
            ...output,
            generatedAt: output.generatedAt.toISOString(),
          },
        } as object,
      },
    });

    return output;
  }
}
