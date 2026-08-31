"use client";

import React, { useState, useEffect } from "react";
import { Zap, X, ArrowRight, ShieldCheck } from "lucide-react";
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
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  // Escuchar cuando el usuario regresa a la app (ej. después de copiar en BBVA o Nu)
  useEffect(() => {
    const checkClipboard = async () => {
      if (typeof window === "undefined" || !navigator.clipboard || !navigator.clipboard.readText) {
        return;
      }

      try {
        const text = await navigator.clipboard.readText();
        if (!text || text.length < 10 || text.length > 500) return;

        // Comprobar si parece una notificación bancaria mexicana
        const isBankText = /bbva|bancomer|nu\b|santander|banorte|citibanamex|mercado\s*pago|rappi|hey\s*banco|compra\s+por|retiro|transferencia|cargo|abono|deposito/i.test(text);
        const hasAmount = /(?:\$|por\s+|monto:\s*|\bmxn\s*)(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/i.test(text);

        if (isBankText && hasAmount) {
          // Extraer monto
          const matchAmount = text.match(/(?:\$|por\s+|monto:\s*|\bmxn\s*)(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/i);
          const amountStr = matchAmount ? matchAmount[1] : null;

          // Extraer comercio
          let merchantStr = "Comercio Detectado";
          const matchComercio = text.match(/(?:en|establecimiento|comercio|en\s*:)\s+([A-Za-z0-9\s\.\*\-]+?)(?=\s+(?:el|por|al|tarjeta|cuenta|\d{2}\/\d{2}|\$|\.|$))/i);
          if (matchComercio) {
            merchantStr = matchComercio[1].trim();
          }

          if (text !== dismissedKey) {
            setDetectedText(text);
            setDetectedAmount(amountStr);
            setDetectedMerchant(merchantStr);
          }
        }
      } catch (e) {
        // Permiso de portapapeles no concedido o usuario no interactuó aún
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
      <div className="fixed bottom-20 left-4 right-4 z-40 animate-slide-up">
        <div className="surface-card rounded-2xl p-3.5 border border-brand-cerulean/50 shadow-2xl bg-[#0F1626] text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-brand-cerulean text-white flex items-center justify-center shrink-0 shadow-md">
              <Zap className="w-4 h-4 text-amber-300 fill-current" />
            </div>
            <div className="min-w-0">
              <h5 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                Transferencia Copiada
                <span className="text-[9px] font-black bg-brand-cerulean/30 text-sky-300 px-1.5 py-0.5 rounded-md">
                  1-Toque
                </span>
              </h5>
              <p className="text-[11px] text-slate-300 truncate mt-0.5">
                ${detectedAmount} en {detectedMerchant}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-brand-cerulean hover:bg-sky-600 text-white text-xs font-black transition active:scale-95 shadow-md flex items-center gap-1"
            >
              Registrar
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setDismissedKey(detectedText);
                setDetectedText(null);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
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
