import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import type { CreateSavedVehicleInput } from "@vex/shared";

const prisma = new PrismaClient();

export async function list(req: Request, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ code: "UNAUTHORIZED", message: "Login required" });

  const saved = await prisma.savedVehicle.findMany({
    where: { userId: user.userId },
    include: { inventory: { include: { vehicle: true } } },
    orderBy: { createdAt: "desc" },
  });

  return res.json(
    saved.map((s) => ({
      id: s.id,
      inventoryId: s.inventoryId,
      configSnapshot: s.configSnapshot,
      createdAt: s.createdAt,
      inventory: s.inventory
        ? {
            id: s.inventory.id,
            listPrice: Number(s.inventory.listPrice),
            vehicle: s.inventory.vehicle
              ? {
                  id: s.inventory.vehicle.id,
                  make: s.inventory.vehicle.make,
                  model: s.inventory.vehicle.model,
                  year: s.inventory.vehicle.year,
                  trimLevel: s.inventory.vehicle.trimLevel,
                }
              : null,
          }
        : null,
    }))
  );
}

export async function create(req: Request, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ code: "UNAUTHORIZED", message: "Login required" });

  const body = req.body as CreateSavedVehicleInput;
  if (!body.inventoryId && !body.configSnapshot) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "inventoryId or configSnapshot required" });
  }

  if (body.inventoryId) {
    const inv = await prisma.inventory.findUnique({ where: { id: body.inventoryId } });
    if (!inv) return res.status(400).json({ code: "BAD_REQUEST", message: "Inventory not found" });
  }

  const saved = await prisma.savedVehicle.create({
    data: {
      userId: user.userId,
      inventoryId: body.inventoryId ?? null,
      configSnapshot: body.configSnapshot ?? null,
    },
  });
  return res.status(201).json({ id: saved.id, inventoryId: saved.inventoryId, configSnapshot: saved.configSnapshot, createdAt: saved.createdAt });
}

export async function remove(req: Request, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ code: "UNAUTHORIZED", message: "Login required" });

  const { id } = req.params;
  const saved = await prisma.savedVehicle.findUnique({ where: { id } });
  if (!saved) return res.status(404).json({ code: "NOT_FOUND", message: "Saved vehicle not found" });
  if (saved.userId !== user.userId) return res.status(403).json({ code: "FORBIDDEN", message: "Not yours" });

  await prisma.savedVehicle.delete({ where: { id } });
  return res.status(204).send();
}
