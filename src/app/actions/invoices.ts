"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateInvoiceCategory(invoiceId: string, categoryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  // 1. Actualizar la factura (cast a any para evitar errores de tipado de Supabase)
  const { error: invoiceError } = await (supabase
    .from('invoices') as any)
    .update({ category_id: categoryId })
    .eq('id', invoiceId)
    .eq('user_id', user.id);

  if (invoiceError) {
    console.error('Error al actualizar categoría de factura:', invoiceError);
    return { success: false, error: 'No se pudo actualizar la categoría de la factura.' };
  }

  // 2. Actualizar las transacciones vinculadas si existen
  const { error: txError } = await (supabase
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
