-- DonacionesSaaS · Objetivos y niveles de apoyo
-- Convierte cada donation_button existente en un support_goal con un único
-- support_amount. La migración es atómica: cualquier fallo revierte todo.

BEGIN;

CREATE TABLE public.support_goals (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji       TEXT,
  title       TEXT        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  description TEXT        CHECK (description IS NULL OR char_length(description) <= 160),
  cover_url   TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  order_index INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT support_goals_emoji_length
    CHECK (emoji IS NULL OR char_length(emoji) <= 32)
);

CREATE TABLE public.support_amounts (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id              UUID          NOT NULL REFERENCES public.support_goals(id) ON DELETE CASCADE,
  amount               NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency             TEXT          NOT NULL DEFAULT 'USD'
                                      CHECK (currency ~ '^[A-Z]{3}$'),
  hotmart_checkout_url TEXT          NOT NULL,
  button_label         TEXT          CHECK (button_label IS NULL OR char_length(button_label) <= 40),
  is_featured          BOOLEAN       NOT NULL DEFAULT false,
  order_index          INTEGER       NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_support_goals_profile_order
  ON public.support_goals (profile_id, order_index);

CREATE INDEX idx_support_goals_profile_active_order
  ON public.support_goals (profile_id, is_active, order_index);

CREATE INDEX idx_support_amounts_goal_order
  ON public.support_amounts (goal_id, order_index);

CREATE UNIQUE INDEX idx_support_amounts_one_featured_per_goal
  ON public.support_amounts (goal_id)
  WHERE is_featured = true;

-- El UUID legado se conserva en ambas tablas. Los UUID son table-scoped y esto
-- permite migrar referencias históricas sin una tabla puente permanente.
INSERT INTO public.support_goals (
  id,
  profile_id,
  emoji,
  title,
  description,
  cover_url,
  is_active,
  order_index,
  created_at,
  updated_at
)
SELECT
  id,
  profile_id,
  emoji,
  title,
  description,
  NULL,
  is_active,
  order_index,
  created_at,
  updated_at
FROM public.donation_buttons;

INSERT INTO public.support_amounts (
  id,
  goal_id,
  amount,
  currency,
  hotmart_checkout_url,
  button_label,
  is_featured,
  order_index,
  created_at,
  updated_at
)
SELECT
  id,
  id,
  amount,
  UPPER(currency),
  hotmart_checkout_url,
  button_label,
  is_featured,
  0,
  created_at,
  updated_at
FROM public.donation_buttons;

-- Trasladar analytics sin perder eventos históricos.
ALTER TABLE public.analytics_events
  ADD COLUMN support_amount_id UUID;

UPDATE public.analytics_events
SET support_amount_id = donation_button_id
WHERE donation_button_id IS NOT NULL;

ALTER TABLE public.analytics_events
  ADD CONSTRAINT analytics_events_support_amount_id_fkey
  FOREIGN KEY (support_amount_id)
  REFERENCES public.support_amounts(id)
  ON DELETE SET NULL;

-- La tabla del webhook está preparada aunque el procesamiento permanezca
-- desactivado. Su referencia también debe apuntar al nuevo nivel.
ALTER TABLE public.webhook_events
  ADD COLUMN support_amount_id UUID;

UPDATE public.webhook_events
SET support_amount_id = donation_button_id
WHERE donation_button_id IS NOT NULL;

ALTER TABLE public.webhook_events
  ADD CONSTRAINT webhook_events_support_amount_id_fkey
  FOREIGN KEY (support_amount_id)
  REFERENCES public.support_amounts(id)
  ON DELETE SET NULL;

-- Verificación obligatoria antes de retirar el modelo anterior.
DO $$
DECLARE
  legacy_count BIGINT;
  goal_count BIGINT;
  amount_count BIGINT;
  missing_analytics BIGINT;
  missing_webhooks BIGINT;
BEGIN
  SELECT COUNT(*) INTO legacy_count FROM public.donation_buttons;
  SELECT COUNT(*) INTO goal_count
    FROM public.support_goals
    WHERE id IN (SELECT id FROM public.donation_buttons);
  SELECT COUNT(*) INTO amount_count
    FROM public.support_amounts
    WHERE id IN (SELECT id FROM public.donation_buttons);
  SELECT COUNT(*) INTO missing_analytics
    FROM public.analytics_events
    WHERE donation_button_id IS NOT NULL
      AND support_amount_id IS NULL;
  SELECT COUNT(*) INTO missing_webhooks
    FROM public.webhook_events
    WHERE donation_button_id IS NOT NULL
      AND support_amount_id IS NULL;

  IF legacy_count <> goal_count OR legacy_count <> amount_count THEN
    RAISE EXCEPTION 'Support migration count mismatch: legacy %, goals %, amounts %',
      legacy_count, goal_count, amount_count;
  END IF;

  IF missing_analytics > 0 OR missing_webhooks > 0 THEN
    RAISE EXCEPTION 'Support migration left unresolved references: analytics %, webhooks %',
      missing_analytics, missing_webhooks;
  END IF;
END $$;

DROP POLICY IF EXISTS "Public insert analytics"
  ON public.analytics_events;
DROP POLICY IF EXISTS "Public insert validated analytics"
  ON public.analytics_events;

ALTER TABLE public.analytics_events
  DROP CONSTRAINT IF EXISTS analytics_events_donation_button_id_fkey,
  DROP COLUMN donation_button_id;

ALTER TABLE public.webhook_events
  DROP CONSTRAINT IF EXISTS webhook_events_donation_button_id_fkey,
  DROP COLUMN donation_button_id;

ALTER TABLE public.support_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_amounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads active support goals"
  ON public.support_goals FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = support_goals.profile_id
        AND profiles.is_active = true
    )
  );

CREATE POLICY "Owners manage support goals"
  ON public.support_goals FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Public reads support amounts from active goals"
  ON public.support_amounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.support_goals
      JOIN public.profiles
        ON profiles.id = support_goals.profile_id
      WHERE support_goals.id = support_amounts.goal_id
        AND support_goals.is_active = true
        AND profiles.is_active = true
    )
  );

CREATE POLICY "Owners manage support amounts"
  ON public.support_amounts FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.support_goals
      WHERE support_goals.id = support_amounts.goal_id
        AND support_goals.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.support_goals
      WHERE support_goals.id = support_amounts.goal_id
        AND support_goals.profile_id = auth.uid()
    )
  );

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
        AND support_amount_id IS NULL
      )
      OR
      (
        event_type IN ('amount_selected', 'hotmart_redirect')
        AND support_amount_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.support_amounts
          JOIN public.support_goals
            ON support_goals.id = support_amounts.goal_id
          WHERE support_amounts.id = analytics_events.support_amount_id
            AND support_goals.profile_id = analytics_events.profile_id
            AND support_goals.is_active = true
        )
      )
    )
  );

-- Ya no queda ninguna referencia viva al modelo anterior.
DROP TABLE public.donation_buttons;

-- Portadas opcionales de objetivos.
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'support-goals',
  'support-goals',
  true,
  5242880,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp'];

DROP POLICY IF EXISTS "support_goal_cover_public_read"
  ON storage.objects;
DROP POLICY IF EXISTS "support_goal_cover_owner_insert"
  ON storage.objects;
DROP POLICY IF EXISTS "support_goal_cover_owner_update"
  ON storage.objects;
DROP POLICY IF EXISTS "support_goal_cover_owner_delete"
  ON storage.objects;

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

COMMIT;
