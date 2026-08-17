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
      { name: "Préstamos", href: "/loans", icon: Landmark },
      { name: "Calendario", href: "/calendar", icon: Calendar },
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
        "relative hidden h-screen shrink-0 flex-col border-r border-slate-200/80 bg-white/85 backdrop-blur-xl transition-all duration-300 dark:border-zinc-800/80 dark:bg-zinc-950/85 md:flex",
        collapsed ? "w-20" : "w-72",
      )}
    >
      {/* Botón para plegar / desplegar sidebar */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-7 z-20 grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition hover:border-brand-cerulean hover:bg-brand-cerulean hover:text-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
        title={collapsed ? "Expandir menú" : "Contraer menú"}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Header del Sidebar */}
      <div className="flex h-20 items-center gap-3.5 px-5 border-b border-slate-100 dark:border-zinc-900/60 shrink-0">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-cerulean to-blue-600 text-white shadow-md shadow-brand-cerulean/25">
          <Zap className="h-5 w-5" />
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Factura<span className="text-brand-cerulean">Control</span>
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Panel Financiero</p>
          </div>
        ) : null}
      </div>

      {/* Navegación Agrupada */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3.5 py-4 custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1.5">
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
                      "group flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-150",
                      collapsed && "justify-center px-0 h-11",
                      isActive
                        ? "bg-gradient-to-r from-brand-cerulean to-blue-600 text-white shadow-md shadow-brand-cerulean/20 font-semibold"
                        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-950 dark:text-zinc-400 dark:hover:bg-zinc-900/80 dark:hover:text-white",
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon
                      className={cn("h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-105", isActive ? "text-white" : "text-slate-500 dark:text-zinc-400")}
                      strokeWidth={isActive ? 2.4 : 2}
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
      <div className="space-y-3 border-t border-slate-200/80 p-3.5 dark:border-zinc-900/80 shrink-0">
        <div
          className={cn(
            "rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-900/60",
            collapsed && "p-2 text-center",
          )}
        >
          {collapsed ? (
            <div className="grid place-items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-cerulean" />
              <button
                type="button"
                onClick={() => setTheme(nextTheme)}
                className="grid h-8 w-8 place-items-center rounded-xl text-slate-500 hover:bg-white hover:text-brand-cerulean dark:text-zinc-400 dark:hover:bg-zinc-800 transition"
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
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-brand-cerulean/10 text-brand-cerulean">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Plan Pro SAT</p>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400">Facturas ilimitadas</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTheme(nextTheme)}
                  className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-brand-cerulean hover:text-brand-cerulean dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 transition"
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
            "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition border border-amber-500/20 shadow-sm",
            collapsed && "justify-center px-0",
          )}
          title="Invitar un café (Donar)"
        >
          <Coffee className="h-4.5 w-4.5 shrink-0" />
          {!collapsed ? <span>Invítanos un café ☕</span> : null}
        </button>

        <form action={signout}>
          <button
            type="submit"
            className={cn(
              "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition",
              collapsed && "justify-center px-0",
            )}
            title="Cerrar sesión"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            {!collapsed ? <span>Cerrar sesión</span> : null}
          </button>
        </form>

        <DonationModal isOpen={isDonationOpen} onClose={() => setIsDonationOpen(false)} />
      </div>
    </aside>
  );
}
