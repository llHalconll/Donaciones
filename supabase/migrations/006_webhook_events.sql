-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION 006 — Webhook events table (prepared, not active)
-- Receives future Hotmart webhook confirmations.
-- NOT connected to any live integration yet.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'hotmart',
  external_event_id TEXT UNIQUE,  -- idempotency: prevents duplicate processing
  event_type TEXT,                -- e.g. 'PURCHASE_COMPLETE' (Hotmart event name)
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  donation_button_id UUID REFERENCES public.donation_buttons(id) ON DELETE SET NULL,
  payload JSONB,                  -- raw webhook body (sanitized)
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'processed', 'failed', 'ignored')),
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service-role (used in Route Handler, server-only) can insert/read
-- No RLS policies needed for client — this table is server-access only
-- (anon and authenticated roles have no policies = no access)

-- Idempotency index
CREATE INDEX IF NOT EXISTS idx_webhook_events_external_id
  ON public.webhook_events (external_event_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_status
  ON public.webhook_events (status, created_at DESC);

-- ROLLBACK: DROP TABLE IF EXISTS public.webhook_events;

-- ═══════════════════════════════════════════════════════════════════
-- Environment variables required for webhook (NOT YET IMPLEMENTED):
--   HOTMART_WEBHOOK_SECRET — HMAC secret from Hotmart dashboard
--   HOTMART_TOKEN          — API bearer token (for future verification)
-- ═══════════════════════════════════════════════════════════════════
