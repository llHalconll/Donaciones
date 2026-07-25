-- Migration: add emoji column to donation_buttons
-- Run in Supabase SQL Editor

ALTER TABLE public.donation_buttons
  ADD COLUMN IF NOT EXISTS emoji text DEFAULT NULL;

-- Limit to a single emoji character (or empty)
ALTER TABLE public.donation_buttons
  ADD CONSTRAINT donation_buttons_emoji_length
  CHECK (emoji IS NULL OR char_length(emoji) <= 8);

COMMENT ON COLUMN public.donation_buttons.emoji IS 'Optional emoji prefix shown before the button title on the public profile.';
