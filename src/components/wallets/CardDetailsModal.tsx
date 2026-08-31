"use client";

import React from "react";
import Link from "next/link";
import { getBankThemeConfig, BankLogo } from "./BankLogos";
import { 
  X, 
  CreditCard, 
  Wallet, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Wifi, 
  PlusCircle, 
  Zap,
  ExternalLink,
  ChevronRight,
  TrendingDown
} from "lucide-react";

interface CardDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: any | null;
  transactions: any[];
  onOpenNewTx?: (type: "expense" | "income", walletId: string) => void;
}

export default function CardDetailsModal({
  isOpen,
  onClose,
  wallet,
  transactions,
  onOpenNewTx,
}: CardDetailsModalProps) {
  if (!isOpen || !wallet) return null;

  const formatCurrency = (val: number) => {
    return val.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  };

  const isCredit = wallet.type === "credit";
  const creditLimit = wallet.credit_limit || 0;
  const debt = isCredit ? Math.max(0, -wallet.balance) : 0;
  const availableCredit = isCredit ? Math.max(0, creditLimit - debt) : wallet.balance;
  const usedPct = isCredit && creditLimit > 0 ? Math.min(100, (debt / creditLimit) * 100) : 0;

  const cutOff = wallet.cut_off_day || 15;
  const due = wallet.due_day || 5;
  const today = new Date().getDate();
  const daysToDue = due >= today ? due - today : (30 - today + due);

  // Filtrar transacciones de esta cartera
  const walletTransactions = transactions
    .filter((t) => t.wallet_id === wallet.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const theme = getBankThemeConfig(wallet.name, wallet.type);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-950 rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-slide-up safe-bottom">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-cerulean" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Detalles de la Tarjeta
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
          {/* Tarjeta Visual Renderizada */}
          <div className={`w-full h-[195px] rounded-3xl p-5 bg-gradient-to-tr ${theme.gradient} ${theme.textColor} shadow-2xl relative overflow-hidden flex flex-col justify-between`}>
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-36 h-36 rounded-full bg-brand-cerulean/20 blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between relative z-10">
              <div>
                <div className="flex items-center gap-1.5 opacity-90">
                  <BankLogo bank={theme.type} />
                  {theme.type === "generic" && (
                    <span className="text-[11px] font-black uppercase tracking-wider block">
                      {theme.name}
                    </span>
                  )}
                </div>
                <h4 className="text-base font-extrabold tracking-tight mt-0.5">
                  {wallet.name}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 opacity-75 rotate-90" />
                <div className={`w-8 h-6 rounded-md ${theme.chipColor} border border-white/40 shadow-inner`} />
              </div>
            </div>

            <div className="relative z-10">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 block">
                {isCredit ? "Crédito Disponible" : "Saldo Actual"}
              </span>
              <p className="text-3xl font-black tracking-tight drop-shadow-md">
                {formatCurrency(isCredit ? availableCredit : wallet.balance)}
              </p>
            </div>

            <div className="flex items-end justify-between relative z-10 pt-1 border-t border-white/10 text-xs font-mono">
              <span>•••• •••• •••• {wallet.name.match(/\d{4}/)?.[0] || "4589"}</span>
              <span className="font-sans font-black italic">{theme.network}</span>
            </div>
          </div>

          {/* Estadísticas de la Tarjeta */}
          {isCredit ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-500 dark:text-zinc-400">Límite de Crédito:</span>
                <span className="text-slate-900 dark:text-white font-extrabold">{formatCurrency(creditLimit)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-500 dark:text-zinc-400">Deuda / Saldo Utilizado:</span>
                <span className="text-rose-500 font-extrabold">{formatCurrency(debt)} ({usedPct.toFixed(0)}%)</span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    usedPct > 80 ? "bg-rose-500" : usedPct > 50 ? "bg-amber-400" : "bg-emerald-500"
                  }`}
                  style={{ width: `${usedPct}%` }}
                />
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800 flex justify-between items-center text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
                  <Clock className="w-4 h-4 text-brand-cerulean" />
                  <span>Corte: día {cutOff} • Pago: día {due}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  daysToDue <= 3 ? "bg-rose-500/15 text-rose-500" : "bg-emerald-500/15 text-emerald-500"
                }`}>
                  {daysToDue === 0 ? "Paga hoy" : `En ${daysToDue} días`}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Tipo de Cartera</span>
                <p className="text-xs font-black text-slate-900 dark:text-white capitalize">{wallet.type}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Estado</span>
                <p className="text-xs font-black text-emerald-500">Activa & Conciliada</p>
              </div>
            </div>
          )}

          {/* Botones de Acción Rápida para esta Tarjeta */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                onClose();
                if (onOpenNewTx) onOpenNewTx("expense", wallet.id);
              }}
              className="py-3 px-4 bg-rose-500/10 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 font-extrabold text-xs rounded-2xl border border-rose-500/20 transition flex items-center justify-center gap-2 min-h-[44px]"
            >
              <ArrowDownLeft className="w-4 h-4" />
              Registrar Gasto
            </button>

            <button
              onClick={() => {
                onClose();
                if (onOpenNewTx) onOpenNewTx("income", wallet.id);
              }}
              className="py-3 px-4 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs rounded-2xl border border-emerald-500/20 transition flex items-center justify-center gap-2 min-h-[44px]"
            >
              <ArrowUpRight className="w-4 h-4" />
              {isCredit ? "Abonar / Pagar" : "Nuevo Ingreso"}
            </button>
          </div>

          {/* Movimientos Recientes con esta Tarjeta */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Movimientos con esta Tarjeta
              </h4>
              <span className="text-[10px] text-slate-400 font-bold">
                {walletTransactions.length} registros
              </span>
            </div>

            {walletTransactions.length === 0 ? (
              <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl text-xs">
                No hay movimientos registrados aún con esta tarjeta.
              </div>
            ) : (
              <div className="space-y-2">
                {walletTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800 flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {tx.concept}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                        {new Date(tx.date).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>

                    <p className={`text-xs font-black shrink-0 ${
                      tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
                    }`}>
                      {tx.type === "income" ? "+" : "-"} {formatCurrency(Number(tx.amount || 0))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
