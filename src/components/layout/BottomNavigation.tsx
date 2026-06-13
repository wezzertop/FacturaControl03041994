'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  PieChart, 
  Settings,
  Plus,
  UploadCloud,
  KeyRound,
  FileSignature,
  X,
  Wallet
} from 'lucide-react';

const navItems = [
  { name: 'Inicio', href: '/', icon: LayoutDashboard },
  { name: 'Historial', href: '/invoices', icon: FileText },
  // El botón central irá aquí visualmente
  { name: 'Análisis', href: '/analytics', icon: PieChart },
  { name: 'Ajustes', href: '/settings', icon: Settings },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  if (isAuthPage || !mounted) return null;

  return (
    <>
      {/* Overlay Oscuro para el Menú Flotante */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-brand-carbon/60 dark:bg-black/70 backdrop-blur-sm z-40 transition-opacity md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Menú de Acción (Bottom Sheet) */}
      <div 
        className={`fixed bottom-[80px] left-0 w-full p-4 z-40 transition-transform duration-300 md:hidden ${
          isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-brand-white dark:bg-brand-graphite border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl p-2 flex flex-col gap-2">
          
          <Link 
            href="/upload" 
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-brand-cerulean/10 flex items-center justify-center shrink-0">
              <UploadCloud className="w-5 h-5 text-brand-cerulean" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-carbon dark:text-white">Subir XML Manual</h4>
              <p className="text-xs text-brand-graphite dark:text-zinc-400">Carga tus archivos directamente</p>
            </div>
          </Link>

          <Link 
            href="/wallets" 
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-brand-cerulean/10 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-brand-cerulean" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-carbon dark:text-white">Mi Cartera y Efectivo</h4>
              <p className="text-xs text-brand-graphite dark:text-zinc-400">Controla tus cuentas y transacciones manuales</p>
            </div>
          </Link>

          <button 
            className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors opacity-60 text-left"
            onClick={() => alert("Próximamente: Conexión con SAT vía CIEC")}
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5 text-brand-graphite dark:text-zinc-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-carbon dark:text-white">Por Contraseña (CIEC)</h4>
              <p className="text-xs text-brand-graphite dark:text-zinc-400">Descarga automática del SAT</p>
            </div>
          </button>

          <button 
            className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors opacity-60 text-left"
            onClick={() => alert("Próximamente: Conexión con SAT vía e.Firma")}
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
              <FileSignature className="w-5 h-5 text-brand-graphite dark:text-zinc-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-carbon dark:text-white">Por e.Firma</h4>
              <p className="text-xs text-brand-graphite dark:text-zinc-400">Sincronización total y firmas</p>
            </div>
          </button>

        </div>
      </div>

      {/* Barra de Navegación Inferior */}
      <div className="fixed bottom-0 left-0 w-full bg-brand-white/90 dark:bg-brand-graphite/90 backdrop-blur-md border-t border-gray-200 dark:border-zinc-800 flex justify-between items-center px-6 pb-safe pt-2 h-[72px] z-50 md:hidden">
        
        {/* Izquierda */}
        <div className="flex gap-8">
          {navItems.slice(0, 2).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href} className="flex flex-col items-center justify-center gap-1">
                <Icon 
                  className={`w-6 h-6 ${isActive ? 'text-brand-cerulean' : 'text-brand-graphite dark:text-zinc-500'}`} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={`text-[10px] font-medium ${isActive ? 'text-brand-cerulean' : 'text-brand-graphite dark:text-zinc-500'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* FAB Central Flotante */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-6">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-brand-cerulean/30 text-white transition-all duration-300 ${
              isMenuOpen ? 'bg-red-500 rotate-45' : 'bg-brand-cerulean hover:bg-blue-500 scale-100'
            }`}
          >
            <Plus className="w-6 h-6" strokeWidth={3} />
          </button>
        </div>

        {/* Derecha */}
        <div className="flex gap-8">
          {navItems.slice(2, 4).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href} className="flex flex-col items-center justify-center gap-1">
                <Icon 
                  className={`w-6 h-6 ${isActive ? 'text-brand-cerulean' : 'text-brand-graphite dark:text-zinc-500'}`} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={`text-[10px] font-medium ${isActive ? 'text-brand-cerulean' : 'text-brand-graphite dark:text-zinc-500'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>

      </div>
    </>
  );
}
