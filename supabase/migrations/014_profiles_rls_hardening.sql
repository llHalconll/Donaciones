-- DonacionesSaaS · Separación entre datos públicos, datos del propietario
-- y funciones administrativas de perfiles.

BEGIN;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND is_admin = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

DROP POLICY IF EXISTS "Lectura pública de perfiles activos"
  ON public.profiles;
DROP POLICY IF EXISTS "Anonymous read active public profiles"
  ON public.profiles;
DROP POLICY IF EXISTS "Owners read their profile"
  ON public.profiles;
DROP POLICY IF EXISTS "Admins read all profiles"
  ON public.profiles;

CREATE POLICY "Anonymous read active public profiles"
  ON public.profiles FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Owners read their profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

-- The anonymous role can only request fields rendered by the public profile.
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id,
  username,
  display_name,
  bio,
  avatar_url,
  banner_url,
  account_type,
  website_url,
  is_active
) ON public.profiles TO anon;

-- Authenticated owners and platform administrators still need complete rows,
-- but RLS now limits which rows each role can see.
GRANT SELECT ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "Los usuarios pueden editar su propio perfil"
  ON public.profiles;
DROP POLICY IF EXISTS "Owners update their profile"
  ON public.profiles;
DROP POLICY IF EXISTS "Admins update profiles"
  ON public.profiles;

CREATE POLICY "Owners update their profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- plan, is_active and is_admin cannot be changed through a direct client
-- update. Dedicated SECURITY DEFINER functions handle allowed state changes.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (
  username,
  display_name,
  bio,
  avatar_url,
  banner_url,
  account_type,
  website_url,
  updated_at
) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.deactivate_own_profile()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.profiles
  SET is_active = false,
      updated_at = NOW()
  WHERE id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.deactivate_own_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deactivate_own_profile() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_profile_active(
  p_profile_id UUID,
  p_is_active BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  IF p_profile_id = auth.uid() AND p_is_active = false THEN
    RAISE EXCEPTION 'Administrators cannot deactivate themselves';
  END IF;

  UPDATE public.profiles
  SET is_active = p_is_active,
      updated_at = NOW()
  WHERE id = p_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_profile_active(UUID, BOOLEAN)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_active(UUID, BOOLEAN)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.is_username_available(
  candidate_username TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    candidate_username ~ '^[a-z0-9_-]{3,30}$'
    AND NOT EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE username = candidate_username
    );
$$;

REVOKE ALL ON FUNCTION public.is_username_available(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_username_available(TEXT)
  TO anon, authenticated;

-- Administrators need complete read access for dashboard counts and review.
DROP POLICY IF EXISTS "Admins read all social links"
  ON public.social_links;
CREATE POLICY "Admins read all social links"
  ON public.social_links FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins read all support goals"
  ON public.support_goals;
CREATE POLICY "Admins read all support goals"
  ON public.support_goals FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins read all support amounts"
  ON public.support_amounts;
CREATE POLICY "Admins read all support amounts"
  ON public.support_amounts FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

COMMIT;
