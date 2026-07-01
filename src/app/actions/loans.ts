"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseAdmin = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getLoans() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  const { data, error } = await (supabase.from('loans') as any)
    .select('*, wallets(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener préstamos:', error);
    return [];
  }

  return data || [];
}

export async function createLoan(data: {
  name: string;
  bank: string;
  contract_number?: string;
  clabe?: string;
  amount_granted: number;
  current_balance: number;
  interest_rate: number;
  total_payments: number;
  frequency: 'days_14' | 'days_15' | 'monthly';
  payment_amount: number;
  start_date: string;
  wallet_id: string;
  depositInWallet: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  // Crear registro de préstamo
  const { data: loan, error } = await (supabase.from('loans') as any)
    .insert({
      user_id: user.id,
      name: data.name,
      bank: data.bank,
      contract_number: data.contract_number || null,
      clabe: data.clabe || null,
      amount_granted: data.amount_granted,
      current_balance: data.current_balance,
      interest_rate: data.interest_rate,
      total_payments: data.total_payments,
      payments_made: 0,
      frequency: data.frequency,
      payment_amount: data.payment_amount,
      start_date: data.start_date,
      wallet_id: data.wallet_id,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    console.error('Error al crear préstamo:', error);
    return { success: false, error: 'Error al registrar el préstamo' };
  }

  // Si eligió depositar el monto otorgado en la cartera asociada
  if (data.depositInWallet && data.amount_granted > 0) {
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        wallet_id: data.wallet_id,
        type: 'income',
        amount: data.amount_granted,
        concept: `Depósito de Préstamo - ${data.name}`,
        date: new Date(data.start_date + 'T12:00:00').toISOString()
      } as any);

    if (txError) {
      console.error('Error al registrar transacción de depósito de préstamo:', txError);
    }
  }

  revalidatePath('/loans');
  revalidatePath('/wallets');
  revalidatePath('/');
  return { success: true, loan };
}

export async function updateLoan(loanId: string, data: {
  name: string;
  bank: string;
  contract_number?: string | null;
  clabe?: string | null;
  amount_granted: number;
  current_balance: number;
  interest_rate: number;
  total_payments: number;
  payments_made: number;
  frequency: 'days_14' | 'days_15' | 'monthly';
  payment_amount: number;
  wallet_id: string;
  is_active: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  const { data: loan, error } = await (supabase.from('loans') as any)
    .update({
      name: data.name,
      bank: data.bank,
      contract_number: data.contract_number || null,
      clabe: data.clabe || null,
      amount_granted: data.amount_granted,
      current_balance: data.current_balance,
      interest_rate: data.interest_rate,
      total_payments: data.total_payments,
      payments_made: data.payments_made,
      frequency: data.frequency,
      payment_amount: data.payment_amount,
      wallet_id: data.wallet_id,
      is_active: data.is_active
    })
    .eq('id', loanId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error al actualizar préstamo:', error);
    return { success: false, error: 'No se pudo actualizar el préstamo' };
  }

  revalidatePath('/loans');
  revalidatePath('/wallets');
  revalidatePath('/');
  return { success: true, loan };
}

export async function deleteLoan(loanId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  // Al borrar el préstamo, eliminamos las transacciones vinculadas para restaurar el saldo de cartera
  const { error: txError } = await supabase
    .from('transactions')
    .delete()
    .eq('loan_id', loanId)
    .eq('user_id', user.id);

  if (txError) {
    console.error('Error al borrar transacciones del préstamo:', txError);
  }

  const { error } = await (supabase.from('loans') as any)
    .delete()
    .eq('id', loanId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error al borrar préstamo:', error);
    return { success: false, error: 'No se pudo eliminar el préstamo' };
  }

  revalidatePath('/loans');
  revalidatePath('/wallets');
  revalidatePath('/');
  return { success: true };
}

export async function addLoanPayment(
  loanId: string,
  walletId: string,
  amount: number,
  paymentNumber: number,
  principalAmount: number,
  date?: string,
  voucher_base64?: string | null,
  voucher_name?: string | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  const paymentDate = date ? new Date(date + 'T12:00:00') : new Date();

  // Subir comprobante si existe
  let voucherUrl: string | null = null;
  if (voucher_base64 && voucher_name) {
    try {
      const base64Data = voucher_base64.split(';base64,').pop();
      if (base64Data) {
        const buffer = Buffer.from(base64Data, 'base64');
        const fileExt = voucher_name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabaseAdmin
          .storage
          .from('comprobantes')
          .upload(fileName, buffer, {
            contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
            upsert: false
          });

        if (uploadError) {
          console.error('Error al subir comprobante de pago de préstamo:', uploadError);
        } else {
          voucherUrl = fileName;
        }
      }
    } catch (uploadErr) {
      console.error('Error de subida de comprobante:', uploadErr);
    }
  }

  // Registrar transacción de cobro regular
  const { data: tx, error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      wallet_id: walletId,
      type: 'expense',
      amount: amount,
      concept: `Pago Préstamo Recibo ${paymentNumber}`,
      date: paymentDate.toISOString(),
      loan_id: loanId,
      loan_payment_type: 'regular',
      principal_amount: principalAmount,
      voucher_url: voucherUrl
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Error al registrar pago de préstamo:', error);
    return { success: false, error: 'No se pudo registrar el pago' };
  }

  revalidatePath('/loans');
  revalidatePath('/wallets');
  revalidatePath('/');
  return { success: true, transaction: tx };
}

export async function addLoanPrincipalPayment(
  loanId: string,
  walletId: string,
  amount: number,
  date?: string,
  voucher_base64?: string | null,
  voucher_name?: string | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  const paymentDate = date ? new Date(date + 'T12:00:00') : new Date();

  // Subir comprobante si existe
  let voucherUrl: string | null = null;
  if (voucher_base64 && voucher_name) {
    try {
      const base64Data = voucher_base64.split(';base64,').pop();
      if (base64Data) {
        const buffer = Buffer.from(base64Data, 'base64');
        const fileExt = voucher_name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabaseAdmin
          .storage
          .from('comprobantes')
          .upload(fileName, buffer, {
            contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
            upsert: false
          });

        if (uploadError) {
          console.error('Error al subir comprobante de abono a capital:', uploadError);
        } else {
          voucherUrl = fileName;
        }
      }
    } catch (uploadErr) {
      console.error('Error de subida de comprobante de capital:', uploadErr);
    }
  }

  // Registrar transacción de abono extraordinario
  const { data: tx, error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      wallet_id: walletId,
      type: 'expense',
      amount: amount,
      concept: `Abono Extraordinario a Capital`,
      date: paymentDate.toISOString(),
      loan_id: loanId,
      loan_payment_type: 'principal_only',
      voucher_url: voucherUrl
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Error al registrar abono a capital:', error);
    return { success: false, error: 'No se pudo registrar el abono' };
  }

  revalidatePath('/loans');
  revalidatePath('/wallets');
  revalidatePath('/');
  return { success: true, transaction: tx };
}
