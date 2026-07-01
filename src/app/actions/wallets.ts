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

  // Procesar pagos recurrentes vencidos del usuario en caliente
  try {
    await processRecurringPayments(user.id);
  } catch (err) {
    console.error('Error al procesar pagos recurrentes en getWallets:', err);
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

  return wallets || [];
}

/**
 * Crea una nueva cartera.
 */
export async function createWallet(
  name: string, 
  type: 'cash' | 'debit' | 'credit' = 'debit', 
  initialBalance: number = 0, 
  creditLimit: number = 0,
  cutOffDay: number | null = null,
  dueDay: number | null = null,
  statementPaymentDue: number = 0
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  // Para tarjeta de crédito, el balance inicial representa deuda. 
  // Si ingresan saldo positivo de deuda, lo registramos como negativo (balance real).
  const actualBalance = type === 'credit' ? -Math.abs(initialBalance) : initialBalance;

  // 1. Insertar cartera
  const { data: wallet, error } = await (supabase
    .from('wallets')
    .insert({
      user_id: user.id,
      name,
      balance: 0.00, // Se inicializa en 0 y se actualiza mediante transacción
      currency: 'MXN',
      type,
      credit_limit: type === 'credit' ? creditLimit : 0.00,
      cut_off_day: type === 'credit' ? cutOffDay : null,
      due_day: type === 'credit' ? dueDay : null,
      statement_payment_due: type === 'credit' ? statementPaymentDue : 0.00
    } as any)
    .select() as any)
    .single();

  if (error) {
    console.error('Error al crear cartera:', error);
    return { success: false, error: 'Error al crear la cartera. Asegúrate de ejecutar la migración SQL.' };
  }

  // 2. Si hay saldo inicial (positivo o negativo), insertar una transacción de ajuste
  if (initialBalance !== 0) {
    const isCredit = type === 'credit';
    // Si es crédito y tiene saldo inicial (ej. debe $5000), es un gasto (expense).
    // Si es débito/efectivo y es positivo, es ingreso (income).
    const txType = isCredit ? 'expense' : (initialBalance > 0 ? 'income' : 'expense');
    const amount = Math.abs(initialBalance);

    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        wallet_id: (wallet as any).id,
        type: txType,
        amount,
        concept: isCredit ? 'Deuda inicial' : 'Saldo inicial',
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
 * Actualiza una cartera existente.
 * Permite cambiar el nombre, tipo, límite de crédito y ajustar el balance de forma profesional.
 */
export async function updateWallet(
  walletId: string, 
  name: string, 
  type: 'cash' | 'debit' | 'credit', 
  creditLimit: number, 
  newBalance: number,
  cutOffDay: number | null = null,
  dueDay: number | null = null,
  statementPaymentDue: number = 0
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  // 1. Obtener el saldo actual de la cartera para calcular la diferencia de ajuste
  const { data: currentWallet, error: fetchError } = await supabase
    .from('wallets')
    .select('balance')
    .eq('id', walletId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !currentWallet) {
    console.error('Error al obtener la cartera para actualizar:', fetchError);
    return { success: false, error: 'No se encontró la cartera especificada' };
  }

  const currentBal = Number((currentWallet as any).balance);
  const diff = newBalance - currentBal;

  // 2. Si hay diferencia, creamos una transacción de ajuste para conciliar el saldo de forma profesional
  if (diff !== 0) {
    const txType = diff > 0 ? 'income' : 'expense';
    const amount = Math.abs(diff);

    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        wallet_id: walletId,
        type: txType,
        amount,
        concept: 'Ajuste de saldo manual',
        date: new Date().toISOString()
      } as any);

    if (txError) {
      console.error('Error al registrar transacción de ajuste:', txError);
      return { success: false, error: 'No se pudo ajustar el saldo' };
    }
  }

  // 3. Actualizar los campos de la cartera (el saldo se actualiza automáticamente por el trigger si hubo transacción)
  const { data: updatedWallet, error: updateError } = await (supabase.from('wallets') as any)
    .update({
      name,
      type,
      credit_limit: type === 'credit' ? creditLimit : 0.00,
      cut_off_day: type === 'credit' ? cutOffDay : null,
      due_day: type === 'credit' ? dueDay : null,
      statement_payment_due: type === 'credit' ? statementPaymentDue : 0.00
    })
    .eq('id', walletId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (updateError) {
    console.error('Error al actualizar la cartera:', updateError);
    return { success: false, error: 'Error al guardar los cambios de la cartera' };
  }

  revalidatePath('/wallets');
  revalidatePath('/');
  return { success: true, wallet: updatedWallet as any };
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
    .select('*, wallets(name), categories(name, color, icon), invoices(*, categories(*))')
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
  installments_count?: number | null;
  current_installment?: number | null;
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
      voucher_url: voucherUrl,
      installments_count: data.installments_count || null,
      current_installment: data.current_installment || null
    } as any);

  if (error) {
    console.error('Error al crear transacción:', error);
    return { success: false, error: 'Error al registrar la transacción' };
  }

  // Si es un ingreso y el concepto contiene "Nómina", verificar cobros de préstamos asociados
  if (data.type === 'income' && data.concept.toLowerCase().includes('nómina')) {
    try {
      await autoDeductLoansFromPayroll(user.id, data.wallet_id, data.date || new Date().toISOString());
    } catch (err) {
      console.error('Error en deducción automática de préstamos:', err);
    }
  }

  revalidatePath('/wallets');
  revalidatePath('/');
  return { success: true };
}

/**
 * Actualiza el pago para no generar intereses de una cartera manualmente.
 */
export async function updateWalletStatement(walletId: string, statementPaymentDue: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  const { data: updatedWallet, error: updateError } = await (supabase.from('wallets') as any)
    .update({
      statement_payment_due: statementPaymentDue
    })
    .eq('id', walletId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (updateError) {
    console.error('Error al actualizar el pago de corte:', updateError);
    return { success: false, error: 'Error al actualizar el pago del corte de tarjeta.' };
  }

  revalidatePath('/wallets');
  revalidatePath('/');
  return { success: true, wallet: updatedWallet as any };
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
export async function linkInvoiceToWallet(invoiceId: string, walletId: string, ignoreBalanceEffect: boolean = false) {
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
      amount: ignoreBalanceEffect ? 0 : Number(invoiceData.total),
      concept: ignoreBalanceEffect ? `${concept} (Sin afectar saldo)` : concept,
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

/**
 * Restablece por completo los datos del usuario para empezar de cero.
 */
export async function resetUserData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  // 1. Eliminar transacciones
  const { error: txError } = await supabase
    .from('transactions')
    .delete()
    .eq('user_id', user.id);

  if (txError) {
    console.error('Error al borrar transacciones:', txError);
  }

  // 2. Eliminar facturas
  const { error: invError } = await supabase
    .from('invoices')
    .delete()
    .eq('user_id', user.id);

  if (invError) {
    console.error('Error al borrar facturas:', invError);
  }

  // 3. Eliminar pagos recurrentes
  const { error: recError } = await (supabase
    .from('recurring_payments') as any)
    .delete()
    .eq('user_id', user.id);

  if (recError) {
    console.error('Error al borrar pagos recurrentes:', recError);
  }

  // 4. Eliminar carteras
  const { error: walletError } = await supabase
    .from('wallets')
    .delete()
    .eq('user_id', user.id);

  if (walletError) {
    console.error('Error al borrar carteras:', walletError);
  }

  // 5. Eliminar categorías personalizadas (las que tienen user_id del usuario)
  const { error: catError } = await supabase
    .from('categories')
    .delete()
    .eq('user_id', user.id);

  if (catError) {
    console.error('Error al borrar categorías:', catError);
  }

  // 6. Eliminar préstamos
  const { error: loanError } = await (supabase.from('loans') as any)
    .delete()
    .eq('user_id', user.id);

  if (loanError) {
    console.error('Error al borrar préstamos:', loanError);
  }

  // 7. Resetear RFC del usuario a NULL en la tabla users
  const { error: userError } = await (supabase.from('users') as any)
    .update({ rfc: null })
    .eq('id', user.id);

  if (userError) {
    console.error('Error al resetear RFC del usuario:', userError);
  }

  // 8. Vaciar físicamente los archivos del storage (XMLs y comprobantes)
  try {
    const { data: fileList } = await supabaseAdmin.storage.from('facturas').list();
    if (fileList && fileList.length > 0) {
      const fileNames = fileList.map(f => f.name);
      await supabaseAdmin.storage.from('facturas').remove(fileNames);
    }
  } catch (err) {
    console.error('Error al vaciar storage de facturas:', err);
  }

  try {
    const { data: voucherList } = await supabaseAdmin.storage.from('comprobantes').list();
    if (voucherList && voucherList.length > 0) {
      const voucherNames = voucherList.map(f => f.name);
      await supabaseAdmin.storage.from('comprobantes').remove(voucherNames);
    }
  } catch (err) {
    console.error('Error al vaciar storage de comprobantes:', err);
  }

  revalidatePath('/wallets');
  revalidatePath('/');
  revalidatePath('/settings');
  revalidatePath('/invoices');
  revalidatePath('/loans');
  
  return { success: true };
}

/**
 * Obtiene todas las reglas de pagos recurrentes del usuario.
 */
export async function getRecurringPayments() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  const { data, error } = await (supabase
    .from('recurring_payments') as any)
    .select('*, wallets(name), categories(name, color, icon)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener pagos recurrentes:', error);
    return [];
  }

  return data || [];
}

/**
 * Crea una nueva regla de pago/ingreso recurrente.
 */
export async function createRecurringPayment(data: {
  wallet_id: string;
  type: 'income' | 'expense';
  amount: number;
  concept: string;
  category_id?: string | null;
  frequency: 'days_14' | 'days_15' | 'monthly' | 'weekly' | 'yearly';
  start_date: string;
  next_execution_date: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  const { data: rule, error } = await (supabase
    .from('recurring_payments') as any)
    .insert({
      user_id: user.id,
      wallet_id: data.wallet_id,
      type: data.type,
      amount: data.amount,
      concept: data.concept,
      category_id: data.category_id || null,
      frequency: data.frequency,
      start_date: data.start_date,
      next_execution_date: data.next_execution_date,
      is_active: true
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Error al crear regla recurrente:', error);
    return { success: false, error: 'Error al registrar la regla de pago recurrente.' };
  }

  revalidatePath('/wallets');
  revalidatePath('/settings');
  revalidatePath('/');
  return { success: true, rule };
}

/**
 * Actualiza una regla de pago recurrente existente.
 */
export async function updateRecurringPayment(
  id: string,
  data: {
    wallet_id: string;
    type: 'income' | 'expense';
    amount: number;
    concept: string;
    category_id?: string | null;
    frequency: 'days_14' | 'days_15' | 'monthly' | 'weekly' | 'yearly';
    start_date: string;
    next_execution_date: string;
    is_active: boolean;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  const { data: rule, error } = await (supabase
    .from('recurring_payments') as any)
    .update({
      wallet_id: data.wallet_id,
      type: data.type,
      amount: data.amount,
      concept: data.concept,
      category_id: data.category_id || null,
      frequency: data.frequency,
      start_date: data.start_date,
      next_execution_date: data.next_execution_date,
      is_active: data.is_active
    } as any)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error al actualizar regla recurrente:', error);
    return { success: false, error: 'Error al guardar cambios de la regla recurrente.' };
  }

  revalidatePath('/wallets');
  revalidatePath('/settings');
  revalidatePath('/');
  return { success: true, rule };
}

/**
 * Elimina una regla de pago recurrente.
 */
export async function deleteRecurringPayment(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  const { error } = await (supabase
    .from('recurring_payments') as any)
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error al eliminar regla recurrente:', error);
    return { success: false, error: 'No se pudo eliminar la regla recurrente.' };
  }

  revalidatePath('/wallets');
  revalidatePath('/settings');
  revalidatePath('/');
  return { success: true };
}

/**
 * Procesa todos los pagos recurrentes pendientes del usuario.
 * Inserta transacciones para cada ciclo vencido y actualiza la fecha de próxima ejecución.
 */
export async function processRecurringPayments(userId: string) {
  const supabase = await createClient();
  const now = new Date();
  
  // Buscar programaciones activas cuyo vencimiento ya haya pasado
  const todayStr = now.toISOString().split('T')[0];

  const { data: rules, error: rulesError } = await (supabase
    .from('recurring_payments') as any)
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .lte('next_execution_date', todayStr);

  if (rulesError || !rules) {
    if (rulesError) console.error('Error al obtener pagos recurrentes pendientes:', rulesError);
    return;
  }

  for (const rule of rules) {
    let nextExec = new Date(rule.next_execution_date);
    
    // Iterar para crear transacciones por cada ciclo vencido
    while (nextExec <= now) {
      // 1. Insertar transacción
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          wallet_id: rule.wallet_id,
          type: rule.type,
          amount: rule.amount,
          concept: rule.concept,
          category_id: rule.category_id || null,
          date: nextExec.toISOString()
        } as any);

      if (txError) {
        console.error('Error al insertar transacción automática recurrente:', txError);
        break;
      }

      // Si es un ingreso y el concepto contiene "Nómina", verificar cobros de préstamos asociados
      if (rule.type === 'income' && rule.concept.toLowerCase().includes('nómina')) {
        try {
          await autoDeductLoansFromPayroll(userId, rule.wallet_id, nextExec.toISOString());
        } catch (err) {
          console.error('Error en deducción automática de préstamos en recurrente:', err);
        }
      }

      // 2. Incrementar fecha de próxima ejecución según la frecuencia
      const freq = rule.frequency;
      if (freq === 'days_14') {
        nextExec.setDate(nextExec.getDate() + 14);
      } else if (freq === 'days_15') {
        nextExec.setDate(nextExec.getDate() + 15);
      } else if (freq === 'monthly') {
        nextExec.setMonth(nextExec.getMonth() + 1);
      } else if (freq === 'weekly') {
        nextExec.setDate(nextExec.getDate() + 7);
      } else if (freq === 'yearly') {
        nextExec.setFullYear(nextExec.getFullYear() + 1);
      } else {
        nextExec.setMonth(nextExec.getMonth() + 1);
      }
    }

    // 3. Guardar la nueva fecha de próxima ejecución en la base de datos
    const nextExecStr = nextExec.toISOString().split('T')[0];
    const { error: updateError } = await (supabase
      .from('recurring_payments') as any)
      .update({ next_execution_date: nextExecStr } as any)
      .eq('id', rule.id);

    if (updateError) {
      console.error('Error al actualizar fecha de ejecución de regla recurrente:', updateError);
    }
  }
}

/**
 * Actualiza una transacción existente.
 */
export async function updateTransaction(
  transactionId: string,
  data: {
    amount: number;
    concept: string;
    category_id?: string | null;
    date: string;
    type?: 'income' | 'expense';
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  const updateFields: any = {
    amount: data.amount,
    concept: data.concept,
    category_id: data.category_id || null,
    date: data.date
  };

  if (data.type) {
    updateFields.type = data.type;
  }

  const { data: tx, error } = await (supabase
    .from('transactions') as any)
    .update(updateFields)
    .eq('id', transactionId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error al actualizar transacción:', error);
    return { success: false, error: 'No se pudo actualizar la transacción' };
  }

  revalidatePath('/wallets');
  revalidatePath('/');
  return { success: true, transaction: tx };
}

/**
 * Deduce automáticamente la cuota de préstamos activos ligados a una nómina depositada.
 */
export async function autoDeductLoansFromPayroll(userId: string, walletId: string, date: string) {
  const supabase = await createClient();
  
  // Buscar préstamos activos ligados a esta cartera
  const { data: activeLoans } = await (supabase
    .from('loans') as any)
    .select('*')
    .eq('user_id', userId)
    .eq('wallet_id', walletId)
    .eq('is_active', true);

  if (!activeLoans || activeLoans.length === 0) return;

  for (const loan of activeLoans) {
    // Verificar si ya existe un pago regular registrado para este préstamo en el mismo día
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: existingPayment } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('loan_id', loan.id)
      .eq('loan_payment_type', 'regular')
      .gte('date', startOfDay.toISOString())
      .lte('date', endOfDay.toISOString())
      .limit(1);

    if (existingPayment && existingPayment.length > 0) {
      console.log(`El pago de préstamo para ${loan.name} ya fue deducido en esta fecha.`);
      continue;
    }

    const nextPaymentNumber = loan.payments_made + 1;
    
    // Si ya completamos todos los pagos, desactivamos el préstamo
    if (nextPaymentNumber > loan.total_payments) {
      await (supabase.from('loans') as any)
        .update({ is_active: false } as any)
        .eq('id', loan.id);
      continue;
    }

    // Calcular porción de capital para este pago quincenal/mensual
    const principalAmount = calculatePrincipalPortion(
      loan.amount_granted,
      loan.current_balance,
      loan.interest_rate,
      loan.total_payments,
      loan.payments_made,
      loan.frequency,
      loan.payment_amount
    );

    // Insertar la transacción de deducción
    await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        wallet_id: walletId,
        type: 'expense',
        amount: loan.payment_amount,
        concept: `Deducción Préstamo ${loan.name} (Recibo ${nextPaymentNumber}/${loan.total_payments})`,
        date: date,
        loan_id: loan.id,
        loan_payment_type: 'regular',
        principal_amount: principalAmount
      } as any);
  }
}

// Helper para calcular la porción de capital del pago
function calculatePrincipalPortion(
  amountGranted: number,
  currentBalance: number,
  interestRate: number,
  totalPayments: number,
  paymentsMade: number,
  frequency: string,
  paymentAmount: number
) {
  const annualRate = Number(interestRate) / 100;
  let periodsPerYear = 12;
  if (frequency === 'days_14') periodsPerYear = 26;
  else if (frequency === 'days_15') periodsPerYear = 24;

  const ratePerPeriod = annualRate / periodsPerYear;
  
  // Interés bruto con IVA (16%)
  const grossInterest = Number(currentBalance) * ratePerPeriod;
  const interestWithIVA = grossInterest * 1.16;

  let principal = Number(paymentAmount) - interestWithIVA;
  
  if (principal < 0) principal = 0;
  if (principal > Number(currentBalance)) principal = Number(currentBalance);

  return Math.round(principal * 100) / 100;
}

/**
 * Elimina las facturas XML cargadas de la base de datos y vacía físicamente el storage.
 * Desvincula las facturas de cualquier transacción para no borrar tus movimientos ni alterar carteras.
 */
export async function resetXMLData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  // 1. Desvincular todas las facturas de las transacciones (establecer invoice_id a null)
  const { error: txError } = await (supabase
    .from('transactions') as any)
    .update({ invoice_id: null } as any)
    .eq('user_id', user.id);

  if (txError) {
    console.error('Error al desvincular facturas de transacciones:', txError);
  }

  // 2. Eliminar facturas
  const { error: invError } = await supabase
    .from('invoices')
    .delete()
    .eq('user_id', user.id);

  if (invError) {
    console.error('Error al borrar facturas:', invError);
    return { success: false, error: 'No se pudieron eliminar las facturas de la base de datos' };
  }

  // 3. Vaciar físicamente los archivos del storage (XMLs y comprobantes)
  try {
    const { data: fileList } = await supabaseAdmin.storage.from('facturas').list();
    if (fileList && fileList.length > 0) {
      const fileNames = fileList.map(f => f.name);
      await supabaseAdmin.storage.from('facturas').remove(fileNames);
    }
  } catch (err) {
    console.error('Error al vaciar storage de facturas:', err);
  }

  try {
    const { data: voucherList } = await supabaseAdmin.storage.from('comprobantes').list();
    if (voucherList && voucherList.length > 0) {
      const voucherNames = voucherList.map(f => f.name);
      await supabaseAdmin.storage.from('comprobantes').remove(voucherNames);
    }
  } catch (err) {
    console.error('Error al vaciar storage de comprobantes:', err);
  }

  revalidatePath('/invoices');
  revalidatePath('/wallets');
  revalidatePath('/');
  return { success: true };
}
