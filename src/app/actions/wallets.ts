'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseAdmin = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Obtiene todas las carteras del usuario.
 * Si el usuario no tiene ninguna cartera, le crea una por defecto llamada "Efectivo".
 */
export async function getWallets() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  const { data: wallets, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error al obtener carteras:', error);
    return [];
  }

  // Si no hay carteras, creamos una por defecto
  if (wallets.length === 0) {
    const defaultWallet = {
      user_id: user.id,
      name: 'Efectivo',
      balance: 0.00,
      currency: 'MXN'
    };

    const { data: newWallet, error: createError } = await supabase
      .from('wallets')
      .insert(defaultWallet as any)
      .select()
      .single();

    if (createError) {
      console.error('Error al crear cartera por defecto:', createError);
      return [];
    }

    return [newWallet];
  }

  return wallets;
}

/**
 * Crea una nueva cartera.
 */
export async function createWallet(name: string, initialBalance: number = 0) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  // 1. Insertar cartera
  const { data: wallet, error } = await supabase
    .from('wallets')
    .insert({
      user_id: user.id,
      name,
      balance: 0.00, // Se inicializa en 0 y se actualiza mediante transacción
      currency: 'MXN'
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Error al crear cartera:', error);
    return { success: false, error: 'Error al crear la cartera' };
  }

  // 2. Si hay saldo inicial, insertar una transacción de ingreso
  if (initialBalance > 0) {
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        wallet_id: (wallet as any).id,
        type: 'income',
        amount: initialBalance,
        concept: 'Saldo inicial',
        date: new Date().toISOString()
      } as any);

    if (txError) {
      console.error('Error al crear transacción inicial:', txError);
      // Borramos la cartera si falla la transacción inicial para mantener consistencia
      await supabase.from('wallets').delete().eq('id', (wallet as any).id);
      return { success: false, error: 'Error al inicializar el saldo' };
    }
  }

  revalidatePath('/wallets');
  revalidatePath('/');
  return { success: true, wallet: wallet as any };
}

/**
 * Elimina una cartera.
 */
export async function deleteWallet(walletId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  const { error } = await supabase
    .from('wallets')
    .delete()
    .eq('id', walletId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error al eliminar cartera:', error);
    return { success: false, error: 'No se pudo eliminar la cartera' };
  }

  revalidatePath('/wallets');
  revalidatePath('/');
  return { success: true };
}

/**
 * Obtiene las transacciones de una cartera o de todas las carteras.
 */
export async function getTransactions(walletId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  let query = supabase
    .from('transactions')
    .select('*, wallets(name), categories(name, color, icon)')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (walletId) {
    query = query.eq('wallet_id', walletId);
  }

  const { data: transactions, error } = await query;

  if (error) {
    console.error('Error al obtener transacciones:', error);
    return [];
  }

  return transactions || [];
}

/**
 * Crea una transacción manual.
 */
export async function createTransaction(data: {
  wallet_id: string;
  type: 'income' | 'expense';
  amount: number;
  concept: string;
  category_id?: string | null;
  date?: string;
  invoice_id?: string | null;
  voucher_base64?: string | null;
  voucher_name?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  let voucherUrl: string | null = null;

  if (data.voucher_base64 && data.voucher_name) {
    try {
      const base64Data = data.voucher_base64.split(';base64,').pop();
      if (base64Data) {
        const buffer = Buffer.from(base64Data, 'base64');
        const fileExt = data.voucher_name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabaseAdmin
          .storage
          .from('comprobantes')
          .upload(fileName, buffer, {
            contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
            upsert: false
          });

        if (uploadError) {
          console.error('Error al subir comprobante:', uploadError);
        } else {
          voucherUrl = fileName;
        }
      }
    } catch (err) {
      console.error('Failed to parse and upload voucher:', err);
    }
  }

  const { error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      wallet_id: data.wallet_id,
      type: data.type,
      amount: data.amount,
      concept: data.concept,
      category_id: data.category_id || null,
      invoice_id: data.invoice_id || null,
      date: data.date || new Date().toISOString(),
      voucher_url: voucherUrl
    } as any);

  if (error) {
    console.error('Error al crear transacción:', error);
    return { success: false, error: 'Error al registrar la transacción' };
  }

  revalidatePath('/wallets');
  revalidatePath('/');
  return { success: true };
}

/**
 * Obtiene la URL firmada para visualizar un comprobante de transacción.
 */
export async function getVoucherUrl(filePath: string) {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) return null;

  const { data, error } = await supabaseAdmin
    .storage
    .from('comprobantes')
    .createSignedUrl(filePath, 60);

  if (error) {
    console.error('Error al generar URL firmada:', error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Elimina una transacción.
 */
export async function deleteTransaction(transactionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error al eliminar transacción:', error);
    return { success: false, error: 'No se pudo eliminar la transacción' };
  }

  revalidatePath('/wallets');
  revalidatePath('/');
  return { success: true };
}

/**
 * Obtiene todas las facturas que aún no están vinculadas a ninguna transacción.
 */
export async function getUnlinkedInvoices() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // 1. Obtener IDs de facturas ya vinculadas
  const { data: linkedTxs, error: txError } = await supabase
    .from('transactions')
    .select('invoice_id')
    .eq('user_id', user.id)
    .not('invoice_id', 'is', null);

  if (txError) {
    console.error('Error al obtener facturas vinculadas:', txError);
    return [];
  }

  const linkedIds = ((linkedTxs as any[]) || []).map((t: any) => t.invoice_id);

  // 2. Obtener todas las facturas del usuario
  let query = supabase
    .from('invoices')
    .select('*, categories(*)')
    .eq('user_id', user.id)
    .eq('status', 'Vigente')
    .order('fecha', { ascending: false });

  // 3. Filtrar las no vinculadas
  const { data: invoices, error: invError } = await query;
  if (invError) {
    console.error('Error al obtener facturas:', invError);
    return [];
  }

  const unlinked = (invoices as any[] || []).filter(inv => !linkedIds.includes(inv.id));
  return unlinked;
}

/**
 * Vincula una factura XML (ej. nómina o gasto) a una cartera.
 * Esto crea una transacción automática que suma o resta saldo en la cartera.
 */
export async function linkInvoiceToWallet(invoiceId: string, walletId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  // 1. Obtener la factura
  const { data: invoice, error: invError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('user_id', user.id)
    .single();

  if (invError || !invoice) {
    console.error('Error al obtener factura para vincular:', invError);
    return { success: false, error: 'No se encontró la factura especificada' };
  }

  const invoiceData = invoice as any;

  // 2. Determinar si la transacción es un ingreso o un gasto
  // Nomina e Ingresos emitidos son ingresos (income) para el usuario
  // Egresos son gastos (expense)
  const isIncome = invoiceData.invoice_type === 'nomina' || invoiceData.invoice_type === 'ingreso';
  const type = isIncome ? 'income' : 'expense';
  
  // Concepto de la transacción
  const partnerName = isIncome ? invoiceData.nombre_emisor : invoiceData.nombre_emisor;
  const prefix = isIncome 
    ? (invoiceData.invoice_type === 'nomina' ? 'Depósito de Nómina' : 'Ingreso Facturado')
    : 'Pago Facturado';
    
  const concept = `${prefix}: ${partnerName}`;

  // 3. Insertar la transacción vinculada
  const { error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      wallet_id: walletId,
      type,
      amount: Number(invoiceData.total),
      concept,
      category_id: invoiceData.category_id || null,
      invoice_id: invoiceId,
      date: invoiceData.fecha
    } as any);

  if (txError) {
    console.error('Error al insertar transacción vinculada:', txError);
    return { success: false, error: 'Error al registrar la transacción en la cartera' };
  }

  revalidatePath('/wallets');
  revalidatePath('/');
  return { success: true };
}

/**
 * Guarda o actualiza el RFC del usuario en la base de datos.
 */
export async function saveUserRFC(rfc: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  const formattedRFC = rfc.trim().toUpperCase();

  const { error } = await (supabase.from('users') as any)
    .update({ rfc: formattedRFC })
    .eq('id', user.id);

  if (error) {
    console.error('Error al guardar RFC:', error);
    return { success: false, error: 'Error al guardar el RFC' };
  }

  revalidatePath('/settings');
  revalidatePath('/');
  return { success: true };
}

/**
 * Obtiene el RFC del usuario.
 */
export async function getUserRFC() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('rfc')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error al obtener RFC:', error);
    return null;
  }

  return (data as any)?.rfc || null;
}
