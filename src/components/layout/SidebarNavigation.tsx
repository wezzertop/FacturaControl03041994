"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Calendar,
  Calculator,
  ChevronLeft,
  ChevronRight,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  Moon,
  PieChart,
  Repeat,
  Settings,
  Sparkles,
  Sun,
  Tag,
  UploadCloud,
  Wallet,
  Zap,
  Coffee,
  Scale,
  PiggyBank,
} from "lucide-react";
import DonationModal from "./DonationModal";
import { signout } from "@/app/actions/auth";

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

const navGroups = [
  {
    title: "Principal",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Cargar XML", href: "/upload", icon: UploadCloud },
      { name: "Historial CFDI", href: "/invoices", icon: FileText },
    ],
  },
  {
    title: "Finanzas",
    items: [
      { name: "Mis Carteras", href: "/wallets", icon: Wallet },
      { name: "Metas de Ahorro", href: "/savings", icon: PiggyBank },
      { name: "Préstamos", href: "/loans", icon: Landmark },
      { name: "Calendario", href: "/calendar", icon: Calendar },
      { name: "Impuestos SAT", href: "/tax", icon: Scale },
    ],
  },
  {
    title: "Herramientas",
    items: [
      { name: "Categorías", href: "/categories", icon: Tag },
      { name: "Recurrentes", href: "/recurring", icon: Repeat },
      { name: "Análisis", href: "/analytics", icon: PieChart },
      { name: "Simulación fiscal", href: "/simulation", icon: Calculator },
      { name: "Configuración", href: "/settings", icon: Settings },
    ],
  },
];

export default function SidebarNavigation() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  if (isAuthPage) return null;

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <aside
      className={cn(
        "relative hidden h-screen shrink-0 flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-xl transition-all duration-300 dark:border-white/[0.08] dark:bg-[#000000] md:flex",
        collapsed ? "w-20" : "w-72",
      )}
    >
      {/* Botón para plegar / desplegar sidebar */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-7 z-20 grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition hover:border-white/30 hover:bg-neutral-800 hover:text-white dark:border-white/15 dark:bg-[#0A0A0C] dark:text-slate-200"
        title={collapsed ? "Expandir menú" : "Contraer menú"}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Header del Sidebar */}
      <div className="flex h-20 items-center gap-3.5 px-5 border-b border-slate-200/80 dark:border-white/[0.08] shrink-0">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-black shadow-md">
          <Zap className="h-5 w-5 fill-current" />
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-base font-black text-slate-900 dark:text-white tracking-tight">
              Factura<span className="text-white">Control</span>
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Panel Financiero</p>
          </div>
        ) : null}
      </div>

      {/* Navegación Agrupada */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3.5 py-4 custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-zinc-500 mb-1.5">
                {group.title}
              </p>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-all duration-150",
                      collapsed && "justify-center px-0 h-11",
                      isActive
                        ? "bg-white text-black font-extrabold shadow-sm"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-[#0A0A0C] dark:hover:text-white",
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon
                      className={cn("h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-105", isActive ? "text-black" : "text-slate-500 dark:text-slate-400")}
                      strokeWidth={isActive ? 2.4 : 1.8}
                    />
                    {!collapsed ? <span className="truncate">{item.name}</span> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer del Sidebar: Plan + Cambiador de Tema + Logout */}
      <div className="space-y-2.5 border-t border-slate-200/80 p-3.5 dark:border-white/[0.08] shrink-0">
        <div
          className={cn(
            "rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/[0.08] dark:bg-[#0A0A0C]",
            collapsed && "p-2 text-center",
          )}
        >
          {collapsed ? (
            <div className="grid place-items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <button
                type="button"
                onClick={() => setTheme(nextTheme)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:bg-white hover:text-white dark:text-slate-300 dark:hover:bg-white/10 transition"
                title="Cambiar tema"
                suppressHydrationWarning
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">Plan Pro SAT</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Facturas ilimitadas</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTheme(nextTheme)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-white/40 hover:text-white dark:border-white/10 dark:bg-[#141418] dark:text-zinc-300 transition"
                  title="Cambiar tema"
                  suppressHydrationWarning
                >
                  {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                </button>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsDonationOpen(true)}
          className={cn(
            "flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/15 transition border border-amber-500/20 shadow-sm",
            collapsed && "justify-center px-0",
          )}
          title="Invitar un café (Donar)"
        >
          <Coffee className="h-4 w-4 shrink-0" />
          {!collapsed ? <span>Invítanos un café ☕</span> : null}
        </button>

        <form action={signout}>
          <button
            type="submit"
            className={cn(
              "flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition",
              collapsed && "justify-center px-0",
            )}
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed ? <span>Cerrar sesión</span> : null}
          </button>
        </form>

        <DonationModal isOpen={isDonationOpen} onClose={() => setIsDonationOpen(false)} />
      </div>
    </aside>
  );
}
