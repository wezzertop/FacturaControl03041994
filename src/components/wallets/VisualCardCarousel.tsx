"use client";

import React, { useRef, useState } from "react";
import CardDetailsModal from "./CardDetailsModal";
import { getBankThemeConfig, BankLogo } from "./BankLogos";
import { 
  CreditCard, 
  Wallet, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Wifi, 
  Sparkles,
  TrendingUp,
  Landmark,
  Coins,
  PlusCircle
} from "lucide-react";

interface WalletCardData {
  id: string;
  name: string;
  type: "cash" | "bank" | "credit" | string;
  balance: number;
  credit_limit?: number | null;
  color?: string | null;
  cut_off_day?: number | null;
  due_day?: number | null;
  [key: string]: any;
}

interface VisualCardCarouselProps {
  wallets: WalletCardData[];
  transactions?: any[];
  onSelectWallet?: (walletId: string) => void;
  onAddWalletClick?: () => void;
  onOpenNewTx?: (type: "expense" | "income", walletId: string) => void;
  selectedWalletId?: string;
}

export default function VisualCardCarousel({
  wallets,
  transactions = [],
  onSelectWallet,
  onAddWalletClick,
  onOpenNewTx,
  selectedWalletId,
}: VisualCardCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inspectingWallet, setInspectingWallet] = useState<WalletCardData | null>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  };

  return (
    <div className="relative w-full">
      {/* Header del Carrusel con Controles de Desplazamiento */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-brand-cerulean" />
          <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
            Mis Tarjetas & Carteras
          </h3>
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
            {wallets.length}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => scroll("left")}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white transition"
            aria-label="Anterior tarjeta"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white transition"
            aria-label="Siguiente tarjeta"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contenedor Carrusel Snap Scroll Horizontal */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 pt-1 px-1 custom-scrollbar scroll-smooth"
      >
        {wallets.map((wallet) => {
          const theme = getBankThemeConfig(wallet.name, wallet.type);
          const isSelected = selectedWalletId === wallet.id;
          const isCredit = wallet.type === "credit";
          const creditLimit = wallet.credit_limit || 0;
          const debt = isCredit ? Math.max(0, -wallet.balance) : 0;
          const availableCredit = isCredit ? Math.max(0, creditLimit - debt) : wallet.balance;
          const usedPct = isCredit && creditLimit > 0 ? Math.min(100, (debt / creditLimit) * 100) : 0;

          return (
            <div
              key={wallet.id}
              onClick={() => {
                if (onSelectWallet) onSelectWallet(wallet.id);
                setInspectingWallet(wallet);
              }}
              className={`snap-center shrink-0 w-[290px] sm:w-[320px] h-[180px] rounded-2xl p-4 sm:p-5 bg-gradient-to-tr ${theme.gradient} ${theme.textColor} shadow-lg relative overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 transform active:scale-95 border border-white/10 ${
                isSelected
                  ? "ring-2 ring-brand-cerulean shadow-xl scale-[1.01]"
                  : "hover:scale-[1.01] hover:shadow-xl opacity-95 hover:opacity-100"
              }`}
            >
              {/* Reflejos de Luz y Textura de Fondo */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-36 h-36 rounded-full bg-brand-cerulean/20 blur-2xl pointer-events-none" />

              {/* Fila Superior: Nombre/Banco + Chip y Contactless */}
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-1.5 opacity-90">
                    <BankLogo bank={theme.type} />
                    {theme.type === "generic" && (
                      <span className="text-[11px] font-black uppercase tracking-wider block">
                        {theme.name}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold tracking-tight truncate max-w-[170px] mt-0.5">
                    {wallet.name}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <Wifi className="w-3.5 h-3.5 opacity-75 rotate-90" />
                  <div className={`w-7 h-5 rounded-md ${theme.chipColor} border border-white/40 shadow-inner flex items-center justify-center`}>
                    <div className="w-4 h-2.5 border-t border-b border-black/20" />
                  </div>
                </div>
              </div>

              {/* Fila Central: Balance o Deuda */}
              <div className="relative z-10">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 block">
                  {isCredit ? "Saldo Disponible" : "Saldo Actual"}
                </span>
                <p className="text-2xl font-black tracking-tight drop-shadow-md">
                  {formatCurrency(isCredit ? availableCredit : wallet.balance)}
                </p>

                {isCredit && creditLimit > 0 && (
                  <div className="mt-1.5 space-y-1">
                    <div className="w-full bg-black/30 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all rounded-full ${
                          usedPct > 80 ? "bg-rose-400" : usedPct > 50 ? "bg-amber-300" : "bg-emerald-400"
                        }`}
                        style={{ width: `${usedPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-bold opacity-80">
                      <span>Deuda: {formatCurrency(debt)}</span>
                      <span>Límite: {formatCurrency(creditLimit)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Fila Inferior: Número Enmascarado + Marca */}
              <div className="flex items-end justify-between relative z-10 pt-1 border-t border-white/10">
                <div className="text-[11px] font-mono tracking-widest opacity-85">
                  •••• •••• •••• {wallet.name.match(/\d{4}/)?.[0] || "8492"}
                </div>
                <span className="text-xs font-black italic tracking-tighter opacity-90">
                  {theme.network}
                </span>
              </div>
            </div>
          );
        })}

        {/* Tarjeta de Agregar Nueva Cartera */}
        {onAddWalletClick && (
          <button
            onClick={onAddWalletClick}
            className="snap-center shrink-0 w-[240px] h-[180px] rounded-2xl p-5 border-2 border-dashed border-slate-300 dark:border-white/15 hover:border-brand-cerulean bg-slate-50/60 dark:bg-[#0F1626]/50 flex flex-col items-center justify-center gap-2.5 text-slate-500 dark:text-slate-400 hover:text-brand-cerulean transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-200/80 dark:bg-[#151E32] group-hover:bg-brand-cerulean group-hover:text-white flex items-center justify-center transition">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div className="text-center">
              <span className="text-xs font-bold block text-slate-900 dark:text-white">
                Nueva Cartera
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Banco, Débito o Crédito
              </span>
            </div>
          </button>
        )}
      </div>

      {/* Modal de Detalles de Tarjeta, Calendario y Transacciones */}
      <CardDetailsModal
        isOpen={!!inspectingWallet}
        onClose={() => setInspectingWallet(null)}
        wallet={inspectingWallet}
        transactions={transactions}
        onOpenNewTx={onOpenNewTx}
      />
    </div>
  );
}
