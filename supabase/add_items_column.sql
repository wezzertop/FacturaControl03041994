-- Añadir columna JSONB a la tabla invoices para almacenar el desglose de productos
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
