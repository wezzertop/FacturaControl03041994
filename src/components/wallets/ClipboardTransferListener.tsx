"use client";

import React, { useState, useEffect } from "react";
import { Zap, X, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import SmartTransactionDetectorModal from "./SmartTransactionDetectorModal";

interface ClipboardTransferListenerProps {
  wallets: any[];
  categories: any[];
  onTransactionCreated?: () => void;
}

export default function ClipboardTransferListener({
  wallets,
  categories,
  onTransactionCreated,
}: ClipboardTransferListenerProps) {
  const [detectedText, setDetectedText] = useState<string | null>(null);
  const [detectedAmount, setDetectedAmount] = useState<string | null>(null);
  const [detectedMerchant, setDetectedMerchant] = useState<string | null>(null);
  const [isApplePaySource, setIsApplePaySource] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  // 1. Escuchar Deep Link o URL params al abrir desde Atajos de iOS (Apple Pay Automation)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const isPay = urlParams.get("applePay") === "true" || urlParams.get("pay") === "true" || urlParams.get("wallet") === "true";
      const amount = urlParams.get("amount") || urlParams.get("monto");
      const merchant = urlParams.get("merchant") || urlParams.get("comercio") || "Apple Pay";

      if (isPay && amount) {
        setDetectedText(`Apple Pay: $${amount} en ${merchant}`);
        setDetectedAmount(amount);
        setDetectedMerchant(merchant);
        setIsApplePaySource(true);
        setIsModalOpen(true);
        if (navigator.vibrate) navigator.vibrate([40, 60, 40]);

        // Limpiar URL sin recargar
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    } catch (err) {
      console.error("[ClipboardListener] Error parsing URL query:", err);
    }
  }, []);

  // 2. Escuchar cuando el usuario regresa a la app (ej. después de pagar con Apple Pay o copiar en BBVA/Nu)
  useEffect(() => {
    const checkClipboard = async () => {
      if (typeof window === "undefined" || !navigator.clipboard || !navigator.clipboard.readText) {
        return;
      }

      try {
        const text = await navigator.clipboard.readText();
        if (!text || text.length < 5 || text.length > 500) return;

        // Comprobar si parece Apple Pay, Google Wallet o banco mexicano
        const isApplePayOrBank = /apple\s*pay|google\s*pay|wallet|apple\s*wallet|bbva|bancomer|nu\b|santander|banorte|citibanamex|mercado\s*pago|rappi|hey\s*banco|compra\s+por|retiro|transferencia|cargo|abono|deposito|transacci[oó]n|pago\s+con\s+tarjeta|aprobada/i.test(text);
        const hasAmount = /(?:\$|por\s+|monto:\s*|\bmxn\s*)(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/i.test(text);

        if (isApplePayOrBank && hasAmount) {
          // Extraer monto
          const matchAmount = text.match(/(?:\$|por\s+|monto:\s*|\bmxn\s*)(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/i);
          const amountStr = matchAmount ? matchAmount[1] : null;

          // Extraer comercio
          let merchantStr = /apple\s*pay/i.test(text) ? "Apple Pay Comercio" : "Comercio Detectado";
          const matchComercio = text.match(/(?:en|establecimiento|comercio|en\s*:)\s+([A-Za-z0-9\s\.\*\-]+?)(?=\s+(?:el|por|al|tarjeta|cuenta|\d{2}\/\d{2}|\$|\.|$))/i);
          if (matchComercio) {
            merchantStr = matchComercio[1].trim();
          }

          if (text !== dismissedKey) {
            setDetectedText(text);
            setDetectedAmount(amountStr);
            setDetectedMerchant(merchantStr);
            setIsApplePaySource(/apple\s*pay/i.test(text));
            if (navigator.vibrate) navigator.vibrate(25);
          }
        }
      } catch (e) {
        // Permiso no concedido o no interactuó aún
      }
    };

    window.addEventListener("focus", checkClipboard);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        checkClipboard();
      }
    });

    return () => {
      window.removeEventListener("focus", checkClipboard);
    };
  }, [dismissedKey]);

  if (!detectedText || !detectedAmount) return null;

  return (
    <>
      <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] left-4 right-4 z-40 animate-slide-up">
        <div className="surface-card rounded-2xl p-3.5 border border-white/20 shadow-2xl bg-[#0A0A0C] text-white flex items-center justify-between gap-3 backdrop-blur-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
              isApplePaySource ? "bg-white text-black font-black text-xs" : "bg-white/10 text-white"
            }`}>
              {isApplePaySource ? " Pay" : <Zap className="w-4 h-4 text-amber-400 fill-current" />}
            </div>
            <div className="min-w-0">
              <h5 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                {isApplePaySource ? "Pago Apple Pay Detectado" : "Transferencia Copiada"}
                <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md">
                  1-Toque
                </span>
              </h5>
              <p className="text-[11px] text-zinc-300 truncate mt-0.5 font-medium">
                ${detectedAmount} en {detectedMerchant}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-black transition active:scale-95 shadow-md flex items-center gap-1 min-h-[36px]"
            >
              Registrar
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setDismissedKey(detectedText);
                setDetectedText(null);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              aria-label="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <SmartTransactionDetectorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setDismissedKey(detectedText);
          setDetectedText(null);
        }}
        wallets={wallets}
        categories={categories}
        onTransactionCreated={() => {
          setIsModalOpen(false);
          setDismissedKey(detectedText);
          setDetectedText(null);
          if (onTransactionCreated) onTransactionCreated();
        }}
      />
    </>
  );
}

