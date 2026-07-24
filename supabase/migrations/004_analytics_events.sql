-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION 004 — Analytics events table
-- Tracks profile views, amount selections, and Hotmart redirects.
-- Does NOT track payment confirmations.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  donation_button_id UUID REFERENCES public.donation_buttons(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('profile_view', 'amount_selected', 'hotmart_redirect')),
  session_id TEXT,          -- anonymous session token, not linked to auth
  referrer TEXT,            -- truncated referrer URL, no sensitive params
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Profile owner can read their own events
CREATE POLICY "Owner reads their analytics"
  ON public.analytics_events FOR SELECT
  USING (auth.uid() = profile_id);

-- Public anonymous insert (visitors can trigger events)
-- The application layer validates event_type before insert
CREATE POLICY "Public insert analytics"
  ON public.analytics_events FOR INSERT
  WITH CHECK (
    event_type IN ('profile_view', 'amount_selected', 'hotmart_redirect')
  );

-- Index for time-series queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_profile_time
  ON public.analytics_events (profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type
  ON public.analytics_events (profile_id, event_type, created_at DESC);

-- ROLLBACK: DROP TABLE IF EXISTS public.analytics_events;
