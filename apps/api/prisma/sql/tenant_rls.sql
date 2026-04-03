-- Optional defense-in-depth RLS baseline for tenant-owned hot tables.
-- Usage (per DB session):
--   SET app.current_tenant = '<tenant-id>';
-- Then Postgres enforces tenant_id visibility even if app filters are missed.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'vehicles',
    'inventory',
    'orders',
    'appraisals',
    'leads',
    'customers',
    'event_logs',
    'usage_logs',
    'notifications'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation_policy ON %I
       USING (tenant_id = current_setting(''app.current_tenant'', true))
       WITH CHECK (tenant_id = current_setting(''app.current_tenant'', true))',
      t
    );
  END LOOP;
END $$;

