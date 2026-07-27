-- Harden public-profile read and analytics insert policies.
-- No columns or existing records are modified.

BEGIN;

DROP POLICY IF EXISTS "Lectura pública de redes sociales"
  ON public.social_links;

DROP POLICY IF EXISTS "Lectura pública de redes sociales activas"
  ON public.social_links;

CREATE POLICY "Lectura pública de redes sociales activas"
  ON public.social_links FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = social_links.profile_id
        AND profiles.is_active = true
    )
  );

DROP POLICY IF EXISTS "Lectura pública de botones de donación"
  ON public.donation_buttons;

DROP POLICY IF EXISTS "Lectura pública de botones activos"
  ON public.donation_buttons;

DROP POLICY IF EXISTS "Lectura pública de botones de donación activos"
  ON public.donation_buttons;

CREATE POLICY "Lectura pública de botones de donación activos"
  ON public.donation_buttons FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = donation_buttons.profile_id
        AND profiles.is_active = true
    )
  );

DROP POLICY IF EXISTS "Public insert analytics"
  ON public.analytics_events;

DROP POLICY IF EXISTS "Public insert validated analytics"
  ON public.analytics_events;

CREATE POLICY "Public insert validated analytics"
  ON public.analytics_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = analytics_events.profile_id
        AND profiles.is_active = true
    )
    AND (
      (
        event_type = 'profile_view'
        AND donation_button_id IS NULL
      )
      OR
      (
        event_type IN ('amount_selected', 'hotmart_redirect')
        AND donation_button_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.donation_buttons
          WHERE donation_buttons.id = analytics_events.donation_button_id
            AND donation_buttons.profile_id = analytics_events.profile_id
            AND donation_buttons.is_active = true
        )
      )
    )
  );

COMMIT;
