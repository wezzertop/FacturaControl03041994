"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  AlertCircle, 
  CreditCard, 
  Clock, 
  Calendar, 
  X, 
  ChevronRight,
  Sparkles,
  CheckCircle2,
  BellRing
} from "lucide-react";

interface WalletAlert {
  id: string;
  name: string;
  type: string;
  balance: number;
  cut_off_day?: number;
  due_day?: number;
  statement_payment_due?: number;
}

interface RecurringAlert {
  id: string;
  concept: string;
  amount: number;
  next_execution_date: string;
  frequency: string;
}

interface UpcomingAlertsBannerProps {
  wallets?: WalletAlert[];
  recurringPayments?: RecurringAlert[];
  onPayCreditCard?: (walletId: string) => void;
}

export default function UpcomingAlertsBanner({
  wallets = [],
  recurringPayments = [],
  onPayCreditCard,
}: UpcomingAlertsBannerProps) {
  const [dismissed, setDismissed] = useState<boolean>(false);

  const alerts = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const items: Array<{
      id: string;
      title: string;
      description: string;
      type: "credit_due" | "credit_cutoff" | "recurring";
      badge: string;
      daysRemaining: number;
      actionText: string;
      actionHref?: string;
      walletId?: string;
    }> = [];

    // 1. Analizar Tarjetas de Crédito
    wallets
      .filter((w) => w.type === "credit")
      .forEach((w) => {
        const dueDay = w.due_day || 5;
        const cutOffDay = w.cut_off_day || 15;

        // Días para fecha límite de pago
        let daysToDue = dueDay - currentDay;
        if (daysToDue < 0) daysToDue += 30; // Próximo ciclo

        if (daysToDue >= 0 && daysToDue <= 3) {
          items.push({
            id: `due-${w.id}`,
            title: `Límite de pago: ${w.name}`,
            description: daysToDue === 0 ? "¡Vence HOY! Realiza tu pago para no generar intereses." : `Vence en ${daysToDue} día${daysToDue > 1 ? "s" : ""}. Pago sugerido: $${Number(w.statement_payment_due || Math.abs(w.balance || 0)).toLocaleString("es-MX")}`,
            type: "credit_due",
            badge: daysToDue === 0 ? "Vence Hoy 🔥" : `${daysToDue} días`,
            daysRemaining: daysToDue,
            actionText: "Pagar Tarjeta",
            walletId: w.id,
          });
        }

        // Días para corte de tarjeta
        let daysToCut = cutOffDay - currentDay;
        if (daysToCut < 0) daysToCut += 30;

        if (daysToCut >= 0 && daysToCut <= 2) {
          items.push({
            id: `cutoff-${w.id}`,
            title: `Corte de Tarjeta: ${w.name}`,
            description: daysToCut === 0 ? "Hoy es el corte de tu tarjeta. Las compras posteriores entran al siguiente ciclo." : `Corta en ${daysToCut} día${daysToCut > 1 ? "s" : ""}. Aprovecha para compras del siguiente periodo.`,
            type: "credit_cutoff",
            badge: "Corte Próximo",
            daysRemaining: daysToCut,
            actionText: "Ver Tarjeta",
            actionHref: "/wallets",
          });
        }
      });

    // 2. Analizar Pagos Recurrentes
    recurringPayments.forEach((r) => {
      if (!r.next_execution_date) return;
      const nextDate = new Date(r.next_execution_date);
      const diffTime = nextDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 3) {
        items.push({
          id: `rec-${r.id}`,
          title: `Pago Recurrente: ${r.concept}`,
          description: diffDays === 0 ? `Se cobrará HOY por $${Number(r.amount).toLocaleString("es-MX")}` : `Programado en ${diffDays} día${diffDays > 1 ? "s" : ""} ($${Number(r.amount).toLocaleString("es-MX")})`,
          type: "recurring",
          badge: diffDays === 0 ? "Cobro Hoy" : `En ${diffDays}d`,
          daysRemaining: diffDays,
          actionText: "Ver Recurrentes",
          actionHref: "/recurring",
        });
      }
    });

    return items.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [wallets, recurringPayments]);

  if (dismissed || alerts.length === 0) return null;

  const firstAlert = alerts[0];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 p-4 shadow-sm animate-in fade-in">
      <div className="flex items-start sm:items-center justify-between gap-3">
        
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <BellRing className="w-4 h-4 animate-bounce" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {firstAlert.title}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/40">
                {firstAlert.badge}
              </span>
              {alerts.length > 1 && (
                <span className="text-[10px] text-zinc-400 font-bold">
                  +{alerts.length - 1} alerta{alerts.length - 1 > 1 ? "s" : ""} más
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
              {firstAlert.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {firstAlert.actionHref ? (
            <Link
              href={firstAlert.actionHref}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-amber-500 text-black dark:text-black text-xs font-bold hover:opacity-90 transition flex items-center gap-1 shadow-sm"
            >
              {firstAlert.actionText} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (firstAlert.walletId && onPayCreditCard) {
                  onPayCreditCard(firstAlert.walletId);
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition flex items-center gap-1 shadow-sm"
            >
              {firstAlert.actionText} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-zinc-400 hover:text-white transition"
            title="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
