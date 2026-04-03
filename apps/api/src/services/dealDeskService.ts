import type { PrismaClient } from "@prisma/client";
import { InventorySource, OrderStatus, OrderType } from "@prisma/client";

type DealDeskStatus = "OPEN" | "ACCEPTED" | "REJECTED" | "NEGOTIATING" | "CLOSED";

type DealDeskUpdateInput = {
  tenantId: string;
  appraisalId: string;
  status: DealDeskStatus;
  note?: string | null;
  actorUserId: string;
};

type AddToInventoryInput = {
  tenantId: string;
  appraisalId: string;
  actorUserId: string;
  listPrice?: number;
  location?: string | null;
};

function parseVehicleFromNotes(notes: string | null): { make: string; model: string; year: number } | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes) as { make?: string; model?: string; year?: number };
    if (!parsed.make || !parsed.model || !parsed.year) return null;
    return {
      make: parsed.make,
      model: parsed.model,
      year: parsed.year,
    };
  } catch {
    return null;
  }
}

async function ensureInventoryForAppraisal(prisma: PrismaClient, input: AddToInventoryInput) {
  const appraisal = await prisma.appraisal.findFirst({
    where: { id: input.appraisalId, tenantId: input.tenantId },
    include: {
      vehicle: true,
    },
  });
  if (!appraisal) {
    throw new Error("APPRAISAL_NOT_FOUND");
  }

  const existingInventory = await prisma.inventory.findFirst({
    where: {
      tenantId: input.tenantId,
      source: InventorySource.APPRAISAL,
      vehicleId: appraisal.vehicleId ?? undefined,
      specs: {
        path: ["appraisalId"],
        equals: input.appraisalId,
      },
    },
  });
  if (existingInventory) return existingInventory;

  let vehicleId = appraisal.vehicleId;
  if (!vehicleId) {
    const fromNotes = parseVehicleFromNotes(appraisal.notes);
    const createdVehicle = await prisma.vehicle.create({
      data: {
        tenantId: input.tenantId,
        make: fromNotes?.make ?? "Unknown",
        model: fromNotes?.model ?? "Appraisal",
        trimLevel: "Appraisal",
        year: fromNotes?.year ?? new Date().getUTCFullYear(),
        basePrice: Number(appraisal.value ?? 0),
        bodyType: "UNKNOWN",
        isActive: true,
      },
      select: { id: true },
    });
    vehicleId = createdVehicle.id;
    await prisma.appraisal.updateMany({
      where: { id: input.appraisalId, tenantId: input.tenantId },
      data: { vehicleId },
    });
  }

  return prisma.inventory.create({
    data: {
      tenantId: input.tenantId,
      source: InventorySource.APPRAISAL,
      vehicleId: vehicleId!,
      listedByUserId: input.actorUserId,
      location: input.location ?? "Deal Desk Intake",
      listPrice: input.listPrice ?? Number(appraisal.value ?? 0),
      mileage: null,
      status: "AVAILABLE",
      specs: {
        appraisalId: input.appraisalId,
        appraisalSourced: true,
      },
    },
  });
}

async function pickOrderUserId(prisma: PrismaClient, tenantId: string, appraisalId: string): Promise<string | null> {
  const appraisal = await prisma.appraisal.findFirst({
    where: { id: appraisalId, tenantId },
    include: { customer: { select: { userId: true } } },
  });
  if (appraisal?.customer?.userId) return appraisal.customer.userId;

  const fallback = await prisma.user.findFirst({
    where: { tenantId, role: { in: ["ADMIN", "GROUP_ADMIN", "STAFF"] } },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  return fallback?.id ?? null;
}

export async function addAppraisalToInventory(prisma: PrismaClient, input: AddToInventoryInput) {
  return ensureInventoryForAppraisal(prisma, input);
}

export async function updateDealDeskStatus(prisma: PrismaClient, input: DealDeskUpdateInput) {
  const appraisal = await prisma.appraisal.findFirst({
    where: { id: input.appraisalId, tenantId: input.tenantId },
    select: { id: true, value: true },
  });
  if (!appraisal) {
    throw new Error("APPRAISAL_NOT_FOUND");
  }

  const normalizedStatus = input.status.toLowerCase();
  const isClosed = input.status === "CLOSED";

  let inventoryId: string | null = null;
  let orderId: string | null = null;
  if (isClosed) {
    const inventory = await ensureInventoryForAppraisal(prisma, {
      tenantId: input.tenantId,
      appraisalId: input.appraisalId,
      actorUserId: input.actorUserId,
      listPrice: Number(appraisal.value ?? 0),
    });
    inventoryId = inventory.id;

    const orderUserId = await pickOrderUserId(prisma, input.tenantId, input.appraisalId);
    if (orderUserId) {
      const existingOrder = await prisma.order.findFirst({
        where: {
          tenantId: input.tenantId,
          inventoryId: inventory.id,
          type: OrderType.INVENTORY,
        },
        select: { id: true },
      });
      if (existingOrder) {
        orderId = existingOrder.id;
      } else {
        const order = await prisma.order.create({
          data: {
            tenantId: input.tenantId,
            userId: orderUserId,
            type: OrderType.INVENTORY,
            inventoryId: inventory.id,
            vehicleId: inventory.vehicleId,
            status: OrderStatus.CONFIRMED,
            totalAmount: Number(appraisal.value ?? 0),
          },
          select: { id: true },
        });
        orderId = order.id;
      }
    }
  }

  await prisma.$transaction([
    prisma.appraisal.updateMany({
      where: { id: input.appraisalId, tenantId: input.tenantId },
      data: { status: normalizedStatus },
    }),
    prisma.eventLog.create({
      data: {
        tenantId: input.tenantId,
        type: "deal_desk.updated",
        payload: {
          appraisalId: input.appraisalId,
          status: input.status,
          note: input.note ?? null,
          actorUserId: input.actorUserId,
        },
      },
    }),
    prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        actorId: input.actorUserId,
        action: "DEAL_DESK_UPDATE",
        entity: "Appraisal",
        entityId: input.appraisalId,
        payload: {
          status: input.status,
          note: input.note ?? null,
          inventoryId,
          orderId,
        },
      },
    }),
    prisma.notification.create({
      data: {
        tenantId: input.tenantId,
        userId: input.actorUserId,
        type: "DEAL_DESK",
        title: "Deal desk updated",
        body: `Appraisal ${input.appraisalId} marked ${input.status}.`,
      },
    }),
    ...(isClosed
      ? [
          prisma.usageLog.create({
            data: {
              tenantId: input.tenantId,
              kind: "deal_desk_close",
              quantity: 1,
              amountUsd: Number(appraisal.value ?? 0),
              meta: {
                appraisalId: input.appraisalId,
                inventoryId,
                orderId,
              },
            },
          }),
          prisma.eventLog.create({
            data: {
              tenantId: input.tenantId,
              type: "RevenueEvent",
              payload: {
                appraisalId: input.appraisalId,
                inventoryId,
                orderId,
                amountUsd: Number(appraisal.value ?? 0),
                actorUserId: input.actorUserId,
              },
            },
          }),
        ]
      : []),
  ]);

  return {
    appraisalId: input.appraisalId,
    status: input.status,
    note: input.note ?? null,
    inventoryId,
    orderId,
  };
}
