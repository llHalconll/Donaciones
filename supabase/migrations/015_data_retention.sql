-- DonacionesSaaS · Retención técnica de datos operativos
-- La función debe ejecutarse diariamente con Supabase Cron o un job de servicio.

BEGIN;

CREATE INDEX IF NOT EXISTS idx_analytics_events_retention
  ON public.analytics_events (created_at);

CREATE INDEX IF NOT EXISTS idx_profile_reports_retention
  ON public.profile_reports (reviewed_at)
  WHERE status IN ('resolved', 'dismissed');

CREATE INDEX IF NOT EXISTS idx_webhook_events_retention
  ON public.webhook_events (created_at);

CREATE OR REPLACE FUNCTION public.purge_expired_operational_data()
RETURNS TABLE (
  analytics_deleted BIGINT,
  reports_deleted BIGINT,
  webhook_payloads_cleared BIGINT,
  webhooks_deleted BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_analytics_deleted BIGINT := 0;
  v_reports_deleted BIGINT := 0;
  v_webhook_payloads_cleared BIGINT := 0;
  v_webhooks_deleted BIGINT := 0;
BEGIN
  DELETE FROM public.analytics_events
  WHERE created_at < NOW() - INTERVAL '13 months';
  GET DIAGNOSTICS v_analytics_deleted = ROW_COUNT;

  DELETE FROM public.profile_reports
  WHERE status IN ('resolved', 'dismissed')
    AND reviewed_at IS NOT NULL
    AND reviewed_at < NOW() - INTERVAL '24 months';
  GET DIAGNOSTICS v_reports_deleted = ROW_COUNT;

  UPDATE public.webhook_events
  SET payload = NULL,
      error_message = NULL
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND status IN ('processed', 'ignored')
    AND (payload IS NOT NULL OR error_message IS NOT NULL);
  GET DIAGNOSTICS v_webhook_payloads_cleared = ROW_COUNT;

  DELETE FROM public.webhook_events
  WHERE created_at < NOW() - INTERVAL '13 months';
  GET DIAGNOSTICS v_webhooks_deleted = ROW_COUNT;

  RETURN QUERY
  SELECT
    v_analytics_deleted,
    v_reports_deleted,
    v_webhook_payloads_cleared,
    v_webhooks_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_operational_data()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_operational_data()
  TO service_role;

COMMENT ON FUNCTION public.purge_expired_operational_data() IS
  'Aplica la retención aprobada: analítica 13 meses, reportes cerrados 24 meses, payloads webhook 90 días y metadatos webhook 13 meses.';

COMMIT;
