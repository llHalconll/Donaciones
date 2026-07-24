-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION 001 — Extender tabla profiles
-- Base actual (schema.sql ya aplicado):
--   id, username, display_name, bio, avatar_url, banner_url,
--   is_active, is_admin, created_at, updated_at
--
-- Esta migración AGREGA únicamente las columnas que faltan.
-- Usa ADD COLUMN IF NOT EXISTS para ser idempotente.
-- ═══════════════════════════════════════════════════════════════════

-- account_type: discrimina entre persona natural y organización
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT
    NOT NULL DEFAULT 'individual'
    CHECK (account_type IN ('individual', 'organization'));

-- website_url: enlace personal u organizacional (opcional)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS website_url TEXT;

-- plan: nivel de suscripción SaaS
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan TEXT
    NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro', 'organization'));

-- Actualizar el trigger handle_new_user para incluir valores por defecto
-- de las nuevas columnas (ya tienen DEFAULT, pero documentamos la intención)
-- No se necesita modificar el trigger porque los DEFAULTs se aplican automáticamente.

-- ─────────────────────────────────────────────
-- Verificación (ejecuta esto para confirmar):
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'profiles'
-- ORDER BY ordinal_position;
-- ─────────────────────────────────────────────
