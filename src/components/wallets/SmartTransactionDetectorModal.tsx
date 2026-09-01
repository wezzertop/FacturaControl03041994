"use client";

import React, { useState, useTransition } from "react";
import { 
  Sparkles, 
  Clipboard, 
  Check, 
  ArrowRight, 
  X, 
  CreditCard, 
  Building2, 
  Tag, 
  Calendar,
  AlertCircle,
  Zap
} from "lucide-react";
import { createTransaction } from "@/app/actions/wallets";
import { saveNotification } from "@/lib/notifications";
import CurrencyInput from "@/components/ui/CurrencyInput";

interface SmartTransactionDetectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: any[];
  categories: any[];
  onTransactionCreated?: () => void;
}

export default function SmartTransactionDetectorModal({
  isOpen,
  onClose,
  wallets,
  categories,
  onTransactionCreated,
}: SmartTransactionDetectorModalProps) {
  const [rawText, setRawText] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [concept, setConcept] = useState("");
  const [selectedWalletId, setSelectedWalletId] = useState<string>(wallets[0]?.id || "");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [detectedBank, setDetectedBank] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // Parser inteligente para notificaciones bancarias de México
  const parseBankNotification = (text: string) => {
    setRawText(text);
    if (!text.trim()) return;

    let foundAmount = 0;
    let foundConcept = "";
    let foundBank = "";
    let foundCardDigits = "";

    const lower = text.toLowerCase();

    // 1. Detectar Banco
    if (lower.includes("bbva")) foundBank = "BBVA";
    else if (lower.includes("nu ") || lower.includes("nubank") || lower.includes("nu méxico")) foundBank = "Nu";
    else if (lower.includes("mercado pago") || lower.includes("mercadopago")) foundBank = "Mercado Pago";
    else if (lower.includes("santander")) foundBank = "Santander";
    else if (lower.includes("banorte")) foundBank = "Banorte";
    else if (lower.includes("citibanamex") || lower.includes("banamex")) foundBank = "Citibanamex";
    else if (lower.includes("hey banco") || lower.includes("heybanco")) foundBank = "Hey Banco";
    else if (lower.includes("rappi")) foundBank = "RappiCard";

    // 2. Extraer Monto con regex ($120.00, $ 1,500.50, por 450.00 MXN)
    const amountRegex = /(?:\$|por\s+|monto:\s*|\bmxn\s*)(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/i;
    const amountMatch = text.match(amountRegex);
    if (amountMatch && amountMatch[1]) {
      const cleanNum = amountMatch[1].replace(/,/g, "");
      foundAmount = parseFloat(cleanNum) || 0;
    }

    // 3. Extraer Comercio (en OXXO, en STARBUCKS, en UBER, compra en AMAZON)
    const merchantRegex = /(?:en|comercio:|establecimiento:)\s+([A-Za-z0-9\s\.\*\-]+?)(?:\s+con|\s+por|\s+el|\s+la|\.|\,|$)/i;
    const merchantMatch = text.match(merchantRegex);
    if (merchantMatch && merchantMatch[1]) {
      foundConcept = merchantMatch[1].trim().toUpperCase();
    } else {
      // Intento secundario
      if (lower.includes("oxxo")) foundConcept = "OXXO";
      else if (lower.includes("uber")) foundConcept = "UBER";
      else if (lower.includes("didi")) foundConcept = "DIDI";
      else if (lower.includes("starbucks")) foundConcept = "STARBUCKS";
      else if (lower.includes("amazon")) foundConcept = "AMAZON";
      else if (lower.includes("walmart")) foundConcept = "WALMART";
      else if (lower.includes("mercado libre")) foundConcept = "MERCADO LIBRE";
      else if (lower.includes("gasolina") || lower.includes("pemex") || lower.includes("shell")) foundConcept = "GASOLINERA";
      else foundConcept = "COMPRA CON TARJETA";
    }

    // 4. Extraer terminación de tarjeta (*1234, tarjeta 5678)
    const cardRegex = /(?:\*|terminaci[oó]n\s+|tarjeta\s+)(\d{4})/i;
    const cardMatch = text.match(cardRegex);
    if (cardMatch && cardMatch[1]) {
      foundCardDigits = cardMatch[1];
      // Intentar auto-seleccionar la cartera que coincida en nombre o dígitos
      const matchedWallet = wallets.find((w) => 
        w.name.includes(foundCardDigits) || 
        (foundBank && w.name.toLowerCase().includes(foundBank.toLowerCase()))
      );
      if (matchedWallet) {
        setSelectedWalletId(matchedWallet.id);
      }
    } else if (foundBank) {
      const matchedWallet = wallets.find((w) => 
        w.name.toLowerCase().includes(foundBank.toLowerCase())
      );
      if (matchedWallet) {
        setSelectedWalletId(matchedWallet.id);
      }
    }

    // 5. Sugerir categoría
    const cLower = foundConcept.toLowerCase();
    let suggestedCat = "";
    if (cLower.includes("oxxo") || cLower.includes("walmart") || cLower.includes("super") || cLower.includes("soriana") || cLower.includes("costco")) {
      suggestedCat = categories.find((c) => c.name.toLowerCase().includes("super") || c.name.toLowerCase().includes("despensa"))?.id || "";
    } else if (cLower.includes("starbucks") || cLower.includes("restaurante") || cLower.includes("mcdonalds") || cLower.includes("café")) {
      suggestedCat = categories.find((c) => c.name.toLowerCase().includes("restaurante") || c.name.toLowerCase().includes("comida"))?.id || "";
    } else if (cLower.includes("uber") || cLower.includes("didi") || cLower.includes("gasolina") || cLower.includes("pemex")) {
      suggestedCat = categories.find((c) => c.name.toLowerCase().includes("transporte") || c.name.toLowerCase().includes("gasolina"))?.id || "";
    }

    if (foundAmount > 0) setAmount(foundAmount);
    if (foundConcept) setConcept(foundConcept);
    if (foundBank) setDetectedBank(foundBank);
    if (suggestedCat) setSelectedCategoryId(suggestedCat);
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard) {
        const clipText = await navigator.clipboard.readText();
        if (clipText) {
          parseBankNotification(clipText);
        }
      }
    } catch {
      setError("No se pudo leer el portapapeles. Pega el texto manualmente abajo.");
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setError("El monto debe ser mayor a $0.00");
      return;
    }
    if (!selectedWalletId) {
      setError("Por favor selecciona una cartera.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await createTransaction({
        wallet_id: selectedWalletId,
        type: "expense",
        amount,
        concept: concept || "Compra Detectada",
        category_id: selectedCategoryId || null,
        date: new Date(date).toISOString(),
      });

      if (res.success) {
        if (typeof window !== "undefined" && navigator.vibrate) {
          navigator.vibrate([10, 50, 10]);
        }

        saveNotification({
          title: "💳 Gasto Registrado con Éxito",
          body: `Se descontaron $${amount.toFixed(2)} por "${concept}" en tu cartera.`,
          type: "transaction",
        });

        setSuccess(true);
        if (onTransactionCreated) onTransactionCreated();
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1200);
      } else {
        setError(res.error || "No se pudo guardar la transacción.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="surface-card rounded-2xl p-6 max-w-lg w-full border border-slate-200 dark:border-white/[0.08] shadow-2xl relative animate-slide-up max-h-[90vh] overflow-y-auto custom-scrollbar bg-white dark:bg-[#000000]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Detector Inteligente de Compras
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400">
              Pega el SMS o notificación de tu banco (BBVA, Nu, Santander, etc.)
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 text-xs font-bold rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 text-xs font-bold rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            ¡Gasto registrado automáticamente!
          </div>
        )}

        {/* Botón de Pegar desde Portapapeles */}
        <div className="space-y-2 mb-4">
          <button
            type="button"
            onClick={handlePasteClipboard}
            className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 min-h-[40px]"
          >
            <Clipboard className="w-4 h-4" />
            Pegar Notificación del Portapapeles (1 Toque)
          </button>

          <textarea
            rows={2}
            value={rawText}
            onChange={(e) => parseBankNotification(e.target.value)}
            placeholder="Ejemplo: BBVA: Compra por $420.00 en STARBUCKS con tarjeta *1234 el 30/Ago/2026."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-zinc-500 focus:ring-1 focus:ring-white/40 focus:outline-none"
          />
        </div>

        {detectedBank && (
          <div className="mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-white text-[11px] font-black border border-white/20">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Banco Detectado: {detectedBank}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3.5">
          {/* Monto Extraído */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
              Monto del Gasto (MXN)
            </label>
            <CurrencyInput
              value={amount}
              onChange={(val) => setAmount(val)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-xl text-base font-black text-slate-900 dark:text-white focus:ring-1 focus:ring-white/40 focus:outline-none"
            />
          </div>

          {/* Comercio / Concepto */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
              Comercio o Concepto
            </label>
            <input
              type="text"
              required
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ej. STARBUCKS, OXXO, UBER"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-white/40 focus:outline-none"
            />
          </div>

          {/* Cartera de Pago */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
              Cartera o Tarjeta
            </label>
            <select
              value={selectedWalletId}
              onChange={(e) => setSelectedWalletId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-white/40 focus:outline-none cursor-pointer"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id} className="bg-neutral-900 text-white">
                  {w.name} ({w.type === "credit" ? "Tarjeta de Crédito" : "Débito / Efectivo"})
                </option>
              ))}
            </select>
          </div>

          {/* Categoría */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
              Categoría
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-white/40 focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-neutral-900 text-white">
                Sin categoría (General)
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-neutral-900 text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isPending || success}
            className="w-full py-3 bg-white hover:bg-neutral-200 disabled:opacity-50 text-black font-extrabold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 min-h-[40px]"
          >
            {isPending ? "Guardando..." : "Confirmar y Registrar Movimiento ⚡"}
          </button>
        </form>
      </div>
    </div>
  );
}
