-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION 009 — Índices de rendimiento
--
-- Problema identificado en auditoría 2026-07-25:
--   Las queries de analytics_events filtran por (profile_id, event_type, created_at).
--   Sin un índice compuesto, PostgreSQL hace seq scan cuando la tabla crece.
--   El dashboard lanza 4 queries a esta tabla en cada carga.
--
-- Usa CONCURRENTLY para no bloquear escrituras durante la creación.
-- Usa IF NOT EXISTS para hacer idempotente la migración.
-- ═══════════════════════════════════════════════════════════════════

-- Índice compuesto principal para queries de analytics del dashboard:
--   WHERE profile_id = ? AND event_type IN (...) AND created_at >= ?
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_profile_type_time
  ON public.analytics_events (profile_id, event_type, created_at DESC);

-- Índice en profiles.username (usado en rutas públicas /[username])
-- Ya debería existir si hay un UNIQUE constraint, pero lo garantizamos:
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username
  ON public.profiles (username);

-- Verificación post-migración (ejecuta en SQL Editor de Supabase):
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('analytics_events', 'profiles')
-- ORDER BY tablename, indexname;
