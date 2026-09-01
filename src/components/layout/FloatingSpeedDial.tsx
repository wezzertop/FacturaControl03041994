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

  return (
    <>
      {/* Backdrop oscuro cuando está abierto */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 md:hidden animate-fade-in"
        />
      )}

      {/* Menú Flotante de Acciones Rápidas (Speed Dial) */}
      <div className="fixed bottom-20 right-4 z-50 md:hidden flex flex-col items-end gap-2">
        {isOpen && (
          <div className="flex flex-col items-end gap-1.5 mb-1.5 animate-slide-up">
            {/* Opción 1: Detectar SMS / Notificación Bancaria */}
            <button
              onClick={openDetector}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#0A0A0C] text-white shadow-xl border border-white/[0.08] active:scale-95 transition group"
            >
              <span className="text-xs font-bold text-slate-200">
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
              <span className="text-xs font-bold text-slate-200">
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
          className={`w-12 h-12 rounded-xl shadow-2xl flex items-center justify-center transition-all duration-300 transform active:scale-90 ${
            isOpen
              ? "bg-white text-black rotate-45"
              : "bg-white text-black hover:scale-105 border border-white/20"
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
        initialType={tactileType}
        wallets={wallets}
        categories={categories}
        onSuccess={onRefresh}
      />

      <SmartTransactionDetectorModal
        isOpen={detectorModalOpen}
        onClose={() => setDetectorModalOpen(false)}
        wallets={wallets}
        categories={categories}
        onTransactionCreated={onRefresh}
      />
    </>
  );
}
