import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validate.js";
import { prisma, runWithTenant, findTenantByCustomDomain, normalizeHost } from "../lib/tenant.js";

export const pilotRouter: Router = Router();

const pilotApplySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  dealership: z.string().min(2),
  phone: z.string().optional(),
});

pilotRouter.post("/apply", validateBody(pilotApplySchema), async (req, res) => {
  const body = req.body as z.infer<typeof pilotApplySchema>;

  const tenantId =
    (typeof req.query.tenantId === "string" && req.query.tenantId.trim()) ||
    (await (async () => {
      const forwarded = req.get("x-forwarded-host");
      const host = forwarded ? normalizeHost(forwarded) : req.get("host") ? normalizeHost(req.get("host")!) : "";
      if (!host) return "";
      const t = await findTenantByCustomDomain(host);
      return t?.id ?? "";
    })()) ||
    process.env.PUBLIC_APPRAISAL_TENANT_ID ||
    "";

  if (!tenantId) {
    return res.status(400).json({
      code: "BAD_REQUEST",
      message: "Could not resolve tenant for pilot application",
    });
  }

  const existing = await runWithTenant(tenantId, () => prisma.lead.findFirst({ where: { email: body.email } }));
  if (existing) return res.json({ data: { leadId: existing.id, status: existing.status }, error: null });

  const approvedCount = await runWithTenant(tenantId, () => prisma.lead.count({ where: { source: "PILOT_AUTO_APPROVED" } }));
  const autoApprove = approvedCount < 20;
  const lead = await runWithTenant(tenantId, () =>
    prisma.lead.create({
      data: {
        tenantId,
        source: autoApprove ? "PILOT_AUTO_APPROVED" : "PILOT_WAITLIST",
        name: body.name,
        email: body.email,
        phone: body.phone,
        notes: `Dealership: ${body.dealership}`,
        status: autoApprove ? "QUALIFIED" : "NEW",
      },
    })
  );

  await runWithTenant(tenantId, () =>
    prisma.auditLog.create({
      data: {
        tenantId,
        action: "PILOT_APPLY",
        entity: "Lead",
        entityId: lead.id,
        payload: { autoApprove },
      },
    })
  );
  return res.status(201).json({ data: { leadId: lead.id, status: lead.status, autoApprove }, error: null });
});
