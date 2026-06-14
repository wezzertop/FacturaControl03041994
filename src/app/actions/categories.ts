'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

/**
 * Obtiene las categorías visibles para el usuario (globales y personalizadas).
 */
export async function getCategories() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  // 1. Intentamos obtener las categorías específicas del usuario
  const { data: userCategories, error: userError } = await (supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name') as any);

  if (userError) {
    console.error('Error al obtener categorías del usuario:', userError);
    return [];
  }

  // 2. Si el usuario ya tiene sus propias categorías clonadas/creadas, las retornamos
  if (userCategories && userCategories.length > 0) {
    return userCategories;
  }

  // 3. Si no tiene categorías personalizadas, obtenemos las globales
  const { data: globalCategories, error: globalError } = await (supabase
    .from('categories')
    .select('*')
    .is('user_id', null)
    .order('name') as any);

  if (globalError) {
    console.error('Error al obtener categorías globales:', globalError);
    return [];
  }

  // 4. Clonamos las categorías globales para este usuario de manera que pueda editarlas y borrarlas
  if (globalCategories && globalCategories.length > 0) {
    const cloned = globalCategories.map((cat: any) => ({
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      user_id: user.id
    }));

    const { data: inserted, error: insertError } = await (supabase
      .from('categories')
      .insert(cloned as any)
      .select() as any);

    if (insertError) {
      console.error('Error al clonar categorías para el usuario:', insertError);
      // Retornamos las globales temporalmente como fallback para evitar que la UI quede en blanco
      return globalCategories;
    }

    // 5. Migrar transacciones e facturas existentes para usar los nuevos IDs de categorías clonadas
    for (const globalCat of (globalCategories as any[])) {
      const clonedCat = (inserted || []).find((c: any) => c.name === globalCat.name);
      if (clonedCat) {
        // Actualizar facturas
        await (supabase.from('invoices') as any)
          .update({ category_id: clonedCat.id })
          .eq('user_id', user.id)
          .eq('category_id', globalCat.id);

        // Actualizar transacciones
        await (supabase.from('transactions') as any)
          .update({ category_id: clonedCat.id })
          .eq('user_id', user.id)
          .eq('category_id', globalCat.id);
      }
    }

    return inserted || [];
  }

  return [];
}

/**
 * Crea una nueva categoría personalizada para el usuario.
 */
export async function createCategory(name: string, color: string, icon: string): Promise<{ success: boolean; category?: any; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  const cleanName = name.trim();
  if (!cleanName) {
    return { success: false, error: 'El nombre de la categoría no puede estar vacío' };
  }

  // Insertar la categoría con el user_id del usuario para que sea privada
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: cleanName,
      color,
      icon,
      user_id: user.id
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Error al crear categoría:', error);
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe una categoría con ese nombre' };
    }
    return { success: false, error: 'Error al crear la categoría. Asegúrate de haber ejecutado la migración de base de datos.' };
  }

  revalidatePath('/wallets');
  revalidatePath('/settings');
  revalidatePath('/analytics');
  revalidatePath('/');
  return { success: true, category: data };
}

/**
 * Elimina una categoría personalizada del usuario.
 */
export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  // Borrar categoría asegurando que pertenece al usuario
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error al eliminar categoría:', error);
    return { success: false, error: 'No se pudo eliminar la categoría' };
  }

  revalidatePath('/wallets');
  revalidatePath('/settings');
  revalidatePath('/analytics');
  revalidatePath('/');
  return { success: true };
}

/**
 * Actualiza una categoría personalizada existente.
 */
export async function updateCategory(id: string, name: string, color: string, icon: string): Promise<{ success: boolean; category?: any; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  const cleanName = name.trim();
  if (!cleanName) {
    return { success: false, error: 'El nombre de la categoría no puede estar vacío' };
  }

  const { data, error } = await (supabase.from('categories') as any)
    .update({
      name: cleanName,
      color,
      icon
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error al actualizar categoría:', error);
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe una categoría con ese nombre' };
    }
    return { success: false, error: 'No se pudo actualizar la categoría' };
  }

  revalidatePath('/wallets');
  revalidatePath('/settings');
  revalidatePath('/analytics');
  revalidatePath('/');
  return { success: true, category: data };
}
