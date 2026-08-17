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
    <div className="fixed inset-0 z-[90] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="surface-card rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-700/80 shadow-2xl relative animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 bg-amber-500/15 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
          <Coffee className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-black text-white text-center tracking-tight">
          ¡Invítanos un Café! ☕
        </h3>
        <p className="text-xs text-slate-400 text-center mt-1.5 leading-relaxed font-medium">
          FacturaControl es un software **100% gratuito, libre y Open-Source** para el ciudadano mexicano. Si este sistema te ayuda a ahorrar tiempo y dinero, puedes apoyar su desarrollo continuo con una donación voluntaria.
        </p>

        <div className="space-y-3 my-6">
          {/* Opción 1: Buy Me a Coffee / Mercado Pago */}
          <a
            href="https://buymeacoffee.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full p-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs rounded-2xl transition flex items-center justify-between shadow-md"
          >
            <span className="flex items-center gap-2">
              <Coffee className="w-4 h-4" /> Invitar un café en Buy Me a Coffee
            </span>
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Opción 2: Transferencia SPEI (México) */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Transferencia SPEI (México)</span>
              <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full">Sin comisiones</span>
            </div>
            
            <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-semibold">CLABE Interbancaria (STP / Mercado Pago)</p>
                <p className="font-mono text-white font-bold tracking-wider truncate">646180110400000000</p>
              </div>
              <button
                onClick={() => handleCopy("646180110400000000", "clabe")}
                className="p-2 text-brand-cerulean hover:bg-brand-cerulean/10 rounded-lg transition"
                title="Copiar CLABE"
              >
                {copiedField === "clabe" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="text-center pt-2 border-t border-slate-800">
          <p className="text-[11px] text-slate-400 font-semibold flex items-center justify-center gap-1">
            Hecho con <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> para todo México
          </p>
        </div>
      </div>
    </div>
  );
}
