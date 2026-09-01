"use client";

import React, { useState, useTransition } from "react";
import { 
  X, 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  Tag, 
  CreditCard, 
  Repeat, 
  FileText, 
  Check, 
  Delete,
  AlertCircle
} from "lucide-react";
import { createTransaction } from "@/app/actions/wallets";
import { saveNotification } from "@/lib/notifications";

interface TactileTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: "expense" | "income";
  wallets: any[];
  categories: any[];
  onSuccess?: () => void;
}

export default function TactileTransactionModal({
  isOpen,
  onClose,
  initialType = "expense",
  wallets,
  categories,
  onSuccess,
}: TactileTransactionModalProps) {
  const [type, setType] = useState<"expense" | "income">(initialType);
  const [displayAmount, setDisplayAmount] = useState<string>("0");
  const [concept, setConcept] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [selectedWalletId, setSelectedWalletId] = useState<string>(wallets[0]?.id || "");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState<"paid" | "pending" | "planned">("paid");
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [showNoteField, setShowNoteField] = useState<boolean>(false);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  // Lógica del Teclado Numérico Táctil
  const handleKeypadPress = (val: string) => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(8);
    }

    if (val === "backspace") {
      if (displayAmount.length <= 1) {
        setDisplayAmount("0");
      } else {
        setDisplayAmount(displayAmount.slice(0, -1));
      }
      return;
    }

    if (val === ".") {
      if (!displayAmount.includes(".")) {
        setDisplayAmount(displayAmount + ".");
      }
      return;
    }

    // Evitar ceros a la izquierda (ej. 054 -> 54)
    if (displayAmount === "0" && val !== ".") {
      setDisplayAmount(val);
    } else {
      // Limitar a 2 decimales
      if (displayAmount.includes(".")) {
        const parts = displayAmount.split(".");
        if (parts[1] && parts[1].length >= 2) return;
      }
      setDisplayAmount(displayAmount + val);
    }
  };

  const parsedAmount = parseFloat(displayAmount) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) {
      setError("Por favor ingresa un monto mayor a $0.00");
      return;
    }
    if (!selectedWalletId) {
      setError("Por favor selecciona una cartera.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const finalConcept = concept.trim() || (type === "expense" ? "Gasto Registrado" : "Ingreso Registrado");
      
      const res = await createTransaction({
        wallet_id: selectedWalletId,
        type,
        amount: parsedAmount,
        concept: `${finalConcept}${status === "pending" ? " (Pendiente)" : ""}`,
        category_id: selectedCategoryId || null,
        date: new Date(date).toISOString(),
      });

      if (res.success) {
        if (typeof window !== "undefined" && navigator.vibrate) {
          navigator.vibrate([10, 40, 10]);
        }

        saveNotification({
          title: type === "expense" ? "🔴 Gasto Registrado" : "🟢 Ingreso Registrado",
          body: `${type === "expense" ? "Descontaste" : "Ingresaste"} $${parsedAmount.toFixed(2)} en "${finalConcept}".`,
          type: "transaction",
        });

        setSuccess(true);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1000);
      } else {
        setError(res.error || "No se pudo guardar la transacción.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#000000] rounded-t-2xl sm:rounded-2xl border-t sm:border border-slate-200 dark:border-white/[0.08] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-slide-up safe-bottom">
        
        {/* Header del Modal */}
        <div className="p-3.5 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver
          </button>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#141418] p-1 rounded-lg border border-slate-200/60 dark:border-white/[0.06]">
            <button
              onClick={() => setType("expense")}
              className={`px-3 py-1 rounded-md text-xs font-black transition ${
                type === "expense"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-700 dark:text-zinc-300"
              }`}
            >
              Gasto
            </button>
            <button
              onClick={() => setType("income")}
              className={`px-3 py-1 rounded-md text-xs font-black transition ${
                type === "income"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-700 dark:text-zinc-300"
              }`}
            >
              Ingreso
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            ¡Transacción registrada correctamente!
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {/* Display de Importe */}
          <div className="text-center py-1">
            <div className="flex items-center justify-center gap-1 text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              <span className={type === "expense" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                {type === "expense" ? "-" : "+"} $
              </span>
              <span>{parseFloat(displayAmount).toLocaleString("es-MX", { minimumFractionDigits: displayAmount.includes(".") ? (displayAmount.split(".")[1]?.length || 0) : 0 })}</span>
            </div>

            {/* Fecha Selector Pill */}
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#141418] text-xs font-bold text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-white/[0.08]">
              <CalendarIcon className="w-3.5 h-3.5 text-zinc-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Campo Concepto / ¿En qué gastaste? */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
              Descripción / Comercio
            </label>
            <input
              type="text"
              required
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder={type === "expense" ? "¿En qué gastaste? (ej. Netflix, Starbucks, OXXO)" : "¿De dónde proviene? (ej. Nómina, Venta)"}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-zinc-500 focus:ring-1 focus:ring-white/40 focus:outline-none"
            />
          </div>

          {/* Fila Doble: Cartera y Categoría */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                Cartera / Tarjeta
              </label>
              <select
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-white/40 focus:outline-none cursor-pointer"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id} className="bg-neutral-900 text-white">
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                Categoría
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-white/40 focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-neutral-900 text-white">
                  Sin Categoría
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-neutral-900 text-white">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Pills */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
              Estado del Pago
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus("paid")}
                className={`py-2 rounded-lg text-xs font-black transition ${
                  status === "paid"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-[#141418] text-slate-700 dark:text-zinc-300 border border-slate-200/60 dark:border-white/[0.06]"
                }`}
              >
                Pagado
              </button>
              <button
                type="button"
                onClick={() => setStatus("pending")}
                className={`py-2 rounded-lg text-xs font-black transition ${
                  status === "pending"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-[#141418] text-slate-700 dark:text-zinc-300 border border-slate-200/60 dark:border-white/[0.06]"
                }`}
              >
                Pendiente
              </button>
              <button
                type="button"
                onClick={() => setStatus("planned")}
                className={`py-2 rounded-lg text-xs font-black transition ${
                  status === "planned"
                    ? "bg-neutral-700 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-[#141418] text-slate-700 dark:text-zinc-300 border border-slate-200/60 dark:border-white/[0.06]"
                }`}
              >
                Programado
              </button>
            </div>
          </div>

          {/* Action Chips: Nota y Recurrente */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowNoteField(!showNoteField)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                showNoteField
                  ? "bg-white/10 border-white/40 text-white"
                  : "border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300"
              }`}
            >
              + Agregar Nota
            </button>

            <button
              type="button"
              onClick={() => setIsRecurring(!isRecurring)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
                isRecurring
                  ? "bg-purple-500/15 border-purple-500 text-purple-400"
                  : "border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300"
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              {isRecurring ? "Recurrente" : "+ Hacer Recurrente"}
            </button>
          </div>

          {showNoteField && (
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Escribe notas adicionales o detalles del movimiento..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-zinc-500 focus:outline-none"
            />
          )}

          {/* Teclado Numérico Táctil Integrado */}
          <div className="p-2.5 bg-slate-100 dark:bg-[#0A0A0C] rounded-xl border border-slate-200/80 dark:border-white/[0.08]">
            <div className="grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "backspace"].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeypadPress(key)}
                  className="h-11 rounded-lg bg-white dark:bg-[#141418] text-slate-900 dark:text-white font-black text-base shadow-sm border border-slate-200/60 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/10 active:scale-95 transition flex items-center justify-center"
                >
                  {key === "backspace" ? <Delete className="w-5 h-5" /> : key}
                </button>
              ))}
            </div>
          </div>

          {/* Botón de Confirmación */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || success || parsedAmount <= 0}
            className={`w-full py-3.5 rounded-xl font-black text-xs text-white shadow-lg transition active:scale-98 flex items-center justify-center gap-2 ${
              type === "expense"
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/25"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25"
            }`}
          >
            {isPending ? "Guardando..." : `Confirmar ${type === "expense" ? "Gasto" : "Ingreso"} de $${parsedAmount.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
