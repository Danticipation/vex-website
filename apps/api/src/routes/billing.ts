import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validateBody } from "../middleware/validate.js";
import { prisma } from "../lib/tenant.js";
import { valuationConfig } from "../config/valuation.js";

const usageEventSchema = z.object({
  kind: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  amountUsd: z.number().nonnegative().optional(),
  meta: z.record(z.any()).optional(),
});

export const billingRouter: Router = Router();

billingRouter.get("/usage", requireAuth, requireRole("ADMIN", "GROUP_ADMIN"), async (req, res) => {
  const tenantId = req.tenantId;
  if (!tenantId) return res.status(401).json({ code: "UNAUTHORIZED", message: "Tenant context missing" });

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(dayStart.getFullYear(), dayStart.getMonth(), 1);

  const [todayValuation, monthUsage, overageUsd] = await Promise.all([
    prisma.usageLog.aggregate({
      where: {
        tenantId,
        kind: "APPRAISAL_CALL",
        createdAt: { gte: dayStart },
      },
      _sum: { amountUsd: true, quantity: true },
    }),
    prisma.usageLog.aggregate({
      where: { tenantId, createdAt: { gte: monthStart } },
      _sum: { amountUsd: true, quantity: true },
    }),
    prisma.usageLog.aggregate({
      where: { tenantId, kind: "valuation_overage", createdAt: { gte: dayStart } },
      _sum: { amountUsd: true },
    }),
  ]);

  const todayValuationUsd = Number(todayValuation._sum.amountUsd ?? 0);
  const dailyCap = valuationConfig.costCaps.dailyUsdCap;
  const dailyRemainingUsd = Math.max(0, dailyCap - todayValuationUsd);

  return res.json({
    data: {
      tenantId,
      valuation: {
        dailyCapUsd: dailyCap,
        spentTodayUsd: todayValuationUsd,
        remainingTodayUsd: dailyRemainingUsd,
        callsToday: Number(todayValuation._sum.quantity ?? 0),
      },
      usageMonth: {
        quantity: Number(monthUsage._sum.quantity ?? 0),
        amountUsd: Number(monthUsage._sum.amountUsd ?? 0),
      },
      overage: {
        amountUsdToday: Number(overageUsd._sum.amountUsd ?? 0),
      },
    },
    error: null,
  });
});

billingRouter.post(
  "/usage",
  requireAuth,
  requireRole("ADMIN", "GROUP_ADMIN"),
  validateBody(usageEventSchema),
  async (req, res) => {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ code: "UNAUTHORIZED", message: "Tenant context missing" });
    const body = req.body as z.infer<typeof usageEventSchema>;

    const created = await prisma.usageLog.create({
      data: {
        tenantId,
        kind: body.kind,
        quantity: body.quantity,
        amountUsd: body.amountUsd,
        meta: body.meta,
      },
    });

    return res.status(201).json({ data: created, error: null });
  }
);

