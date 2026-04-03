DROP INDEX IF EXISTS "integration_logs_tenant_id_external_id_key";
DROP INDEX IF EXISTS "external_syncs_tenant_id_external_id_key";

CREATE UNIQUE INDEX "integration_logs_tenant_id_external_id_event_type_key"
  ON "integration_logs"("tenant_id", "external_id", "event_type");

CREATE UNIQUE INDEX "external_syncs_tenant_id_external_id_entity_type_key"
  ON "external_syncs"("tenant_id", "external_id", "entity_type");
