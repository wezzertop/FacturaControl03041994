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
  onOpenNewTx?: (type: "expense" | "income" | "transfer", walletId: string) => void;
  onEditTx?: (tx: any) => void;
}

export default function CardDetailsModal({
  isOpen,
  onClose,
  wallet,
  transactions,
  onOpenNewTx,
  onEditTx,
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
    <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#000000] rounded-t-2xl sm:rounded-2xl border-t sm:border border-slate-200 dark:border-white/[0.08] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-slide-up safe-bottom">
        
        {/* Header */}
        <div className="p-3.5 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Detalles de la Tarjeta
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {/* Tarjeta Visual Renderizada */}
          <div className={`w-full h-[180px] rounded-2xl p-4 sm:p-5 bg-gradient-to-tr ${theme.gradient} ${theme.textColor} shadow-xl relative overflow-hidden flex flex-col justify-between border border-white/10`}>
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-36 h-36 rounded-full bg-white/5 blur-2xl pointer-events-none" />

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
                <h4 className="text-xs font-bold tracking-tight mt-0.5">
                  {wallet.name}
                </h4>
              </div>
              <Wifi className="w-5 h-5 opacity-70 rotate-90" />
            </div>

            <div className="relative z-10">
              <span className="text-[10px] uppercase tracking-wider opacity-75 font-semibold">
                {isCredit ? "Saldo Deudor" : "Saldo Disponible"}
              </span>
              <p className="text-2xl font-black tracking-tight">
                {formatCurrency(isCredit ? debt : wallet.balance)}
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold opacity-85 relative z-10">
              <span>•••• {wallet.name.slice(-4)}</span>
              <span>{isCredit ? `Corte día ${cutOff}` : "Débito / Efectivo"}</span>
            </div>
          </div>

          {/* Estadísticas de Crédito o Débito */}
          {isCredit ? (
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200/60 dark:border-white/[0.08]">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-500">Crédito Disponible</span>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatCurrency(availableCredit)}
                </p>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden mt-1.5">
                  <div 
                    className={`h-full rounded-full ${usedPct > 80 ? "bg-rose-500" : "bg-emerald-500"}`} 
                    style={{ width: `${usedPct}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200/60 dark:border-white/[0.08]">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-500">Fecha Límite Pago</span>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  Día {due}
                </p>
                <span className={`inline-block text-[10px] font-extrabold px-1.5 py-0.5 rounded-md mt-1 ${
                  daysToDue <= 3 ? "bg-rose-500/15 text-rose-600 dark:text-rose-400" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                }`}>
                  {daysToDue === 0 ? "Paga hoy" : `En ${daysToDue} días`}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200/60 dark:border-white/[0.08] flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-500">Tipo de Cartera</span>
                <p className="text-xs font-black text-slate-900 dark:text-white capitalize">{wallet.type}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-500">Estado</span>
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">Activa & Conciliada</p>
              </div>
            </div>
          )}

          {/* Botones de Acción Rápida para esta Tarjeta */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                onClose();
                if (onOpenNewTx) onOpenNewTx("expense", wallet.id);
              }}
              className="py-2.5 px-2 bg-rose-500/10 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl border border-rose-500/25 transition flex flex-col items-center justify-center gap-1 min-h-[44px]"
            >
              <ArrowDownLeft className="w-4 h-4" />
              Gasto
            </button>

            <button
              onClick={() => {
                onClose();
                if (onOpenNewTx) onOpenNewTx("income", wallet.id);
              }}
              className="py-2.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-xl border border-emerald-500/25 transition flex flex-col items-center justify-center gap-1 min-h-[44px]"
            >
              <ArrowUpRight className="w-4 h-4" />
              {isCredit ? "Abono" : "Ingreso"}
            </button>

            <button
              onClick={() => {
                onClose();
                if (onOpenNewTx) onOpenNewTx("transfer", wallet.id);
              }}
              className="py-2.5 px-2 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl border border-white/10 transition flex flex-col items-center justify-center gap-1 min-h-[44px]"
            >
              <CreditCard className="w-4 h-4" />
              Transferir
            </button>
          </div>

          {/* Movimientos Recientes con esta Tarjeta */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Movimientos Recientes
              </h4>
              <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold">
                {walletTransactions.length} registros
              </span>
            </div>

            {walletTransactions.length === 0 ? (
              <div className="p-5 text-center text-slate-500 dark:text-zinc-500 border border-dashed border-slate-200 dark:border-white/[0.08] rounded-xl text-xs">
                No hay movimientos registrados aún con esta tarjeta.
              </div>
            ) : (
              <div className="space-y-1.5">
                {walletTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => {
                      onClose();
                      if (onEditTx) onEditTx(tx);
                    }}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200/60 dark:border-white/[0.06] hover:border-white/20 active:bg-white/5 cursor-pointer transition flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {tx.concept}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-500">
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
