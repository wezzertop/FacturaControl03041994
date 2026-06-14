-- ========================================================
-- Migración: Categorías Personalizadas por Usuario
-- ========================================================

-- 1. Agregar columna user_id a la tabla de categorías
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- 2. Habilitar y actualizar RLS de la tabla categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas anteriores para evitar conflictos
DROP POLICY IF EXISTS "Categorías son públicas" ON public.categories;
DROP POLICY IF EXISTS "Usuarios ven categorías públicas o propias" ON public.categories;
DROP POLICY IF EXISTS "Usuarios insertan sus propias categorías" ON public.categories;
DROP POLICY IF EXISTS "Usuarios actualizan sus propias categorías" ON public.categories;
DROP POLICY IF EXISTS "Usuarios eliminan sus propias categorías" ON public.categories;

-- 3. Crear nuevas políticas RLS
-- A. Permitir a los usuarios leer categorías globales (user_id IS NULL) y las suyas propias
CREATE POLICY "Usuarios ven categorías públicas o propias" ON public.categories
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

-- B. Permitir a los usuarios insertar sus propias categorías
CREATE POLICY "Usuarios insertan sus propias categorías" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- C. Permitir a los usuarios actualizar sus propias categorías
CREATE POLICY "Usuarios actualizan sus propias categorías" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);

-- D. Permitir a los usuarios eliminar sus propias categorías
CREATE POLICY "Usuarios eliminan sus propias categorías" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);
