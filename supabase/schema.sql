-- ==========================================
-- SCHEMA Y SEGURIDAD (RLS) PARA SUPABASE
-- ==========================================
-- Este archivo conserva el bootstrap histórico requerido por la secuencia
-- 001–011. La migración 011 transforma donation_buttons en support_goals y
-- support_amounts y retira la tabla legada. No usar schema.sql sin aplicar
-- todas las migraciones en orden.

-- 1. Tabla de Perfiles de Creadores
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL CHECK (username ~ '^[a-z0-9_-]{3,30}$'),
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_admin BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Políticas de Seguridad (RLS) para Profiles

-- a) Lectura pública: Cualquiera puede ver perfiles activos por username, o el dueño su propio perfil
CREATE POLICY "Lectura pública de perfiles activos"
  ON public.profiles FOR SELECT
  USING (is_active = true OR auth.uid() = id);

-- b) Inserción: Solo se permite insertar su propio perfil y NUNCA con is_admin = true
CREATE POLICY "Los usuarios pueden insertar su propio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id 
    AND (is_admin = false OR is_admin IS NULL)
  );

-- c) Edición: El usuario solo puede actualizar su propio perfil y NO puede cambiarse a is_admin = true
CREATE POLICY "Los usuarios pueden editar su propio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND is_admin = (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

-- 3. Trigger Automático para Creación de Perfil al Registrarse en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    LOWER(COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || SUBSTRING(NEW.id::text FROM 1 FOR 8))),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Creador')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger previo si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Tablas Secundarias (Redes Sociales y Botones de Donación)
CREATE TABLE IF NOT EXISTS public.social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de redes sociales"
  ON public.social_links FOR SELECT
  USING (true);

CREATE POLICY "Gestión de redes sociales por el creador"
  ON public.social_links FOR ALL
  USING (auth.uid() = profile_id);

CREATE TABLE IF NOT EXISTS public.donation_buttons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD' NOT NULL,
  hotmart_checkout_url TEXT NOT NULL,
  order_index INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.donation_buttons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de botones de donación"
  ON public.donation_buttons FOR SELECT
  USING (true);

CREATE POLICY "Gestión de botones por el creador"
  ON public.donation_buttons FOR ALL
  USING (auth.uid() = profile_id);
