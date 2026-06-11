-- ========================================================
-- Configuración de Seguridad y Auth (Fase 5)
-- ========================================================

-- 1. Sincronizar auth.users con public.users
-- Cuando un usuario se registra mediante Supabase Auth,
-- este trigger copiará automáticamente su ID y Email a nuestra tabla public.users
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

-- 2. Asegurar que las facturas pertenezcan al usuario autenticado (RLS Invoices)
-- Permitir lectura
DROP POLICY IF EXISTS "Usuarios ven sus facturas" ON public.invoices;
CREATE POLICY "Usuarios ven sus facturas" ON public.invoices 
  FOR SELECT USING (auth.uid() = user_id);

-- Permitir inserción
DROP POLICY IF EXISTS "Usuarios insertan sus facturas" ON public.invoices;
CREATE POLICY "Usuarios insertan sus facturas" ON public.invoices 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Asegurar la tabla de Usuarios (RLS Users)
DROP POLICY IF EXISTS "Usuarios ven su propio perfil" ON public.users;
CREATE POLICY "Usuarios ven su propio perfil" ON public.users
  FOR SELECT USING (auth.uid() = id);
