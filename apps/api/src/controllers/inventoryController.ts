import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import type { CreateInventoryInput, UpdateInventoryInput } from "@vex/shared";
import { requireAuth } from "../middleware/auth.js";

const prisma = new PrismaClient();

function toInventory(record: {
  id: string;
  source: string;
  vehicleId: string;
  listedByUserId: string | null;
  location: string | null;
  listPrice: { toNumber: () => number };
  mileage: number | null;
  status: string;
  vin: string | null;
  verificationStatus: string | null;
  imageUrls: unknown;
  specs: unknown;
  createdAt: Date;
  updatedAt: Date;
  vehicle?: unknown;
}) {
  const base = {
    id: record.id,
    source: record.source,
    vehicleId: record.vehicleId,
    listedByUserId: record.listedByUserId,
    location: record.location,
    listPrice: Number(record.listPrice),
    mileage: record.mileage,
    status: record.status,
    vin: record.vin,
    verificationStatus: record.verificationStatus,
    imageUrls: record.imageUrls as string[] | null,
    specs: record.specs as Record<string, unknown> | null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
  if (record.vehicle) {
    const v = record.vehicle as { id: string; make: string; model: string; trimLevel: string; year: number; basePrice: { toNumber: () => number }; bodyType: string | null; imageUrls: unknown };
    return {
      ...base,
      vehicle: {
        id: v.id,
        make: v.make,
        model: v.model,
        trimLevel: v.trimLevel,
        year: v.year,
        basePrice: Number(v.basePrice),
        bodyType: v.bodyType,
        imageUrls: v.imageUrls,
      },
    };
  }
  return base;
}

export async function list(req: Request, res: Response) {
  const source = req.query.source as string | undefined;
  const location = req.query.location as string | undefined;
  const minPrice = req.query.minPrice != null ? Number(req.query.minPrice) : undefined;
  const maxPrice = req.query.maxPrice != null ? Number(req.query.maxPrice) : undefined;
  const make = req.query.make as string | undefined;
  const model = req.query.model as string | undefined;
  const year = req.query.year != null ? Number(req.query.year) : undefined;
  const status = (req.query.status as string) || "AVAILABLE";
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Number(req.query.offset) || 0;

  const vehicleWhere: { make?: string; model?: string; year?: number } = {};
  if (make) vehicleWhere.make = make;
  if (model) vehicleWhere.model = model;
  if (year) vehicleWhere.year = year;

  const listPriceWhere: { gte?: number; lte?: number } = {};
  if (minPrice != null && !Number.isNaN(minPrice)) listPriceWhere.gte = minPrice;
  if (maxPrice != null && !Number.isNaN(maxPrice)) listPriceWhere.lte = maxPrice;

  const where: {
    status: string;
    source?: string;
    location?: { contains: string; mode: "insensitive" };
    vehicle?: { make?: string; model?: string; year?: number };
    listPrice?: { gte?: number; lte?: number };
    verificationStatus?: string;
  } = { status };
  if (source) where.source = source;
  if (location) where.location = { contains: location, mode: "insensitive" };
  if (Object.keys(vehicleWhere).length > 0) where.vehicle = vehicleWhere;
  if (Object.keys(listPriceWhere).length > 0) where.listPrice = listPriceWhere;
  if (source === "PRIVATE_SELLER") where.verificationStatus = "APPROVED";

  const [items, total] = await Promise.all([
    prisma.inventory.findMany({
      where,
      include: { vehicle: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.inventory.count({ where }),
  ]);

  return res.json({
    items: items.map(toInventory),
    total,
    limit,
    offset,
  });
}

export async function getById(req: Request, res: Response) {
  const { id } = req.params;

  const item = await prisma.inventory.findUnique({
    where: { id },
    include: { vehicle: true },
  });

  if (!item) {
    return res.status(404).json({ code: "NOT_FOUND", message: "Inventory item not found" });
  }

  if (item.source === "PRIVATE_SELLER" && item.verificationStatus !== "APPROVED") {
    return res.status(404).json({ code: "NOT_FOUND", message: "Inventory item not found" });
  }

  return res.json(toInventory(item));
}

export async function create(req: Request, res: Response) {
  const body = req.body as CreateInventoryInput;
  const user = req.user;
  if (!user) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Login required" });
  }
  if (body.source === "COMPANY" && user.role !== "STAFF" && user.role !== "ADMIN") {
    return res.status(403).json({ code: "FORBIDDEN", message: "Only staff can add company inventory" });
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id: body.vehicleId } });
  if (!vehicle) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "Vehicle not found" });
  }

  const inventory = await prisma.inventory.create({
    data: {
      source: body.source,
      vehicleId: body.vehicleId,
      listedByUserId: body.source === "PRIVATE_SELLER" ? user.userId : null,
      location: body.location ?? null,
      listPrice: body.listPrice,
      mileage: body.mileage ?? null,
      vin: body.vin ?? null,
      verificationStatus: body.source === "PRIVATE_SELLER" ? "PENDING" : null,
      imageUrls: body.imageUrls ?? null,
      specs: body.specs ?? null,
    },
    include: { vehicle: true },
  });

  return res.status(201).json(toInventory(inventory));
}

export async function update(req: Request, res: Response) {
  const { id } = req.params;
  const body = req.body as UpdateInventoryInput;
  const user = req.user;

  const existing = await prisma.inventory.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ code: "NOT_FOUND", message: "Inventory item not found" });
  }

  const isStaff = user && (user.role === "STAFF" || user.role === "ADMIN");
  const isOwner = user && existing.listedByUserId === user.userId;
  if (!isStaff && !isOwner) {
    return res.status(403).json({ code: "FORBIDDEN", message: "Not allowed to update this listing" });
  }

  if (isOwner && !isStaff) {
    if (body.verificationStatus !== undefined || body.status !== undefined) {
      return res.status(403).json({ code: "FORBIDDEN", message: "Only staff can change status or verification" });
    }
  }

  const inventory = await prisma.inventory.update({
    where: { id },
    data: {
      ...(body.location !== undefined && { location: body.location }),
      ...(body.listPrice !== undefined && { listPrice: body.listPrice }),
      ...(body.mileage !== undefined && { mileage: body.mileage }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.vin !== undefined && { vin: body.vin }),
      ...(body.verificationStatus !== undefined && { verificationStatus: body.verificationStatus }),
      ...(body.imageUrls !== undefined && { imageUrls: body.imageUrls }),
      ...(body.specs !== undefined && { specs: body.specs }),
    },
    include: { vehicle: true },
  });

  return res.json(toInventory(inventory));
}
