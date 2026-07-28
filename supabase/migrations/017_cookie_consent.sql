-- DonacionesSaaS · Política de Cookies y evidencia mínima de consentimiento
-- Los visitantes anónimos conservan su decisión solo en el navegador.
-- La base de datos registra únicamente decisiones de usuarios autenticados.

BEGIN;

ALTER TABLE public.legal_document_versions
  DROP CONSTRAINT IF EXISTS legal_document_versions_document_type_check;

ALTER TABLE public.legal_document_versions
  ADD CONSTRAINT legal_document_versions_document_type_check
  CHECK (document_type IN ('terms', 'privacy', 'cookies'));

UPDATE public.legal_document_versions
SET is_current = false
WHERE document_type = 'cookies';

INSERT INTO public.legal_document_versions (
  document_type,
  version,
  effective_at,
  is_current
)
VALUES (
  'cookies',
  '2026-07-28-draft-1',
  '2026-07-28T00:00:00-05:00',
  true
)
ON CONFLICT (document_type, version) DO UPDATE
SET effective_at = EXCLUDED.effective_at,
    is_current = EXCLUDED.is_current;

CREATE TABLE IF NOT EXISTS public.cookie_consent_records (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type         TEXT        NOT NULL DEFAULT 'cookies'
                                  CHECK (document_type = 'cookies'),
  cookie_policy_version TEXT        NOT NULL,
  necessary             BOOLEAN     NOT NULL DEFAULT true CHECK (necessary = true),
  preferences           BOOLEAN     NOT NULL,
  analytics             BOOLEAN     NOT NULL,
  consent_method        TEXT        NOT NULL
                                    CHECK (
                                      consent_method IN (
                                        'banner_accept_all',
                                        'banner_reject_nonessential',
                                        'preferences_save',
                                        'footer_preferences'
                                      )
                                    ),
  consented_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cookie_consent_records_document_version_fkey
    FOREIGN KEY (document_type, cookie_policy_version)
    REFERENCES public.legal_document_versions(document_type, version)
);

CREATE INDEX IF NOT EXISTS idx_cookie_consent_user_time
  ON public.cookie_consent_records (user_id, consented_at DESC);

ALTER TABLE public.cookie_consent_records ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.cookie_consent_records FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.record_current_cookie_consent(
  p_cookie_policy_version TEXT,
  p_preferences BOOLEAN,
  p_analytics BOOLEAN,
  p_consent_method TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_consent_method NOT IN (
    'banner_accept_all',
    'banner_reject_nonessential',
    'preferences_save',
    'footer_preferences'
  ) THEN
    RAISE EXCEPTION 'Invalid consent method';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.legal_document_versions
    WHERE document_type = 'cookies'
      AND version = p_cookie_policy_version
      AND is_current = true
  ) THEN
    RAISE EXCEPTION 'Unknown or inactive cookie policy version';
  END IF;

  INSERT INTO public.cookie_consent_records (
    user_id,
    cookie_policy_version,
    preferences,
    analytics,
    consent_method
  )
  VALUES (
    v_user_id,
    p_cookie_policy_version,
    p_preferences,
    p_analytics,
    p_consent_method
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_current_cookie_consent(
  TEXT,
  BOOLEAN,
  BOOLEAN,
  TEXT
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.record_current_cookie_consent(
  TEXT,
  BOOLEAN,
  BOOLEAN,
  TEXT
) TO authenticated;

COMMIT;
