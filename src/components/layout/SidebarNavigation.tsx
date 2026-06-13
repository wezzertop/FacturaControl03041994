"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { 
  LayoutDashboard, 
  UploadCloud, 
  FileText, 
  PieChart, 
  Calculator, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Moon,
  Sun,
  Wallet
} from 'lucide-react';
import { signout } from '@/app/actions/auth';

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Cargar XML', href: '/upload', icon: UploadCloud },
  { name: 'Historial', href: '/invoices', icon: FileText },
  { name: 'Carteras', href: '/wallets', icon: Wallet },
  { name: 'Análisis de Gastos', href: '/analytics', icon: PieChart },
  { name: 'Simulación Fiscal', href: '/simulation', icon: Calculator },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

export default function SidebarNavigation() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  if (isAuthPage) return null;

  return (
    <aside 
      className={cn(
        "hidden md:flex relative flex-col h-screen bg-brand-white dark:bg-brand-graphite border-r border-gray-200 dark:border-zinc-800 transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 bg-brand-smoke dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-full p-1 text-brand-graphite dark:text-brand-smoke hover:text-brand-cerulean dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors z-10"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Logo */}
      <div className="flex items-center h-20 px-6 border-b border-gray-200 dark:border-zinc-800/50 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-brand-cerulean to-blue-400 flex items-center justify-center shrink-0">
            <Zap className="text-white w-5 h-5" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight text-brand-carbon dark:text-white">
              Factura<span className="text-brand-cerulean">Control</span>
            </span>
          )}
        </div>
        {!collapsed && mounted && (
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-md text-brand-graphite dark:text-zinc-400 hover:bg-brand-smoke dark:hover:bg-zinc-800 hover:text-brand-cerulean dark:hover:text-white transition-colors"
            title={theme === 'dark' ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group",
                isActive 
                  ? "bg-brand-cerulean/10 dark:bg-brand-cerulean/20 text-brand-cerulean" 
                  : "text-brand-graphite dark:text-zinc-400 hover:bg-brand-smoke dark:hover:bg-zinc-800/50 hover:text-brand-carbon dark:hover:text-zinc-100"
              )}
            >
              <Icon 
                className={cn(
                  "shrink-0", 
                  collapsed ? "w-6 h-6 mx-auto" : "w-5 h-5"
                )} 
              />
              {!collapsed && (
                <span className="font-medium text-sm whitespace-nowrap">
                  {item.name}
                </span>
              )}
              
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-cerulean" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Plan Indicator & Sign Out */}
      <div className="p-4 border-t border-gray-200 dark:border-zinc-800/50 flex flex-col gap-3">
        <div className={cn(
          "bg-brand-smoke dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg transition-all duration-300",
          collapsed ? "p-2 flex justify-center" : "p-4"
        )}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-cerulean/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-brand-cerulean" />
              </div>
              {mounted && (
                <button 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-1.5 rounded-md text-brand-graphite dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-800 hover:text-brand-cerulean transition-colors"
                  title="Cambiar tema"
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-brand-cerulean/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-brand-cerulean" />
                </div>
                <div>
                  <p className="text-sm font-medium text-brand-carbon dark:text-zinc-200">Plan Pro</p>
                  <p className="text-xs text-brand-graphite dark:text-zinc-500">Ilimitado</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-brand-graphite dark:text-zinc-400 mb-1">
                  <span>Facturas este mes</span>
                  <span className="text-brand-cerulean font-medium">Ilimitado</span>
                </div>
                <div className="w-full bg-gray-300 dark:bg-zinc-800 rounded-full h-1.5">
                  <div className="bg-brand-cerulean h-1.5 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </>
          )}
        </div>
        
        <form action={signout} className={collapsed ? 'mx-auto' : ''}>
          <button 
            type="submit"
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-brand-graphite dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors",
              collapsed ? "justify-center" : ""
            )}
            title="Cerrar Sesión"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            {!collapsed && <span className="text-sm font-medium">Cerrar Sesión</span>}
          </button>
        </form>
      </div>
    </aside>
  );
}
