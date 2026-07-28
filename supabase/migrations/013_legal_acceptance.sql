-- DonacionesSaaS · Registro versionado de aceptación legal
-- Conserva evidencia mínima: documento, versión, método y hora del servidor.

BEGIN;

CREATE TABLE IF NOT EXISTS public.legal_document_versions (
  document_type TEXT        NOT NULL
                             CHECK (document_type IN ('terms', 'privacy')),
  version       TEXT        NOT NULL,
  effective_at  TIMESTAMPTZ NOT NULL,
  is_current    BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (document_type, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_legal_document_current
  ON public.legal_document_versions (document_type)
  WHERE is_current = true;

INSERT INTO public.legal_document_versions (
  document_type,
  version,
  effective_at,
  is_current
)
VALUES
  ('terms', '2026-07-28-draft-1', '2026-07-28T00:00:00-05:00', true),
  ('privacy', '2026-07-28-draft-1', '2026-07-28T00:00:00-05:00', true)
ON CONFLICT (document_type, version) DO UPDATE
SET effective_at = EXCLUDED.effective_at,
    is_current = EXCLUDED.is_current;

CREATE TABLE IF NOT EXISTS public.legal_acceptances (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type     TEXT        NOT NULL,
  document_version  TEXT        NOT NULL,
  acceptance_method TEXT        NOT NULL
                                CHECK (
                                  acceptance_method IN (
                                    'email_password',
                                    'google_oauth',
                                    'reauthorization'
                                  )
                                ),
  accepted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT legal_acceptances_document_version_fkey
    FOREIGN KEY (document_type, document_version)
    REFERENCES public.legal_document_versions(document_type, version),
  CONSTRAINT legal_acceptances_unique_evidence
    UNIQUE (user_id, document_type, document_version)
);

CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user_time
  ON public.legal_acceptances (user_id, accepted_at DESC);

ALTER TABLE public.legal_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.legal_document_versions FROM anon, authenticated;
GRANT SELECT ON public.legal_document_versions TO anon, authenticated;

REVOKE ALL ON public.legal_acceptances FROM anon, authenticated;
GRANT SELECT ON public.legal_acceptances TO authenticated;

DROP POLICY IF EXISTS "Public reads current legal versions"
  ON public.legal_document_versions;
CREATE POLICY "Public reads current legal versions"
  ON public.legal_document_versions FOR SELECT
  TO anon, authenticated
  USING (is_current = true);

DROP POLICY IF EXISTS "Users read their legal acceptances"
  ON public.legal_acceptances;
CREATE POLICY "Users read their legal acceptances"
  ON public.legal_acceptances FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.capture_signup_legal_acceptance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_terms_version   TEXT := NULLIF(TRIM(NEW.raw_user_meta_data->>'legal_terms_version'), '');
  v_privacy_version TEXT := NULLIF(TRIM(NEW.raw_user_meta_data->>'legal_privacy_version'), '');
  v_method          TEXT := NULLIF(TRIM(NEW.raw_user_meta_data->>'legal_acceptance_method'), '');
BEGIN
  IF v_method <> 'email_password'
     OR v_terms_version IS NULL
     OR v_privacy_version IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.legal_acceptances (
    user_id,
    document_type,
    document_version,
    acceptance_method
  )
  SELECT NEW.id, evidence.document_type, evidence.document_version, v_method
  FROM (
    VALUES
      ('terms'::TEXT, v_terms_version),
      ('privacy'::TEXT, v_privacy_version)
  ) AS evidence(document_type, document_version)
  JOIN public.legal_document_versions versions
    ON versions.document_type = evidence.document_type
   AND versions.version = evidence.document_version
  ON CONFLICT (user_id, document_type, document_version) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_legal_acceptance ON auth.users;
CREATE TRIGGER on_auth_user_legal_acceptance
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.capture_signup_legal_acceptance();

REVOKE ALL ON FUNCTION public.capture_signup_legal_acceptance() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.record_current_legal_acceptance(
  p_terms_version TEXT,
  p_privacy_version TEXT,
  p_acceptance_method TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_matched_documents INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_acceptance_method NOT IN ('google_oauth', 'reauthorization') THEN
    RAISE EXCEPTION 'Invalid acceptance method';
  END IF;

  SELECT COUNT(*)
  INTO v_matched_documents
  FROM public.legal_document_versions
  WHERE (document_type = 'terms' AND version = p_terms_version)
     OR (document_type = 'privacy' AND version = p_privacy_version);

  IF v_matched_documents <> 2 THEN
    RAISE EXCEPTION 'Unknown legal document version';
  END IF;

  INSERT INTO public.legal_acceptances (
    user_id,
    document_type,
    document_version,
    acceptance_method
  )
  VALUES
    (v_user_id, 'terms', p_terms_version, p_acceptance_method),
    (v_user_id, 'privacy', p_privacy_version, p_acceptance_method)
  ON CONFLICT (user_id, document_type, document_version) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.record_current_legal_acceptance(TEXT, TEXT, TEXT)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_current_legal_acceptance(TEXT, TEXT, TEXT)
  TO authenticated;

COMMIT;
