-- ═══════════════════════════════════════════════════════════════════
-- DonacionesSaaS · Supabase Storage Setup
-- Run this manually in the Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. Buckets
-- ─────────────────────────────────────────────
-- avatars: public reads, max 2 MB
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,          -- 2 MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public             = true,
      file_size_limit    = 2097152,
      allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp'];

-- banners: public reads, max 5 MB
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners',
  true,
  5242880,          -- 5 MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public             = true,
      file_size_limit    = 5242880,
      allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp'];

-- support-goals: portadas públicas opcionales, max 5 MB
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'support-goals',
  'support-goals',
  true,
  5242880,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public             = true,
      file_size_limit    = 5242880,
      allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp'];


-- ─────────────────────────────────────────────
-- 2. RLS Policies — avatars
-- ─────────────────────────────────────────────
-- Public SELECT
CREATE POLICY "avatar_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Authenticated user can INSERT only inside their own folder
CREATE POLICY "avatar_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated user can UPDATE only their own files
CREATE POLICY "avatar_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated user can DELETE only their own files
CREATE POLICY "avatar_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ─────────────────────────────────────────────
-- 3. RLS Policies — banners
-- ─────────────────────────────────────────────
-- Public SELECT
CREATE POLICY "banner_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

-- Authenticated user can INSERT only inside their own folder
CREATE POLICY "banner_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'banners'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated user can UPDATE only their own files
CREATE POLICY "banner_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'banners'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated user can DELETE only their own files
CREATE POLICY "banner_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'banners'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ─────────────────────────────────────────────
-- 4. RLS Policies — support-goals
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "support_goal_cover_public_read" ON storage.objects;
DROP POLICY IF EXISTS "support_goal_cover_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "support_goal_cover_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "support_goal_cover_owner_delete" ON storage.objects;

CREATE POLICY "support_goal_cover_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'support-goals');

CREATE POLICY "support_goal_cover_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'support-goals'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "support_goal_cover_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'support-goals'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "support_goal_cover_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'support-goals'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
