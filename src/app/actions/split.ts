'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

export interface SharedExpense {
  id: string;
  user_id: string;
  person_name: string;
  concept: string;
  total_amount: number;
  my_share: number;
  other_share: number;
  type: 'they_owe_me' | 'i_owe_them';
  is_settled: boolean;
  wallet_id?: string | null;
  created_at: string;
  wallets?: { name: string } | null;
}

/**
 * Obtiene todos los gastos compartidos del usuario.
 */
export async function getSharedExpenses(): Promise<SharedExpense[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  try {
    const { data, error } = await (supabase
      .from('shared_expenses') as any)
      .select('*, wallets(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Tabla shared_expenses no disponible:', error.message);
      return [];
    }

    return (data || []) as SharedExpense[];
  } catch (err) {
    console.error('Error al obtener gastos compartidos:', err);
    return [];
  }
}

/**
 * Registra un nuevo gasto compartido.
 */
export async function createSharedExpense(data: {
  person_name: string;
  concept: string;
  total_amount: number;
  my_share: number;
  other_share: number;
  type: 'they_owe_me' | 'i_owe_them';
  wallet_id?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  const cleanPerson = data.person_name.trim();
  const cleanConcept = data.concept.trim();

  if (!cleanPerson || !cleanConcept) {
    return { success: false, error: 'Ingresa el nombre de la persona y el concepto' };
  }

  try {
    const { data: expense, error } = await (supabase
      .from('shared_expenses') as any)
      .insert({
        user_id: user.id,
        person_name: cleanPerson,
        concept: cleanConcept,
        total_amount: Math.abs(Number(data.total_amount) || 0),
        my_share: Math.abs(Number(data.my_share) || 0),
        other_share: Math.abs(Number(data.other_share) || 0),
        type: data.type,
        is_settled: false,
        wallet_id: data.wallet_id || null
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message || 'Error al guardar gasto compartido' };
    }

    revalidatePath('/split');
    revalidatePath('/wallets');
    revalidatePath('/');
    return { success: true, expense };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error en servidor' };
  }
}

/**
 * Liquida / salda un gasto compartido registrando el ingreso o egreso en la cartera.
 */
export async function settleSharedExpense(expenseId: string, walletId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  try {
    // 1. Obtener gasto
    const { data: expense, error: fetchErr } = await (supabase
      .from('shared_expenses') as any)
      .select('*')
      .eq('id', expenseId)
      .eq('user_id', user.id)
      .single();

    if (fetchErr || !expense) {
      return { success: false, error: 'No se encontró el registro de gasto' };
    }

    // 2. Si se proporciona walletId, registrar el ajuste de dinero
    if (walletId) {
      const isTheyOweMe = expense.type === 'they_owe_me';
      await (supabase.from('transactions') as any)
        .insert({
          user_id: user.id,
          wallet_id: walletId,
          type: isTheyOweMe ? 'income' : 'expense',
          amount: Number(expense.other_share || 0),
          concept: isTheyOweMe 
            ? `[Reembolso] ${expense.person_name} (${expense.concept})`
            : `[Pago Deuda] ${expense.person_name} (${expense.concept})`,
          date: new Date().toISOString()
        });
    }

    // 3. Marcar como liquidado
    await (supabase
      .from('shared_expenses') as any)
      .update({ is_settled: true })
      .eq('id', expenseId)
      .eq('user_id', user.id);

    revalidatePath('/split');
    revalidatePath('/wallets');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al liquidar' };
  }
}

/**
 * Elimina un registro de gasto compartido.
 */
export async function deleteSharedExpense(expenseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  try {
    const { error } = await (supabase
      .from('shared_expenses') as any)
      .delete()
      .eq('id', expenseId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: 'Error al eliminar' };
    }

    revalidatePath('/split');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al eliminar' };
  }
}
