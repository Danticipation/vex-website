import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { validateBody } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { createPortalSessionSchema } from "@vex/shared";
import { getStripeClient } from "../lib/stripe.js";

export const pricingRouter: Router = Router();
const prisma = new PrismaClient();

const PLANS = [
  { tier: "STARTER", name: "Starter", monthly: 49, yearly: 470, features: ["1 user", "Basic CRM", "Inventory core"] },
  { tier: "PRO", name: "Pro", monthly: 149, yearly: 1430, features: ["5 users", "Portal + analytics", "Priority support"] },
  { tier: "ENTERPRISE", name: "Enterprise", monthly: 299, yearly: 2870, features: ["Unlimited users", "Custom integrations", "Dedicated support"] },
] as const;

pricingRouter.get("/plans", async (_req, res) => {
  return res.json({ data: { plans: PLANS }, error: null });
});

pricingRouter.get("/current", requireAuth, async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ code: "UNAUTHORIZED", message: "Login required" });
  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: {
      id: true,
      name: true,
      billingTier: true,
      stripeSubscriptionStatus: true,
      customDomain: true,
      themeJson: true,
      onboardedAt: true,
    },
  });
  if (!tenant) return res.status(404).json({ code: "NOT_FOUND", message: "Tenant not found" });
  return res.json({ data: tenant, error: null });
});

pricingRouter.post("/portal/session", requireAuth, validateBody(createPortalSessionSchema), async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ code: "UNAUTHORIZED", message: "Login required" });

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: { stripeCustomerId: true },
  });
  if (!tenant?.stripeCustomerId) {
    return res.status(400).json({
      code: "MISSING_STRIPE_CUSTOMER",
      message: "No Stripe customer linked to this tenant yet.",
    });
  }

  const body = req.body as { returnUrl?: string };
  const stripe = getStripeClient();
  const returnUrl = body.returnUrl || `${process.env.PUBLIC_WEB_URL || "http://localhost:3000"}/portal/subscriptions`;

  const session = await stripe.billingPortal.sessions.create({
    customer: tenant.stripeCustomerId,
    return_url: returnUrl,
  });

  return res.status(201).json({ data: { url: session.url }, error: null });
});

