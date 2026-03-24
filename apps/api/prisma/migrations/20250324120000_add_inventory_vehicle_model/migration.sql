-- CreateEnum
CREATE TYPE "VehicleModelSource" AS ENUM ('LIBRARY', 'UPLOAD', 'GENERATED_FROM_PHOTOS');

-- AlterTable
ALTER TABLE "inventory" ADD COLUMN     "model_glb_url" TEXT,
ADD COLUMN     "model_source" "VehicleModelSource",
ADD COLUMN     "model_source_photo_ids" JSONB;
