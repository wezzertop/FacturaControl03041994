"use server";

import { createClient } from "@/utils/supabase/server";
import { resetUserData, createWallet, saveUserRFC } from "@/app/actions/wallets";
import { revalidatePath } from "next/cache";

interface OnboardingWallet {
  name: string;
  type: 'cash' | 'debit' | 'credit';
  initialBalance: number;
  creditLimit?: number;
  cutOffDay?: number;
  dueDay?: number;
  isPayrollRecipient?: boolean;
}

interface OnboardingLoan {
  name: string;
  bank: string;
  amount_granted: number;
  current_balance: number;
  interest_rate: number;
  total_payments: number;
  frequency: 'days_14' | 'days_15' | 'monthly';
  payment_amount: number;
  start_date: string;
  wallet_name: string;
  first_payment_date?: string;
  first_payment_amount?: number;
}

interface OnboardingData {
  rfc?: string;
  startDate: string; // YYYY-MM-DD
  hasPayroll: boolean;
  payrollAmount: number;
  nextPayrollDate: string; // YYYY-MM-DD
  payrollFrequency: 'days_14' | 'days_15' | 'monthly' | 'weekly' | 'yearly';
  wallets: OnboardingWallet[];
  hasLoan: boolean;
  loan?: OnboardingLoan;
}

export async function setupInitialData(data: OnboardingData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Usuario no autenticado" };
  }

  // 1. Resetear todos los datos existentes para empezar limpio
  const resetRes = await resetUserData();
  if (!resetRes.success) {
    return { success: false, error: resetRes.error || "No se pudo limpiar los datos antiguos" };
  }

  // 2. Si ingresó RFC, guardarlo
  if (data.rfc && data.rfc.trim()) {
    await saveUserRFC(data.rfc);
  }

  // 3. Crear carteras
  let payrollRecipientWalletId: string | null = null;

  for (const walletData of data.wallets) {
    const res = await createWallet(
      walletData.name,
      walletData.type,
      walletData.initialBalance,
      walletData.creditLimit || 0,
      walletData.cutOffDay || null,
      walletData.dueDay || null,
      0 // statementPaymentDue
    );

    if (!res.success || !res.wallet) {
      return { success: false, error: `Error al crear cartera ${walletData.name}: ${res.error}` };
    }

    const createdWalletId = (res.wallet as any).id;

    // Si esta cartera recibe la nómina
    if (walletData.isPayrollRecipient) {
      payrollRecipientWalletId = createdWalletId;
    }
  }

  // 4. Si tiene nómina configurada, crear el pago recurrente de ingresos
  if (data.hasPayroll) {
    if (!payrollRecipientWalletId && data.wallets.length > 0) {
      const fallbackWallet = data.wallets.find(w => w.type !== 'credit') || data.wallets[0];
      const { data: insertedWallets } = await supabase
        .from('wallets')
        .select('id, name')
        .eq('user_id', user.id);
      
      const matchedWallet = (insertedWallets as any)?.find((w: any) => w.name === fallbackWallet.name);
      if (matchedWallet) {
        payrollRecipientWalletId = (matchedWallet as any).id;
      }
    }

    if (payrollRecipientWalletId) {
      const { error: ruleError } = await (supabase
        .from('recurring_payments') as any)
        .insert({
          user_id: user.id,
          wallet_id: payrollRecipientWalletId,
          type: 'income',
          amount: data.payrollAmount,
          concept: 'Nómina',
          frequency: data.payrollFrequency,
          start_date: data.startDate,
          next_execution_date: data.nextPayrollDate,
          is_active: true
        } as any);

      if (ruleError) {
        console.error("Error al crear regla de nómina recurrente:", ruleError);
        return { success: false, error: "Se crearon las carteras pero falló la configuración de la nómina recurrente." };
      }
    }
  }

  // 5. Si tiene préstamo configurado, crearlo
  if (data.hasLoan && data.loan) {
    const loan = data.loan;
    const { data: insertedWallets } = await supabase
      .from('wallets')
      .select('id, name')
      .eq('user_id', user.id);

    const matchedWallet = (insertedWallets as any)?.find((w: any) => w.name === loan.wallet_name);
    if (matchedWallet) {
      const { error: loanError } = await (supabase.from('loans') as any)
        .insert({
          user_id: user.id,
          name: loan.name,
          bank: loan.bank,
          amount_granted: loan.amount_granted,
          current_balance: loan.current_balance,
          interest_rate: loan.interest_rate,
          total_payments: loan.total_payments,
          payments_made: 0,
          frequency: loan.frequency,
          payment_amount: loan.payment_amount,
          start_date: loan.start_date,
          wallet_id: matchedWallet.id,
          is_active: true,
          first_payment_date: loan.first_payment_date || null,
          first_payment_amount: loan.first_payment_amount || null
        } as any);

      if (loanError) {
        console.error("Error al registrar préstamo en onboarding:", loanError);
      }
    }
  }

  revalidatePath('/');
  revalidatePath('/wallets');
  revalidatePath('/settings');
  revalidatePath('/loans');
  return { success: true };
}
