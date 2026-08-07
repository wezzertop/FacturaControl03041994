-- ========================================================
-- SCRIPT DE INICIALIZACIÓN COMPLETA PARA SUPABASE
-- FacturaControl - Todas las tablas, triggers, RLS y buckets
-- ========================================================

-- --------------------------------------------------------
-- 1. TABLA DE USUARIOS (public.users)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'gratis' CHECK (plan IN ('gratis', 'pro')),
  rfc TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- 2. TABLA DE CATEGORÍAS (public.categories)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  CONSTRAINT categories_name_user_id_key UNIQUE (name, user_id)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Insertar categorías globales predeterminadas
INSERT INTO public.categories (name, color, icon, user_id) VALUES 
('Súper y Despensa', 'bg-brand-cerulean', 'ShoppingCart', NULL),
('Gasolina y Transporte', 'bg-blue-400', 'Fuel', NULL),
('Servicios (Luz, Agua, Internet)', 'bg-emerald-500', 'Zap', NULL),
('Salud y Farmacia', 'bg-red-400', 'HeartPulse', NULL),
('Restaurantes y Comida', 'bg-orange-400', 'Utensils', NULL),
('Otros', 'bg-gray-400', 'MoreHorizontal', NULL)
ON CONFLICT (name, user_id) DO NOTHING;

-- --------------------------------------------------------
-- 3. TABLA DE CARTERAS / CUENTAS (public.wallets)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'MXN',
  type TEXT NOT NULL DEFAULT 'debit' CHECK (type IN ('cash', 'debit', 'credit')),
  credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  cut_off_day INTEGER CHECK (cut_off_day >= 1 AND cut_off_day <= 31),
  due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31),
  statement_payment_due NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- 4. TABLA DE FACTURAS XML / CFDI (public.invoices)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rfc_emisor TEXT NOT NULL,
  nombre_emisor TEXT NOT NULL,
  rfc_receptor TEXT,
  nombre_receptor TEXT,
  invoice_type TEXT DEFAULT 'egreso' CHECK (invoice_type IN ('ingreso', 'egreso', 'nomina')),
  fecha TIMESTAMP WITH TIME ZONE NOT NULL,
  total NUMERIC(12, 2) NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL,
  iva NUMERIC(12, 2) NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Vigente' CHECK (status IN ('Vigente', 'Cancelado')),
  items JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- 5. TABLA DE PRÉSTAMOS BANCARIOS (public.loans)
-- --------------------------------------------------------
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

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- 6. TABLA DE TRANSACCIONES / MOVIMIENTOS (public.transactions)
-- --------------------------------------------------------
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
  voucher_url TEXT,
  installments_count INTEGER,
  current_installment INTEGER,
  loan_id UUID REFERENCES public.loans(id) ON DELETE SET NULL,
  loan_payment_type TEXT CHECK (loan_payment_type IN ('regular', 'principal_only')),
  principal_amount NUMERIC(12, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- 7. TABLA DE PAGOS RECURRENTES (public.recurring_payments)
-- --------------------------------------------------------
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

ALTER TABLE public.recurring_payments ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- 8. TABLA DE NOMBRES COMERCIALES / ALIAS (public.provider_mappings)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.provider_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rfc TEXT NOT NULL,
  commercial_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, rfc)
);

ALTER TABLE public.provider_mappings ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- 9. USUARIO DUMMY INICIAL (Para Fallbacks)
-- --------------------------------------------------------
INSERT INTO public.users (id, email, plan) 
VALUES ('00000000-0000-0000-0000-000000000000', 'dummy@facturacontrol.com', 'pro')
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------
-- 10. POLÍTICAS DE RLS (Row Level Security)
-- --------------------------------------------------------

-- Users
DROP POLICY IF EXISTS "Usuarios ven su propio perfil" ON public.users;
CREATE POLICY "Usuarios ven su propio perfil" ON public.users FOR SELECT USING (auth.uid() = id);

-- Categories
DROP POLICY IF EXISTS "Usuarios ven categorías públicas o propias" ON public.categories;
CREATE POLICY "Usuarios ven categorías públicas o propias" ON public.categories FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuarios insertan sus propias categorías" ON public.categories;
CREATE POLICY "Usuarios insertan sus propias categorías" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuarios actualizan sus propias categorías" ON public.categories;
CREATE POLICY "Usuarios actualizan sus propias categorías" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuarios eliminan sus propias categorías" ON public.categories;
CREATE POLICY "Usuarios eliminan sus propias categorías" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Wallets
DROP POLICY IF EXISTS "Usuarios ven sus propias carteras" ON public.wallets;
CREATE POLICY "Usuarios ven sus propias carteras" ON public.wallets FOR SELECT USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');
DROP POLICY IF EXISTS "Usuarios insertan sus propias carteras" ON public.wallets;
CREATE POLICY "Usuarios insertan sus propias carteras" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');
DROP POLICY IF EXISTS "Usuarios actualizan sus propias carteras" ON public.wallets;
CREATE POLICY "Usuarios actualizan sus propias carteras" ON public.wallets FOR UPDATE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');
DROP POLICY IF EXISTS "Usuarios borran sus propias carteras" ON public.wallets;
CREATE POLICY "Usuarios borran sus propias carteras" ON public.wallets FOR DELETE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

-- Invoices
DROP POLICY IF EXISTS "Usuarios ven sus facturas" ON public.invoices;
CREATE POLICY "Usuarios ven sus facturas" ON public.invoices FOR SELECT USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');
DROP POLICY IF EXISTS "Usuarios insertan sus facturas" ON public.invoices;
CREATE POLICY "Usuarios insertan sus facturas" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');
DROP POLICY IF EXISTS "Usuarios actualizan sus facturas" ON public.invoices;
CREATE POLICY "Usuarios actualizan sus facturas" ON public.invoices FOR UPDATE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

-- Loans
DROP POLICY IF EXISTS "Usuarios ven sus propios prestamos" ON public.loans;
CREATE POLICY "Usuarios ven sus propios prestamos" ON public.loans FOR SELECT USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');
DROP POLICY IF EXISTS "Usuarios insertan sus propios prestamos" ON public.loans;
CREATE POLICY "Usuarios insertan sus propios prestamos" ON public.loans FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');
DROP POLICY IF EXISTS "Usuarios actualizan sus propios prestamos" ON public.loans;
CREATE POLICY "Usuarios actualizan sus propios prestamos" ON public.loans FOR UPDATE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');
DROP POLICY IF EXISTS "Usuarios borran sus propios prestamos" ON public.loans;
CREATE POLICY "Usuarios borran sus propios prestamos" ON public.loans FOR DELETE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

-- Transactions
DROP POLICY IF EXISTS "Usuarios ven sus propias transacciones" ON public.transactions;
CREATE POLICY "Usuarios ven sus propias transacciones" ON public.transactions FOR SELECT USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');
DROP POLICY IF EXISTS "Usuarios insertan sus propias transacciones" ON public.transactions;
CREATE POLICY "Usuarios insertan sus propias transacciones" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');
DROP POLICY IF EXISTS "Usuarios actualizan sus propias transacciones" ON public.transactions;
CREATE POLICY "Usuarios actualizan sus propias transacciones" ON public.transactions FOR UPDATE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');
DROP POLICY IF EXISTS "Usuarios borran sus propias transacciones" ON public.transactions;
CREATE POLICY "Usuarios borran sus propias transacciones" ON public.transactions FOR DELETE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

-- Recurring Payments
DROP POLICY IF EXISTS "Usuarios ven sus propios pagos recurrentes" ON public.recurring_payments;
CREATE POLICY "Usuarios ven sus propios pagos recurrentes" ON public.recurring_payments FOR SELECT USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');
DROP POLICY IF EXISTS "Usuarios insertan sus propios pagos recurrentes" ON public.recurring_payments;
CREATE POLICY "Usuarios insertan sus propios pagos recurrentes" ON public.recurring_payments FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');
DROP POLICY IF EXISTS "Usuarios actualizan sus propios pagos recurrentes" ON public.recurring_payments;
CREATE POLICY "Usuarios actualizan sus propios pagos recurrentes" ON public.recurring_payments FOR UPDATE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');
DROP POLICY IF EXISTS "Usuarios borran sus propios pagos recurrentes" ON public.recurring_payments;
CREATE POLICY "Usuarios borran sus propios pagos recurrentes" ON public.recurring_payments FOR DELETE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

-- Provider Mappings
DROP POLICY IF EXISTS "Usuarios ven sus mapeos" ON public.provider_mappings;
CREATE POLICY "Usuarios ven sus mapeos" ON public.provider_mappings FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuarios insertan sus mapeos" ON public.provider_mappings;
CREATE POLICY "Usuarios insertan sus mapeos" ON public.provider_mappings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuarios actualizan sus mapeos" ON public.provider_mappings;
CREATE POLICY "Usuarios actualizan sus mapeos" ON public.provider_mappings FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuarios eliminan sus mapeos" ON public.provider_mappings;
CREATE POLICY "Usuarios eliminan sus mapeos" ON public.provider_mappings FOR DELETE USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- 11. TRIGGERS Y FUNCIONES AUTOMÁTICAS
-- --------------------------------------------------------

-- Trigger 1: Autocreado de usuario en public.users al registrarse en Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, plan)
  VALUES (new.id, new.email, 'gratis')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger 2: Recálculo automático del saldo en carteras al crear/editar/borrar transacciones
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
    IF (OLD.type = 'income') THEN
      UPDATE public.wallets SET balance = balance - OLD.amount WHERE id = OLD.wallet_id;
    ELSIF (OLD.type = 'expense') THEN
      UPDATE public.wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
    END IF;
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

-- Trigger 3: Recálculo automático del saldo del préstamo al registrar/eliminar pagos
CREATE OR REPLACE FUNCTION public.update_loan_balance()
RETURNS TRIGGER AS $$
BEGIN
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

-- --------------------------------------------------------
-- 12. BUCKETS DE STORAGE (Archivos y Comprobantes)
-- --------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) 
VALUES ('facturas', 'facturas', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('comprobantes', 'comprobantes', false)
ON CONFLICT (id) DO NOTHING;
