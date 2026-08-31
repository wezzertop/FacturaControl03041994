"use client";

import React, { useState } from "react";
import { Coffee, Heart, X, Copy, Check, ExternalLink } from "lucide-react";

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DonationModal({ isOpen, onClose }: DonationModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="surface-card rounded-2xl p-6 sm:p-7 max-w-md w-full border border-slate-200 dark:border-white/10 shadow-2xl relative animate-slide-up bg-white dark:bg-[#080C14]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 bg-amber-500/15 text-amber-500 rounded-xl flex items-center justify-center mx-auto mb-3.5 border border-amber-500/30">
          <Coffee className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-black text-slate-900 dark:text-white text-center tracking-tight">
          ¡Invítanos un Café! ☕
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 text-center mt-1 leading-relaxed font-medium">
          FacturaControl es un software libre y gratuito para el ciudadano mexicano. Puedes apoyar su desarrollo con una donación voluntaria.
        </p>

        <div className="space-y-3 my-5">
          {/* Opción 1: Buy Me a Coffee / Mercado Pago */}
          <a
            href="https://buymeacoffee.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full p-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-between shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Coffee className="w-4 h-4" /> Invitar un café en Buy Me a Coffee
            </span>
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Opción 2: Transferencia SPEI (México) */}
          <div className="p-3.5 bg-slate-50 dark:bg-[#0F1626] border border-slate-200/80 dark:border-white/10 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Transferencia SPEI (México)</span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Sin Comisiones</span>
            </div>
            <div className="flex items-center justify-between bg-white dark:bg-[#151E32] p-2.5 rounded-lg border border-slate-200/60 dark:border-white/5">
              <code className="text-xs font-mono font-bold text-slate-900 dark:text-white">646180123456789012</code>
              <button
                onClick={() => handleCopy("646180123456789012", "clabe")}
                className="p-1 text-slate-500 hover:text-brand-cerulean transition"
                title="Copiar CLABE"
              >
                {copiedField === "clabe" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="text-center pt-1 border-t border-slate-200/80 dark:border-white/10">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
            Hecho con <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" /> por y para México
          </p>
        </div>
      </div>
    </div>
  );
}
