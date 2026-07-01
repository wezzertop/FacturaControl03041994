"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Calculator,
  ChevronLeft,
  ChevronRight,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  Moon,
  PieChart,
  Settings,
  Sparkles,
  Sun,
  UploadCloud,
  Wallet,
  Zap,
} from "lucide-react";
import { signout } from "@/app/actions/auth";

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Cargar XML", href: "/upload", icon: UploadCloud },
  { name: "Historial", href: "/invoices", icon: FileText },
  { name: "Carteras", href: "/wallets", icon: Wallet },
  { name: "Préstamos", href: "/loans", icon: Landmark },
  { name: "Análisis", href: "/analytics", icon: PieChart },
  { name: "Simulación fiscal", href: "/simulation", icon: Calculator },
  { name: "Configuración", href: "/settings", icon: Settings },
];

export default function SidebarNavigation() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  if (isAuthPage) return null;

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <aside
      className={cn(
        "relative hidden h-screen shrink-0 flex-col border-r border-slate-200/80 bg-white/82 backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-zinc-950/70 md:flex",
        collapsed ? "w-20" : "w-72",
      )}
    >
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 z-10 grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-brand-cerulean hover:text-brand-cerulean dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
        title={collapsed ? "Expandir menú" : "Contraer menú"}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className="flex h-20 items-center gap-3 px-5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-cerulean text-white shadow-lg shadow-brand-cerulean/20">
          <Zap className="h-5 w-5" />
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-slate-950 dark:text-white">
              Factura<span className="text-brand-cerulean">Control</span>
            </p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Panel financiero</p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-brand-cerulean text-white shadow-sm shadow-brand-cerulean/20"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white",
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.4 : 2} />
              {!collapsed ? <span className="truncate">{item.name}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-slate-200/80 p-4 dark:border-white/10">
        <div
          className={cn(
            "rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5",
            collapsed && "p-2",
          )}
        >
          {collapsed ? (
            <div className="grid place-items-center gap-3">
              <Sparkles className="h-5 w-5 text-brand-cerulean" />
              <button
                type="button"
                onClick={() => setTheme(nextTheme)}
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-white hover:text-brand-cerulean dark:text-slate-400 dark:hover:bg-zinc-900"
                title="Cambiar tema"
                suppressHydrationWarning
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-cerulean/10 text-brand-cerulean">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">Plan Pro</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Facturas ilimitadas</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Tema</span>
                <button
                  type="button"
                  onClick={() => setTheme(nextTheme)}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-cerulean hover:text-brand-cerulean dark:border-white/10 dark:bg-zinc-950 dark:text-slate-300"
                  suppressHydrationWarning
                >
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                  {theme === "dark" ? "Claro" : "Oscuro"}
                </button>
              </div>
            </>
          )}
        </div>

        <form action={signout}>
          <button
            type="submit"
            className={cn(
              "flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-300",
              collapsed && "justify-center px-0",
            )}
            title="Cerrar sesión"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed ? <span>Cerrar sesión</span> : null}
          </button>
        </form>
      </div>
    </aside>
  );
}
