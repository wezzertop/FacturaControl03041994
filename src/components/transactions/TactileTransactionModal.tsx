"use client";

import React, { useState, useTransition, useEffect } from "react";
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
  AlertCircle,
  ArrowRightLeft,
  Trash2
} from "lucide-react";
import { createTransaction, updateTransaction, deleteTransaction, transferBetweenWallets } from "@/app/actions/wallets";
import { saveNotification } from "@/lib/notifications";

interface TactileTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: "expense" | "income" | "transfer";
  transaction?: any | null; // For editing existing transaction
  wallets: any[];
  categories: any[];
  onSuccess?: () => void;
}

export default function TactileTransactionModal({
  isOpen,
  onClose,
  initialType = "expense",
  transaction = null,
  wallets = [],
  categories = [],
  onSuccess,
}: TactileTransactionModalProps) {
  const [type, setType] = useState<"expense" | "income" | "transfer">(
    transaction?.type || initialType
  );
  const [displayAmount, setDisplayAmount] = useState<string>(
    transaction ? Math.abs(Number(transaction.amount || 0)).toString() : "0"
  );
  const [concept, setConcept] = useState<string>(transaction?.concept || "");
  const [note, setNote] = useState<string>("");
  const [selectedWalletId, setSelectedWalletId] = useState<string>(
    transaction?.wallet_id || (wallets[0]?.id || "")
  );
  const [toWalletId, setToWalletId] = useState<string>(
    wallets.length > 1 ? wallets[1].id : (wallets[0]?.id || "")
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    transaction?.category_id || ""
  );
  const [date, setDate] = useState<string>(
    transaction?.date ? new Date(transaction.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [status, setStatus] = useState<"paid" | "pending" | "planned">("paid");
  const [showNoteField, setShowNoteField] = useState<boolean>(false);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type || "expense");
      setDisplayAmount(Math.abs(Number(transaction.amount || 0)).toString());
      setConcept(transaction.concept || "");
      setSelectedWalletId(transaction.wallet_id || wallets[0]?.id || "");
      setSelectedCategoryId(transaction.category_id || "");
      setDate(transaction.date ? new Date(transaction.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
    } else {
      setType(initialType);
    }
  }, [transaction, initialType, wallets]);

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

    if (displayAmount === "0" && val !== ".") {
      setDisplayAmount(val);
    } else {
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
      // Si es modo transferencia
      if (type === "transfer") {
        if (selectedWalletId === toWalletId) {
          setError("La cartera de origen y destino deben ser diferentes.");
          return;
        }
        const res = await transferBetweenWallets(selectedWalletId, toWalletId, parsedAmount, concept, date);
        if (res.success) {
          setSuccess(true);
          if (onSuccess) onSuccess();
          setTimeout(() => {
            setSuccess(false);
            onClose();
          }, 800);
        } else {
          setError(res.error || "No se pudo realizar la transferencia.");
        }
        return;
      }

      // Si es edición de transacción existente
      if (transaction) {
        const res = await updateTransaction(transaction.id, {
          type: type === "income" ? "income" : "expense",
          amount: parsedAmount,
          concept: concept.trim() || transaction.concept,
          category_id: selectedCategoryId || null,
          date: new Date(date).toISOString(),
        });

        if (res.success) {
          setSuccess(true);
          if (onSuccess) onSuccess();
          setTimeout(() => {
            setSuccess(false);
            onClose();
          }, 800);
        } else {
          setError(res.error || "No se pudo actualizar la transacción.");
        }
        return;
      }

      // Creación de nueva transacción
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
        }, 800);
      } else {
        setError(res.error || "No se pudo guardar la transacción.");
      }
    });
  };

  const handleDelete = () => {
    if (!transaction) return;
    if (!confirm("¿Estás seguro de eliminar este movimiento? El saldo de tu cartera se actualizará.")) return;

    startTransition(async () => {
      const res = await deleteTransaction(transaction.id);
      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.error || "No se pudo eliminar el movimiento.");
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
            className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver
          </button>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#141418] p-1 rounded-xl border border-slate-200/60 dark:border-white/[0.06]">
            <button
              onClick={() => setType("expense")}
              className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                type === "expense"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-zinc-400"
              }`}
            >
              Gasto
            </button>
            <button
              onClick={() => setType("income")}
              className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                type === "income"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-zinc-400"
              }`}
            >
              Ingreso
            </button>
            <button
              onClick={() => setType("transfer")}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition flex items-center gap-1 ${
                type === "transfer"
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-400"
              }`}
            >
              <ArrowRightLeft className="w-3 h-3" />
              Transferir
            </button>
          </div>

          <div className="flex items-center gap-1">
            {transaction && (
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                title="Eliminar movimiento"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            ¡Movimiento guardado con éxito!
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {/* Display de Importe */}
          <div className="text-center py-1">
            <div className="flex items-center justify-center gap-1 text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              <span className={
                type === "expense" 
                  ? "text-rose-400" 
                  : type === "income" 
                    ? "text-emerald-400" 
                    : "text-white"
              }>
                {type === "expense" ? "-" : type === "income" ? "+" : "⇄"} $
              </span>
              <span>{parseFloat(displayAmount).toLocaleString("es-MX", { minimumFractionDigits: displayAmount.includes(".") ? (displayAmount.split(".")[1]?.length || 0) : 0 })}</span>
            </div>

            {/* Selector de Fecha */}
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#141418] text-xs font-bold text-zinc-300 border border-slate-200/80 dark:border-white/[0.08]">
              <CalendarIcon className="w-3.5 h-3.5 text-zinc-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Campo Concepto */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Descripción / Concepto
            </label>
            <input
              type="text"
              required
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder={
                type === "transfer"
                  ? "Ej. Traspaso de nómina, Ahorro"
                  : type === "expense" 
                    ? "¿En qué gastaste? (ej. Netflix, Starbucks, OXXO)" 
                    : "¿De dónde proviene? (ej. Nómina, Venta)"
              }
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-zinc-500 focus:ring-1 focus:ring-white/40 focus:outline-none"
            />
          </div>

          {/* Selector de Carteras según Modo */}
          {type === "transfer" ? (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08]">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
                  De Cartera (Origen)
                </label>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white dark:bg-[#141418] border border-white/[0.06] rounded-lg text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id} className="bg-neutral-900 text-white">
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                  A Cartera (Destino)
                </label>
                <select
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white dark:bg-[#141418] border border-white/[0.06] rounded-lg text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id} className="bg-neutral-900 text-white">
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
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
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
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
          )}

          {/* Teclado Numérico Táctil */}
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
            className={`w-full py-3.5 rounded-xl font-black text-xs transition active:scale-98 flex items-center justify-center gap-2 shadow-lg min-h-[44px] ${
              type === "transfer"
                ? "bg-white text-black hover:bg-neutral-200"
                : type === "expense"
                  ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25"
            }`}
          >
            {isPending ? "Guardando..." : transaction ? "Guardar Cambios" : `Confirmar ${type === "transfer" ? "Transferencia" : type === "expense" ? "Gasto" : "Ingreso"} de $${parsedAmount.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

