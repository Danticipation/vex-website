import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validateBody } from "../middleware/validate.js";
import { prisma } from "../lib/tenant.js";
import { createErpOrderFromAppraisal, listErpInvoices, listErpOrders } from "../services/erpService.js";

export const erpRouter: Router = Router();

const createErpOrderSchema = z.object({
  appraisalId: z.string().min(1),
  listPrice: z.number().positive().optional(),
  location: z.string().max(200).optional(),
});

erpRouter.post(
  "/orders",
  requireAuth,
  requireRole("STAFF", "ADMIN", "GROUP_ADMIN"),
  validateBody(createErpOrderSchema),
  async (req, res) => {
    if (!req.tenantId || !req.user?.userId) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Tenant or user context missing" });
    }
    const body = req.body as z.infer<typeof createErpOrderSchema>;
    try {
      const result = await createErpOrderFromAppraisal(prisma, {
        tenantId: req.tenantId,
        appraisalId: body.appraisalId,
        actorUserId: req.user.userId,
        listPrice: body.listPrice,
        location: body.location ?? null,
      });
      return res.status(201).json({ data: result, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create ERP order";
      if (message === "APPRAISAL_NOT_FOUND") {
        return res.status(404).json({ code: "NOT_FOUND", message: "Appraisal not found" });
      }
      if (message === "ORDER_USER_NOT_FOUND") {
        return res.status(400).json({ code: "BAD_REQUEST", message: "No eligible user to attach order" });
      }
      throw error;
    }
  }
);

erpRouter.get(
  "/orders",
  requireAuth,
  requireRole("STAFF", "ADMIN", "GROUP_ADMIN"),
  async (req, res) => {
    if (!req.tenantId) return res.status(401).json({ code: "UNAUTHORIZED", message: "Tenant context missing" });
    const items = await listErpOrders(prisma, req.tenantId);
    return res.json({ data: { items, total: items.length }, error: null });
  }
);

erpRouter.get(
  "/invoices",
  requireAuth,
  requireRole("STAFF", "ADMIN", "GROUP_ADMIN"),
  async (req, res) => {
    if (!req.tenantId) return res.status(401).json({ code: "UNAUTHORIZED", message: "Tenant context missing" });
    const items = await listErpInvoices(prisma, req.tenantId);
    return res.json({ data: { items, total: items.length }, error: null });
  }
);
