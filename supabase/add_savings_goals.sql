-- ========================================================
-- Migración: Tabla de Metas de Ahorro y Apartados (savings_goals)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL,
  current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  target_date DATE,
  color TEXT DEFAULT 'bg-emerald-500',
  icon TEXT DEFAULT 'PiggyBank',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para savings_goals
DROP POLICY IF EXISTS "Usuarios ven sus propias metas de ahorro" ON public.savings_goals;
CREATE POLICY "Usuarios ven sus propias metas de ahorro" ON public.savings_goals 
  FOR SELECT USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Usuarios insertan sus propias metas de ahorro" ON public.savings_goals;
CREATE POLICY "Usuarios insertan sus propias metas de ahorro" ON public.savings_goals 
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Usuarios actualizan sus propias metas de ahorro" ON public.savings_goals;
CREATE POLICY "Usuarios actualizan sus propias metas de ahorro" ON public.savings_goals 
  FOR UPDATE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Usuarios borran sus propias metas de ahorro" ON public.savings_goals;
CREATE POLICY "Usuarios borran sus propias metas de ahorro" ON public.savings_goals 
  FOR DELETE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');
