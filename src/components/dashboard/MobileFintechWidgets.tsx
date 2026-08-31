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

  const formatCurrency = (val: number) => {
    return val.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  };

  // Calcular tarjetas de crédito y sus próximos vencimientos
  const creditCards = wallets.filter((w) => w.type === "credit");
  const today = new Date().getDate();

  return (
    <div className="space-y-4">
      {/* Widget 1: Barra de Acciones Rápidas Táctiles (Quick Actions) */}
      <div className="surface-card rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-sm bg-[#0F1626] text-white">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 fill-current" />
            Acciones Rápidas
          </span>
          <span className="text-[10px] text-slate-300 font-bold">1-Toque</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {/* Acción 1: Detectar SMS / Notificación */}
          <button
            onClick={() => setIsDetectorOpen(true)}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 transition text-center gap-1.5 group border border-white/10"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-cerulean text-white flex items-center justify-center shadow-md">
              <Clipboard className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-white leading-tight">
              Detectar SMS
            </span>
          </button>

          {/* Acción 2: Cargar XML SAT */}
          <Link
            href="/upload"
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 transition text-center gap-1.5 group border border-white/10"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <PlusCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-white leading-tight">
              Subir CFDI
            </span>
          </Link>

          {/* Acción 3: Escanear Ticket */}
          <Link
            href="/wallets"
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 transition text-center gap-1.5 group border border-white/10"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-md">
              <Camera className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-white leading-tight">
              Escanear
            </span>
          </Link>

          {/* Acción 4: Impuestos SAT */}
          <Link
            href="/tax"
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 transition text-center gap-1.5 group border border-white/10"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-md">
              <Scale className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-white leading-tight">
              Impuestos
            </span>
          </Link>
        </div>
      </div>

      {/* Widget 2: Próximos Vencimientos y Fechas de Corte */}
      {creditCards.length > 0 && (
        <div className="surface-card rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-cerulean" />
              Próximos Pagos & Vencimientos
            </h4>
            <Link
              href="/calendar"
              className="text-[11px] font-bold text-brand-cerulean hover:underline"
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
                  className="p-3 rounded-xl bg-slate-50 dark:bg-[#151E32] border border-slate-200/60 dark:border-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand-cerulean/15 text-brand-cerulean flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {card.name}
                      </p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-300">
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
    </div>
  );
}
