-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION 003 — Donation buttons extended fields
-- Safe: additive only.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.donation_buttons
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.donation_buttons
  ADD COLUMN IF NOT EXISTS button_label TEXT;

ALTER TABLE public.donation_buttons
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.donation_buttons
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.donation_buttons
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Enforce: only one featured button per profile
-- (enforced in application layer; DB allows flexibility for edge cases)
CREATE INDEX IF NOT EXISTS idx_donation_buttons_profile_order
  ON public.donation_buttons (profile_id, order_index);

CREATE INDEX IF NOT EXISTS idx_donation_buttons_profile_active
  ON public.donation_buttons (profile_id, is_active);

-- Add constraint: amount must be > 0
ALTER TABLE public.donation_buttons
  DROP CONSTRAINT IF EXISTS donation_buttons_amount_positive;
ALTER TABLE public.donation_buttons
  ADD CONSTRAINT donation_buttons_amount_positive CHECK (amount > 0);

-- ROLLBACK (manual):
-- ALTER TABLE public.donation_buttons DROP COLUMN IF EXISTS description;
-- ALTER TABLE public.donation_buttons DROP COLUMN IF EXISTS button_label;
-- ALTER TABLE public.donation_buttons DROP COLUMN IF EXISTS is_active;
-- ALTER TABLE public.donation_buttons DROP COLUMN IF EXISTS is_featured;
-- ALTER TABLE public.donation_buttons DROP COLUMN IF EXISTS updated_at;
