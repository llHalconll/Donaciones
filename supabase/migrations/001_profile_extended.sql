-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION 001 — Profile extended fields
-- Safe: only adds columns if not already present.
-- Compatible with existing profiles rows.
-- Run AFTER schema.sql
-- ═══════════════════════════════════════════════════════════════════

-- account_type: 'individual' | 'organization'
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT
    NOT NULL DEFAULT 'individual'
    CHECK (account_type IN ('individual', 'organization'));

-- website_url: optional personal/organizational URL
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS website_url TEXT;

-- plan: SaaS plan level
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan TEXT
    NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro', 'organization'));

-- ROLLBACK (manual):
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS account_type;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS website_url;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS plan;
