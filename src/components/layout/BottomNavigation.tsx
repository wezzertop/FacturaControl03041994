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
  X,
  Wallet,
  Camera,
  PlusCircle
} from 'lucide-react';

const navItems = [
  { name: 'Inicio', href: '/', icon: LayoutDashboard },
  { name: 'Historial', href: '/invoices', icon: FileText },
  // El botón central flotante se intercala aquí visualmente
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

  // Manejador del click de OCR en móvil
  const handleOcrClick = (e: React.MouseEvent) => {
    setIsMenuOpen(false);
    if (pathname === '/wallets') {
      e.preventDefault();
      const input = document.getElementById('ocr-file-input');
      if (input) {
        (input as HTMLInputElement).click();
      }
    }
  };

  // Manejador del click de Transacción manual en móvil
  const handleTxClick = (e: React.MouseEvent) => {
    setIsMenuOpen(false);
    if (pathname === '/wallets') {
      e.preventDefault();
      const button = document.getElementById('trigger-tx-modal-btn');
      if (button) {
        (button as HTMLButtonElement).click();
      }
    }
  };

  return (
    <>
      {/* Overlay Oscuro para el Menú Flotante */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-brand-carbon/60 dark:bg-black/80 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Menú de Acción (Bottom Sheet Premium) */}
      <div 
        className={`fixed bottom-[84px] inset-x-4 z-40 transition-all duration-300 transform md:hidden ${
          isMenuOpen 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-10 opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-gray-150 dark:border-zinc-800 rounded-2xl shadow-2xl p-3 flex flex-col gap-1.5">
          
          {/* Encabezado del Bottom Sheet */}
          <div className="px-3 py-2 border-b border-gray-100 dark:border-zinc-800/80 mb-1 flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-graphite dark:text-zinc-500">
              Acciones Rápidas
            </span>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="text-brand-graphite dark:text-zinc-500 hover:text-brand-carbon dark:hover:text-white p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {/* 1. Subir Factura XML */}
          <Link 
            href="/upload" 
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-brand-cerulean/5 dark:hover:bg-brand-cerulean/10 active:scale-[0.98] transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-brand-cerulean/10 flex items-center justify-center shrink-0">
              <UploadCloud className="w-5 h-5 text-brand-cerulean" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-carbon dark:text-white">Cargar XML (SAT)</h4>
              <p className="text-[11px] text-brand-graphite dark:text-zinc-400">Sube tus archivos XML de facturas directamente</p>
            </div>
          </Link>

          {/* 2. Escanear Transferencia (OCR) */}
          <Link 
            href="/wallets?triggerOcr=true" 
            onClick={handleOcrClick}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 active:scale-[0.98] transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-carbon dark:text-white">Escanear Transferencia</h4>
              <p className="text-[11px] text-brand-graphite dark:text-zinc-400">OCR automático desde captura de pantalla (BBVA)</p>
            </div>
          </Link>

          {/* 3. Registrar Movimiento en Efectivo */}
          <Link 
            href="/wallets?triggerTx=true" 
            onClick={handleTxClick}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-blue-500/5 dark:hover:bg-blue-500/10 active:scale-[0.98] transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
              <PlusCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-carbon dark:text-white">Movimiento en Efectivo</h4>
              <p className="text-[11px] text-brand-graphite dark:text-zinc-400">Registra un ingreso o gasto manual en efectivo</p>
            </div>
          </Link>

          {/* 4. Mi Cartera y Cuentas */}
          <Link 
            href="/wallets" 
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-purple-500/5 dark:hover:bg-purple-500/10 active:scale-[0.98] transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-carbon dark:text-white">Mi Cartera y Cuentas</h4>
              <p className="text-[11px] text-brand-graphite dark:text-zinc-400">Ver saldos de cuentas, conciliar y transferencias</p>
            </div>
          </Link>

        </div>
      </div>

      {/* Barra de Navegación Inferior Estilo Premium */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-t border-gray-150 dark:border-zinc-800 grid grid-cols-5 px-2 pb-safe pt-2.5 h-[68px] z-50 md:hidden shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.06)]">
        
        {/* 1. Inicio */}
        {(() => {
          const item = navItems[0];
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              href={item.href} 
              onClick={() => setIsMenuOpen(false)}
              className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
            >
              <Icon 
                className={`w-5 h-5 transition-colors ${isActive ? 'text-brand-cerulean' : 'text-brand-graphite dark:text-zinc-500'}`} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[10px] font-bold tracking-tight transition-colors ${isActive ? 'text-brand-cerulean font-extrabold' : 'text-brand-graphite dark:text-zinc-500'}`}>
                {item.name}
              </span>
            </Link>
          );
        })()}

        {/* 2. Historial */}
        {(() => {
          const item = navItems[1];
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              href={item.href} 
              onClick={() => setIsMenuOpen(false)}
              className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
            >
              <Icon 
                className={`w-5 h-5 transition-colors ${isActive ? 'text-brand-cerulean' : 'text-brand-graphite dark:text-zinc-500'}`} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[10px] font-bold tracking-tight transition-colors ${isActive ? 'text-brand-cerulean font-extrabold' : 'text-brand-graphite dark:text-zinc-500'}`}>
                {item.name}
              </span>
            </Link>
          );
        })()}

        {/* 3. Espacio Central Reservado para el FAB */}
        <div className="relative flex items-center justify-center">
          <div className="absolute -top-7">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg shadow-brand-cerulean/25 text-white active:scale-95 hover:scale-105 transition-all duration-300 ${
                isMenuOpen ? 'bg-zinc-850 dark:bg-white text-white dark:text-zinc-900 rotate-45' : 'bg-brand-cerulean text-white'
              }`}
            >
              <Plus className="w-5 h-5" strokeWidth={3.5} />
            </button>
          </div>
        </div>

        {/* 4. Análisis */}
        {(() => {
          const item = navItems[2];
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              href={item.href} 
              onClick={() => setIsMenuOpen(false)}
              className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
            >
              <Icon 
                className={`w-5 h-5 transition-colors ${isActive ? 'text-brand-cerulean' : 'text-brand-graphite dark:text-zinc-500'}`} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[10px] font-bold tracking-tight transition-colors ${isActive ? 'text-brand-cerulean font-extrabold' : 'text-brand-graphite dark:text-zinc-500'}`}>
                {item.name}
              </span>
            </Link>
          );
        })()}

        {/* 5. Ajustes */}
        {(() => {
          const item = navItems[3];
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              href={item.href} 
              onClick={() => setIsMenuOpen(false)}
              className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
            >
              <Icon 
                className={`w-5 h-5 transition-colors ${isActive ? 'text-brand-cerulean' : 'text-brand-graphite dark:text-zinc-500'}`} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[10px] font-bold tracking-tight transition-colors ${isActive ? 'text-brand-cerulean font-extrabold' : 'text-brand-graphite dark:text-zinc-500'}`}>
                {item.name}
              </span>
            </Link>
          );
        })()}

      </div>
    </>
  );
}
