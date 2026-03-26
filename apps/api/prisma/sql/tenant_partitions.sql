-- Postgres 15+ — declarative partitioning by tenant_id range (ops-run after baseline tables exist).
-- Prisma manages the logical schema; this migration is applied manually on production primaries.
--
-- Example (adjust ranges to shard plan):
-- ALTER TABLE event_logs RENAME TO event_logs_old;
-- CREATE TABLE event_logs (
--   LIKE event_logs_old INCLUDING ALL
-- ) PARTITION BY RANGE (tenant_id);
-- Re-import / attach partitions per tenant_id range; drop _old when migrated.

-- Valuation cache hot path: optional hash partitions on tenant_id for billion-row scale.
-- CREATE TABLE valuation_cache (...) PARTITION BY HASH (tenant_id);

COMMENT ON TABLE event_logs IS 'Append-only tenant events; partition by tenant_id in prod (see AGENTS.md billion-scale).';
COMMENT ON TABLE valuation_cache IS 'Valuation cache; partition by tenant_id in prod when row count warrants.';
