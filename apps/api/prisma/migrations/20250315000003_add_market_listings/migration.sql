-- Create enum for external market sources
CREATE TYPE "MarketSource" AS ENUM ('BAT', 'CARS_COM', 'CARFAX', 'AUTONATION', 'MARKETCHECK', 'OTHER');

-- Create table for external market listings
CREATE TABLE "market_listings" (
  "id" TEXT PRIMARY KEY,
  "source" "MarketSource" NOT NULL,
  "external_url" TEXT NOT NULL,
  "thumbnail_url" TEXT,
  "make" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "trim" TEXT,
  "year" INTEGER NOT NULL,
  "price" DECIMAL(12, 2),
  "mileage" INTEGER,
  "location" TEXT,
  "raw_payload" JSONB,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

