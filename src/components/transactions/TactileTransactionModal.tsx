"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
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
  Trash2,
  Scissors,
  Camera,
  Image as ImageIcon,
  Plus,
  Sparkles,
  PlusCircle,
  Clock
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
  transaction?: any | null; // For editing existing transaction
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

  // Evidencia / Voucher
  const [voucherFile, setVoucherFile] = useState<File | null>(initialVoucherFile);
  const [voucherPreview, setVoucherPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recurrencia
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringFreq, setRecurringFreq] = useState<"monthly" | "days_15" | "days_14" | "weekly" | "yearly">("monthly");

  // Meses sin Intereses (MSI)
  const [isInstallments, setIsInstallments] = useState<boolean>(false);
  const [installmentsCount, setInstallmentsCount] = useState<string>("12");

  // Tags personalizados
  const [customTagInput, setCustomTagInput] = useState<string>("");

  // Creación rápida de categoría en línea
  const [showInlineCatModal, setShowInlineCatModal] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>("");
  const [newCatColor, setNewCatColor] = useState<string>("bg-emerald-500");
  const [localCategories, setLocalCategories] = useState<any[]>(categories);

  // Estados de División de Gasto (Split)
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
      const url = URL.createObjectURL(initialVoucherFile);
      setVoucherPreview(url);
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
    } else {
      setType(initialType);
    }
  }, [transaction, initialType, wallets]);

  if (!isOpen) return null;

  const currentWallet = wallets.find((w) => w.id === selectedWalletId);
  const isCreditCard = currentWallet?.type === "credit";

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVoucherFile(file);
      const url = URL.createObjectURL(file);
      setVoucherPreview(url);
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
      // 1. Si es modo transferencia
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

      // 2. Si está en modo División de Gasto (Split)
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
          }, 800);
        } else {
          setError(res.error || "No se pudo registrar la división.");
        }
        return;
      }

      // 3. Si es edición de transacción existente
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

      // 4. Creación de nueva transacción
      let voucherBase64: string | null = null;
      let voucherName: string | null = null;

      if (voucherFile) {
        try {
          voucherBase64 = await fileToBase64(voucherFile);
          voucherName = voucherFile.name;
        } catch (err) {
          console.error("Error al procesar archivo:", err);
        }
      }

      let finalConcept = concept.trim() || (type === "expense" ? "Gasto Registrado" : "Ingreso Registrado");
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
        // Si activó pago recurrente, registrar la regla en background
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
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
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

            {/* Etiquetas Rápidas y Crear Tags al Vuelo */}
            <div className="pt-1.5 space-y-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-zinc-500 font-bold">#Tags:</span>
                {["#Deducible", "#Vacaciones", "#Negocio", "#Hogar", "#Mascotas", "#Extra"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (!concept.includes(tag)) {
                        setConcept((prev) => `${prev} ${tag}`.trim());
                      }
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition ${
                      concept.includes(tag)
                        ? "bg-white/20 text-white border-white/40 font-extrabold"
                        : "bg-slate-100 dark:bg-[#141418] text-zinc-400 border-white/[0.04] hover:text-white"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Agregar Tag Libre */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Crear nuevo #Tag (ej. #Proyecto)"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomTag(e);
                    }
                  }}
                  className="flex-1 px-2.5 py-1 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[11px] text-white focus:outline-none"
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
          </div>

          {/* Toggle Reembolso / Devolución */}
          {type === "expense" && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.06]">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">¿Es una Devolución / Reembolso?</span>
                <span className="text-[10px] text-zinc-500">Resta el gasto de tu categoría sin alterar ingresos fiscales</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (concept.includes("[Reembolso]")) {
                    setConcept(concept.replace("[Reembolso] ", "").replace("[Reembolso]", "").trim());
                  } else {
                    setConcept(`[Reembolso] ${concept}`.trim());
                  }
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                  concept.includes("[Reembolso]")
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-extrabold"
                    : "bg-slate-100 dark:bg-[#141418] text-zinc-400 border-white/[0.06]"
                }`}
              >
                {concept.includes("[Reembolso]") ? "✓ Reembolso" : "Marcar"}
              </button>
            </div>
          )}

          {/* Selector de Carteras y Categorías */}
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
            <div className="space-y-3">
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

                {!isSplitMode && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        Categoría
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowInlineCatModal(true)}
                        className="text-[10px] font-bold text-emerald-400 hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Nueva
                      </button>
                    </div>
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-white/40 focus:outline-none cursor-pointer"
                    >
                      <option value="" className="bg-neutral-900 text-white">
                        Sin Categoría
                      </option>
                      {localCategories.map((c) => (
                        <option key={c.id} value={c.id} className="bg-neutral-900 text-white">
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Botón Split Transaction */}
              {type === "expense" && !transaction && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setIsSplitMode(!isSplitMode)}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition ${
                      isSplitMode
                        ? "bg-white text-black border-white shadow-sm"
                        : "bg-slate-100 dark:bg-[#141418] text-zinc-300 border-slate-200 dark:border-white/[0.06] hover:text-white"
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    {isSplitMode ? "Modo División Activo (Split)" : "Dividir en Múltiples Categorías (Split)"}
                  </button>

                  {isSplitMode && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-zinc-400">Desglose de Partes:</span>
                        <span className={`font-black ${
                          Math.abs(splits.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0) - parsedAmount) < 0.01
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }`}>
                          Suma: ${splits.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0).toFixed(2)} / ${parsedAmount.toFixed(2)}
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
                            className="col-span-4 px-2 py-1.5 bg-white dark:bg-[#141418] border border-white/[0.06] rounded-lg text-xs font-bold text-white focus:outline-none"
                          />
                          <select
                            value={s.category_id}
                            onChange={(e) => {
                              const copy = [...splits];
                              copy[idx].category_id = e.target.value;
                              setSplits(copy);
                            }}
                            className="col-span-5 px-1.5 py-1.5 bg-white dark:bg-[#141418] border border-white/[0.06] rounded-lg text-xs font-bold text-white focus:outline-none"
                          >
                            <option value="">Categoría</option>
                            {localCategories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
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
                            className="col-span-3 px-1.5 py-1.5 bg-white dark:bg-[#141418] border border-white/[0.06] rounded-lg text-xs font-bold text-white focus:outline-none"
                          />
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => setSplits([...splits, { amount: "", concept: "", category_id: "" }])}
                        className="text-[11px] font-bold text-emerald-400 hover:underline pt-1 block"
                      >
                        + Agregar otra parte
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Opciones Avanzadas: Recurrente, Comprobante y MSI */}
          <div className="space-y-2 pt-1 border-t border-slate-200/60 dark:border-white/[0.06]">
            
            {/* Activar Pago Recurrente */}
            {!transaction && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Hacer recurrente este movimiento</span>
                      <span className="text-[10px] text-zinc-400">Programa cobros automáticos en suscripciones o nóminas</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>

                {isRecurring && (
                  <div className="pt-2 border-t border-white/[0.04] grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRecurringFreq("monthly")}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                        recurringFreq === "monthly" ? "bg-white text-black border-white" : "bg-[#141418] text-zinc-400 border-white/[0.06]"
                      }`}
                    >
                      Mensual
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecurringFreq("days_15")}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                        recurringFreq === "days_15" ? "bg-white text-black border-white" : "bg-[#141418] text-zinc-400 border-white/[0.06]"
                      }`}
                    >
                      Quincenal (15/30)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecurringFreq("weekly")}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                        recurringFreq === "weekly" ? "bg-white text-black border-white" : "bg-[#141418] text-zinc-400 border-white/[0.06]"
                      }`}
                    >
                      Semanal
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecurringFreq("yearly")}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                        recurringFreq === "yearly" ? "bg-white text-black border-white" : "bg-[#141418] text-zinc-400 border-white/[0.06]"
                      }`}
                    >
                      Anual
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Compras a Meses Sin Intereses (MSI) */}
            {isCreditCard && type === "expense" && !transaction && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-purple-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">¿Compra a Meses sin Intereses (MSI)?</span>
                      <span className="text-[10px] text-zinc-400">Difiere el pago en tu tarjeta de crédito</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isInstallments}
                    onChange={(e) => setIsInstallments(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-500 focus:ring-purple-500 cursor-pointer"
                  />
                </div>

                {isInstallments && (
                  <div className="pt-2 border-t border-white/[0.04]">
                    <select
                      value={installmentsCount}
                      onChange={(e) => setInstallmentsCount(e.target.value)}
                      className="w-full px-3 py-2 bg-[#141418] border border-white/[0.06] rounded-lg text-xs font-bold text-white focus:outline-none"
                    >
                      <option value="3">3 meses sin intereses</option>
                      <option value="6">6 meses sin intereses</option>
                      <option value="9">9 meses sin intereses</option>
                      <option value="12">12 meses sin intereses</option>
                      <option value="18">18 meses sin intereses</option>
                      <option value="24">24 meses sin intereses</option>
                      <option value="36">36 meses sin intereses</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Adjuntar Evidencia / Comprobante */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Camera className="w-4 h-4 text-blue-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">
                    {voucherFile ? voucherFile.name : "Adjuntar Comprobante o Ticket"}
                  </span>
                  <span className="text-[10px] text-zinc-400 block">
                    {voucherFile ? "Foto lista para adjuntar" : "Guarda evidencia fotográfica de la compra"}
                  </span>
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {voucherFile ? (
                <button
                  type="button"
                  onClick={() => {
                    setVoucherFile(null);
                    setVoucherPreview(null);
                  }}
                  className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                  title="Quitar comprobante"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
                >
                  <Camera className="w-3.5 h-3.5" /> Subir
                </button>
              )}
            </div>

          </div>

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

      {/* Modal de Creación Rápida de Categoría */}
      {showInlineCatModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="surface-card rounded-2xl p-5 max-w-sm w-full border border-white/[0.08] shadow-2xl relative animate-slide-up bg-white dark:bg-[#000000] text-slate-900 dark:text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h4 className="text-sm font-black flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                Nueva Categoría Rápida
              </h4>
              <button
                onClick={() => setShowInlineCatModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFastCategory} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Nombre de la Categoría</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Gimnasio, Mascotas, Cafetería"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Color de Etiqueta</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCatColor(c)}
                      className={`w-6 h-6 rounded-full ${c} transition ${newCatColor === c ? "ring-2 ring-white scale-110" : "opacity-70"}`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-white text-black font-extrabold text-xs rounded-xl hover:bg-neutral-200 transition"
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
