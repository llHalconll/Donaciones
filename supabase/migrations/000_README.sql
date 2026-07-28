-- ═══════════════════════════════════════════════════════════════════
-- GUÍA DE APLICACIÓN — DonacionesSaaS
-- ═══════════════════════════════════════════════════════════════════
--
-- ESTADO INICIAL DE LA BD (ya aplicado vía schema.sql):
--   ✅ profiles       (id, username, display_name, bio, avatar_url,
--                      banner_url, is_active, is_admin, created_at, updated_at)
--   ✅ social_links   (id, profile_id, platform, url, created_at)
--   ✅ donation_buttons (id, profile_id, title, amount, currency,
--                        hotmart_checkout_url, order_index, created_at)
--   ✅ RLS activo en las 3 tablas
--   ✅ Trigger on_auth_user_created → handle_new_user
--   ✅ Storage: buckets avatars y banners con RLS
--
-- ORDEN DE APLICACIÓN (ejecuta en el SQL Editor de Supabase):
--
--   1. migrations/001_profile_extended.sql
--      → ADD COLUMN: account_type, website_url, plan
--
--   2. migrations/002_social_links_extended.sql
--      → ADD COLUMN: label, is_active, order_index, updated_at
--      → CREATE INDEX: idx_social_links_profile_order
--
--   3. migrations/003_donation_buttons_extended.sql
--      → ADD COLUMN: description, button_label, is_active,
--                    is_featured, updated_at
--      → ADD CONSTRAINT: amount > 0
--      → CREATE INDEX: idx_donation_buttons_profile_order/active
--
--   4. migrations/004_analytics_events.sql
--      → CREATE TABLE: analytics_events (NUEVA)
--      → CREATE POLICY: owner reads, public insert
--      → CREATE INDEX: profile_time, type
--
--   5. migrations/005_profile_reports.sql
--      → CREATE TABLE: profile_reports (NUEVA)
--      → CREATE POLICY: admin read/update, public insert
--      → CREATE INDEX: status, profile
--
--   6. migrations/006_webhook_events.sql
--      → CREATE TABLE: webhook_events (NUEVA, preparada)
--      → Sin políticas RLS (acceso solo server-side)
--      → CREATE INDEX: external_id, status
--
--   7. migrations/007_donation_buttons_emoji.sql
--      → Agrega emoji al modelo legado
--
--   8. migrations/008_oauth_handle_new_user.sql
--      → Endurece la creación de perfiles OAuth
--
--   9. migrations/009_performance_indexes.sql
--      → Agrega índices de analytics y username
--
--  10. migrations/010_public_profile_rls_hardening.sql
--      → Limita lecturas públicas a perfiles y registros activos
--
--  11. migrations/011_support_goals.sql
--      → Crea support_goals y support_amounts
--      → Convierte automáticamente cada donation_button en un objetivo
--        con un nivel, conservando datos, orden y referencias históricas
--      → Migra analytics_events y webhook_events a support_amount_id
--      → Retira donation_buttons únicamente después de verificar conteos
--      → Crea RLS, índices y el bucket support-goals
--
--  12. migrations/012_hotmart_checkout_overlay.sql
--      → Agrega el código opcional de oferta de Hotmart
--
--  13. migrations/013_legal_acceptance.sql
--      → Registra aceptación versionada de Términos y Privacidad
--
--  14. migrations/014_profiles_rls_hardening.sql
--      → Separa lecturas anónimas, propietarios y administradores
--      → Protege plan, is_active e is_admin de cambios directos
--
--  15. migrations/015_data_retention.sql
--      → Añade índices y función restringida de depuración
--
--  16. migrations/016_function_privileges.sql
--      → Revoca la ejecución anónima de funciones privilegiadas
--
-- ═══════════════════════════════════════════════════════════════════
-- VERIFICACIÓN DESPUÉS DE APLICAR CADA MIGRACIÓN:
-- ═══════════════════════════════════════════════════════════════════

-- Verificar columnas de profiles:
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Verificar columnas de social_links:
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'social_links'
ORDER BY ordinal_position;

-- Verificar columnas del modelo final de objetivos:
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('support_goals', 'support_amounts')
ORDER BY table_name, ordinal_position;

-- Verificar tablas nuevas:
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verificar políticas RLS:
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
