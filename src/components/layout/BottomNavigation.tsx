"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Calendar,
  Camera,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PieChart,
  PlusCircle,
  Repeat,
  Settings,
  Sparkles,
  Sun,
  Tag,
  UploadCloud,
  Wallet,
  X,
  Zap,
  Calculator,
  Scale,
  PiggyBank
} from "lucide-react";
import { signout } from "@/app/actions/auth";
import ApplePaySetupModal from "@/components/wallets/ApplePaySetupModal";

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

const mainDockItems = [
  { name: "Inicio", href: "/", icon: LayoutDashboard },
  { name: "Facturas", href: "/invoices", icon: FileText },
  { name: "Carteras", href: "/wallets", icon: Wallet },
  { name: "Calendario", href: "/calendar", icon: Calendar },
];

const mobileGroups = [
  {
    title: "Principal",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard, desc: "Panel de control general" },
      { name: "Cargar XML", href: "/upload", icon: UploadCloud, desc: "Procesar comprobantes SAT" },
      { name: "Historial CFDI", href: "/invoices", icon: FileText, desc: "Facturas e ingresos" },
    ],
  },
  {
    title: "Finanzas & Control",
    items: [
      { name: "Mis Carteras", href: "/wallets", icon: Wallet, desc: "Bancos, efectivo y crédito" },
      { name: "Metas de Ahorro", href: "/savings", icon: PiggyBank, desc: "Apartados y objetivos" },
      { name: "Préstamos", href: "/loans", icon: Landmark, desc: "Cuotas y amortizaciones" },
      { name: "Calendario Financiero", href: "/calendar", icon: Calendar, desc: "Flujo de caja y vencimientos" },
      { name: "Impuestos SAT", href: "/tax", icon: Scale, desc: "Cálculo de IVA e ISR estimado" },
    ],
  },
  {
    title: "Herramientas & Ajustes",
    items: [
      { name: "Categorías", href: "/categories", icon: Tag, desc: "Personalizar gastos" },
      { name: "Pagos Recurrentes", href: "/recurring", icon: Repeat, desc: "Suscripciones y nómina" },
      { name: "Análisis Financiero", href: "/analytics", icon: PieChart, desc: "Reportes y gráficos" },
      { name: "Simulación Fiscal", href: "/simulation", icon: Calculator, desc: "Cálculo de impuestos" },
      { name: "Configuración", href: "/settings", icon: Settings, desc: "RFC y preferencias" },
    ],
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isApplePayOpen, setIsApplePayOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  if (isAuthPage) return null;

  const nextTheme = theme === "dark" ? "light" : "dark";

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
      {/* Drawer Overlay Móvil */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md transition-opacity md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Slide-over Drawer Móvil Completo */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[92vh] flex-col rounded-t-2xl border-t border-slate-200/80 bg-white/95 backdrop-blur-2xl transition-transform duration-300 dark:border-white/[0.08] dark:bg-[#050505]/98 md:hidden shadow-2xl overflow-hidden",
          isMenuOpen ? "translate-y-0" : "translate-y-full pointer-events-none"
        )}
      >
        {/* Indicador táctil superior */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-white/20" />
        </div>

        {/* Header del Drawer Móvil */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 dark:border-white/[0.08] shrink-0">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-black shadow-md">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Factura<span className="text-white">Control</span>
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Plan Pro SAT</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(nextTheme)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-[#0A0A0C] dark:text-white dark:hover:bg-white/10 transition"
              title="Cambiar tema"
              suppressHydrationWarning
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#0A0A0C] dark:text-white dark:hover:bg-white/10 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Contenido Scrolleable del Drawer Móvil */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 custom-scrollbar">

          {/* Tarjetas de Acceso Rápido Táctiles */}
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">
              Acciones Rápidas
            </p>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsApplePayOpen(true);
                }}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-100 dark:bg-[#0A0A0C] text-slate-900 dark:text-white border border-white/20 active:scale-95 transition text-center"
              >
                <div className="h-5 w-5 mb-1 bg-white text-black font-black text-[9px] rounded flex items-center justify-center">
                  Pay
                </div>
                <span className="text-[10px] font-bold leading-tight">Apple Pay</span>
              </button>

              <Link
                href="/upload"
                onClick={() => setIsMenuOpen(false)}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-100 dark:bg-[#0A0A0C] text-slate-900 dark:text-white border border-slate-200/80 dark:border-white/[0.08] active:scale-95 transition text-center"
              >
                <UploadCloud className="h-5 w-5 mb-1 text-slate-300" />
                <span className="text-[10px] font-bold leading-tight">Subir XML</span>
              </Link>

              <Link
                href="/wallets?triggerOcr=true"
                onClick={handleOcrClick}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 active:scale-95 transition text-center"
              >
                <Camera className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-bold leading-tight">Escanear</span>
              </Link>

              <Link
                href="/wallets?triggerTx=true"
                onClick={handleTxClick}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-100 dark:bg-[#0A0A0C] text-slate-900 dark:text-white border border-slate-200/80 dark:border-white/[0.08] active:scale-95 transition text-center"
              >
                <PlusCircle className="h-5 w-5 mb-1 text-slate-300" />
                <span className="text-[10px] font-bold leading-tight">Movimiento</span>
              </Link>
            </div>
          </div>

          {/* Secciones de Navegación Agrupadas */}
          {mobileGroups.map((group) => (
            <div key={group.title} className="space-y-1.5">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500 px-1">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3.5 p-3 rounded-xl transition-all active:scale-[0.98]",
                        isActive
                          ? "bg-white text-black font-extrabold shadow-md"
                          : "bg-slate-100/80 dark:bg-[#0A0A0C] text-slate-900 dark:text-white border border-slate-200/60 dark:border-white/[0.08]"
                      )}
                    >
                      <div
                        className={cn(
                          "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                          isActive ? "bg-black/10 text-black" : "bg-white/10 text-white"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-xs font-black truncate", isActive ? "text-black" : "text-slate-900 dark:text-white")}>
                          {item.name}
                        </p>
                        <p className={cn("text-[11px] truncate mt-0.5", isActive ? "text-black/70" : "text-slate-600 dark:text-slate-400")}>
                          {item.desc}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Botón de Salir en el Drawer */}
          <form action={signout} className="pt-2 pb-4">
            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 text-xs font-black transition active:scale-98 border border-rose-200/60 dark:border-rose-900/40"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión de FacturaControl</span>
            </button>
          </form>

        </div>
      </div>

      {/* Dock Inferior Fijo para Celular con Soporte de Safe Areas para iPhone y Android */}
      <div className="fixed bottom-0 left-0 z-40 grid w-full grid-cols-5 border-t border-slate-200/80 bg-white/95 px-2 pb-[env(safe-area-inset-bottom,0px)] h-[calc(3.75rem+env(safe-area-inset-bottom,0px))] shadow-lg backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#000000]/95 md:hidden">
        {mainDockItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => {
                if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(10);
                setIsMenuOpen(false);
              }}
              className="flex flex-col items-center justify-center gap-0.5 transition active:scale-90"
            >
              <Icon
                className={cn("h-5 w-5 transition-transform", isActive ? "text-white scale-110" : "text-zinc-500 dark:text-zinc-500")}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className={cn("text-[10px] font-bold", isActive ? "text-white" : "text-zinc-500 dark:text-zinc-400")}>
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* Botón táctil para desplegar el Menú Completo */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(10);
            setIsMenuOpen(!isMenuOpen);
          }}
          className="flex flex-col items-center justify-center gap-0.5 transition active:scale-90"
        >
          <div className={cn("grid h-6 w-6 place-items-center rounded-md transition", isMenuOpen ? "bg-white text-black" : "text-zinc-500 dark:text-zinc-400")}>
            <Menu className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className={cn("text-[10px] font-bold", isMenuOpen ? "text-white" : "text-zinc-500 dark:text-zinc-400")}>
            Menú
          </span>
        </button>
      </div>

      <ApplePaySetupModal
        isOpen={isApplePayOpen}
        onClose={() => setIsApplePayOpen(false)}
      />
    </>
  );
}
