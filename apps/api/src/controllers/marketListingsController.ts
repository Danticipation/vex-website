import { Request, Response } from "express";
import { MarketSource, PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export async function list(req: Request, res: Response) {
  const source = req.query.source as string | undefined;
  const make = req.query.make as string | undefined;
  const model = req.query.model as string | undefined;
  const year = req.query.year != null ? Number(req.query.year) : undefined;
  const minPrice = req.query.minPrice != null ? Number(req.query.minPrice) : undefined;
  const maxPrice = req.query.maxPrice != null ? Number(req.query.maxPrice) : undefined;
  const location = req.query.location as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Number(req.query.offset) || 0;

  const where: Prisma.MarketListingWhereInput = {};

  if (source && Object.values(MarketSource).includes(source as MarketSource)) {
    where.source = source as MarketSource;
  }
  if (make) where.make = { equals: make, mode: "insensitive" };
  if (model) where.model = { equals: model, mode: "insensitive" };
  if (year) where.year = year;
  if (location) where.location = { contains: location, mode: "insensitive" };

  const priceWhere: Prisma.DecimalFilter = {};
  if (minPrice != null && !Number.isNaN(minPrice)) priceWhere.gte = minPrice;
  if (maxPrice != null && !Number.isNaN(maxPrice)) priceWhere.lte = maxPrice;
  if (Object.keys(priceWhere).length > 0) where.price = priceWhere;

  const [items, total] = await Promise.all([
    prisma.marketListing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.marketListing.count({ where }),
  ]);

  return res.json({
    items: items.map((m) => ({
      id: m.id,
      source: m.source,
      externalUrl: m.externalUrl,
      thumbnailUrl: m.thumbnailUrl,
      make: m.make,
      model: m.model,
      trim: m.trim,
      year: m.year,
      price: m.price ? Number(m.price) : null,
      mileage: m.mileage,
      location: m.location,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    })),
    total,
    limit,
    offset,
  });
}

