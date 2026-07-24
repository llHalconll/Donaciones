# DonacionesSaaS

Plataforma SaaS de apoyo y donaciones que conecta creadores, profesionales, organizaciones e iglesias con sus comunidades — sin procesar pagos directamente.

Cada monto de apoyo redirige al visitante al checkout de **Hotmart** configurado por el creador.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript 5 |
| Estilos | Tailwind CSS 4 |
| Backend/Auth/DB | Supabase (PostgreSQL + Auth + Storage) |
| Iconos | Lucide React |
| Tipografía | Geist Sans / Geist Mono |
| Despliegue | Vercel (ready) |

---

## Instalación

```bash
git clone <repo>
cd proyecto-donaciones
npm install
cp .env.example .env.local
# Completa las variables de entorno en .env.local
npm run dev
```

---

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NEXT_PUBLIC_SITE_URL=https://tudominio.com

# Webhook (no activo todavía)
HOTMART_WEBHOOK_ENABLED=false
```

> ⚠️ Nunca pongas `SUPABASE_SERVICE_ROLE_KEY` en `.env.local` del cliente.

---

## Configuración de Supabase

### 1. Crea el proyecto en Supabase

Ejecuta el esquema base:

```sql
-- Desde supabase/schema.sql
```

### 2. Ejecuta las migraciones en orden

```sql
-- 1. supabase/migrations/001_profile_extended.sql
-- 2. supabase/migrations/002_social_links_extended.sql
-- 3. supabase/migrations/003_donation_buttons_extended.sql
-- 4. supabase/migrations/004_analytics_events.sql
-- 5. supabase/migrations/005_profile_reports.sql
-- 6. supabase/migrations/006_webhook_events.sql
```

### 3. Ejecuta Storage (buckets)

```sql
-- supabase/storage.sql
```

### 4. Configura Authentication

- Email + Password habilitado
- Email confirmation: opcional para desarrollo
- Redirect URL: `http://localhost:3000/auth/callback`

---

## Scripts

```bash
npm run dev        # Servidor de desarrollo
npm run build      # Build de producción
npm run start      # Servidor de producción
npm run lint       # ESLint
npm run typecheck  # TypeScript sin emitir
npm test           # Tests con Node.js built-in runner
```

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (legal)/         # Términos, Privacidad
│   ├── [username]/      # Página pública del creador
│   ├── admin/           # Panel administrativo (is_admin requerido)
│   ├── api/
│   │   ├── analytics/   # POST — registrar eventos
│   │   ├── reports/     # POST — reportar perfiles
│   │   └── webhook/hotmart/ # Webhook preparado (no activo)
│   ├── auth/            # Login, register, reset password
│   └── dashboard/       # Panel del creador (protegido)
│       ├── analytics/   # Estadísticas
│       ├── buttons/     # Montos de apoyo Hotmart
│       ├── profile/     # Edición de perfil
│       ├── settings/    # Configuración de cuenta
│       └── social/      # Redes sociales
├── components/
│   ├── dashboard/       # Sidebar, header, uploaders
│   ├── shared/          # Header público, footer
│   ├── theme-*          # Dark/light mode
│   └── ui/              # Button, Card, Input, Badge
├── lib/
│   ├── supabase/        # Clientes server/client/middleware
│   ├── utils/           # Procesador de imágenes
│   └── validations/     # auth.ts, url.ts
└── types/
    └── database.types.ts
```

---

## Seguridad

- **RLS activo** en todas las tablas.
- **`is_admin`** solo se puede leer, nunca modificar por formulario normal.
- **URLs de Hotmart** validadas por hostname exacto (no `includes()`).
- **Storage** organizado por `{user_id}/` — RLS previene acceso cruzado.
- **No se usa `service_role`** en ningún cliente del navegador.
- **`user_metadata` no se usa** para permisos — siempre se consulta `profiles`.
- **Esquemas peligrosos** bloqueados: `javascript:`, `data:`, `file:`, `vbscript:`.

---

## Flujo de Hotmart

```
Visitante → selecciona monto → clic en "Apoyar"
  → se registra evento hotmart_redirect en analytics_events
  → validación client-side de URL (HTTPS + hostname)
  → window.location.href = hotmart_checkout_url
  → Visitante llega al checkout de Hotmart
```

> ⚠️ Un clic a Hotmart **no confirma** un pago. La confirmación requiere integración con webhook de Hotmart (Fase 12 del roadmap — preparada pero no activa).

---

## Métricas disponibles

| Métrica | Significado |
|---|---|
| `profile_view` | El visitante cargó la página del creador |
| `amount_selected` | El visitante seleccionó un monto |
| `hotmart_redirect` | El visitante hizo clic en "Apoyar" |

**No disponible sin webhook de Hotmart:**
- Pagos completados
- Ingresos confirmados
- Donaciones recibidas

---

## Planes y límites

| Plan | Botones | Redes sociales |
|---|---|---|
| free | 5 | 5 |
| pro | 20 | 15 |
| organization | 50 | 30 |

Los límites se validan **del lado del servidor** en cada Server Action.

---

## Despliegue en Vercel

```bash
# 1. Conecta tu repositorio a Vercel
# 2. Configura las variables de entorno en el dashboard de Vercel
# 3. Vercel detecta Next.js automáticamente
# 4. Deploy
```

---

## Roadmap de fases

| Fase | Estado | Descripción |
|---|---|---|
| 0 | ✅ Completa | Correcciones críticas, build limpio |
| 1 | ✅ Completa | Perfil completo del creador |
| 2 | ✅ Completa | Avatar y banner |
| 3 | ✅ Completa | Redes sociales |
| 4 | ✅ Completa | Montos y URLs de Hotmart |
| 5 | ✅ Completa | Dashboard con métricas |
| 6 | ✅ Completa | Página pública |
| 7 | ✅ Completa | Métricas de analytics |
| 8 | ⚠️ Parcial | Admin — datos reales, sin acciones de moderación avanzada |
| 9 | ✅ Completa | Reportes de perfiles |
| 10 | 🔜 Pendiente | Configuración de apariencia avanzada |
| 11 | ✅ Completa | Organizaciones (account_type) |
| 12 | ✅ Scaffolded | Webhook de Hotmart preparado |
| 13 | ✅ Completa | Planes y límites centralizados |
| 14 | ✅ Completa | Páginas legales base |
| 15 | ✅ Completa | SEO, sitemap, robots, OG tags |
| 16 | ✅ Completa | Tests de validación |
| 17 | ✅ Completa | Documentación |

---

## Notas legales

Los textos en `/terms` y `/privacy` son **borradores provisionales** y deben ser revisados por un profesional del derecho antes de publicación oficial.
