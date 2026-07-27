# Reconciliación de la migración 010

## Estado verificado

Verificación de solo lectura realizada el 27 de julio de 2026:

- El archivo `supabase/migrations/010_public_profile_rls_hardening.sql` existe en el repositorio.
- En el proyecto Supabase vinculado existen las políticas esperadas:
  - `Lectura pública de redes sociales activas`
  - `Lectura pública de botones de donación activos`
  - `Public insert validated analytics`
- El historial remoto de Supabase CLI no registra la migración 010.
- La relación de historial `supabase_migrations.schema_migrations` no está disponible en el proyecto vinculado.

Conclusión: los efectos de seguridad de la migración 010 están aplicados, pero existe
drift de historial. La presencia del archivo no demuestra por sí sola que una
migración haya sido aplicada.

## Riesgo

Reaplicar el archivo o ejecutar un `db push` sin reconciliar primero puede producir
errores por políticas existentes o dejar un historial engañoso. Marcarla como
aplicada sin comparar todo su contenido también podría ocultar diferencias.

## Procedimiento recomendado

1. Mantener una copia de seguridad reciente del proyecto.
2. Comparar, mediante consultas de solo lectura, cada objeto definido por la
   migración 010 contra el estado remoto.
3. Confirmar el mecanismo de historial apropiado para la versión actual de Supabase
   CLI y para este proyecto.
4. Reconciliar el historial únicamente después de la comparación completa.
5. Ejecutar cualquier reparación primero en un entorno no productivo.
6. Registrar quién realizó la reconciliación, cuándo y con qué versión del CLI.

Este documento no autoriza ni ejecuta SQL, `migration repair`, `db push` ni una nueva
aplicación de la migración.
