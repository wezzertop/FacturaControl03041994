-- ========================================================
-- Migración: Nombre Comercial de Proveedores y Descripción de Gastos
-- ========================================================

-- 1. Agregar columna description a la tabla de facturas (invoices)
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Crear tabla provider_mappings para relacionar RFCs con nombres comerciales
CREATE TABLE IF NOT EXISTS public.provider_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rfc TEXT NOT NULL,
  commercial_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, rfc)
);

-- 3. Habilitar RLS en la tabla provider_mappings
ALTER TABLE public.provider_mappings ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas de RLS para provider_mappings
DROP POLICY IF EXISTS "Usuarios ven sus mapeos" ON public.provider_mappings;
CREATE POLICY "Usuarios ven sus mapeos" ON public.provider_mappings 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios insertan sus mapeos" ON public.provider_mappings;
CREATE POLICY "Usuarios insertan sus mapeos" ON public.provider_mappings 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios actualizan sus mapeos" ON public.provider_mappings;
CREATE POLICY "Usuarios actualizan sus mapeos" ON public.provider_mappings 
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios eliminan sus mapeos" ON public.provider_mappings;
CREATE POLICY "Usuarios eliminan sus mapeos" ON public.provider_mappings 
  FOR DELETE USING (auth.uid() = user_id);
