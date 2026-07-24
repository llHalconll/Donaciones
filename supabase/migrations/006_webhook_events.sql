-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION 006 — Crear tabla webhook_events (NUEVA, PREPARADA)
-- No existe en schema.sql. Se crea con CREATE TABLE IF NOT EXISTS.
--
-- Propósito: almacenar eventos futuros del webhook de Hotmart.
-- Esta tabla está PREPARADA pero NO está integrada con ningún webhook activo.
-- Activar la integración requiere: HOTMART_WEBHOOK_ENABLED=true y
-- la verificación de firma HMAC en el Route Handler.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider            TEXT        NOT NULL DEFAULT 'hotmart',
  external_event_id   TEXT        UNIQUE,   -- idempotencia: evita procesar duplicados
  event_type          TEXT,                 -- nombre del evento (ej: 'PURCHASE_COMPLETE')
  profile_id          UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  donation_button_id  UUID        REFERENCES public.donation_buttons(id) ON DELETE SET NULL,
  payload             JSONB,                -- body del webhook (sanitizado)
  status              TEXT        NOT NULL DEFAULT 'received'
                                    CHECK (status IN ('received', 'processed', 'failed', 'ignored')),
  error_message       TEXT,
  processed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Sin políticas para anon/authenticated: acceso exclusivo via service_role
-- en el Route Handler del servidor. Ningún cliente puede leer ni insertar.
-- Esto es intencional — los webhooks solo se procesan server-side.

-- Índice de idempotencia
CREATE INDEX IF NOT EXISTS idx_webhook_events_external_id
  ON public.webhook_events (external_event_id)
  WHERE external_event_id IS NOT NULL;

-- Índice de estado para monitoreo
CREATE INDEX IF NOT EXISTS idx_webhook_events_status
  ON public.webhook_events (status, created_at DESC);
