# Plataforma SaaS de Donaciones para Creadores (tipo Buy Me a Coffee / Ko-fi)

Plataforma SaaS que permite a creadores de contenido registrarse, configurar su perfil público con avatar, banner y enlaces a redes sociales, y crear botones de donación con montos fijos vinculados a enlaces de pago de **Hotmart**.

---

## 🛠️ Guía de Configuración e Integración con Supabase

### 1. Creación del Proyecto en Supabase
1. Ingresa a [https://supabase.com](https://supabase.com) y crea un nuevo proyecto.
2. Copia la **Project URL** y la **anon key** (Key pública de API) desde *Project Settings > API*.

### 2. Variables de Entorno
Copia `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Configura en `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Ejecución del Schema SQL y RLS
1. Ve al **SQL Editor** en la consola de Supabase.
2. Ejecuta todo el contenido del archivo [`supabase/schema.sql`](supabase/schema.sql).
3. Este script creará la tabla `profiles`, activará Row Level Security (RLS) y configurará el Trigger automático que crea el perfil cuando un usuario se registra.

### 4. Configuración de URLs de Autenticación en Supabase
1. En Supabase, ve a *Authentication > URL Configuration*.
2. Establece **Site URL** a `http://localhost:3000`.
3. Añade a **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/reset-password`

---

## 🧪 Pruebas de Autenticación y Flujo de Creador

### A. Prueba de Registro
1. Ve a `/auth/register`.
2. Completa los campos: Nombre (`Alex Creator`), Username deseado (`alex`), Email y Contraseña.
3. El sistema validará que `username` cumpla la regla de 3 a 30 caracteres (`[a-z0-9_-]`) y no esté repetido.
4. Tras registrarte, el Trigger de Supabase creará tu perfil en `public.profiles` y serás redirigido a `/dashboard`.

### B. Prueba de Inicio de Sesión
1. Cierra sesión desde el Dashboard o ve a `/auth/login`.
2. Ingresa tu email y contraseña.
3. Si la sesión es válida, se guardan cookies seguras y te redirige a `/dashboard`.

### C. Prueba de Recuperación de Contraseña
1. Ve a `/auth/forgot-password`.
2. Ingresa tu correo para recibir el enlace de restablecimiento a `/auth/reset-password`.

### D. Perfil Público
1. Accede a `http://localhost:3000/alex` (o tu username elegido).
2. Verás el perfil público cargado dinámicamente desde la base de datos de Supabase.

---

## 🔍 Comandos de Verificación

```bash
# Linter
npm run lint

# Build de producción
npm run build
```
