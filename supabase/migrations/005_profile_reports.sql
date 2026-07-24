-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION 005 — Profile reports table
-- Visitors can report profiles; admins review.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.profile_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (
    reason IN ('fraud', 'impersonation', 'prohibited_content', 'suspicious_link', 'spam', 'other')
  ),
  description TEXT CHECK (char_length(description) <= 1000),
  reporter_email TEXT,      -- optional, never exposed publicly
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.profile_reports ENABLE ROW LEVEL SECURITY;

-- Only admins can read reports (verified server-side via is_admin check)
-- No direct SELECT policy for anonymous — admin access is server-side only
CREATE POLICY "Admins read reports"
  ON public.profile_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Anyone can insert a report (anonymous reporting)
CREATE POLICY "Public insert report"
  ON public.profile_reports FOR INSERT
  WITH CHECK (
    reason IN ('fraud', 'impersonation', 'prohibited_content', 'suspicious_link', 'spam', 'other')
    AND (description IS NULL OR char_length(description) <= 1000)
  );

-- Only admins can update status
CREATE POLICY "Admins update reports"
  ON public.profile_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ROLLBACK: DROP TABLE IF EXISTS public.profile_reports;
