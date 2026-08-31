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
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 md:hidden animate-fade-in"
        />
      )}

      {/* Menú Flotante de Acciones Rápidas (Speed Dial) */}
      <div className="fixed bottom-24 right-4 z-50 md:hidden flex flex-col items-end gap-2.5">
        {isOpen && (
          <div className="flex flex-col items-end gap-2 mb-2 animate-slide-up">
            {/* Opción 1: Detectar SMS / Notificación Bancaria */}
            <button
              onClick={openDetector}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900 text-white shadow-xl border border-brand-cerulean/40 active:scale-95 transition group"
            >
              <span className="text-xs font-black text-slate-200">
                Detectar SMS / Banco ⚡
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-cerulean to-blue-500 text-white flex items-center justify-center shadow-md">
                <Clipboard className="w-4 h-4" />
              </div>
            </button>

            {/* Opción 2: Escanear Ticket con Cámara */}
            <Link
              href="/wallets?triggerOcr=true"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900 text-white shadow-xl border border-white/10 active:scale-95 transition group"
            >
              <span className="text-xs font-black text-slate-200">
                Escanear Ticket OCR 📸
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                <Camera className="w-4 h-4" />
              </div>
            </Link>

            {/* Opción 3: Registrar Ingreso */}
            <button
              onClick={() => openTactile("income")}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900 text-white shadow-xl border border-emerald-500/30 active:scale-95 transition group"
            >
              <span className="text-xs font-black text-emerald-400">
                Nuevo Ingreso 🟢
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </button>

            {/* Opción 4: Registrar Gasto */}
            <button
              onClick={() => openTactile("expense")}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900 text-white shadow-xl border border-rose-500/30 active:scale-95 transition group"
            >
              <span className="text-xs font-black text-rose-400">
                Nuevo Gasto 🔴
              </span>
              <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/30">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}

        {/* Botón Principal Flotante (FAB) */}
        <button
          onClick={toggleOpen}
          className={`w-14 h-14 rounded-3xl shadow-2xl flex items-center justify-center transition-all duration-300 transform active:scale-90 ${
            isOpen
              ? "bg-rose-600 text-white rotate-45 shadow-rose-600/40"
              : "bg-gradient-to-tr from-brand-cerulean to-blue-600 hover:from-blue-600 hover:to-brand-cerulean text-white shadow-brand-cerulean/40 hover:scale-105"
          }`}
          aria-label={isOpen ? "Cerrar accesos rápidos" : "Abrir accesos rápidos"}
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
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
