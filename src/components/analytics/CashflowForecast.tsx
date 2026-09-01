"use client";

import React, { useState, useMemo } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  ShieldAlert, 
  Zap, 
  Info,
  Clock
} from "lucide-react";

interface CashflowForecastProps {
  wallets: any[];
  recurringPayments?: any[];
  categories?: any[];
  monthlyExpenseAvg?: number;
}

export default function CashflowForecast({
  wallets = [],
  recurringPayments = [],
  categories = [],
  monthlyExpenseAvg = 0,
}: CashflowForecastProps) {
  const [daysHorizon, setDaysHorizon] = useState<30 | 60 | 90>(30);

  // 1. Calcular Saldo Inicial Líquido (Débito + Efectivo - Saldo Utilizado en TC)
  const startingLiquidBalance = useMemo(() => {
    let liquid = 0;
    let debt = 0;
    wallets.forEach((w) => {
      if (w.type === "credit") {
        debt += Math.abs(Number(w.balance || 0));
      } else {
        liquid += Number(w.balance || 0);
      }
    });
    return liquid;
  }, [wallets]);

  // 2. Simulación día a día
  const { projection, minBalance, minBalanceDay, isRiskOfNegative, runwayDays } = useMemo(() => {
    const dailyData: Array<{ day: number; date: Date; dateStr: string; balance: number; event?: string }> = [];
    const today = new Date();
    
    // Gasto diario base estimado
    const totalBudget = categories.reduce((sum, c) => sum + (Number(c.monthly_budget) || 0), 0);
    const dailyBurnRate = (totalBudget > 0 ? totalBudget : (monthlyExpenseAvg || 12000)) / 30;

    let currentSimBalance = startingLiquidBalance;
    let lowest = startingLiquidBalance;
    let lowestDay = 0;

    for (let i = 1; i <= daysHorizon; i++) {
      const simDate = new Date(today);
      simDate.setDate(today.getDate() + i);
      const dayOfMonth = simDate.getDate();

      let dayEvents: string[] = [];

      // Aplicar pagos recurrentes
      recurringPayments.forEach((p) => {
        if (!p.is_active) return;
        const amount = Number(p.amount || 0);
        const pDate = new Date(p.next_execution_date || p.start_date);
        
        let appliesToday = false;
        if (p.frequency === "monthly" && pDate.getDate() === dayOfMonth) {
          appliesToday = true;
        } else if (p.frequency === "days_15" && (dayOfMonth === 15 || dayOfMonth === 30 || (dayOfMonth === 28 && simDate.getMonth() === 1))) {
          appliesToday = true;
        } else if (p.frequency === "weekly" && simDate.getDay() === pDate.getDay()) {
          appliesToday = true;
        }

        if (appliesToday) {
          if (p.type === "income") {
            currentSimBalance += amount;
            dayEvents.push(`+ $${amount.toFixed(0)} (${p.concept})`);
          } else {
            currentSimBalance -= amount;
            dayEvents.push(`- $${amount.toFixed(0)} (${p.concept})`);
          }
        }
      });

      // Restar gasto diario estimado variable
      currentSimBalance -= dailyBurnRate;

      if (currentSimBalance < lowest) {
        lowest = currentSimBalance;
        lowestDay = i;
      }

      dailyData.push({
        day: i,
        date: simDate,
        dateStr: simDate.toLocaleDateString("es-MX", { day: "numeric", month: "short" }),
        balance: Math.round(currentSimBalance),
        event: dayEvents.length > 0 ? dayEvents.join(", ") : undefined
      });
    }

    const runway = dailyBurnRate > 0 ? Math.max(0, Math.floor(startingLiquidBalance / dailyBurnRate)) : 999;

    return {
      projection: dailyData,
      minBalance: lowest,
      minBalanceDay: lowestDay,
      isRiskOfNegative: lowest < 0,
      runwayDays: runway
    };
  }, [startingLiquidBalance, daysHorizon, recurringPayments, categories, monthlyExpenseAvg]);

  return (
    <div className="surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0A0A0C] space-y-5">
      
      {/* Cabecera del Forecast */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/[0.08] pb-4">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Proyección de Flujo de Efectivo (Cashflow Forecast)
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Simulación predictiva combinando saldo en carteras, nóminas y gastos recurrentes
          </p>
        </div>

        {/* Selector de Horizonte */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#141418] p-1 rounded-xl border border-slate-200 dark:border-white/[0.06] shrink-0 self-start sm:self-auto">
          {[30, 60, 90].map((h) => (
            <button
              key={h}
              onClick={() => setDaysHorizon(h as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                daysHorizon === h
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {h} Días
            </button>
          ))}
        </div>
      </div>

      {/* Tarjetas KPI de Proyección */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141418] border border-slate-200 dark:border-white/[0.04] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Saldo Líquido Inicial
          </span>
          <p className="text-xl font-black text-white">
            ${startingLiquidBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-zinc-500">En cuentas de débito y efectivo</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141418] border border-slate-200 dark:border-white/[0.04] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-400" /> Pista Financiera (Runway)
          </span>
          <p className="text-xl font-black text-blue-400">
            {runwayDays >= 999 ? "+90" : runwayDays} Días
          </p>
          <span className="text-[10px] text-zinc-500">De cobertura con tu nivel de gasto</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141418] border border-slate-200 dark:border-white/[0.04] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            {isRiskOfNegative ? <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />} Punto Más Bajo
          </span>
          <p className={`text-xl font-black ${isRiskOfNegative ? "text-rose-400" : "text-emerald-400"}`}>
            ${minBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-zinc-500">
            {isRiskOfNegative ? `Alerta en día +${minBalanceDay}` : `Saldo seguro en los ${daysHorizon} días`}
          </span>
        </div>
      </div>

      {/* Alerta Preventiva de Sobregiro si aplica */}
      {isRiskOfNegative && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <p className="text-xs font-black text-rose-300">Riesgo de saldo negativo proyectado</p>
            <p className="text-[11px] text-rose-200/80">
              Se prevé que en el día {minBalanceDay} tus gastos programados superen tus fondos disponibles. Considera ajustar compras variables o transferir fondos.
            </p>
          </div>
        </div>
      )}

      {/* Mini Gráfico de Barras Táctil de la Proyección */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400">
          <span>Evolución diaria estimada</span>
          <span>Fin de periodo: ${projection[projection.length - 1]?.balance.toLocaleString("es-MX")}</span>
        </div>

        <div className="h-28 flex items-end gap-1 overflow-x-auto custom-scrollbar p-2 bg-slate-50 dark:bg-[#121216] rounded-xl border border-slate-200 dark:border-white/[0.04]">
          {projection.map((point, index) => {
            const maxVal = Math.max(...projection.map(p => Math.abs(p.balance)), 1000);
            const heightPct = Math.max(12, Math.min(100, Math.round((Math.abs(point.balance) / maxVal) * 100)));
            const isNegative = point.balance < 0;

            return (
              <div
                key={point.day}
                title={`${point.dateStr}: $${point.balance.toLocaleString("es-MX")} ${point.event ? `(${point.event})` : ''}`}
                className="flex-1 min-w-[12px] flex flex-col items-center justify-end h-full group relative cursor-pointer"
              >
                <div
                  className={`w-full rounded-t-sm transition-all ${
                    isNegative 
                      ? "bg-rose-500 hover:bg-rose-400" 
                      : index % 5 === 0 
                        ? "bg-emerald-400 hover:bg-emerald-300" 
                        : "bg-emerald-500/40 hover:bg-emerald-400"
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
