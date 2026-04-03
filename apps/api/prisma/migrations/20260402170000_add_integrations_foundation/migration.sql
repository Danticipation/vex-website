CREATE TABLE "integration_logs" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "vendor" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "external_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PROCESSED',
  "payload" JSONB,
  "error" TEXT,
  "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processed_at" TIMESTAMP(3),
  CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "external_syncs" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "vendor" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "external_id" TEXT NOT NULL,
  "direction" TEXT NOT NULL DEFAULT 'INBOUND',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "payload" JSONB,
  "synced_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "external_syncs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "integration_logs_tenant_id_external_id_key" ON "integration_logs"("tenant_id", "external_id");
CREATE INDEX "integration_logs_tenant_id_vendor_received_at_idx" ON "integration_logs"("tenant_id", "vendor", "received_at");
CREATE INDEX "integration_logs_tenant_id_event_type_received_at_idx" ON "integration_logs"("tenant_id", "event_type", "received_at");

CREATE UNIQUE INDEX "external_syncs_tenant_id_external_id_key" ON "external_syncs"("tenant_id", "external_id");
CREATE INDEX "external_syncs_tenant_id_vendor_entity_type_idx" ON "external_syncs"("tenant_id", "vendor", "entity_type");
CREATE INDEX "external_syncs_tenant_id_status_updated_at_idx" ON "external_syncs"("tenant_id", "status", "updated_at");

ALTER TABLE "integration_logs"
  ADD CONSTRAINT "integration_logs_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "external_syncs"
  ADD CONSTRAINT "external_syncs_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
