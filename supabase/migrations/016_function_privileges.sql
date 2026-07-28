-- DonacionesSaaS · Privilegios explícitos para funciones SECURITY DEFINER
-- Supabase puede conceder EXECUTE a anon/authenticated mediante privilegios
-- predeterminados. Cada función se cierra y se reabre solo al rol necesario.

BEGIN;

REVOKE ALL ON FUNCTION public.handle_new_user()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.capture_signup_legal_acceptance()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.record_current_legal_acceptance(TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_current_legal_acceptance(TEXT, TEXT, TEXT)
  TO authenticated;

REVOKE ALL ON FUNCTION public.is_current_user_admin()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin()
  TO authenticated;

REVOKE ALL ON FUNCTION public.deactivate_own_profile()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_own_profile()
  TO authenticated;

REVOKE ALL ON FUNCTION public.admin_set_profile_active(UUID, BOOLEAN)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_active(UUID, BOOLEAN)
  TO authenticated;

REVOKE ALL ON FUNCTION public.is_username_available(TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_username_available(TEXT)
  TO anon, authenticated;

REVOKE ALL ON FUNCTION public.purge_expired_operational_data()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_operational_data()
  TO service_role;

COMMIT;
