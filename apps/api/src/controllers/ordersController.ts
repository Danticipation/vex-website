import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import type { CreateOrderInput, UpdateOrderInput } from "@vex/shared";
import { requireAuth } from "../middleware/auth.js";

const prisma = new PrismaClient();

function toShipment(s: { id: string; carrier: string | null; trackingUrl: string | null; status: string; estimatedDelivery: Date | null; quoteAmount: unknown; origin: string | null; destination: string | null }) {
  return {
    id: s.id,
    carrier: s.carrier,
    trackingUrl: s.trackingUrl,
    status: s.status,
    estimatedDelivery: s.estimatedDelivery,
    quoteAmount: s.quoteAmount != null ? Number(s.quoteAmount) : null,
    origin: s.origin,
    destination: s.destination,
  };
}

function toOrder(
  record: {
    id: string;
    userId: string;
    type: string;
    inventoryId: string | null;
    vehicleId: string | null;
    configSnapshot: unknown;
    status: string;
    depositAmount: unknown;
    totalAmount: unknown;
    financingSnapshot: unknown;
    tradeInSnapshot: unknown;
    shippingSnapshot: unknown;
    stylingAddonsSnapshot: unknown;
    createdAt: Date;
    updatedAt: Date;
    shipments?: Array<{ id: string; carrier: string | null; trackingUrl: string | null; status: string; estimatedDelivery: Date | null; quoteAmount: unknown; origin: string | null; destination: string | null }>;
  }
) {
  const base = {
    id: record.id,
    userId: record.userId,
    type: record.type,
    inventoryId: record.inventoryId,
    vehicleId: record.vehicleId,
    configSnapshot: record.configSnapshot,
    status: record.status,
    depositAmount: record.depositAmount != null ? Number(record.depositAmount) : null,
    totalAmount: record.totalAmount != null ? Number(record.totalAmount) : null,
    financingSnapshot: record.financingSnapshot,
    tradeInSnapshot: record.tradeInSnapshot,
    shippingSnapshot: record.shippingSnapshot,
    stylingAddonsSnapshot: record.stylingAddonsSnapshot,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
  if (record.shipments) {
    return { ...base, shipments: record.shipments.map(toShipment) };
  }
  return base;
}

export async function create(req: Request, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ code: "UNAUTHORIZED", message: "Login required" });

  const body = req.body as CreateOrderInput;
  const order = await prisma.order.create({
    data: {
      userId: user.userId,
      type: body.type,
      inventoryId: body.inventoryId ?? null,
      vehicleId: body.vehicleId ?? null,
      configSnapshot: body.configSnapshot ?? null,
      status: body.status ?? "DRAFT",
      depositAmount: body.depositAmount ?? null,
      totalAmount: body.totalAmount ?? null,
      financingSnapshot: body.financingSnapshot ?? null,
      tradeInSnapshot: body.tradeInSnapshot ?? null,
      shippingSnapshot: body.shippingSnapshot ?? null,
      stylingAddonsSnapshot: body.stylingAddonsSnapshot ?? null,
    },
  });
  return res.status(201).json(toOrder(order));
}

export async function list(req: Request, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ code: "UNAUTHORIZED", message: "Login required" });

  const isStaff = user.role === "STAFF" || user.role === "ADMIN";
  const status = req.query.status as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Number(req.query.offset) || 0;

  const where = isStaff ? {} : { userId: user.userId };
  if (status) (where as Record<string, unknown>).status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { shipments: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.order.count({ where }),
  ]);

  return res.json({ items: orders.map(toOrder), total, limit, offset });
}

export async function getById(req: Request, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ code: "UNAUTHORIZED", message: "Login required" });

  const { id } = req.params;
  const order = await prisma.order.findUnique({ where: { id }, include: { shipments: true } });
  if (!order) return res.status(404).json({ code: "NOT_FOUND", message: "Order not found" });

  const isStaff = user.role === "STAFF" || user.role === "ADMIN";
  if (!isStaff && order.userId !== user.userId) {
    return res.status(403).json({ code: "FORBIDDEN", message: "Not your order" });
  }

  return res.json(toOrder(order));
}

export async function update(req: Request, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ code: "UNAUTHORIZED", message: "Login required" });

  const { id } = req.params;
  const body = req.body as UpdateOrderInput;

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ code: "NOT_FOUND", message: "Order not found" });

  const isStaff = user.role === "STAFF" || user.role === "ADMIN";
  if (!isStaff && existing.userId !== user.userId) {
    return res.status(403).json({ code: "FORBIDDEN", message: "Not your order" });
  }
  if (!isStaff && body.status && !["DRAFT", "DEPOSIT_PAID"].includes(body.status)) {
    return res.status(403).json({ code: "FORBIDDEN", message: "Only staff can set that status" });
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      ...(body.status != null && { status: body.status }),
      ...(body.depositAmount != null && { depositAmount: body.depositAmount }),
      ...(body.totalAmount != null && { totalAmount: body.totalAmount }),
    },
  });
  return res.json(toOrder(order));
}
