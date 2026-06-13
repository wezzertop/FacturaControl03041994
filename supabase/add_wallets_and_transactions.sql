-- ========================================================
-- Migración: Gestión de Carteras y Transacciones
-- ========================================================

-- 0. Agregar columna RFC a la tabla de usuarios
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rfc TEXT;

-- 1. Alterar tabla invoices para soportar clasificación de tipo de CFDI
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_type TEXT DEFAULT 'egreso' CHECK (invoice_type IN ('ingreso', 'egreso', 'nomina'));
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS rfc_receptor TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS nombre_receptor TEXT;

-- 2. Crear Tabla de Carteras (Wallets)
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'MXN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para wallets
DROP POLICY IF EXISTS "Usuarios ven sus propias carteras" ON public.wallets;
CREATE POLICY "Usuarios ven sus propias carteras" ON public.wallets 
  FOR SELECT USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Usuarios insertan sus propias carteras" ON public.wallets;
CREATE POLICY "Usuarios insertan sus propias carteras" ON public.wallets 
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Usuarios actualizan sus propias carteras" ON public.wallets;
CREATE POLICY "Usuarios actualizan sus propias carteras" ON public.wallets 
  FOR UPDATE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Usuarios borran sus propias carteras" ON public.wallets;
CREATE POLICY "Usuarios borran sus propias carteras" ON public.wallets 
  FOR DELETE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');


-- 3. Crear Tabla de Transacciones (Transactions)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12, 2) NOT NULL,
  concept TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para transactions
DROP POLICY IF EXISTS "Usuarios ven sus propias transacciones" ON public.transactions;
CREATE POLICY "Usuarios ven sus propias transacciones" ON public.transactions 
  FOR SELECT USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Usuarios insertan sus propias transacciones" ON public.transactions;
CREATE POLICY "Usuarios insertan sus propias transacciones" ON public.transactions 
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Usuarios actualizan sus propias transacciones" ON public.transactions;
CREATE POLICY "Usuarios actualizan sus propias transacciones" ON public.transactions 
  FOR UPDATE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Usuarios borran sus propias transacciones" ON public.transactions;
CREATE POLICY "Usuarios borran sus propias transacciones" ON public.transactions 
  FOR DELETE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');


-- 4. Trigger de base de datos para recalcular saldo en cartera al insertar/actualizar/eliminar transacciones
CREATE OR REPLACE FUNCTION public.update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF (NEW.type = 'income') THEN
      UPDATE public.wallets SET balance = balance + NEW.amount WHERE id = NEW.wallet_id;
    ELSIF (NEW.type = 'expense') THEN
      UPDATE public.wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF (OLD.type = 'income') THEN
      UPDATE public.wallets SET balance = balance - OLD.amount WHERE id = OLD.wallet_id;
    ELSIF (OLD.type = 'expense') THEN
      UPDATE public.wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Revertir movimiento anterior
    IF (OLD.type = 'income') THEN
      UPDATE public.wallets SET balance = balance - OLD.amount WHERE id = OLD.wallet_id;
    ELSIF (OLD.type = 'expense') THEN
      UPDATE public.wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
    END IF;
    -- Aplicar nuevo movimiento
    IF (NEW.type = 'income') THEN
      UPDATE public.wallets SET balance = balance + NEW.amount WHERE id = NEW.wallet_id;
    ELSIF (NEW.type = 'expense') THEN
      UPDATE public.wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_wallet_balance ON public.transactions;
CREATE TRIGGER trigger_update_wallet_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance();
