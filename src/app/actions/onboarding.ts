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

interface OnboardingData {
  rfc?: string;
  startDate: string; // YYYY-MM-DD
  hasPayroll: boolean;
  payrollAmount: number;
  nextPayrollDate: string; // YYYY-MM-DD
  payrollFrequency: 'days_14' | 'days_15' | 'monthly' | 'weekly' | 'yearly';
  wallets: OnboardingWallet[];
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
    // Si no se asignó explícitamente una cartera receptora, intentamos encontrar la primera cartera creada
    if (!payrollRecipientWalletId && data.wallets.length > 0) {
      // Buscar la primera de tipo debit o cash, si no hay, la primera cualquiera
      const fallbackWallet = data.wallets.find(w => w.type !== 'credit') || data.wallets[0];
      // Necesitamos obtener las carteras recién insertadas de la DB para saber sus IDs correspondientes
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

  revalidatePath('/');
  revalidatePath('/wallets');
  revalidatePath('/settings');
  return { success: true };
}
