"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import { 
  X, 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  Tag, 
  CreditCard, 
  Repeat, 
  Check, 
  Delete,
  AlertCircle,
  ArrowRightLeft,
  Trash2,
  Scissors,
  Camera,
  Plus,
  PlusCircle,
  Sparkles,
  Undo2
} from "lucide-react";
import { 
  createTransaction, 
  updateTransaction, 
  deleteTransaction, 
  transferBetweenWallets, 
  createSplitTransaction,
  createRecurringPayment
} from "@/app/actions/wallets";
import { createCategory } from "@/app/actions/categories";
import { saveNotification } from "@/lib/notifications";

interface TactileTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: "expense" | "income" | "transfer";
  transaction?: any | null;
  wallets: any[];
  categories: any[];
  initialVoucherFile?: File | null;
  onSuccess?: () => void;
  onCategoryCreated?: (newCategory: any) => void;
}

const CATEGORY_COLORS = [
  "bg-emerald-500", "bg-blue-500", "bg-purple-600", "bg-rose-500", 
  "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-cyan-500",
  "bg-pink-500", "bg-orange-500", "bg-yellow-500", "bg-zinc-600"
];

export default function TactileTransactionModal({
  isOpen,
  onClose,
  initialType = "expense",
  transaction = null,
  wallets = [],
  categories = [],
  initialVoucherFile = null,
  onSuccess,
  onCategoryCreated
}: TactileTransactionModalProps) {
  const [type, setType] = useState<"expense" | "income" | "transfer">(
    transaction?.type || initialType
  );
  const [displayAmount, setDisplayAmount] = useState<string>(
    transaction ? Math.abs(Number(transaction.amount || 0)).toString() : "0"
  );
  const [concept, setConcept] = useState<string>(transaction?.concept || "");
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

  // Chips activos
  const [showTagsPanel, setShowTagsPanel] = useState<boolean>(false);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringFreq, setRecurringFreq] = useState<"monthly" | "days_15" | "days_14" | "weekly" | "yearly">("monthly");
  const [isInstallments, setIsInstallments] = useState<boolean>(false);
  const [installmentsCount, setInstallmentsCount] = useState<string>("12");
  const [isRefund, setIsRefund] = useState<boolean>(
    transaction?.concept?.includes("[Reembolso]") || false
  );

  // Evidencia / Voucher
  const [voucherFile, setVoucherFile] = useState<File | null>(initialVoucherFile);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tags personalizados
  const [customTagInput, setCustomTagInput] = useState<string>("");

  // Creación rápida de categoría
  const [showInlineCatModal, setShowInlineCatModal] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>("");
  const [newCatColor, setNewCatColor] = useState<string>("bg-emerald-500");
  const [localCategories, setLocalCategories] = useState<any[]>(categories);

  // Split
  const [isSplitMode, setIsSplitMode] = useState<boolean>(false);
  const [splits, setSplits] = useState<Array<{ amount: string; concept: string; category_id: string }>>([
    { amount: "", concept: "", category_id: "" },
    { amount: "", concept: "", category_id: "" }
  ]);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    if (initialVoucherFile) {
      setVoucherFile(initialVoucherFile);
    }
  }, [initialVoucherFile]);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type || "expense");
      setDisplayAmount(Math.abs(Number(transaction.amount || 0)).toString());
      setConcept(transaction.concept || "");
      setSelectedWalletId(transaction.wallet_id || wallets[0]?.id || "");
      setSelectedCategoryId(transaction.category_id || "");
      setDate(transaction.date ? new Date(transaction.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
      setIsRefund(transaction.concept?.includes("[Reembolso]") || false);
    } else {
      setType(initialType);
    }
  }, [transaction, initialType, wallets]);

  // Teclado Físico (Windows, Mac, Linux)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input o select
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "select" || activeTag === "textarea") {
        if (e.key === "Escape") {
          onClose();
        }
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit(e as any);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleKeypadPress("backspace");
      } else if (e.key === ".") {
        e.preventDefault();
        handleKeypadPress(".");
      } else if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKeypadPress(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, displayAmount, concept, selectedWalletId, selectedCategoryId, date, isRecurring, isInstallments, isRefund, isSplitMode, splits]);

  if (!isOpen) return null;

  const currentWallet = wallets.find((w) => w.id === selectedWalletId);
  const isCreditCard = currentWallet?.type === "credit";

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVoucherFile(file);
    }
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = customTagInput.trim().replace(/^#/, "");
    if (!cleanTag) return;
    const tagFormatted = `#${cleanTag}`;
    if (!concept.includes(tagFormatted)) {
      setConcept((prev) => `${prev} ${tagFormatted}`.trim());
    }
    setCustomTagInput("");
  };

  const handleCreateFastCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const res = await createCategory(newCatName.trim(), newCatColor, "Tag", 0, type === "income" ? "income" : "expense");
    if (res.success && res.category) {
      const created = res.category;
      setLocalCategories([...localCategories, created]);
      setSelectedCategoryId(created.id);
      setShowInlineCatModal(false);
      setNewCatName("");
      if (onCategoryCreated) onCategoryCreated(created);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (parsedAmount <= 0) {
      setError("Ingresa un monto mayor a $0.00");
      return;
    }
    if (!selectedWalletId) {
      setError("Selecciona una cartera.");
      return;
    }

    setError(null);
    startTransition(async () => {
      if (type === "transfer") {
        if (selectedWalletId === toWalletId) {
          setError("La cartera de origen y destino deben ser distintas.");
          return;
        }
        const res = await transferBetweenWallets(selectedWalletId, toWalletId, parsedAmount, concept, date);
        if (res.success) {
          setSuccess(true);
          if (onSuccess) onSuccess();
          setTimeout(() => {
            setSuccess(false);
            onClose();
          }, 600);
        } else {
          setError(res.error || "Error al transferir.");
        }
        return;
      }

      if (isSplitMode) {
        const validSplits = splits.filter((s) => parseFloat(s.amount) > 0);
        if (validSplits.length < 2) {
          setError("Agrega al menos 2 partes para dividir el gasto.");
          return;
        }

        const res = await createSplitTransaction({
          wallet_id: selectedWalletId,
          total_amount: parsedAmount,
          date: new Date(date).toISOString(),
          splits: validSplits.map((s) => ({
            amount: parseFloat(s.amount),
            concept: s.concept.trim() || concept.trim() || "Gasto Dividido",
            category_id: s.category_id || null,
          })),
        });

        if (res.success) {
          setSuccess(true);
          if (onSuccess) onSuccess();
          setTimeout(() => {
            setSuccess(false);
            onClose();
          }, 600);
        } else {
          setError(res.error || "Error en split.");
        }
        return;
      }

      if (transaction) {
        let finalConcept = concept.trim() || transaction.concept;
        if (isRefund && !finalConcept.includes("[Reembolso]")) {
          finalConcept = `[Reembolso] ${finalConcept}`;
        }

        const res = await updateTransaction(transaction.id, {
          type: type === "income" ? "income" : "expense",
          amount: parsedAmount,
          concept: finalConcept,
          category_id: selectedCategoryId || null,
          date: new Date(date).toISOString(),
        });

        if (res.success) {
          setSuccess(true);
          if (onSuccess) onSuccess();
          setTimeout(() => {
            setSuccess(false);
            onClose();
          }, 600);
        } else {
          setError(res.error || "Error al actualizar.");
        }
        return;
      }

      // Nueva transacción
      let voucherBase64: string | null = null;
      let voucherName: string | null = null;

      if (voucherFile) {
        try {
          voucherBase64 = await fileToBase64(voucherFile);
          voucherName = voucherFile.name;
        } catch (err) {
          console.error("Error voucher:", err);
        }
      }

      let finalConcept = concept.trim() || (type === "expense" ? "Gasto Registrado" : "Ingreso Registrado");
      if (isRefund && !finalConcept.includes("[Reembolso]")) {
        finalConcept = `[Reembolso] ${finalConcept}`;
      }
      if (isInstallments && isCreditCard) {
        finalConcept = `${finalConcept} (${installmentsCount} MSI)`;
      }

      const res = await createTransaction({
        wallet_id: selectedWalletId,
        type,
        amount: parsedAmount,
        concept: `${finalConcept}${status === "pending" ? " (Pendiente)" : ""}`,
        category_id: selectedCategoryId || null,
        date: new Date(date).toISOString(),
        voucher_base64: voucherBase64,
        voucher_name: voucherName,
        installments_count: isInstallments ? parseInt(installmentsCount, 10) : null,
        current_installment: isInstallments ? 1 : null
      });

      if (res.success) {
        if (isRecurring) {
          await createRecurringPayment({
            wallet_id: selectedWalletId,
            type: type === "income" ? "income" : "expense",
            amount: parsedAmount,
            concept: concept.trim() || "Pago Recurrente",
            category_id: selectedCategoryId || null,
            frequency: recurringFreq,
            start_date: date,
            next_execution_date: date
          });
        }

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
        }, 600);
      } else {
        setError(res.error || "Error al guardar.");
      }
    });
  };

  const handleDelete = () => {
    if (!transaction) return;
    if (!confirm("¿Eliminar este movimiento?")) return;

    startTransition(async () => {
      const res = await deleteTransaction(transaction.id);
      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.error || "Error al eliminar.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white dark:bg-[#0A0A0C] rounded-t-2xl sm:rounded-2xl border-t sm:border border-slate-200 dark:border-white/[0.08] shadow-2xl overflow-hidden flex flex-col max-h-[94vh] animate-slide-up safe-bottom">
        
        {/* Header Compacto */}
        <div className="px-4 py-3 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver
          </button>

          {/* Selector de Tipo Píldora */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#141418] p-1 rounded-xl border border-white/[0.06]">
            <button
              onClick={() => setType("expense")}
              className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                type === "expense" ? "bg-rose-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
              }`}
            >
              Gasto
            </button>
            <button
              onClick={() => setType("income")}
              className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                type === "income" ? "bg-emerald-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
              }`}
            >
              Ingreso
            </button>
            <button
              onClick={() => setType("transfer")}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition flex items-center gap-1 ${
                type === "transfer" ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-white"
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
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mx-4 mt-2 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            ¡Guardado con éxito!
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3.5">
          
          {/* Display de Importe & Fecha */}
          <div className="text-center py-0.5">
            <div className="flex items-center justify-center gap-1 text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              <span className={type === "expense" ? "text-rose-400" : type === "income" ? "text-emerald-400" : "text-white"}>
                {type === "expense" ? "-" : type === "income" ? "+" : "⇄"} $
              </span>
              <span>{parseFloat(displayAmount).toLocaleString("es-MX", { minimumFractionDigits: displayAmount.includes(".") ? (displayAmount.split(".")[1]?.length || 0) : 0 })}</span>
            </div>

            <div className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-[#141418] text-[11px] font-bold text-zinc-300 border border-white/[0.06]">
              <CalendarIcon className="w-3 h-3 text-zinc-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-[11px] font-bold focus:outline-none cursor-pointer text-white"
              />
            </div>
          </div>

          {/* Campo Concepto */}
          <div className="space-y-1">
            <input
              type="text"
              required
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder={type === "transfer" ? "Concepto del traspaso..." : type === "expense" ? "¿En qué gastaste? (ej. Uber, Super, Netflix)" : "¿Origen del ingreso? (ej. Nómina, Venta)"}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#121216] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/30"
            />
          </div>

          {/* Selector de Cuentas / Categorías */}
          {type === "transfer" ? (
            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#121216] border border-white/[0.06]">
              <div>
                <label className="text-[10px] font-bold uppercase text-rose-400 block mb-1">De Origen</label>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#18181C] border border-white/[0.06] rounded-lg text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id} className="bg-neutral-900">{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-emerald-400 block mb-1">A Destino</label>
                <select
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#18181C] border border-white/[0.06] rounded-lg text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id} className="bg-neutral-900">{w.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Cartera</label>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#121216] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id} className="bg-neutral-900">{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Categoría</label>
                  <button
                    type="button"
                    onClick={() => setShowInlineCatModal(true)}
                    className="text-[10px] font-bold text-emerald-400 hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-2.5 h-2.5" /> Nueva
                  </button>
                </div>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#121216] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-neutral-900">Sin Categoría</option>
                  {localCategories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-neutral-900">{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* BARRA DE MICRO-CHIPS MINIMALISTA (Opciones Avanzadas en 1 Línea) */}
          <div className="pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
              
              {/* Chip Recurrente */}
              {!transaction && (
                <button
                  type="button"
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 shrink-0 ${
                    isRecurring
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "bg-slate-100 dark:bg-[#141418] text-zinc-400 border-white/[0.06] hover:text-white"
                  }`}
                >
                  <Repeat className="w-3 h-3" />
                  {isRecurring ? "Recurrente ✓" : "Recurrente"}
                </button>
              )}

              {/* Chip Evidencia / Foto */}
              <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
              <button
                type="button"
                onClick={() => {
                  if (voucherFile) {
                    setVoucherFile(null);
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 shrink-0 ${
                  voucherFile
                    ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                    : "bg-slate-100 dark:bg-[#141418] text-zinc-400 border-white/[0.06] hover:text-white"
                }`}
              >
                <Camera className="w-3 h-3" />
                {voucherFile ? `Ticket adjunto ✕` : "Evidencia"}
              </button>

              {/* Chip Split */}
              {type === "expense" && !transaction && (
                <button
                  type="button"
                  onClick={() => setIsSplitMode(!isSplitMode)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 shrink-0 ${
                    isSplitMode
                      ? "bg-white text-black border-white"
                      : "bg-slate-100 dark:bg-[#141418] text-zinc-400 border-white/[0.06] hover:text-white"
                  }`}
                >
                  <Scissors className="w-3 h-3" />
                  {isSplitMode ? "Split ✓" : "Dividir (Split)"}
                </button>
              )}

              {/* Chip MSI */}
              {isCreditCard && type === "expense" && !transaction && (
                <button
                  type="button"
                  onClick={() => setIsInstallments(!isInstallments)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 shrink-0 ${
                    isInstallments
                      ? "bg-purple-500/20 text-purple-400 border-purple-500/40"
                      : "bg-slate-100 dark:bg-[#141418] text-zinc-400 border-white/[0.06] hover:text-white"
                  }`}
                >
                  <CreditCard className="w-3 h-3" />
                  {isInstallments ? `${installmentsCount} MSI ✓` : "MSI"}
                </button>
              )}

              {/* Chip Reembolso */}
              {type === "expense" && (
                <button
                  type="button"
                  onClick={() => setIsRefund(!isRefund)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 shrink-0 ${
                    isRefund
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                      : "bg-slate-100 dark:bg-[#141418] text-zinc-400 border-white/[0.06] hover:text-white"
                  }`}
                >
                  <Undo2 className="w-3 h-3" />
                  {isRefund ? "Reembolso ✓" : "Reembolso"}
                </button>
              )}

              {/* Chip Tags */}
              <button
                type="button"
                onClick={() => setShowTagsPanel(!showTagsPanel)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 shrink-0 ${
                  showTagsPanel
                    ? "bg-white/20 text-white border-white/40"
                    : "bg-slate-100 dark:bg-[#141418] text-zinc-400 border-white/[0.06] hover:text-white"
                }`}
              >
                <Tag className="w-3 h-3" />
                #Tags
              </button>
            </div>

            {/* Micro-Paneles Contextuales según Chip Activo */}
            {isRecurring && (
              <div className="mt-2 p-2 rounded-xl bg-[#141418] border border-white/[0.06] flex items-center gap-1.5 animate-in fade-in">
                <span className="text-[10px] text-zinc-400 font-bold">Frecuencia:</span>
                {[
                  { id: "monthly", label: "Mensual" },
                  { id: "days_15", label: "Quincenal (15/30)" },
                  { id: "weekly", label: "Semanal" },
                  { id: "yearly", label: "Anual" }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setRecurringFreq(f.id as any)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition ${
                      recurringFreq === f.id ? "bg-white text-black border-white" : "bg-[#18181C] text-zinc-400 border-white/[0.04]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            {isInstallments && (
              <div className="mt-2 p-2 rounded-xl bg-[#141418] border border-white/[0.06] flex items-center gap-1.5 animate-in fade-in">
                <span className="text-[10px] text-zinc-400 font-bold">Mensualidades:</span>
                {["3", "6", "9", "12", "18", "24"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setInstallmentsCount(m)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition ${
                      installmentsCount === m ? "bg-purple-500 text-white border-purple-500" : "bg-[#18181C] text-zinc-400 border-white/[0.04]"
                    }`}
                  >
                    {m} MSI
                  </button>
                ))}
              </div>
            )}

            {showTagsPanel && (
              <div className="mt-2 p-2.5 rounded-xl bg-[#141418] border border-white/[0.06] space-y-2 animate-in fade-in">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {["#Deducible", "#Vacaciones", "#Negocio", "#Hogar", "#Mascotas", "#Extra"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (!concept.includes(tag)) setConcept((prev) => `${prev} ${tag}`.trim());
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition ${
                        concept.includes(tag) ? "bg-white text-black border-white" : "bg-[#18181C] text-zinc-400 border-white/[0.04]"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Escribir #Tag personalizado..."
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomTag(e);
                      }
                    }}
                    className="flex-1 px-2.5 py-1 bg-[#18181C] border border-white/[0.06] rounded-lg text-[11px] text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition"
                  >
                    + Tag
                  </button>
                </div>
              </div>
            )}

            {isSplitMode && (
              <div className="mt-2 p-3 rounded-xl bg-[#141418] border border-white/[0.06] space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-zinc-400">Partes del Gasto:</span>
                  <span className={`font-black ${
                    Math.abs(splits.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0) - parsedAmount) < 0.01 ? "text-emerald-400" : "text-amber-400"
                  }`}>
                    ${splits.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0).toFixed(2)} / ${parsedAmount.toFixed(2)}
                  </span>
                </div>
                {splits.map((s, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
                    <input
                      type="number"
                      placeholder="Monto"
                      value={s.amount}
                      onChange={(e) => {
                        const copy = [...splits];
                        copy[idx].amount = e.target.value;
                        setSplits(copy);
                      }}
                      className="col-span-4 px-2 py-1 bg-[#18181C] border border-white/[0.06] rounded-lg text-xs font-bold text-white focus:outline-none"
                    />
                    <select
                      value={s.category_id}
                      onChange={(e) => {
                        const copy = [...splits];
                        copy[idx].category_id = e.target.value;
                        setSplits(copy);
                      }}
                      className="col-span-5 px-1.5 py-1 bg-[#18181C] border border-white/[0.06] rounded-lg text-xs font-bold text-white focus:outline-none"
                    >
                      <option value="">Categoría</option>
                      {localCategories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Detalle"
                      value={s.concept}
                      onChange={(e) => {
                        const copy = [...splits];
                        copy[idx].concept = e.target.value;
                        setSplits(copy);
                      }}
                      className="col-span-3 px-1.5 py-1 bg-[#18181C] border border-white/[0.06] rounded-lg text-xs font-bold text-white focus:outline-none"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setSplits([...splits, { amount: "", concept: "", category_id: "" }])}
                  className="text-[10px] font-bold text-emerald-400 hover:underline block"
                >
                  + Agregar otra parte
                </button>
              </div>
            )}
          </div>

          {/* TECLADO TÁCTIL: Visible en Pantallas Táctiles / Móvil */}
          <div className="md:hidden pt-1">
            <div className="p-2 bg-[#121216] rounded-xl border border-white/[0.06]">
              <div className="grid grid-cols-3 gap-1.5">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "backspace"].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeypadPress(key)}
                    className="h-10 rounded-lg bg-[#18181C] text-white font-black text-sm shadow-sm border border-white/[0.04] active:scale-95 transition flex items-center justify-center"
                  >
                    {key === "backspace" ? <Delete className="w-4 h-4" /> : key}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Indicación para Desktop: Teclado físico compatible */}
          <p className="hidden md:block text-center text-[11px] text-zinc-500">
            💡 Puedes escribir el importe con el teclado de tu computadora y presionar <kbd className="px-1.5 py-0.5 bg-[#18181C] rounded border border-white/10 text-zinc-300 font-mono">Enter</kbd> para confirmar.
          </p>

          {/* Botón de Confirmación Principal */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || success || parsedAmount <= 0}
            className={`w-full py-3 rounded-xl font-black text-xs transition active:scale-98 flex items-center justify-center gap-2 shadow-lg min-h-[44px] ${
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

      {/* Modal Rápida de Categoría */}
      {showInlineCatModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="surface-card rounded-2xl p-5 max-w-sm w-full border border-white/[0.08] shadow-2xl relative animate-slide-up bg-white dark:bg-[#0A0A0C] text-white space-y-3.5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
              <h4 className="text-xs font-black flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                Nueva Categoría Rápida
              </h4>
              <button onClick={() => setShowInlineCatModal(false)} className="p-1 rounded-lg text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFastCategory} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Gimnasio, Cafetería"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#141418] border border-white/[0.08] rounded-xl text-xs font-bold text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1">Color</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCatColor(c)}
                      className={`w-5 h-5 rounded-full ${c} transition ${newCatColor === c ? "ring-2 ring-white scale-110" : "opacity-60"}`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-white text-black font-extrabold text-xs rounded-xl hover:bg-neutral-200 transition"
              >
                Crear y Asignar 🚀
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
