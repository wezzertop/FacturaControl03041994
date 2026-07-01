-- ========================================================
-- Migración: Préstamos Bancarios y Tabla de Amortización
-- ========================================================

-- 1. Crear Tabla de Préstamos (loans)
CREATE TABLE IF NOT EXISTS public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bank TEXT NOT NULL,
  contract_number TEXT,
  clabe TEXT,
  amount_granted NUMERIC(12, 2) NOT NULL,
  current_balance NUMERIC(12, 2) NOT NULL,
  interest_rate NUMERIC(5, 2) NOT NULL,
  total_payments INTEGER NOT NULL,
  payments_made INTEGER NOT NULL DEFAULT 0,
  frequency TEXT NOT NULL CHECK (frequency IN ('days_14', 'days_15', 'monthly')),
  payment_amount NUMERIC(12, 2) NOT NULL,
  start_date DATE NOT NULL,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en loans
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para loans
DROP POLICY IF EXISTS "Usuarios ven sus propios prestamos" ON public.loans;
CREATE POLICY "Usuarios ven sus propios prestamos" ON public.loans 
  FOR SELECT USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Usuarios insertan sus propios prestamos" ON public.loans;
CREATE POLICY "Usuarios insertan sus propios prestamos" ON public.loans 
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Usuarios actualizan sus propios prestamos" ON public.loans;
CREATE POLICY "Usuarios actualizan sus propios prestamos" ON public.loans 
  FOR UPDATE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Usuarios borran sus propios prestamos" ON public.loans;
CREATE POLICY "Usuarios borran sus propios prestamos" ON public.loans 
  FOR DELETE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

-- 2. Modificar la Tabla de Transacciones (transactions) para enlazar préstamos
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS loan_id UUID REFERENCES public.loans(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS loan_payment_type TEXT CHECK (loan_payment_type IN ('regular', 'principal_only'));
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS principal_amount NUMERIC(12, 2);

-- 3. Trigger para actualizar el balance del préstamo reactivamente al registrar pagos
CREATE OR REPLACE FUNCTION public.update_loan_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Revertir impacto del OLD en caso de UPDATE o DELETE
  IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
    IF (OLD.loan_id IS NOT NULL) THEN
      IF (OLD.loan_payment_type = 'regular') THEN
        UPDATE public.loans 
        SET current_balance = current_balance + COALESCE(OLD.principal_amount, OLD.amount),
            payments_made = GREATEST(0, payments_made - 1)
        WHERE id = OLD.loan_id;
      ELSIF (OLD.loan_payment_type = 'principal_only') THEN
        UPDATE public.loans 
        SET current_balance = current_balance + OLD.amount
        WHERE id = OLD.loan_id;
      END IF;
    END IF;
  END IF;

  -- Aplicar impacto del NEW en caso de INSERT o UPDATE
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF (NEW.loan_id IS NOT NULL) THEN
      IF (NEW.loan_payment_type = 'regular') THEN
        UPDATE public.loans 
        SET current_balance = current_balance - COALESCE(NEW.principal_amount, NEW.amount),
            payments_made = payments_made + 1
        WHERE id = NEW.loan_id;
      ELSIF (NEW.loan_payment_type = 'principal_only') THEN
        UPDATE public.loans 
        SET current_balance = current_balance - NEW.amount
        WHERE id = NEW.loan_id;
      END IF;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_loan_balance ON public.transactions;
CREATE TRIGGER trigger_update_loan_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_loan_balance();
