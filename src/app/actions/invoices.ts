"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseAdmin = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function updateInvoiceCategory(invoiceId: string, categoryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  // 1. Actualizar la factura usando supabaseAdmin para saltar RLS
  const { error: invoiceError } = await (supabaseAdmin
    .from('invoices') as any)
    .update({ category_id: categoryId })
    .eq('id', invoiceId)
    .eq('user_id', user.id);

  if (invoiceError) {
    console.error('Error al actualizar categoría de factura:', invoiceError);
    return { success: false, error: 'No se pudo actualizar la categoría de la factura.' };
  }

  // 2. Actualizar las transacciones vinculadas si existen usando supabaseAdmin
  const { error: txError } = await (supabaseAdmin
    .from('transactions') as any)
    .update({ category_id: categoryId })
    .eq('invoice_id', invoiceId)
    .eq('user_id', user.id);

  if (txError) {
    console.error('Error al actualizar categoría de transacciones vinculadas:', txError);
  }

  revalidatePath('/invoices');
  revalidatePath('/wallets');
  revalidatePath('/');
  return { success: true };
}

export async function getProviderMappings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('provider_mappings')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error al obtener mapeos de proveedores:', error);
    return [];
  }

  return data || [];
}

export async function upsertProviderMapping(rfc: string, commercialName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  const trimmedName = commercialName.trim();
  const upperRfc = rfc.trim().toUpperCase();

  if (!trimmedName) {
    // Si el nombre comercial está vacío, eliminamos el mapeo
    const { error } = await supabase
      .from('provider_mappings')
      .delete()
      .eq('rfc', upperRfc)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error al eliminar mapeo de proveedor:', error);
      return { success: false, error: 'No se pudo eliminar el nombre comercial.' };
    }
  } else {
    // Upsert usando supabaseAdmin para evitar RLS o conflictos
    const { error } = await (supabaseAdmin
      .from('provider_mappings') as any)
      .upsert({
        user_id: user.id,
        rfc: upperRfc,
        commercial_name: trimmedName
      }, {
        onConflict: 'user_id,rfc'
      });

    if (error) {
      console.error('Error al guardar mapeo de proveedor:', error);
      return { success: false, error: 'No se pudo guardar el nombre comercial.' };
    }
  }

  revalidatePath('/invoices');
  revalidatePath('/');
  return { success: true };
}

export async function updateInvoiceDescription(invoiceId: string, description: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  const { error } = await (supabaseAdmin
    .from('invoices') as any)
    .update({ description: description })
    .eq('id', invoiceId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error al actualizar descripción de factura:', error);
    return { success: false, error: 'No se pudo actualizar la descripción de la factura.' };
  }

  revalidatePath('/invoices');
  return { success: true };
}
