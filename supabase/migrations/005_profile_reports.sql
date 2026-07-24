-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION 005 — Crear tabla profile_reports (NUEVA)
-- No existe en schema.sql. Se crea con CREATE TABLE IF NOT EXISTS.
--
-- Propósito: recibir reportes anónimos sobre perfiles sospechosos.
-- Solo administradores pueden leer y actualizar reportes.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.profile_reports (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason         TEXT        NOT NULL CHECK (
                               reason IN (
                                 'fraud', 'impersonation', 'prohibited_content',
                                 'suspicious_link', 'spam', 'other'
                               )
                             ),
  description    TEXT        CHECK (char_length(description) <= 1000),
  reporter_email TEXT,       -- email del denunciante (nunca expuesto públicamente)
  status         TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at    TIMESTAMPTZ,
  reviewed_by    UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.profile_reports ENABLE ROW LEVEL SECURITY;

-- Solo administradores pueden leer reportes
CREATE POLICY "Admins read reports"
  ON public.profile_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Cualquier visitante puede insertar un reporte (anónimo)
CREATE POLICY "Public insert report"
  ON public.profile_reports FOR INSERT
  WITH CHECK (
    reason IN ('fraud', 'impersonation', 'prohibited_content', 'suspicious_link', 'spam', 'other')
    AND (description IS NULL OR char_length(description) <= 1000)
  );

-- Solo administradores pueden actualizar el estado del reporte
CREATE POLICY "Admins update reports"
  ON public.profile_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Índice para filtrar reportes pendientes eficientemente
CREATE INDEX IF NOT EXISTS idx_profile_reports_status
  ON public.profile_reports (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profile_reports_profile
  ON public.profile_reports (profile_id, created_at DESC);
