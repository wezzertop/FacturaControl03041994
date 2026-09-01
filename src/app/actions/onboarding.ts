"use server";

import { createClient } from "@/utils/supabase/server";
import { resetUserData, createWallet, ensureUserExists } from "@/app/actions/wallets";
import { revalidatePath } from "next/cache";

export interface OnboardingWallet {
  name: string;
  type: 'cash' | 'debit' | 'credit';
  initialBalance: number;
  creditLimit?: number;
  cutOffDay?: number;
  dueDay?: number;
  isPayrollRecipient?: boolean;
}

export interface OnboardingLoan {
  name: string;
  bank: string;
  amount_granted: number;
  current_balance: number;
  interest_rate: number;
  total_payments: number;
  frequency: 'days_14' | 'days_15' | 'every_15_days' | 'monthly';
  payment_amount: number;
  start_date: string;
  wallet_name: string;
  first_payment_date?: string;
  first_payment_amount?: number;
}

export interface OnboardingRecurringExpense {
  concept: string;
  amount: number;
  frequency: 'monthly' | 'days_14' | 'days_15' | 'every_15_days' | 'weekly' | 'yearly';
  nextExecutionDate: string; // YYYY-MM-DD
  wallet_name?: string;
  notifyDaysBefore?: number;
}

export interface OnboardingData {
  startDate: string; // YYYY-MM-DD
  hasPayroll: boolean;
  payrollAmount: number;
  hasProportionalFirstPayment?: boolean;
  firstPaymentAmount?: number;
  firstPaymentDate?: string;
  nextPayrollDate: string; // YYYY-MM-DD
  payrollFrequency: 'days_14' | 'days_15' | 'every_15_days' | 'monthly' | 'weekly' | 'yearly';
  notifyDaysBefore?: number;
  wallets: OnboardingWallet[];
  recurringExpenses?: OnboardingRecurringExpense[];
  hasLoan: boolean;
  loan?: OnboardingLoan;
}

export async function setupInitialData(data: OnboardingData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Usuario no autenticado" };
  }

  // 0. Garantizar existencia del registro de usuario en public.users de forma infalible
  await ensureUserExists(user.id, user.email);

  // 1. Resetear todos los datos existentes para empezar limpio
  const resetRes = await resetUserData();
  if (!resetRes.success) {
    return { success: false, error: resetRes.error || "No se pudo limpiar los datos antiguos" };
  }

  // 2. Crear carteras
  let payrollRecipientWalletId: string | null = null;
  const createdWalletMap = new Map<string, string>(); // Name -> ID

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
    createdWalletMap.set(walletData.name, createdWalletId);

    // Si esta cartera recibe la nómina
    if (walletData.isPayrollRecipient) {
      payrollRecipientWalletId = createdWalletId;
    }
  }

  // 3. Si tiene nómina configurada, crear el pago recurrente de ingresos
  if (data.hasPayroll) {
    if (!payrollRecipientWalletId && data.wallets.length > 0) {
      const fallbackWallet = data.wallets.find(w => w.type !== 'credit') || data.wallets[0];
      payrollRecipientWalletId = createdWalletMap.get(fallbackWallet.name) || Array.from(createdWalletMap.values())[0];
    }

    if (payrollRecipientWalletId) {
      // Si tiene primer pago proporcional ajustado
      const effectiveFirstDate = data.firstPaymentDate || data.nextPayrollDate;
      const effectiveFirstAmount = (data.hasProportionalFirstPayment && data.firstPaymentAmount && data.firstPaymentAmount > 0)
        ? data.firstPaymentAmount
        : data.payrollAmount;

      const { error: ruleError } = await (supabase
        .from('recurring_payments') as any)
        .insert({
          user_id: user.id,
          wallet_id: payrollRecipientWalletId,
          type: 'income',
          amount: effectiveFirstAmount,
          concept: 'Nómina',
          frequency: data.payrollFrequency,
          start_date: effectiveFirstDate,
          next_execution_date: effectiveFirstDate,
          is_active: true
        } as any);

      if (ruleError) {
        console.error("Error al crear regla de nómina recurrente:", ruleError);
      }
    }
  }

  // 4. Si tiene gastos recurrentes configurados (Suscripciones, Renta, Servicios), crearlos
  if (data.recurringExpenses && data.recurringExpenses.length > 0) {
    const defaultWalletId = payrollRecipientWalletId || Array.from(createdWalletMap.values())[0];

    for (const exp of data.recurringExpenses) {
      if (exp.amount > 0) {
        const targetWalletId = exp.wallet_name ? (createdWalletMap.get(exp.wallet_name) || defaultWalletId) : defaultWalletId;
        await (supabase.from('recurring_payments') as any).insert({
          user_id: user.id,
          wallet_id: targetWalletId,
          type: 'expense',
          amount: exp.amount,
          concept: exp.concept,
          frequency: exp.frequency || 'monthly',
          start_date: exp.nextExecutionDate,
          next_execution_date: exp.nextExecutionDate,
          is_active: true
        } as any);
      }
    }
  }

  // 5. Si tiene préstamo configurado, crearlo
  if (data.hasLoan && data.loan) {
    const loan = data.loan;
    const targetWalletId = createdWalletMap.get(loan.wallet_name) || Array.from(createdWalletMap.values())[0];

    if (targetWalletId) {
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
          wallet_id: targetWalletId,
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
  revalidatePath('/calendar');
  revalidatePath('/recurring');
  revalidatePath('/loans');
  revalidatePath('/analytics');
  return { success: true };
}
