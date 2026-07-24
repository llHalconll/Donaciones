-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION 002 — Extender tabla social_links
-- Base actual (schema.sql ya aplicado):
--   id, profile_id, platform, url, created_at
--
-- Esta migración AGREGA únicamente las columnas que faltan.
-- ═══════════════════════════════════════════════════════════════════

-- label: etiqueta personalizada del enlace (opcional)
ALTER TABLE public.social_links
  ADD COLUMN IF NOT EXISTS label TEXT;

-- is_active: permite al creador ocultar un enlace sin eliminarlo
ALTER TABLE public.social_links
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- order_index: posición en la lista para drag-and-drop futuro
ALTER TABLE public.social_links
  ADD COLUMN IF NOT EXISTS order_index INT NOT NULL DEFAULT 0;

-- updated_at: auditoría de última modificación
ALTER TABLE public.social_links
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Índice para consultas ordenadas eficientes en la página pública
CREATE INDEX IF NOT EXISTS idx_social_links_profile_order
  ON public.social_links (profile_id, order_index);

-- ─────────────────────────────────────────────
-- Nota sobre RLS existente:
-- La política "Gestión de redes sociales por el creador" usa FOR ALL,
-- que cubre INSERT, UPDATE y DELETE. Sigue siendo válida.
-- La política "Lectura pública de redes sociales" cubre SELECT.
-- No se requiere modificar las políticas existentes.
-- ─────────────────────────────────────────────
