-- ========================================================
-- Migración: Control de Pagos de Corte y MSI para Tarjetas de Crédito
-- ========================================================

-- 1. Agregar columnas de facturación/corte a la tabla wallets
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS cut_off_day INTEGER CHECK (cut_off_day >= 1 AND cut_off_day <= 31);
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31);
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS statement_payment_due NUMERIC(12, 2) NOT NULL DEFAULT 0.00;

-- 2. Agregar columnas de mensualidades (MSI) a la tabla de transacciones
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS installments_count INTEGER;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS current_installment INTEGER;
