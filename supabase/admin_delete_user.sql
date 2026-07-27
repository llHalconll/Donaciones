-- ═══════════════════════════════════════════════════════════════════
-- GUÍA DE ELIMINACIÓN DEFINITIVA DE USUARIO — DonacionesSaaS
-- ═══════════════════════════════════════════════════════════════════
--
-- CUÁNDO USAR ESTA GUÍA
-- ─────────────────────
-- Cuando un usuario solicita la eliminación definitiva de su cuenta
-- (derecho al olvido, GDPR/CCPA, solicitud directa por email).
--
-- IMPORTANTE: Este proceso es IRREVERSIBLE.
-- Ejecuta siempre en este orden exacto.
-- Nunca ejecutes en producción sin verificar el UUID del usuario primero.
--
-- PREREQUISITOS
-- ─────────────
-- 1. Tener acceso al SQL Editor del proyecto en Supabase Dashboard
-- 2. O usar psql con la connection string de servicio
-- 3. Tener el UUID del usuario (se puede buscar en Authentication → Users)
--
-- PASO 0: VERIFICAR EL USUARIO
-- Busca y confirma que el UUID es correcto antes de continuar.
-- ═══════════════════════════════════════════════════════════════════

-- Reemplaza 'USER_UUID_AQUI' con el UUID real del usuario
-- (se encuentra en Supabase Dashboard → Authentication → Users)

-- Verificación de identidad:
SELECT
  u.id,
  u.email,
  u.created_at AS auth_created,
  p.username,
  p.display_name,
  p.plan,
  p.is_active
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.id = 'USER_UUID_AQUI';

-- Si el resultado es el usuario correcto, continúa con los pasos siguientes.
-- Si no aparece ningún resultado, el UUID es incorrecto. DETENTE.


-- ═══════════════════════════════════════════════════════════════════
-- RELACIONES Y CASCADAS EXISTENTES (para referencia)
-- ═══════════════════════════════════════════════════════════════════
--
-- profiles (id) → FK fuente:
--   social_links.profile_id        ON DELETE CASCADE  ← se elimina automáticamente
--   support_goals.profile_id       ON DELETE CASCADE  ← elimina objetivos y niveles
--   analytics_events.profile_id    ON DELETE CASCADE  ← se elimina automáticamente
--   profile_reports.profile_id     ON DELETE CASCADE  ← se elimina automáticamente
--
-- support_amounts (id) → FK fuente:
--   analytics_events.support_amount_id   ON DELETE SET NULL  ← evento persiste, FK = NULL
--
-- auth.users (id) → FK fuente:
--   profiles.id                    (trigger on_auth_user_created)
--   profile_reports.reviewed_by    ON DELETE SET NULL
--
-- CONCLUSIÓN:
-- Al eliminar el registro de auth.users, Supabase Auth elimina el usuario.
-- Pero los registros de public.profiles y sus dependientes NO se eliminan automáticamente
-- porque la FK va de profiles → auth.users (no al revés con CASCADE).
-- El orden correcto es: datos de app → auth.users.


-- ═══════════════════════════════════════════════════════════════════
-- PASO 1: ELIMINAR ARCHIVOS DE STORAGE
-- ═══════════════════════════════════════════════════════════════════
--
-- Storage no se puede eliminar vía SQL directamente.
-- Debes hacerlo desde el Supabase Dashboard o mediante la API de servicio.
--
-- Opción A — Supabase Dashboard:
--   1. Ve a Storage → avatars
--   2. Busca la carpeta con el nombre del UUID del usuario
--   3. Elimina todos los archivos dentro de esa carpeta
--   4. Repite en Storage → banners y Storage → support-goals
--
-- Opción B — Supabase Management API (script curl):
--   curl -X DELETE "https://YOUR_PROJECT.supabase.co/storage/v1/object/avatars/USER_UUID_AQUI/avatar.webp" \
--        -H "Authorization: Bearer SERVICE_ROLE_KEY"
--
--   curl -X DELETE "https://YOUR_PROJECT.supabase.co/storage/v1/object/banners/USER_UUID_AQUI/banner.webp" \
--        -H "Authorization: Bearer SERVICE_ROLE_KEY"
--
-- Confirmar eliminación antes de continuar:
SELECT name FROM storage.objects
WHERE bucket_id IN ('avatars', 'banners', 'support-goals')
  AND (storage.foldername(name))[1] = 'USER_UUID_AQUI';
-- Debe devolver 0 filas antes de continuar.


-- ═══════════════════════════════════════════════════════════════════
-- PASO 2: ELIMINAR EVENTOS DE ANALYTICS
-- ═══════════════════════════════════════════════════════════════════
-- Nota: si en el PASO 4 eliminas public.profiles, esto se hará
-- automáticamente por CASCADE. Incluido aquí para transparencia.

DELETE FROM public.analytics_events
WHERE profile_id = 'USER_UUID_AQUI';

-- Verificar:
SELECT COUNT(*) AS remaining_events FROM public.analytics_events WHERE profile_id = 'USER_UUID_AQUI';
-- Debe ser 0.


-- ═══════════════════════════════════════════════════════════════════
-- PASO 3: ELIMINAR REPORTES ASOCIADOS
-- ═══════════════════════════════════════════════════════════════════
-- Nota: también se eliminan por CASCADE al eliminar el perfil.

DELETE FROM public.profile_reports
WHERE profile_id = 'USER_UUID_AQUI';

SELECT COUNT(*) AS remaining_reports FROM public.profile_reports WHERE profile_id = 'USER_UUID_AQUI';
-- Debe ser 0.


-- ═══════════════════════════════════════════════════════════════════
-- PASO 4: ELIMINAR EL PERFIL (y sus dependientes en cascada)
-- ═══════════════════════════════════════════════════════════════════
-- Este DELETE activa los ON DELETE CASCADE para:
--   - social_links
--   - support_goals (y support_amounts por cascada)
--   - analytics_events (si quedó alguno)
--   - profile_reports (si quedó alguno)

DELETE FROM public.profiles
WHERE id = 'USER_UUID_AQUI';

-- Verificar:
SELECT COUNT(*) AS remaining_social   FROM public.social_links      WHERE profile_id = 'USER_UUID_AQUI';
SELECT COUNT(*) AS remaining_goals    FROM public.support_goals      WHERE profile_id = 'USER_UUID_AQUI';
SELECT COUNT(*) AS remaining_profile  FROM public.profiles           WHERE id         = 'USER_UUID_AQUI';
-- Todos deben ser 0.


-- ═══════════════════════════════════════════════════════════════════
-- PASO 5: ELIMINAR EL USUARIO DE SUPABASE AUTH
-- ═══════════════════════════════════════════════════════════════════
--
-- Este paso NO se puede hacer directamente con SQL en el SQL Editor
-- de Supabase por motivos de seguridad (requiere service_role).
--
-- OPCIÓN A — Dashboard (más seguro, sin código):
--   1. Ve a Supabase Dashboard → Authentication → Users
--   2. Busca el usuario por email o UUID
--   3. Haz clic en el menú de opciones → Delete User
--   4. Confirma la eliminación
--
-- OPCIÓN B — Supabase Admin API (para scripts automáticos):
--   Requiere SUPABASE_SERVICE_ROLE_KEY en el servidor.
--   Nunca uses esta clave en el cliente ni en código público.
--
--   curl -X DELETE \
--     "https://YOUR_PROJECT.supabase.co/auth/v1/admin/users/USER_UUID_AQUI" \
--     -H "apikey: SERVICE_ROLE_KEY" \
--     -H "Authorization: Bearer SERVICE_ROLE_KEY"
--
-- OPCIÓN C — Supabase JS Admin Client (en un script de Node.js):
--   import { createClient } from '@supabase/supabase-js'
--   const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
--     auth: { autoRefreshToken: false, persistSession: false }
--   })
--   await admin.auth.admin.deleteUser('USER_UUID_AQUI')
--
-- Verificar (después de eliminar desde el Dashboard o API):
SELECT COUNT(*) AS user_still_exists FROM auth.users WHERE id = 'USER_UUID_AQUI';
-- Debe ser 0.


-- ═══════════════════════════════════════════════════════════════════
-- VERIFICACIÓN FINAL COMPLETA
-- ═══════════════════════════════════════════════════════════════════

SELECT 'auth.users'         AS tabla, COUNT(*) AS registros FROM auth.users          WHERE id         = 'USER_UUID_AQUI'
UNION ALL
SELECT 'profiles',                    COUNT(*)              FROM public.profiles      WHERE id         = 'USER_UUID_AQUI'
UNION ALL
SELECT 'social_links',                COUNT(*)              FROM public.social_links  WHERE profile_id = 'USER_UUID_AQUI'
UNION ALL
SELECT 'support_goals',               COUNT(*)              FROM public.support_goals WHERE profile_id = 'USER_UUID_AQUI'
UNION ALL
SELECT 'analytics_events',            COUNT(*)              FROM public.analytics_events WHERE profile_id = 'USER_UUID_AQUI'
UNION ALL
SELECT 'profile_reports',             COUNT(*)              FROM public.profile_reports  WHERE profile_id = 'USER_UUID_AQUI';

-- Todos los valores en "registros" deben ser 0.
-- Si alguno es > 0, repite el paso correspondiente.


-- ═══════════════════════════════════════════════════════════════════
-- REGISTRO DE AUDITORÍA (recomendado)
-- ═══════════════════════════════════════════════════════════════════
-- Documenta la eliminación en el log interno (hoja de cálculo, Notion, etc.):
--
-- Fecha de solicitud:   _______________
-- Email del usuario:    _______________
-- UUID del usuario:     _______________
-- Ejecutado por:        _______________
-- Fecha de ejecución:   _______________
-- Archivos de Storage eliminados: ✓ avatars / ✓ banners / ✓ support-goals
-- Registros de BD eliminados:     ✓
-- Usuario de Auth eliminado:      ✓
-- ═══════════════════════════════════════════════════════════════════
