"use client";

import React, { useState } from "react";
import { 
  Zap, 
  Snowflake, 
  Flame, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Trophy
} from "lucide-react";

interface DebtItem {
  id: string;
  name: string;
  bank: string;
  balance: number;
  rate: number; // Tasa anual en %
  minPayment: number;
}

interface DebtPayoffSimulatorProps {
  loans: any[];
  creditWallets?: any[];
}

export default function DebtPayoffSimulator({ loans = [], creditWallets = [] }: DebtPayoffSimulatorProps) {
  const [strategy, setStrategy] = useState<"avalanche" | "snowball">("avalanche");
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState<string>("1000");

  // Consolidar deudas de préstamos y tarjetas de crédito
  const debtList: DebtItem[] = [
    ...loans.map((l) => ({
      id: l.id,
      name: l.name,
      bank: l.bank,
      balance: Number(l.current_balance || 0),
      rate: Number(l.interest_rate || 18),
      minPayment: Number(l.payment_amount || 0)
    })),
    ...creditWallets
      .filter((w) => Number(w.balance) < 0)
      .map((w) => ({
        id: w.id,
        name: w.name,
        bank: "Tarjeta de Crédito",
        balance: Math.abs(Number(w.balance)),
        rate: 45, // Tasa promedio de tarjeta de crédito
        minPayment: Math.max(Math.abs(Number(w.balance)) * 0.05, 200)
      }))
  ].filter((d) => d.balance > 0);

  const totalDebt = debtList.reduce((acc, d) => acc + d.balance, 0);
  const totalMinPayment = debtList.reduce((acc, d) => acc + d.minPayment, 0);
  const extraPayNum = parseFloat(extraMonthlyPayment) || 0;
  const totalAvailablePayment = totalMinPayment + extraPayNum;

  // Ordenar deudas según la estrategia
  const sortedDebts = [...debtList].sort((a, b) => {
    if (strategy === "avalanche") {
      return b.rate - a.rate; // Mayor tasa de interés primero
    } else {
      return a.balance - b.balance; // Menor saldo primero
    }
  });

  // Simulación matemática de meses para liquidar
  const simulatePayoff = (items: DebtItem[], extra: number) => {
    if (items.length === 0) return { months: 0, totalInterest: 0 };
    
    let currentDebts = items.map((d) => ({ ...d }));
    let months = 0;
    let totalInterestPaid = 0;
    const maxMonths = 360;

    while (currentDebts.some((d) => d.balance > 0) && months < maxMonths) {
      months++;
      let extraAvailable = extra;

      for (let i = 0; i < currentDebts.length; i++) {
        const d = currentDebts[i];
        if (d.balance <= 0) continue;

        const monthlyRate = d.rate / 100 / 12;
        const interest = d.balance * monthlyRate;
        totalInterestPaid += interest;
        d.balance += interest;

        // Pago mínimo
        let payment = Math.min(d.minPayment, d.balance);
        d.balance -= payment;

        // Si es la primera deuda activa, inyectar el pago extra
        if (extraAvailable > 0 && d.balance > 0) {
          const extraToApply = Math.min(extraAvailable, d.balance);
          d.balance -= extraToApply;
          extraAvailable -= extraToApply;
        }
      }
    }

    return { months, totalInterest: totalInterestPaid };
  };

  const baseline = simulatePayoff(sortedDebts, 0);
  const optimized = simulatePayoff(sortedDebts, extraPayNum);
  const monthsSaved = Math.max(0, baseline.months - optimized.months);
  const interestSaved = Math.max(0, baseline.totalInterest - optimized.totalInterest);

  const getFreedomDate = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  };

  if (debtList.length === 0) {
    return (
      <div className="surface-card rounded-2xl p-6 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0A0A0C] text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center mb-3">
          <Trophy className="w-6 h-6" />
        </div>
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">¡Estás Libre de Deudas!</h3>
        <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
          No tienes préstamos ni saldos pendientes en tarjetas. ¡Excelente salud financiera!
        </p>
      </div>
    );
  }

  return (
    <div className="surface-card rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0A0A0C] shadow-sm space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              Plan Acelerado de Liquidación de Deudas
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black border border-purple-500/30">
                Simulador Pro
              </span>
            </h3>
            <p className="text-xs text-zinc-400">Estrategias matemáticas para salir de deudas más rápido</p>
          </div>
        </div>

        {/* Selector de Estrategia */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#141418] p-1 rounded-xl border border-white/[0.06]">
          <button
            type="button"
            onClick={() => setStrategy("avalanche")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              strategy === "avalanche"
                ? "bg-purple-600 text-white shadow-sm font-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Avalancha (Ahorro Máximo)
          </button>
          <button
            type="button"
            onClick={() => setStrategy("snowball")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              strategy === "snowball"
                ? "bg-blue-600 text-white shadow-sm font-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Snowflake className="w-3.5 h-3.5" />
            Bola de Nieve (Psicológico)
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas de la Simulación */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#121216] border border-white/[0.06] space-y-1">
          <span className="text-[10px] font-bold uppercase text-zinc-400">Deuda Total Consolidada</span>
          <p className="text-xl font-black text-rose-400">
            ${totalDebt.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-zinc-500 font-bold block">
            {debtList.length} cuentas activas
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#121216] border border-white/[0.06] space-y-1">
          <span className="text-[10px] font-bold uppercase text-emerald-400">Ahorro en Intereses</span>
          <p className="text-xl font-black text-emerald-400">
            +${interestSaved.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-zinc-500 font-bold block">
            Ahorras {monthsSaved} meses de pagos
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#121216] border border-white/[0.06] space-y-1">
          <span className="text-[10px] font-bold uppercase text-purple-400">Fecha Libre de Deudas</span>
          <p className="text-xl font-black text-slate-900 dark:text-white capitalize">
            {getFreedomDate(optimized.months)}
          </p>
          <span className="text-[10px] text-zinc-500 font-bold block">
            En solo {optimized.months} meses
          </span>
        </div>
      </div>

      {/* Input de Abono Mensual Extra */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#121216] border border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-slate-900 dark:text-white block">
            ¿Cuánto dinero extra puedes abonar mensualmente?
          </span>
          <span className="text-[10px] text-zinc-400">
            Cualquier abono extra se inyecta directamente al capital de la primera deuda prioritaria.
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-40">
            <span className="absolute left-3 top-2 text-xs font-bold text-zinc-500">$</span>
            <input
              type="number"
              min="0"
              step="100"
              value={extraMonthlyPayment}
              onChange={(e) => setExtraMonthlyPayment(e.target.value)}
              className="w-full pl-6 pr-3 py-1.5 bg-white dark:bg-[#18181C] border border-white/[0.08] rounded-lg text-xs font-black text-white focus:outline-none"
            />
          </div>
          <span className="text-[11px] text-zinc-400 font-bold shrink-0">MXN / mes</span>
        </div>
      </div>

      {/* Orden de Liquidación Prioritaria */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Orden Recomendado de Pago ({strategy === "avalanche" ? "Mayor Tasa ➔ Menor Tasa" : "Menor Monto ➔ Mayor Monto"}):
        </h4>

        <div className="space-y-2">
          {sortedDebts.map((d, index) => (
            <div
              key={d.id}
              className={`p-3 rounded-xl border flex items-center justify-between transition ${
                index === 0
                  ? "bg-purple-500/10 border-purple-500/30 text-white"
                  : "bg-slate-50 dark:bg-[#141418] border-white/[0.04] text-zinc-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                  index === 0 ? "bg-purple-500 text-white" : "bg-white/10 text-zinc-400"
                }`}>
                  #{index + 1}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {d.name} <span className="text-[10px] text-zinc-500">({d.bank})</span>
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Tasa: {d.rate}% anual • Pago Mínimo: ${d.minPayment.toLocaleString("es-MX")}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-black text-rose-400 block">
                  ${d.balance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
                {index === 0 && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-black bg-purple-500/20 text-purple-300">
                    🔥 Liquidar Primero (+${extraPayNum})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
