import { Router } from "express";
import { consumeFortellisWebhookIdempotent, verifyFortellisWebhookSignature } from "../../../lib/fortellis.js";
import { enqueueFortellisInventorySync } from "../../../lib/queue.js";

export const fortellisWebhookRouter: Router = Router();

fortellisWebhookRouter.post("/", async (req, res) => {
  const signature = req.header("x-fortellis-signature") ?? req.header("x-signature");
  const raw = req.body;
  if (!Buffer.isBuffer(raw)) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "Expected raw body buffer" });
  }
  if (!verifyFortellisWebhookSignature(raw, signature ?? undefined)) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid Fortellis signature" });
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

  const result = await consumeFortellisWebhookIdempotent(
    { tenantId, externalId, eventType, payload },
    async () => {
      if (eventType.includes("inventory")) {
        await enqueueFortellisInventorySync({
          tenantId,
          externalId,
          payload,
        });
      }
    }
  );

  return res.status(result.duplicate ? 200 : 202).json({
    data: {
      accepted: true,
      duplicate: result.duplicate,
    },
    error: null,
  });
});
