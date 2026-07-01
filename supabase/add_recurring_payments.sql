-- ========================================================
-- Migración: Tabla de Pagos Recurrentes (recurring_payments)
-- ========================================================

-- 1. Crear Tabla de Pagos Recurrentes
CREATE TABLE IF NOT EXISTS public.recurring_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12, 2) NOT NULL,
  concept TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('days_14', 'days_15', 'monthly', 'weekly', 'yearly')),
  start_date DATE NOT NULL,
  next_execution_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.recurring_payments ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para recurring_payments
DROP POLICY IF EXISTS "Usuarios ven sus propios pagos recurrentes" ON public.recurring_payments;
CREATE POLICY "Usuarios ven sus propios pagos recurrentes" ON public.recurring_payments 
  FOR SELECT USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Usuarios insertan sus propios pagos recurrentes" ON public.recurring_payments;
CREATE POLICY "Usuarios insertan sus propios pagos recurrentes" ON public.recurring_payments 
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Usuarios actualizan sus propios pagos recurrentes" ON public.recurring_payments;
CREATE POLICY "Usuarios actualizan sus propios pagos recurrentes" ON public.recurring_payments 
  FOR UPDATE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Usuarios borran sus propios pagos recurrentes" ON public.recurring_payments;
CREATE POLICY "Usuarios borran sus propios pagos recurrentes" ON public.recurring_payments 
  FOR DELETE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');
