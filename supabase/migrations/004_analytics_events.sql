-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION 004 — Crear tabla analytics_events (NUEVA)
-- No existe en schema.sql. Se crea con CREATE TABLE IF NOT EXISTS.
--
-- Propósito: registrar eventos de visita y clics hacia Hotmart.
-- NO registra pagos confirmados — solo eventos de navegación.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  donation_button_id UUID        REFERENCES public.donation_buttons(id) ON DELETE SET NULL,
  event_type         TEXT        NOT NULL CHECK (
                                   event_type IN ('profile_view', 'amount_selected', 'hotmart_redirect')
                                 ),
  session_id         TEXT,       -- token de sesión anónima (no vinculado a auth)
  referrer           TEXT,       -- URL de referencia truncada (máx. 200 chars)
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- El dueño del perfil puede leer sus propios eventos
CREATE POLICY "Owner reads their analytics"
  ON public.analytics_events FOR SELECT
  USING (auth.uid() = profile_id);

-- Visitantes anónimos pueden insertar eventos (app valida event_type antes de llamar)
CREATE POLICY "Public insert analytics"
  ON public.analytics_events FOR INSERT
  WITH CHECK (
    event_type IN ('profile_view', 'amount_selected', 'hotmart_redirect')
  );

-- Índices para consultas de series de tiempo
CREATE INDEX IF NOT EXISTS idx_analytics_events_profile_time
  ON public.analytics_events (profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type
  ON public.analytics_events (profile_id, event_type, created_at DESC);
