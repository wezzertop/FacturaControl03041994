"use client";

import React, { useState, useTransition } from "react";
import { 
  ArrowRightLeft, 
  X, 
  Wallet as WalletIcon, 
  Check, 
  AlertCircle, 
  CreditCard,
  Banknote,
  Sparkles
} from "lucide-react";
import { transferBetweenWallets } from "@/app/actions/wallets";
import CurrencyInput from "@/components/ui/CurrencyInput";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: any[];
  defaultFromWalletId?: string;
  defaultToWalletId?: string;
  onSuccess?: () => void;
}

export default function TransferModal({
  isOpen,
  onClose,
  wallets = [],
  defaultFromWalletId,
  defaultToWalletId,
  onSuccess
}: TransferModalProps) {
  const [fromWalletId, setFromWalletId] = useState<string>(
    defaultFromWalletId || (wallets.length > 0 ? wallets[0].id : "")
  );
  const [toWalletId, setToWalletId] = useState<string>(
    defaultToWalletId || (wallets.length > 1 ? wallets[1].id : "")
  );
  const [amount, setAmount] = useState<string>("");
  const [concept, setConcept] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSwap = () => {
    if (fromWalletId && toWalletId) {
      setFromWalletId(toWalletId);
      setToWalletId(fromWalletId);
    }
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount.replace(/[^0-9.-]+/g, ""));
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Ingresa un monto válido mayor a $0.00");
      return;
    }

    if (!fromWalletId || !toWalletId) {
      setError("Selecciona la cartera de origen y destino");
      return;
    }

    if (fromWalletId === toWalletId) {
      setError("La cartera de origen y destino deben ser distintas");
      return;
    }

    startTransition(async () => {
      try {
        if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
        const res = await transferBetweenWallets(fromWalletId, toWalletId, numAmount, concept, date);
        if (res.success) {
          if (onSuccess) onSuccess();
          onClose();
        } else {
          setError(res.error || "No se pudo realizar la transferencia");
        }
      } catch (err: any) {
        setError(err.message || "Error al procesar la transferencia");
      }
    });
  };

  const fromWallet = wallets.find((w) => w.id === fromWalletId);
  const toWallet = wallets.find((w) => w.id === toWalletId);

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="surface-card rounded-2xl p-6 max-w-md w-full border border-white/[0.08] shadow-2xl relative animate-slide-up bg-white dark:bg-[#000000] text-slate-900 dark:text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-white text-black flex items-center justify-center shadow-lg">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black tracking-tight">
              Transferencia entre Carteras
            </h3>
            <p className="text-xs text-zinc-400">
              Mueve fondos o paga tu tarjeta de crédito
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 text-xs font-bold rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleTransfer} className="space-y-4">
          {/* Monto a Transferir */}
          <div>
            <label className="text-xs font-bold text-zinc-400 block mb-1.5">
              Monto a Transferir (MXN)
            </label>
            <CurrencyInput
              value={amount}
              onChange={(val) => setAmount(val.toString())}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xl font-black text-slate-900 dark:text-white focus:ring-1 focus:ring-white/40 focus:outline-none"
            />
          </div>

          {/* Origen y Destino */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] space-y-3 relative">
            {/* Botón Swap */}
            <button
              type="button"
              onClick={handleSwap}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white dark:bg-[#141418] border border-white/20 flex items-center justify-center text-zinc-300 hover:text-white shadow-md active:scale-90 transition z-10"
              title="Intercambiar origen y destino"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>

            {/* Cartera Origen */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-rose-400 block mb-1">
                De Cartera (Origen / Retiro)
              </label>
              <select
                value={fromWalletId}
                onChange={(e) => setFromWalletId(e.target.value)}
                className="w-full pr-10 pl-3 py-2 bg-white dark:bg-[#141418] border border-slate-200 dark:border-white/[0.06] rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id} className="bg-neutral-900 text-white">
                    {w.name} (Saldo: ${Number(w.balance || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })})
                  </option>
                ))}
              </select>
            </div>

            {/* Cartera Destino */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-1">
                A Cartera (Destino / Depósito)
              </label>
              <select
                value={toWalletId}
                onChange={(e) => setToWalletId(e.target.value)}
                className="w-full pr-10 pl-3 py-2 bg-white dark:bg-[#141418] border border-slate-200 dark:border-white/[0.06] rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id} className="bg-neutral-900 text-white">
                    {w.name} {w.type === "credit" ? "💳 (Pagar Tarjeta)" : `($${Number(w.balance || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Concepto y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-400 block mb-1">
                Concepto (Opcional)
              </label>
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Ej. Pago TC, Ahorro quincenal"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-white/40 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-400 block mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-white/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Botón Confirmar */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 bg-white hover:bg-neutral-200 disabled:opacity-50 text-black font-extrabold text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-2 min-h-[44px] mt-2"
          >
            {isPending ? "Transfiriendo fondos..." : "Confirmar Transferencia ⚡"}
          </button>
        </form>
      </div>
    </div>
  );
}
