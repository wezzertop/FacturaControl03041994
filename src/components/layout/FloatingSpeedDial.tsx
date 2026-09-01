"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Plus, 
  X, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clipboard, 
  Camera, 
  FileCode2, 
  Scale,
  Zap,
  Sparkles
} from "lucide-react";
import TactileTransactionModal from "@/components/transactions/TactileTransactionModal";
import SmartTransactionDetectorModal from "@/components/wallets/SmartTransactionDetectorModal";
import ApplePaySetupModal from "@/components/wallets/ApplePaySetupModal";

interface FloatingSpeedDialProps {
  wallets?: any[];
  categories?: any[];
  onRefresh?: () => void;
}

export default function FloatingSpeedDial({
  wallets = [],
  categories = [],
  onRefresh,
}: FloatingSpeedDialProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tactileModalOpen, setTactileModalOpen] = useState(false);
  const [tactileType, setTactileType] = useState<"expense" | "income">("expense");
  const [detectorModalOpen, setDetectorModalOpen] = useState(false);
  const [applePayModalOpen, setApplePayModalOpen] = useState(false);

  const toggleOpen = () => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    setIsOpen(!isOpen);
  };

  const openTactile = (type: "expense" | "income") => {
    setIsOpen(false);
    setTactileType(type);
    setTactileModalOpen(true);
  };

  const openDetector = () => {
    setIsOpen(false);
    setDetectorModalOpen(true);
  };

  const openApplePay = () => {
    setIsOpen(false);
    setApplePayModalOpen(true);
  };

  return (
    <>
      {/* Backdrop oscuro cuando está abierto */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 md:hidden animate-fade-in"
        />
      )}

      {/* Menú Flotante de Acciones Rápidas (Speed Dial) posicionado encima del Dock inferior en iOS y Android */}
      <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-4 z-50 md:hidden flex flex-col items-end gap-2">
        {isOpen && (
          <div className="flex flex-col items-end gap-1.5 mb-1.5 animate-slide-up">
            {/* Opción 0: Apple Pay / Google Wallet Instantáneo */}
            <button
              onClick={openApplePay}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#0A0A0C] text-white shadow-2xl border border-white/20 active:scale-95 transition group"
            >
              <span className="text-xs font-bold text-white flex items-center gap-1">
                 Apple Pay / Wallet
                <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 px-1 rounded">Auto</span>
              </span>
              <div className="w-7 h-7 rounded-lg bg-white text-black font-black text-[10px] flex items-center justify-center shadow-md">
                Pay
              </div>
            </button>

            {/* Opción 1: Detectar SMS / Notificación Bancaria */}
            <button
              onClick={openDetector}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#0A0A0C] text-white shadow-xl border border-white/[0.08] active:scale-95 transition group"
            >
              <span className="text-xs font-bold text-zinc-200">
                Detectar SMS / Banco ⚡
              </span>
              <div className="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center shadow-md">
                <Clipboard className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Opción 2: Escanear Ticket con Cámara */}
            <Link
              href="/wallets?triggerOcr=true"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#0A0A0C] text-white shadow-xl border border-white/[0.08] active:scale-95 transition group"
            >
              <span className="text-xs font-bold text-zinc-200">
                Escanear Ticket OCR 📸
              </span>
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shadow-md">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </Link>

            {/* Opción 3: Registrar Ingreso */}
            <button
              onClick={() => openTactile("income")}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#0A0A0C] text-white shadow-xl border border-emerald-500/30 active:scale-95 transition group"
            >
              <span className="text-xs font-bold text-emerald-400">
                Nuevo Ingreso 🟢
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Opción 4: Registrar Gasto */}
            <button
              onClick={() => openTactile("expense")}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#0A0A0C] text-white shadow-xl border border-rose-500/30 active:scale-95 transition group"
            >
              <span className="text-xs font-bold text-rose-400">
                Nuevo Gasto 🔴
              </span>
              <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/30">
                <ArrowDownLeft className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>
        )}

        {/* Botón Principal Flotante (FAB) */}
        <button
          onClick={toggleOpen}
          className={`w-13 h-13 p-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.8)] flex items-center justify-center transition-all duration-300 transform active:scale-90 border ${
            isOpen
              ? "bg-white text-black rotate-45 border-white"
              : "bg-white text-black hover:scale-105 border-white/40"
          }`}
          aria-label={isOpen ? "Cerrar accesos rápidos" : "Abrir accesos rápidos"}
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Modales Vinculados */}
      <TactileTransactionModal
        isOpen={tactileModalOpen}
        onClose={() => setTactileModalOpen(false)}
        wallets={wallets}
        categories={categories}
        initialType={tactileType}
        onSuccess={() => {
          setTactileModalOpen(false);
          if (onRefresh) onRefresh();
        }}
      />

      <SmartTransactionDetectorModal
        isOpen={detectorModalOpen}
        onClose={() => setDetectorModalOpen(false)}
        wallets={wallets}
        categories={categories}
        onTransactionCreated={() => {
          setDetectorModalOpen(false);
          if (onRefresh) onRefresh();
        }}
      />

      <ApplePaySetupModal
        isOpen={applePayModalOpen}
        onClose={() => setApplePayModalOpen(false)}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </>
  );
}
