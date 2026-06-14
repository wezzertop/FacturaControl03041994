-- ========================================================
-- Migración: Conexión Automática con el SAT
-- ========================================================

CREATE TABLE IF NOT EXISTS public.sat_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  rfc TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('ciec', 'efirma')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_sync TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'error'))
);

-- Habilitar RLS en sat_connections
ALTER TABLE public.sat_connections ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para sat_connections
DROP POLICY IF EXISTS "Usuarios ven sus propias conexiones" ON public.sat_connections;
CREATE POLICY "Usuarios ven sus propias conexiones" ON public.sat_connections 
  FOR SELECT USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Usuarios insertan sus propias conexiones" ON public.sat_connections;
CREATE POLICY "Usuarios insertan sus propias conexiones" ON public.sat_connections 
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Usuarios actualizan sus propias conexiones" ON public.sat_connections;
CREATE POLICY "Usuarios actualizan sus propias conexiones" ON public.sat_connections 
  FOR UPDATE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Usuarios borran sus propias conexiones" ON public.sat_connections;
CREATE POLICY "Usuarios borran sus propias conexiones" ON public.sat_connections 
  FOR DELETE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');
