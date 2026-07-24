-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION 003 — Extender tabla donation_buttons
-- Base actual (schema.sql ya aplicado):
--   id, profile_id, title, amount, currency,
--   hotmart_checkout_url, order_index, created_at
--
-- Esta migración AGREGA únicamente las columnas que faltan.
-- ═══════════════════════════════════════════════════════════════════

-- description: descripción corta del monto (opcional, visible al visitante)
ALTER TABLE public.donation_buttons
  ADD COLUMN IF NOT EXISTS description TEXT;

-- button_label: texto personalizado del botón CTA (opcional)
--   Ej: "Apoyar ahora", "Donar $10", etc.
ALTER TABLE public.donation_buttons
  ADD COLUMN IF NOT EXISTS button_label TEXT;

-- is_active: permite al creador ocultar un botón sin eliminarlo
ALTER TABLE public.donation_buttons
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- is_featured: marca UN botón como destacado (Popular)
--   Solo debe haber uno por perfil — se fuerza en la capa de aplicación.
ALTER TABLE public.donation_buttons
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- updated_at: auditoría de última modificación
ALTER TABLE public.donation_buttons
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Constraint: el monto debe ser positivo
-- Solo se agrega si no existe (nombre único del constraint)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'donation_buttons_amount_positive'
    AND conrelid = 'public.donation_buttons'::regclass
  ) THEN
    ALTER TABLE public.donation_buttons
      ADD CONSTRAINT donation_buttons_amount_positive CHECK (amount > 0);
  END IF;
END $$;

-- Índice para consultas de botones activos en la página pública
CREATE INDEX IF NOT EXISTS idx_donation_buttons_profile_order
  ON public.donation_buttons (profile_id, order_index);

CREATE INDEX IF NOT EXISTS idx_donation_buttons_profile_active
  ON public.donation_buttons (profile_id, is_active);

-- ─────────────────────────────────────────────
-- Nota sobre RLS existente:
-- "Lectura pública de botones de donación" y "Gestión de botones por el creador"
-- siguen siendo válidas. No se requieren cambios.
-- ─────────────────────────────────────────────
