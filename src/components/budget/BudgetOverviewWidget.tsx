"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  PieChart, 
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Layers
} from "lucide-react";
import { getCategoryBudgetReport } from "@/app/actions/categories";

interface BudgetReportItem {
  id: string;
  name: string;
  color: string;
  icon: string;
  monthly_budget: number;
  spent: number;
  budget: number;
  percent: number;
  isExceeded: boolean;
  remaining: number;
  type?: string;
}

export default function BudgetOverviewWidget() {
  const [budgetItems, setBudgetItems] = useState<BudgetReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const report = await getCategoryBudgetReport();
        const activeBudgets = (report || []).filter((item: any) => Number(item.budget) > 0);
        setBudgetItems(activeBudgets);
      } catch (err) {
        console.error("Error al cargar presupuestos:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalBudget = budgetItems.reduce((acc, item) => acc + item.budget, 0);
  const totalSpent = budgetItems.reduce((acc, item) => acc + item.spent, 0);
  const globalPercent = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0;
  const isGlobalExceeded = totalSpent > totalBudget && totalBudget > 0;

  if (loading) {
    return (
      <div className="surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0A0A0C] animate-pulse">
        <div className="h-5 w-40 bg-zinc-800 rounded mb-4" />
        <div className="h-20 bg-zinc-900 rounded-xl" />
      </div>
    );
  }

  if (budgetItems.length === 0) {
    return (
      <div className="surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0A0A0C] shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Presupuestos Mensuales</h4>
              <p className="text-[10px] text-zinc-400">Control de topes de gasto por categoría</p>
            </div>
          </div>
          <Link
            href="/categories"
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1"
          >
            Configurar <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <p className="text-xs text-zinc-500 mt-3">
          No has definido límites de gasto para tus categorías este mes. Asigna presupuestos en Categorías para monitorear tus egresos.
        </p>
      </div>
    );
  }

  return (
    <div className="surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0A0A0C] shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center">
            <PieChart className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              Presupuestos del Mes
              {isGlobalExceeded && (
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 text-[10px] font-black border border-rose-500/30">
                  Excedido
                </span>
              )}
            </h4>
            <p className="text-[10px] text-zinc-400">Progreso de gasto vs metas asignadas</p>
          </div>
        </div>

        <Link
          href="/categories"
          className="text-xs font-bold text-zinc-400 hover:text-white transition flex items-center gap-1"
        >
          Editar Topes <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Resumen Global */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#121216] border border-white/[0.06] space-y-2">
        <div className="flex justify-between items-baseline">
          <div>
            <span className="text-[10px] font-bold uppercase text-zinc-400 block">Gasto Acumulado en Presupuestos</span>
            <span className={`text-lg font-black ${isGlobalExceeded ? "text-rose-400" : "text-slate-900 dark:text-white"}`}>
              ${totalSpent.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase text-zinc-400 block">Presupuesto Asignado</span>
            <span className="text-sm font-bold text-zinc-300">
              ${totalBudget.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Barra de Progreso Global */}
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              globalPercent >= 100 
                ? "bg-rose-500" 
                : globalPercent >= 75 
                  ? "bg-amber-500" 
                  : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min(globalPercent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] font-bold">
          <span className="text-zinc-500">{globalPercent}% consumido</span>
          <span className={totalBudget - totalSpent >= 0 ? "text-emerald-400" : "text-rose-400"}>
            {totalBudget - totalSpent >= 0 
              ? `Disponible: $${(totalBudget - totalSpent).toLocaleString("es-MX", { minimumFractionDigits: 2 })}` 
              : `Excedido por: $${Math.abs(totalBudget - totalSpent).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
          </span>
        </div>
      </div>

      {/* Lista de Categorías con Barra de Progreso */}
      <div className="space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
        {budgetItems
          .sort((a, b) => (b.spent / b.budget) - (a.spent / a.budget))
          .map((item) => {
            const pct = Math.round((item.spent / item.budget) * 100);
            const isRed = pct >= 100;
            const isYellow = pct >= 70 && pct < 100;
            const isGreen = pct < 70;

            return (
              <div key={item.id} className="p-2.5 rounded-xl bg-[#141418] border border-white/[0.04] space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.color || "bg-emerald-500"}`} />
                    <span className="font-bold text-white">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-black ${isRed ? "text-rose-400" : "text-zinc-300"}`}>
                      ${item.spent.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-bold ml-1">
                      / ${item.budget.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isRed ? "bg-rose-500" : isYellow ? "bg-amber-400" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className={isRed ? "text-rose-400" : isYellow ? "text-amber-400" : "text-zinc-500"}>
                    {pct}% {isRed && "⚠️ Límite superado"}
                  </span>
                  <span className="text-zinc-500">
                    {item.remaining > 0 
                      ? `Quedan $${item.remaining.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` 
                      : `Exceso: $${Math.abs(item.budget - item.spent).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
