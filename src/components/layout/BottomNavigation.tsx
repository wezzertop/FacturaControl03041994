"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Camera,
  FileText,
  Landmark,
  LayoutDashboard,
  PieChart,
  Plus,
  PlusCircle,
  Settings,
  UploadCloud,
  Wallet,
  X,
} from "lucide-react";

const navItems = [
  { name: "Inicio", href: "/", icon: LayoutDashboard },
  { name: "Historial", href: "/invoices", icon: FileText },
  { name: "Análisis", href: "/analytics", icon: PieChart },
  { name: "Ajustes", href: "/settings", icon: Settings },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  if (isAuthPage) return null;

  const handleOcrClick = (e: React.MouseEvent) => {
    setIsMenuOpen(false);
    if (pathname === "/wallets") {
      e.preventDefault();
      document.getElementById("ocr-file-input")?.click();
    }
  };

  const handleTxClick = (e: React.MouseEvent) => {
    setIsMenuOpen(false);
    if (pathname === "/wallets") {
      e.preventDefault();
      document.getElementById("trigger-tx-modal-btn")?.click();
    }
  };

  return (
    <>
      {isMenuOpen ? (
        <div
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      ) : null}

      <div
        className={`fixed inset-x-3 bottom-[82px] z-40 transition duration-300 md:hidden ${
          isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0 pointer-events-none"
        }`}
      >
        <div className="surface-card rounded-lg p-2">
          <div className="mb-1 flex items-center justify-between border-b border-slate-200/80 px-3 py-2 dark:border-white/10">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Acciones rápidas
            </span>
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white"
              title="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <Link href="/upload" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-slate-100 dark:hover:bg-white/10">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-cerulean/10 text-brand-cerulean">
              <UploadCloud className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-950 dark:text-white">Cargar XML</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Procesa facturas CFDI del SAT</span>
            </span>
          </Link>

          <Link href="/wallets?triggerOcr=true" onClick={handleOcrClick} className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-slate-100 dark:hover:bg-white/10">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Camera className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-950 dark:text-white">Escanear transferencia</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Extrae datos desde una captura</span>
            </span>
          </Link>

          <Link href="/wallets?triggerTx=true" onClick={handleTxClick} className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-slate-100 dark:hover:bg-white/10">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <PlusCircle className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-950 dark:text-white">Movimiento manual</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Registra efectivo o cuenta bancaria</span>
            </span>
          </Link>

          <Link href="/loans" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-slate-100 dark:hover:bg-white/10">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Landmark className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-950 dark:text-white">Mis Préstamos</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Amortizaciones, cuotas y abonos</span>
            </span>
          </Link>

          <Link href="/wallets" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-slate-100 dark:hover:bg-white/10">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Wallet className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-950 dark:text-white">Carteras</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Consulta saldos y movimientos</span>
            </span>
          </Link>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 z-50 grid h-[72px] w-full grid-cols-5 border-t border-slate-200/80 bg-white/90 px-2 pt-2 shadow-[0_-18px_45px_-30px_rgba(15,23,42,0.6)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/90 md:hidden">
        {navItems.slice(0, 2).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href} onClick={() => setIsMenuOpen(false)} className="flex flex-col items-center justify-center gap-1 rounded-lg transition active:scale-95">
              <Icon className={`h-5 w-5 ${isActive ? "text-brand-cerulean" : "text-slate-500 dark:text-slate-400"}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-semibold ${isActive ? "text-brand-cerulean" : "text-slate-500 dark:text-slate-400"}`}>{item.name}</span>
            </Link>
          );
        })}

        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`absolute -top-6 grid h-14 w-14 place-items-center rounded-full text-white shadow-lg shadow-brand-cerulean/30 transition active:scale-95 ${
              isMenuOpen ? "rotate-45 bg-slate-900 dark:bg-white dark:text-slate-950" : "bg-brand-cerulean"
            }`}
            title="Acciones rápidas"
          >
            <Plus className="h-6 w-6" strokeWidth={3} />
          </button>
        </div>

        {navItems.slice(2).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href} onClick={() => setIsMenuOpen(false)} className="flex flex-col items-center justify-center gap-1 rounded-lg transition active:scale-95">
              <Icon className={`h-5 w-5 ${isActive ? "text-brand-cerulean" : "text-slate-500 dark:text-slate-400"}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-semibold ${isActive ? "text-brand-cerulean" : "text-slate-500 dark:text-slate-400"}`}>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

