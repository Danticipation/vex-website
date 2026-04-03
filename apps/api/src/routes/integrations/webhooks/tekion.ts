import { Router } from "express";
import { verifyTekionWebhookSignature } from "../../../lib/tekion.js";
import { enqueueTekionInventorySync } from "../../../lib/queue.js";
import { systemPrisma } from "../../../lib/tenant.js";

export const tekionWebhookRouter: Router = Router();

tekionWebhookRouter.post("/", async (req, res) => {
  const signature = req.header("x-tekion-signature") ?? req.header("x-signature");
  const raw = req.body;
  if (!Buffer.isBuffer(raw)) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "Expected raw body buffer" });
  }
  if (!verifyTekionWebhookSignature(raw, signature ?? undefined)) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid Tekion signature" });
  }

  let body: {
    tenantId?: string;
    eventId?: string;
    eventType?: string;
    payload?: Record<string, unknown>;
  };
  try {
    body = JSON.parse(raw.toString("utf8")) as {
      tenantId?: string;
      eventId?: string;
      eventType?: string;
      payload?: Record<string, unknown>;
    };
  } catch {
    return res.status(400).json({ code: "BAD_REQUEST", message: "Invalid JSON payload" });
  }

  const tenantId = body.tenantId;
  const externalId = body.eventId;
  const eventType = body.eventType ?? "unknown";
  const payload = body.payload ?? {};
  if (!tenantId || !externalId) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "Missing tenantId or eventId" });
  }

  const existing = await systemPrisma.integrationLog.findUnique({
    where: {
      tenantId_externalId_eventType: {
        tenantId,
        externalId,
        eventType: `tekion.${eventType}`,
      },
    },
    select: { id: true },
  });
  const duplicate = Boolean(existing);
  if (!duplicate) {
    if (eventType.includes("inventory")) {
      await enqueueTekionInventorySync({
        tenantId,
        externalId,
        payload,
      });
    }
    await systemPrisma.$transaction([
      systemPrisma.integrationLog.create({
        data: {
          tenantId,
          vendor: "TEKION",
          eventType: `tekion.${eventType}`,
          externalId,
          status: "PROCESSED",
          payload: payload as object,
          processedAt: new Date(),
        },
      }),
      systemPrisma.externalSync.upsert({
        where: {
          tenantId_externalId_entityType: {
            tenantId,
            externalId,
            entityType: `tekion.${eventType}`,
          },
        },
        create: {
          tenantId,
          vendor: "TEKION",
          entityType: `tekion.${eventType}`,
          externalId,
          direction: "INBOUND",
          status: "SUCCESS",
          payload: payload as object,
          syncedAt: new Date(),
        },
        update: {
          status: "SUCCESS",
          payload: payload as object,
          syncedAt: new Date(),
        },
      }),
    ]);
  }

  return res.status(duplicate ? 200 : 202).json({
    data: {
      accepted: true,
      duplicate,
    },
    error: null,
  });
});
