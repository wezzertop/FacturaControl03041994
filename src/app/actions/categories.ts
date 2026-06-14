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

  // Intentamos obtener categorías globales o personalizadas del usuario
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order('name');

  if (error) {
    console.error('Error al obtener categorías:', error);
    return [];
  }

  return data || [];
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
