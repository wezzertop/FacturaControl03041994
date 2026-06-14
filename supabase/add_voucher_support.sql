-- ========================================================
-- Migración: Soporte de Comprobantes en PDF / Imágenes (OCR)
-- ========================================================

-- 1. Agregar columna voucher_url a la tabla de transacciones
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS voucher_url TEXT;

-- 2. Crear Bucket privado para almacenar las capturas de comprobantes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('comprobantes', 'comprobantes', false)
ON CONFLICT (id) DO NOTHING;
