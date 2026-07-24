-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION 002 — Social links extended fields
-- Safe: adds missing columns to existing social_links table.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.social_links
  ADD COLUMN IF NOT EXISTS label TEXT;

ALTER TABLE public.social_links
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.social_links
  ADD COLUMN IF NOT EXISTS order_index INT NOT NULL DEFAULT 0;

ALTER TABLE public.social_links
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_social_links_profile_order
  ON public.social_links (profile_id, order_index);

-- Fix RLS: old ALL policy also covers INSERT — keep it but ensure profile_id is validated
-- The existing "Gestión de redes sociales por el creador" policy already handles INSERT/UPDATE/DELETE
-- The existing "Lectura pública de redes sociales" covers SELECT

-- ROLLBACK (manual):
-- ALTER TABLE public.social_links DROP COLUMN IF EXISTS label;
-- ALTER TABLE public.social_links DROP COLUMN IF EXISTS is_active;
-- ALTER TABLE public.social_links DROP COLUMN IF EXISTS order_index;
-- ALTER TABLE public.social_links DROP COLUMN IF EXISTS updated_at;
-- DROP INDEX IF EXISTS idx_social_links_profile_order;
