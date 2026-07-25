-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION 008 — Mejorar trigger handle_new_user para OAuth (Google)
-- 
-- Problema: cuando Google OAuth crea el usuario, raw_user_meta_data
-- contiene 'name', 'full_name' y 'email', pero NO 'username'.
-- El trigger original usaba 'user_XXXXXXXX' como fallback, lo cual
-- no es amigable ni único de forma predecible.
--
-- Solución:
--   display_name → toma 'full_name', luego 'name', luego 'display_name', luego 'Creador'
--   username     → toma 'username' (registro email), o genera uno único
--                  derivado del email (parte antes del @) + 4 chars del UUID
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_display_name TEXT;
  v_username     TEXT;
  v_base         TEXT;
  v_candidate    TEXT;
  v_counter      INT := 0;
BEGIN
  -- ── Display name: prefer OAuth full_name, then name, then meta display_name
  v_display_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
    'Creador'
  );

  -- ── Username: use explicit 'username' from email registration if available
  IF NEW.raw_user_meta_data->>'username' IS NOT NULL
     AND TRIM(NEW.raw_user_meta_data->>'username') != '' THEN
    v_username := LOWER(TRIM(NEW.raw_user_meta_data->>'username'));
  ELSE
    -- Derive from email: take the part before '@', strip non-alphanum, add short uuid suffix
    v_base := REGEXP_REPLACE(
      LOWER(SPLIT_PART(COALESCE(NEW.email, ''), '@', 1)),
      '[^a-z0-9_]', '', 'g'
    );
    -- Ensure base is not empty
    IF v_base = '' THEN
      v_base := 'user';
    END IF;
    -- Truncate to 12 chars to leave room for suffix
    v_base := LEFT(v_base, 12);

    -- Find a unique username with incrementing suffix
    v_candidate := v_base || '_' || LEFT(REPLACE(NEW.id::text, '-', ''), 4);
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_candidate) LOOP
      v_counter := v_counter + 1;
      v_candidate := v_base || '_' || v_counter::text;
    END LOOP;
    v_username := v_candidate;
  END IF;

  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, v_username, v_display_name)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger (function already replaced above)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
