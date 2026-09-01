"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Zap, 
  Sparkles, 
  Calendar, 
  Camera, 
  PlusCircle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle,
  Scale,
  Clipboard
} from "lucide-react";
import SmartTransactionDetectorModal from "@/components/wallets/SmartTransactionDetectorModal";

import ApplePaySetupModal from "@/components/wallets/ApplePaySetupModal";

interface MobileFintechWidgetsProps {
  wallets: any[];
  categories: any[];
  invoicesCount?: number;
  totalIncome?: number;
  totalExpense?: number;
  onRefresh?: () => void;
}

export default function MobileFintechWidgets({
  wallets,
  categories,
  invoicesCount = 0,
  totalIncome = 0,
  totalExpense = 0,
  onRefresh,
}: MobileFintechWidgetsProps) {
  const [isDetectorOpen, setIsDetectorOpen] = useState(false);
  const [isApplePayOpen, setIsApplePayOpen] = useState(false);

  const formatCurrency = (val: number) => {
    return val.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  };

  // Calcular tarjetas de crédito y sus próximos vencimientos
  const creditCards = wallets.filter((w) => w.type === "credit");
  const today = new Date().getDate();

  return (
    <div className="space-y-4">
      {/* Widget 1: Barra de Acciones Rápidas Táctiles (Quick Actions) */}
      <div className="surface-card rounded-2xl p-4 border border-slate-200/80 dark:border-white/[0.08] shadow-sm bg-white dark:bg-[#0A0A0C] text-slate-900 dark:text-white">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
            Acciones Rápidas
          </span>
          <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold">1-Toque</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {/* Acción 1: Apple Pay / Wallet Automático */}
          <button
            onClick={() => setIsApplePayOpen(true)}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-50 dark:bg-[#141418] hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition text-center gap-1.5 group border border-white/20"
          >
            <div className="w-8 h-8 rounded-lg bg-white text-black font-black text-[11px] flex items-center justify-center shadow-sm">
              Pay
            </div>
            <span className="text-[10px] font-bold text-slate-800 dark:text-zinc-300 leading-tight">
              Apple Pay
            </span>
          </button>

          {/* Acción 2: Detectar SMS / Notificación */}
          <button
            onClick={() => setIsDetectorOpen(true)}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-50 dark:bg-[#141418] hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition text-center gap-1.5 group border border-slate-200/60 dark:border-white/[0.06]"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white/10 text-white flex items-center justify-center shadow-sm">
              <Clipboard className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-800 dark:text-zinc-300 leading-tight">
              Detectar SMS
            </span>
          </button>

          {/* Acción 3: Cargar XML SAT */}
          <Link
            href="/upload"
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-50 dark:bg-[#141418] hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition text-center gap-1.5 group border border-slate-200/60 dark:border-white/[0.06]"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-sm">
              <PlusCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-800 dark:text-zinc-300 leading-tight">
              Subir CFDI
            </span>
          </Link>

          {/* Acción 4: Impuestos SAT */}
          <Link
            href="/tax"
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-50 dark:bg-[#141418] hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition text-center gap-1.5 group border border-slate-200/60 dark:border-white/[0.06]"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shadow-sm">
              <Scale className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-800 dark:text-zinc-300 leading-tight">
              Impuestos
            </span>
          </Link>
        </div>
      </div>

      {/* Widget 2: Próximos Vencimientos y Fechas de Corte */}
      {creditCards.length > 0 && (
        <div className="surface-card rounded-2xl p-4 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Próximos Pagos & Vencimientos
            </h4>
            <Link
              href="/calendar"
              className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 hover:text-white"
            >
              Ver Calendario ➔
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {creditCards.map((card) => {
              const cutOff = card.cut_off_day || 15;
              const due = card.due_day || 5;
              const daysToDue = due >= today ? due - today : (30 - today + due);

              return (
                <div
                  key={card.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-[#141418] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {card.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                        Corte día {cutOff} • Límite día {due}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                      daysToDue <= 3
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                        : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {daysToDue === 0 ? "¡Paga Hoy!" : `En ${daysToDue} días`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Detección de Transacciones */}
      <SmartTransactionDetectorModal
        isOpen={isDetectorOpen}
        onClose={() => setIsDetectorOpen(false)}
        wallets={wallets}
        categories={categories}
        onTransactionCreated={onRefresh}
      />

      {/* Modal de Configuración y Simulación de Apple Pay */}
      <ApplePaySetupModal
        isOpen={isApplePayOpen}
        onClose={() => setIsApplePayOpen(false)}
        onSuccess={onRefresh}
      />
    </div>
  );
}
