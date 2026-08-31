"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Eye, 
  EyeOff, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Sparkles, 
  Receipt, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  Repeat,
  Plus,
  Tv,
  Film,
  Dumbbell,
  Smartphone,
  Home,
  Coffee,
  ShoppingBag,
  Fuel,
  HelpCircle
} from "lucide-react";
import TactileTransactionModal from "@/components/transactions/TactileTransactionModal";
import SmartTransactionDetectorModal from "@/components/wallets/SmartTransactionDetectorModal";

const MONTH_NAMES = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"
];

interface LukasMobileViewProps {
  wallets: any[];
  categories: any[];
  invoices: any[];
  transactions: any[];
  totalIncome: number;
  totalExpense: number;
  onRefresh?: () => void;
}

export default function LukasMobileView({
  wallets,
  categories,
  invoices,
  transactions,
  totalIncome,
  totalExpense,
  onRefresh,
}: LukasMobileViewProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [hideBalances, setHideBalances] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modales
  const [tactileModalOpen, setTactileModalOpen] = useState(false);
  const [tactileModalType, setTactileModalType] = useState<"expense" | "income">("expense");
  const [isDetectorOpen, setIsDetectorOpen] = useState(false);

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const formatCurrency = (val: number) => {
    if (hideBalances) return "••••••";
    return val.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  };

  // Helper para asignar icono de concepto dinámicamente
  const getConceptIcon = (concept: string) => {
    const c = concept.toLowerCase();
    if (c.includes("netflix") || c.includes("disney") || c.includes("spotify") || c.includes("hbo")) return Tv;
    if (c.includes("smartfit") || c.includes("gym") || c.includes("gimnasio")) return Dumbbell;
    if (c.includes("movistar") || c.includes("telcel") || c.includes("at&t") || c.includes("internet")) return Smartphone;
    if (c.includes("arriendo") || c.includes("renta") || c.includes("casa")) return Home;
    if (c.includes("starbucks") || c.includes("café") || c.includes("restaurante") || c.includes("comida")) return Coffee;
    if (c.includes("gasolina") || c.includes("pemex") || c.includes("shell")) return Fuel;
    if (c.includes("super") || c.includes("oxxo") || c.includes("walmart") || c.includes("soriana")) return ShoppingBag;
    return Receipt;
  };

  // Combinar transacciones manuales y facturas CFDI
  const allItems = useMemo(() => {
    const combined: Array<{
      id: string;
      concept: string;
      categoryName: string;
      amount: number;
      type: "income" | "expense";
      date: string;
      status: "paid" | "pending";
    }> = [];

    // Transacciones
    transactions.forEach((tx) => {
      combined.push({
        id: `tx_${tx.id}`,
        concept: tx.concept || "Movimiento",
        categoryName: tx.categories?.name || "General",
        amount: Number(tx.amount || 0),
        type: tx.type === "income" ? "income" : "expense",
        date: tx.date || new Date().toISOString(),
        status: (tx.concept || "").toLowerCase().includes("pendiente") ? "pending" : "paid",
      });
    });

    // Facturas
    invoices.forEach((inv) => {
      const isIncome = inv.invoice_type === "ingreso" || inv.invoice_type === "nomina";
      combined.push({
        id: `inv_${inv.id}`,
        concept: inv.nombre_emisor || "CFDI SAT",
        categoryName: inv.categories?.name || "Factura SAT",
        amount: Number(inv.total || 0),
        type: isIncome ? "income" : "expense",
        date: inv.fecha || inv.date || new Date().toISOString(),
        status: "paid",
      });
    });

    // Ordenar por fecha descendente
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, invoices]);

  // Filtrar por mes seleccionado y búsqueda
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const itemDate = new Date(item.date);
      const matchesMonth = itemDate.getMonth() === selectedMonth && itemDate.getFullYear() === selectedYear;
      const matchesSearch = searchQuery.trim() === "" || 
        item.concept.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesMonth && matchesSearch;
    });
  }, [allItems, selectedMonth, selectedYear, searchQuery]);

  // Agrupar movimientos por día (formato fecha corta ej. "Miércoles, 5 de Agosto")
  const groupedByDay = useMemo(() => {
    const groups: Record<string, { dateLabel: string; items: typeof filteredItems; totalDay: number }> = {};

    filteredItems.forEach((item) => {
      const d = new Date(item.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const dateLabel = d.toLocaleDateString("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "short",
      });

      if (!groups[key]) {
        groups[key] = { dateLabel, items: [], totalDay: 0 };
      }

      groups[key].items.push(item);
      const signedAmount = item.type === "income" ? item.amount : -item.amount;
      groups[key].totalDay += signedAmount;
    });

    return Object.values(groups);
  }, [filteredItems]);

  const openTactileModal = (mode: "expense" | "income") => {
    setTactileModalType(mode);
    setTactileModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Minimalista inspirado en Lukas (Mes + Privacidad + Avatar) */}
      <div className="surface-card rounded-3xl p-4 border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center justify-between gap-3">
        {/* Selector de Mes Cápsula */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-900 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-zinc-800">
          <button
            onClick={prevMonth}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider px-1">
            {MONTH_NAMES[selectedMonth]} {selectedYear}
          </span>
          <button
            onClick={nextMonth}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Controles: Ocultar Saldos (Modo Privacidad) + Avatar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHideBalances(!hideBalances)}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-800 transition"
            title={hideBalances ? "Mostrar saldos" : "Ocultar saldos"}
          >
            {hideBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-brand-cerulean" />}
          </button>

          <div className="w-9 h-9 rounded-2xl bg-brand-cerulean text-white font-black text-xs flex items-center justify-center shadow-md">
            FC
          </div>
        </div>
      </div>

      {/* 2. Buscador Rápido por Nombre o Categoría */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por comercio, concepto o categoría..."
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-cerulean focus:outline-none shadow-sm"
        />
      </div>

      {/* 3. Feed de Movimientos Agrupados por Fecha */}
      <div className="space-y-4">
        {groupedByDay.length === 0 ? (
          <div className="surface-card rounded-3xl p-8 border border-slate-200/80 dark:border-white/10 text-center space-y-2">
            <Receipt className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-700 stroke-1" />
            <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              No hay movimientos en {MONTH_NAMES[selectedMonth]} {selectedYear}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-500">
              Usa los botones de abajo para registrar tu primer gasto o ingreso.
            </p>
          </div>
        ) : (
          groupedByDay.map((group, idx) => (
            <div key={idx} className="space-y-2">
              {/* Encabezado del Día */}
              <div className="flex items-center justify-between px-2 pt-1">
                <span className="text-[11px] font-black capitalize tracking-wider text-slate-500 dark:text-zinc-400">
                  {group.dateLabel}
                </span>
                <span className={`text-[11px] font-black ${
                  group.totalDay >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-zinc-400"
                }`}>
                  {formatCurrency(group.totalDay)}
                </span>
              </div>

              {/* Lista de Transacciones del Día */}
              <div className="surface-card rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm divide-y divide-slate-100 dark:divide-zinc-800/80 overflow-hidden">
                {group.items.map((item) => {
                  const Icon = getConceptIcon(item.concept);
                  return (
                    <div
                      key={item.id}
                      className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                          item.type === "income"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {item.concept}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 truncate">
                              {item.categoryName}
                            </span>
                            {item.status === "pending" && (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/20">
                                Pendiente
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={`text-sm font-black tracking-tight ${
                          item.type === "income"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-900 dark:text-white"
                        }`}>
                          {item.type === "income" ? "+" : "-"} {formatCurrency(item.amount)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Tarjeta Flotante: Asistente Inteligente (Inspirada en Lukas) */}
      <div 
        onClick={() => setIsDetectorOpen(true)}
        className="surface-card rounded-3xl p-4 border border-brand-cerulean/30 shadow-md bg-gradient-to-r from-slate-900 to-zinc-950 text-white cursor-pointer active:scale-98 transition flex items-center justify-between gap-3 group"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-cerulean to-blue-500 text-white flex items-center justify-center shadow-lg shadow-brand-cerulean/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white flex items-center gap-1.5">
              Asistente Rápido
              <span className="text-[9px] font-bold bg-brand-cerulean/20 text-brand-cerulean px-2 py-0.5 rounded-full border border-brand-cerulean/30">
                IA
              </span>
            </h4>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Pega un SMS de tu banco, escanea un ticket o captura tu gasto
            </p>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition" />
      </div>

      {/* 5. Dos Botones de Acción Ergonómicos en la Parte Inferior (Expense / Income) */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={() => openTactileModal("expense")}
          className="p-4 rounded-3xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 active:scale-95 transition flex items-center gap-3.5 group text-left"
        >
          <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/30">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-black text-rose-600 dark:text-rose-400 leading-tight">
              Gasto
            </p>
            <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
              Manual
            </p>
          </div>
        </button>

        <button
          onClick={() => openTactileModal("income")}
          className="p-4 rounded-3xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 active:scale-95 transition flex items-center gap-3.5 group text-left"
        >
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 leading-tight">
              Ingreso
            </p>
            <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
              Manual
            </p>
          </div>
        </button>
      </div>

      {/* Modales Montados */}
      <TactileTransactionModal
        isOpen={tactileModalOpen}
        onClose={() => setTactileModalOpen(false)}
        initialType={tactileModalType}
        wallets={wallets}
        categories={categories}
        onSuccess={onRefresh}
      />

      <SmartTransactionDetectorModal
        isOpen={isDetectorOpen}
        onClose={() => setIsDetectorOpen(false)}
        wallets={wallets}
        categories={categories}
        onTransactionCreated={onRefresh}
      />
    </div>
  );
}
