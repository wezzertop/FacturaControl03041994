"use client";

import React, { useRef, useState } from "react";
import CardDetailsModal from "./CardDetailsModal";
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
  Coins
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

  // Helper para asignar estética visual según nombre y tipo de tarjeta
  const getCardTheme = (wallet: WalletCardData) => {
    const name = (wallet.name || "").toLowerCase();
    
    if (name.includes("bbva")) {
      return {
        bg: "from-[#072146] via-[#004481] to-[#04152d]",
        badge: "BBVA",
        textColor: "text-white",
        chip: "bg-amber-300/80",
        brandLogo: "VISA",
      };
    }
    if (name.includes("nu ") || name.includes("nubank")) {
      return {
        bg: "from-[#820AD1] via-[#5B0891] to-[#2E0249]",
        badge: "Nu México",
        textColor: "text-white",
        chip: "bg-amber-200/90",
        brandLogo: "Mastercard",
      };
    }
    if (name.includes("santander")) {
      return {
        bg: "from-[#EC0000] via-[#A80000] to-[#5C0000]",
        badge: "Santander",
        textColor: "text-white",
        chip: "bg-amber-300/80",
        brandLogo: "Mastercard",
      };
    }
    if (name.includes("mercado") || name.includes("mp")) {
      return {
        bg: "from-[#009EE3] via-[#007EA7] to-[#003459]",
        badge: "Mercado Pago",
        textColor: "text-white",
        chip: "bg-amber-200/90",
        brandLogo: "VISA",
      };
    }
    if (wallet.type === "credit") {
      return {
        bg: "from-[#1E293B] via-[#0F172A] to-[#020617]",
        badge: "Crédito Platinum",
        textColor: "text-white",
        chip: "bg-amber-400/90",
        brandLogo: "Mastercard",
      };
    }
    if (wallet.type === "cash") {
      return {
        bg: "from-[#065F46] via-[#047857] to-[#064E3B]",
        badge: "Efectivo / Caja",
        textColor: "text-white",
        chip: "bg-emerald-300/80",
        brandLogo: "Cash",
      };
    }

    // Default Bank
    return {
      bg: "from-[#007EA7] via-[#003459] to-[#00171F]",
      badge: wallet.name,
      textColor: "text-white",
      chip: "bg-amber-300/80",
      brandLogo: "Débito",
    };
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
          const theme = getCardTheme(wallet);
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
              className={`snap-center shrink-0 w-[290px] sm:w-[320px] h-[185px] rounded-3xl p-5 bg-gradient-to-tr ${theme.bg} text-white shadow-xl relative overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 transform active:scale-95 ${
                isSelected
                  ? "ring-4 ring-brand-cerulean shadow-2xl scale-[1.02]"
                  : "hover:scale-[1.01] hover:shadow-2xl opacity-95 hover:opacity-100"
              }`}
            >
              {/* Reflejos de Luz y Textura de Fondo */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-36 h-36 rounded-full bg-brand-cerulean/20 blur-2xl pointer-events-none" />

              {/* Fila Superior: Nombre/Banco + Chip y Contactless */}
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider opacity-80 block">
                    {theme.badge}
                  </span>
                  <h4 className="text-sm font-extrabold tracking-tight truncate max-w-[170px]">
                    {wallet.name}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 opacity-75 rotate-90" />
                  <div className={`w-8 h-6 rounded-md ${theme.chip} border border-white/40 shadow-inner flex items-center justify-center`}>
                    <div className="w-5 h-3 border-t border-b border-black/20" />
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
                  {theme.brandLogo}
                </span>
              </div>
            </div>
          );
        })}

        {/* Tarjeta de Agregar Nueva Cartera */}
        {onAddWalletClick && (
          <div
            onClick={onAddWalletClick}
            className="snap-center shrink-0 w-[200px] sm:w-[220px] h-[185px] rounded-3xl border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-brand-cerulean dark:hover:border-brand-cerulean p-5 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-zinc-900/50 active:scale-95 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 group-hover:bg-brand-cerulean/15 group-hover:text-brand-cerulean text-slate-500 dark:text-zinc-400 flex items-center justify-center transition shadow-sm">
              <Plus className="w-6 h-6" />
            </div>
            <p className="text-xs font-black text-slate-700 dark:text-zinc-300 group-hover:text-brand-cerulean transition text-center">
              + Agregar Tarjeta o Cartera
            </p>
          </div>
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
