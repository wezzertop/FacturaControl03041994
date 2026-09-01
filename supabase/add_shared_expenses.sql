-- ========================================================
-- Migración: Tabla de Gastos Compartidos y Deudas (shared_expenses)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.shared_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  concept TEXT NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL,
  my_share NUMERIC(12, 2) NOT NULL,
  other_share NUMERIC(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('they_owe_me', 'i_owe_them')),
  is_settled BOOLEAN NOT NULL DEFAULT false,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.shared_expenses ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Usuarios ven sus propios gastos compartidos" ON public.shared_expenses;
CREATE POLICY "Usuarios ven sus propios gastos compartidos" ON public.shared_expenses 
  FOR SELECT USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Usuarios insertan sus propios gastos compartidos" ON public.shared_expenses;
CREATE POLICY "Usuarios insertan sus propios gastos compartidos" ON public.shared_expenses 
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Usuarios actualizan sus propios gastos compartidos" ON public.shared_expenses;
CREATE POLICY "Usuarios actualizan sus propios gastos compartidos" ON public.shared_expenses 
  FOR UPDATE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Usuarios borran sus propios gastos compartidos" ON public.shared_expenses;
CREATE POLICY "Usuarios borran sus propios gastos compartidos" ON public.shared_expenses 
  FOR DELETE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');
