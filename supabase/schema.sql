-- ========================================================
-- Esquema de Base de Datos para FacturaControl MVP
-- ========================================================

-- 1. Tabla de Usuarios (Extendiendo el Auth de Supabase o como standalone temporal)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'gratis' CHECK (plan IN ('gratis', 'pro')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Tabla de Categorías
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  icon TEXT NOT NULL
);

-- Insertar categorías iniciales
INSERT INTO public.categories (name, color, icon) VALUES 
('Súper y Despensa', 'bg-brand-cerulean', 'ShoppingCart'),
('Gasolina y Transporte', 'bg-blue-400', 'Fuel'),
('Servicios (Luz, Agua, Internet)', 'bg-emerald-500', 'Zap'),
('Salud y Farmacia', 'bg-red-400', 'HeartPulse'),
('Restaurantes y Comida', 'bg-orange-400', 'Utensils'),
('Otros', 'bg-gray-400', 'MoreHorizontal')
ON CONFLICT (name) DO NOTHING;

-- Habilitar RLS en categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 3. Tabla de Facturas
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rfc_emisor TEXT NOT NULL,
  nombre_emisor TEXT NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL,
  total NUMERIC(12, 2) NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL,
  iva NUMERIC(12, 2) NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Vigente' CHECK (status IN ('Vigente', 'Cancelado'))
);

-- Habilitar RLS en invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- Políticas Temporales (MVP / Desarrollo)
-- ========================================================
-- ADVERTENCIA: En un entorno de producción estricto con Auth real, 
-- se debe validar "auth.uid() = user_id". 
-- Como estamos usando Service Role y/o pruebas temporales, abrimos
-- las politicas de solo lectura para el anon key, y el service_role ya se salta RLS.

-- Permitir lectura pública de categorías
DROP POLICY IF EXISTS "Categorías son públicas" ON public.categories;
CREATE POLICY "Categorías son públicas" ON public.categories FOR SELECT USING (true);

-- ========================================================
-- Creación de Usuario Dummy
-- ========================================================
-- Insertamos un usuario dummy para poder relacionar las facturas de prueba
INSERT INTO public.users (id, email, plan) 
VALUES ('00000000-0000-0000-0000-000000000000', 'dummy@facturacontrol.com', 'pro')
ON CONFLICT (email) DO NOTHING;


-- ========================================================
-- Storage: Bucket para XMLs
-- ========================================================
-- Creamos un bucket público para simplificar el MVP temporalmente
INSERT INTO storage.buckets (id, name, public) 
VALUES ('facturas', 'facturas', false)
ON CONFLICT (id) DO NOTHING;

-- Política de Storage: El Service Role puede hacer todo (por defecto)
-- No se requiere política adicional si usamos `service_role` en la Server Action.
