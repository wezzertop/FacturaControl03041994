'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

export interface SavingsGoal {
  id: string;
  user_id: string;
  wallet_id?: string | null;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date?: string | null;
  color?: string | null;
  icon?: string | null;
  is_completed: boolean;
  created_at: string;
  wallets?: { name: string } | null;
}

/**
 * Obtiene todas las metas de ahorro y apartados del usuario.
 */
export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  try {
    const { data, error } = await (supabase
      .from('savings_goals') as any)
      .select('*, wallets(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Tabla savings_goals no disponible o error:', error.message);
      return [];
    }

    return (data || []) as SavingsGoal[];
  } catch (err) {
    console.error('Error al obtener metas de ahorro:', err);
    return [];
  }
}

/**
 * Crea una nueva meta de ahorro o apartado.
 */
export async function createSavingsGoal(data: {
  title: string;
  target_amount: number;
  current_amount?: number;
  target_date?: string | null;
  wallet_id?: string | null;
  color?: string;
  icon?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  const cleanTitle = data.title.trim();
  if (!cleanTitle) {
    return { success: false, error: 'El nombre de la meta no puede estar vacío' };
  }

  const targetAmount = Math.abs(Number(data.target_amount) || 0);
  if (targetAmount <= 0) {
    return { success: false, error: 'El monto objetivo debe ser mayor a $0.00' };
  }

  try {
    const { data: goal, error } = await (supabase
      .from('savings_goals') as any)
      .insert({
        user_id: user.id,
        title: cleanTitle,
        target_amount: targetAmount,
        current_amount: Number(data.current_amount || 0),
        target_date: data.target_date || null,
        wallet_id: data.wallet_id || null,
        color: data.color || 'bg-emerald-500',
        icon: data.icon || 'PiggyBank',
        is_completed: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear meta de ahorro:', error);
      return { success: false, error: error.message || 'No se pudo crear la meta de ahorro' };
    }

    revalidatePath('/savings');
    revalidatePath('/wallets');
    revalidatePath('/');
    return { success: true, goal };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al crear meta' };
  }
}

/**
 * Aporta dinero a una meta de ahorro retirándolo de una cartera específica.
 */
export async function depositToSavingsGoal(goalId: string, walletId: string, amount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  const parsedAmount = Math.abs(Number(amount) || 0);
  if (parsedAmount <= 0) {
    return { success: false, error: 'El monto a aportar debe ser mayor a $0.00' };
  }

  try {
    // 1. Obtener la meta
    const { data: goal, error: goalError } = await (supabase
      .from('savings_goals') as any)
      .select('*')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single();

    if (goalError || !goal) {
      return { success: false, error: 'No se encontró la meta de ahorro' };
    }

    // 2. Obtener nombre de la cartera
    const { data: wallet } = await (supabase
      .from('wallets') as any)
      .select('name')
      .eq('id', walletId)
      .eq('user_id', user.id)
      .single();

    // 3. Crear transacción de egreso en la cartera
    const { error: txError } = await (supabase
      .from('transactions') as any)
      .insert({
        user_id: user.id,
        wallet_id: walletId,
        type: 'expense',
        amount: parsedAmount,
        concept: `[Aporte Meta] ${goal.title}`,
        date: new Date().toISOString()
      });

    if (txError) {
      return { success: false, error: 'Error al descontar saldo de la cartera' };
    }

    // 4. Actualizar monto actual de la meta
    const newCurrent = Number(goal.current_amount || 0) + parsedAmount;
    const isCompleted = newCurrent >= Number(goal.target_amount || 0);

    const { data: updatedGoal, error: updateError } = await (supabase
      .from('savings_goals') as any)
      .update({
        current_amount: newCurrent,
        is_completed: isCompleted
      } as any)
      .eq('id', goalId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: 'Error al actualizar meta de ahorro' };
    }

    revalidatePath('/wallets');
    revalidatePath('/savings');
    revalidatePath('/');
    return { success: true, goal: updatedGoal, newAmount: newCurrent, isCompleted };
  } catch (err: any) {
    console.error('Error al aportar a meta:', err);
    return { success: false, error: err.message || 'Error inesperado' };
  }
}

/**
 * Retira dinero de una meta de ahorro y lo devuelve a una cartera.
 */
export async function withdrawFromSavingsGoal(goalId: string, walletId: string, amount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  const parsedAmount = Math.abs(Number(amount));
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return { success: false, error: 'Monto inválido para retirar' };
  }

  try {
    // 1. Obtener la meta
    const { data: goal, error: goalError } = await (supabase
      .from('savings_goals') as any)
      .select('*')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single();

    if (goalError || !goal) {
      return { success: false, error: 'No se encontró la meta de ahorro' };
    }

    if (Number(goal.current_amount || 0) < parsedAmount) {
      return { success: false, error: 'No hay suficiente saldo acumulado en esta meta para retirar' };
    }

    // 2. Crear transacción de ingreso en la cartera de destino
    const { error: txError } = await (supabase
      .from('transactions') as any)
      .insert({
        user_id: user.id,
        wallet_id: walletId,
        type: 'income',
        amount: parsedAmount,
        concept: `[Retiro Meta] ${goal.title}`,
        date: new Date().toISOString()
      });

    if (txError) {
      return { success: false, error: 'Error al depositar saldo en la cartera' };
    }

    // 3. Actualizar meta
    const newCurrent = Math.max(0, Number(goal.current_amount || 0) - parsedAmount);

    await (supabase
      .from('savings_goals') as any)
      .update({
        current_amount: newCurrent,
        is_completed: false
      })
      .eq('id', goalId)
      .eq('user_id', user.id);

    revalidatePath('/savings');
    revalidatePath('/wallets');
    revalidatePath('/');
    return { success: true, newAmount: newCurrent };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al procesar el retiro' };
  }
}

/**
 * Elimina una meta de ahorro.
 */
export async function deleteSavingsGoal(goalId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  try {
    const { error } = await (supabase
      .from('savings_goals') as any)
      .delete()
      .eq('id', goalId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: 'No se pudo eliminar la meta de ahorro' };
    }

    revalidatePath('/savings');
    revalidatePath('/wallets');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al eliminar meta' };
  }
}
