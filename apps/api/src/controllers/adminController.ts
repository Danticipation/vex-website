import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function monthlyAmountForTier(tier: string): number {
  if (tier === "PRO") return 149;
  if (tier === "ENTERPRISE") return 299;
  return 49;
}

export async function overview(req: Request, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ code: "UNAUTHORIZED", message: "Login required" });
  if (user.role !== "ADMIN") return res.status(403).json({ code: "FORBIDDEN", message: "Admin role required" });

  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      billingTier: true,
      stripeSubscriptionStatus: true,
      customDomain: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const active = tenants.filter((t) => t.stripeSubscriptionStatus && t.stripeSubscriptionStatus !== "CANCELED");
  const mrr = active.reduce((sum, t) => sum + monthlyAmountForTier(t.billingTier), 0);

  return res.json({
    data: {
      mrr,
      activeTenants: active.length,
      tenants: tenants.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
    },
    error: null,
  });
}
