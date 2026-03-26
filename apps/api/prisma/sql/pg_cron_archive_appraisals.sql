-- Requires pg_cron + pg_stat_statements on the database host (Render/Fly managed Postgres often support extensions).
-- Archives soft-deleted or stale appraisals: moves rows older than 90 days to cold storage table or deletes per retention policy.

-- SELECT cron.schedule(
--   'archive-old-appraisals',
--   '0 3 * * *',
--   $$DELETE FROM appraisals WHERE status = 'completed' AND updated_at < now() - interval '90 days'$$
-- );

-- For compliance-first tenants, prefer INSERT INTO appraisals_archive ... DELETE ... RETURNING * in a transaction.

COMMENT ON EXTENSION pg_cron IS 'Optional: schedule archive job for appraisals > 90 days (see README retention).';
