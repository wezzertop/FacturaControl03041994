"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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
  date?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  const paymentDate = date ? new Date(date + 'T12:00:00') : new Date();

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
      principal_amount: principalAmount
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
  date?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  const paymentDate = date ? new Date(date + 'T12:00:00') : new Date();

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
      loan_payment_type: 'principal_only'
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
