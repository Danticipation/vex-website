import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateBody } from "../../middleware/validate.js";
import { enqueueCdkInventorySync, enqueueCdkValuationPush } from "../../lib/queue.js";
import { prisma } from "../../lib/tenant.js";
import { subscribeToNeuronEvent } from "../../lib/cdk.js";

export const cdkDriveRouter: Router = Router();

const inventorySyncSchema = z.object({
  externalId: z.string().min(1).optional(),
  vin: z.string().min(3).optional(),
  payload: z.record(z.unknown()),
});

const valuationPushSchema = z.object({
  externalId: z.string().min(1),
  payload: z.record(z.unknown()),
});

const neuronSubscribeSchema = z.object({
  eventType: z.string().min(1),
  callbackUrl: z.string().url(),
});

cdkDriveRouter.post(
  "/inventory-sync",
  requireAuth,
  requireRole("STAFF", "ADMIN", "GROUP_ADMIN"),
  validateBody(inventorySyncSchema),
  async (req, res) => {
    if (!req.tenantId) return res.status(401).json({ code: "UNAUTHORIZED", message: "Tenant context missing" });
    const body = req.body as z.infer<typeof inventorySyncSchema>;
    const externalId = body.externalId ?? body.vin ?? `cdk-inventory-${Date.now()}`;
    await prisma.integrationLog.create({
      data: {
        tenantId: req.tenantId,
        vendor: "CDK",
        eventType: "cdk.drive.inventory.sync.requested",
        externalId,
        status: "PENDING",
        payload: body.payload as object,
      },
    });
    await enqueueCdkInventorySync({
      tenantId: req.tenantId,
      externalId,
      vin: body.vin,
      payload: body.payload,
    });
    return res.status(202).json({ data: { queued: true, externalId }, error: null });
  }
);

cdkDriveRouter.post(
  "/valuation-push",
  requireAuth,
  requireRole("STAFF", "ADMIN", "GROUP_ADMIN"),
  validateBody(valuationPushSchema),
  async (req, res) => {
    if (!req.tenantId) return res.status(401).json({ code: "UNAUTHORIZED", message: "Tenant context missing" });
    const body = req.body as z.infer<typeof valuationPushSchema>;
    await prisma.integrationLog.create({
      data: {
        tenantId: req.tenantId,
        vendor: "CDK",
        eventType: "cdk.drive.valuation.push.requested",
        externalId: body.externalId,
        status: "PENDING",
        payload: body.payload as object,
      },
    });
    await enqueueCdkValuationPush({
      tenantId: req.tenantId,
      externalId: body.externalId,
      payload: body.payload,
    });
    return res.status(202).json({ data: { queued: true, externalId: body.externalId }, error: null });
  }
);

cdkDriveRouter.post(
  "/neuron-subscriptions",
  requireAuth,
  requireRole("ADMIN", "GROUP_ADMIN"),
  validateBody(neuronSubscribeSchema),
  async (req, res) => {
    const body = req.body as z.infer<typeof neuronSubscribeSchema>;
    const result = await subscribeToNeuronEvent(body.eventType, body.callbackUrl);
    return res.status(201).json({ data: result, error: null });
  }
);
