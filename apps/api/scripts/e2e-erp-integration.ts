import { systemPrisma } from "../src/lib/tenant.js";
import { createErpOrderFromAppraisal, listErpInvoices } from "../src/services/erpService.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  await systemPrisma.$executeRawUnsafe(
    "ALTER TYPE \"InventorySource\" ADD VALUE IF NOT EXISTS 'APPRAISAL'"
  );

  const suffix = Date.now();
  const tenant = await systemPrisma.tenant.create({ data: { name: `e2e-erp-${suffix}` } });
  const staff = await systemPrisma.user.create({
    data: {
      tenantId: tenant.id,
      email: `erp-staff-${suffix}@vex.dev`,
      passwordHash: "not-used-in-e2e",
      role: "STAFF",
    },
  });
  const customer = await systemPrisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: "ERP Customer",
      email: `erp-customer-${suffix}@vex.dev`,
    },
  });
  const appraisal = await systemPrisma.appraisal.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      status: "accepted",
      value: 99000,
      notes: JSON.stringify({ make: "Ferrari", model: "F8", year: 2021 }),
    },
  });

  const created = await createErpOrderFromAppraisal(systemPrisma, {
    tenantId: tenant.id,
    appraisalId: appraisal.id,
    actorUserId: staff.id,
  });

  assert(created.order.id, "E2E FAILED: ERP order missing id");
  assert(created.invoice.invoiceNumber.startsWith("INV-"), "E2E FAILED: invoice number not generated");
  assert(Boolean(created.inventoryId), "E2E FAILED: inventory not linked");

  const [usage, revenueEvent, invoices] = await Promise.all([
    systemPrisma.usageLog.findFirst({
      where: { tenantId: tenant.id, kind: "erp_order_create", meta: { path: ["appraisalId"], equals: appraisal.id } },
      orderBy: { createdAt: "desc" },
    }),
    systemPrisma.eventLog.findFirst({
      where: {
        tenantId: tenant.id,
        type: "RevenueEvent",
        payload: { path: ["source"], equals: "erp_order_create" },
      },
      orderBy: { createdAt: "desc" },
    }),
    listErpInvoices(systemPrisma, tenant.id),
  ]);

  assert(Boolean(usage), "E2E FAILED: missing ERP usage billing event");
  assert(Boolean(revenueEvent), "E2E FAILED: missing ERP immutable RevenueEvent");
  assert(invoices.some((i) => i.orderId === created.order.id), "E2E FAILED: invoice ledger missing order");

  await systemPrisma.order.deleteMany({ where: { tenantId: tenant.id } });
  await systemPrisma.inventory.deleteMany({ where: { tenantId: tenant.id } });
  await systemPrisma.appraisal.deleteMany({ where: { tenantId: tenant.id } });
  await systemPrisma.customer.deleteMany({ where: { tenantId: tenant.id } });
  await systemPrisma.user.deleteMany({ where: { tenantId: tenant.id } });
  await systemPrisma.tenant.deleteMany({ where: { id: tenant.id } });

  console.log("e2e-erp-integration: OK");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => systemPrisma.$disconnect());
