-- DonacionesSaaS · Configuración opcional de Hotmart Checkout Elements
-- Revisión manual requerida antes de aplicar. No reemplaza ni modifica las URL
-- existentes: los niveles sin código de oferta conservan su checkout por enlace.

BEGIN;

ALTER TABLE public.support_amounts
  ADD COLUMN IF NOT EXISTS hotmart_offer_code TEXT;

ALTER TABLE public.support_amounts
  DROP CONSTRAINT IF EXISTS support_amounts_hotmart_offer_code_format;

ALTER TABLE public.support_amounts
  ADD CONSTRAINT support_amounts_hotmart_offer_code_format
  CHECK (
    hotmart_offer_code IS NULL
    OR hotmart_offer_code ~ '^[A-Za-z0-9_-]{1,128}$'
  );

COMMENT ON COLUMN public.support_amounts.hotmart_offer_code IS
  'Código público de la oferta usado por Hotmart Checkout Elements. NULL usa el enlace de checkout como fallback.';

COMMIT;
