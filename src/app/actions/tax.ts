"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import { query } from "@/lib/db";

const supabaseAdmin = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type TaxRegime = 'resico' | 'persona_fisica' | 'persona_moral';

export interface TaxCalculationResult {
  month: number;
  year: number;
  regime: TaxRegime;
  totalIncomeSubtotal: number;
  totalIncomeIva: number;
  totalIncomeTotal: number;
  totalExpenseSubtotal: number;
  totalExpenseIva: number;
  totalExpenseTotal: number;
  netProfit: number;
  // IVA
  ivaTrasladado: number;
  ivaAcreditable: number;
  ivaBalance: number; // >0 pagar, <0 a favor
  // ISR
  isrRate: number;
  isrBruto: number;
  isrRetenido: number;
  isrNetoToPay: number;
  // Stats
  incomeInvoicesCount: number;
  expenseInvoicesCount: number;
}

// Tabla orientativa de tasas ISR RESICO 2026 (Mensual)
function calculateResicoIsr(totalIncome: number): { rate: number; isrAmount: number } {
  if (totalIncome <= 0) return { rate: 0, isrAmount: 0 };
  if (totalIncome <= 25000) return { rate: 0.01, isrAmount: totalIncome * 0.01 };
  if (totalIncome <= 50000) return { rate: 0.011, isrAmount: totalIncome * 0.011 };
  if (totalIncome <= 83333.33) return { rate: 0.015, isrAmount: totalIncome * 0.015 };
  if (totalIncome <= 166666.67) return { rate: 0.02, isrAmount: totalIncome * 0.02 };
  return { rate: 0.025, isrAmount: totalIncome * 0.025 };
}

// Tarifa estimada para Persona Física (Actividad Empresarial / Honorarios)
function calculatePersonaFisicaIsr(profit: number): { rate: number; isrAmount: number } {
  if (profit <= 0) return { rate: 0, isrAmount: 0 };
  if (profit <= 10000) return { rate: 0.064, isrAmount: profit * 0.064 };
  if (profit <= 30000) return { rate: 0.1088, isrAmount: profit * 0.1088 };
  if (profit <= 60000) return { rate: 0.1792, isrAmount: profit * 0.1792 };
  if (profit <= 100000) return { rate: 0.2136, isrAmount: profit * 0.2136 };
  return { rate: 0.30, isrAmount: profit * 0.30 };
}

export async function calculateTaxSummary(
  month: number,
  year: number,
  regime: TaxRegime = 'resico'
): Promise<{ success: boolean; data?: TaxCalculationResult; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    // Rango de fechas del mes
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    // Intentar consulta primero por PostgreSQL directo si está configurado
    let invoices: any[] = [];

    try {
      invoices = await query(
        `SELECT * FROM invoices 
         WHERE user_id = $1 
         AND date >= $2 
         AND date <= $3`,
        [user.id, startDate, endDate]
      );
    } catch {
      // Fallback a Supabase Admin
      const { data, error } = await supabaseAdmin
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) {
        console.error('Error al obtener facturas para cálculo de impuestos:', error);
        return { success: false, error: 'No se pudieron consultar las facturas' };
      }
      invoices = data || [];
    }

    let totalIncomeSubtotal = 0;
    let totalIncomeIva = 0;
    let totalIncomeTotal = 0;
    let incomeInvoicesCount = 0;

    let totalExpenseSubtotal = 0;
    let totalExpenseIva = 0;
    let totalExpenseTotal = 0;
    let expenseInvoicesCount = 0;

    for (const inv of invoices) {
      const type = inv.invoice_type || 'ingreso';
      const subtotal = parseFloat(inv.subtotal || inv.amount || 0);
      const iva = parseFloat(inv.iva || 0);
      const total = parseFloat(inv.amount || 0);

      if (type === 'ingreso' || type === 'nomina') {
        totalIncomeSubtotal += subtotal;
        totalIncomeIva += iva;
        totalIncomeTotal += total;
        incomeInvoicesCount++;
      } else {
        totalExpenseSubtotal += subtotal;
        totalExpenseIva += iva;
        totalExpenseTotal += total;
        expenseInvoicesCount++;
      }
    }

    const netProfit = Math.max(0, totalIncomeSubtotal - totalExpenseSubtotal);

    // Cálculo de IVA
    const ivaTrasladado = totalIncomeIva;
    const ivaAcreditable = totalExpenseIva;
    const ivaBalance = ivaTrasladado - ivaAcreditable; // >0 Pagar, <0 A favor

    // Cálculo de ISR según régimen seleccionado
    let isrRate = 0;
    let isrBruto = 0;

    if (regime === 'resico') {
      const resico = calculateResicoIsr(totalIncomeSubtotal);
      isrRate = resico.rate;
      isrBruto = resico.isrAmount;
    } else if (regime === 'persona_fisica') {
      const pf = calculatePersonaFisicaIsr(netProfit);
      isrRate = pf.rate;
      isrBruto = pf.isrAmount;
    } else {
      // Persona Moral 30%
      isrRate = 0.30;
      isrBruto = netProfit * 0.30;
    }

    // Por ahora ISR retenido estimado en 0 (expandible con nodo de retenciones)
    const isrRetenido = 0;
    const isrNetoToPay = Math.max(0, isrBruto - isrRetenido);

    return {
      success: true,
      data: {
        month,
        year,
        regime,
        totalIncomeSubtotal,
        totalIncomeIva,
        totalIncomeTotal,
        totalExpenseSubtotal,
        totalExpenseIva,
        totalExpenseTotal,
        netProfit,
        ivaTrasladado,
        ivaAcreditable,
        ivaBalance,
        isrRate,
        isrBruto,
        isrRetenido,
        isrNetoToPay,
        incomeInvoicesCount,
        expenseInvoicesCount,
      },
    };
  } catch (err: any) {
    console.error('Error general en calculateTaxSummary:', err);
    return { success: false, error: err.message || 'Error al calcular impuestos' };
  }
}
