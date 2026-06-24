-- ========================================================
-- Migración: Soporte para tipos de cartera y límites de crédito
-- ========================================================

-- 1. Agregar columna type a la tabla wallets
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'debit' CHECK (type IN ('cash', 'debit', 'credit'));

-- 2. Agregar columna credit_limit a la tabla wallets
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 0.00;

-- 3. Actualizar carteras existentes que se llamen "Efectivo" a tipo "cash"
UPDATE public.wallets SET type = 'cash' WHERE name ILIKE '%efectivo%';
