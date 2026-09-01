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
  const [tactileModalType, setTactileModalType] = useState<"expense" | "income" | "transfer">("expense");
  const [selectedTransactionToEdit, setSelectedTransactionToEdit] = useState<any | null>(null);
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

  const openTactileModal = (mode: "expense" | "income" | "transfer") => {
    setSelectedTransactionToEdit(null);
    setTactileModalType(mode);
    setTactileModalOpen(true);
  };

  const handleEditTransaction = (tx: any) => {
    setSelectedTransactionToEdit(tx);
    setTactileModalType(tx.type || "expense");
    setTactileModalOpen(true);
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
      rawTransaction?: any;
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
        rawTransaction: tx,
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

  return (
    <div className="space-y-4">
      {/* 1. Header Minimalista inspirado en Lukas (Mes + Privacidad + Avatar) */}
      <div className="surface-card rounded-2xl p-4 flex items-center justify-between gap-3">
        {/* Selector de Mes Cápsula */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#121216] px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08]">
          <button
            onClick={prevMonth}
            className="p-1 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider px-1.5">
            {MONTH_NAMES[selectedMonth]} {selectedYear}
          </span>
          <button
            onClick={nextMonth}
            className="p-1 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Controles: Ocultar Saldos (Modo Privacidad) + Avatar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHideBalances(!hideBalances)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-[#121216] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/[0.08] transition"
            title={hideBalances ? "Mostrar saldos" : "Ocultar saldos"}
          >
            {hideBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-emerald-400" />}
          </button>

          <div className="w-8 h-8 rounded-xl bg-white text-black font-black text-xs flex items-center justify-center shadow-md">
            FC
          </div>
        </div>
      </div>

      {/* 2. Buscador Rápido por Nombre o Categoría */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por comercio, concepto o categoría..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-zinc-500 focus:ring-1 focus:ring-white/40 focus:outline-none shadow-sm"
        />
      </div>

      {/* 3. Feed de Movimientos Agrupados por Fecha */}
      <div className="space-y-3">
        {groupedByDay.length === 0 ? (
          <div className="surface-card rounded-2xl p-6 text-center space-y-2">
            <Receipt className="w-8 h-8 mx-auto text-slate-400 dark:text-zinc-600 stroke-1" />
            <p className="text-xs font-bold text-slate-800 dark:text-zinc-300">
              No hay movimientos en {MONTH_NAMES[selectedMonth]} {selectedYear}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-500">
              Usa los botones de abajo para registrar tu primer gasto o ingreso.
            </p>
          </div>
        ) : (
          groupedByDay.map((group, idx) => (
            <div key={idx} className="space-y-1.5">
              {/* Encabezado del Día */}
              <div className="flex items-center justify-between px-2 pt-1">
                <span className="text-[11px] font-black capitalize tracking-wider text-slate-600 dark:text-zinc-400">
                  {group.dateLabel}
                </span>
                <span className={`text-[11px] font-black ${
                  group.totalDay >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-zinc-300"
                }`}>
                  {formatCurrency(group.totalDay)}
                </span>
              </div>

              {/* Lista de Transacciones del Día */}
              <div className="surface-card rounded-2xl divide-y divide-slate-100 dark:divide-white/[0.06] overflow-hidden">
                {group.items.map((item) => {
                  const Icon = getConceptIcon(item.concept);
                  return (
                    <div
                      key={item.id}
                      onClick={() => item.rawTransaction && handleEditTransaction(item.rawTransaction)}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-white/[0.04] active:bg-slate-100 dark:active:bg-white/[0.08] cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          item.type === "income"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-slate-100 dark:bg-[#141418] text-slate-700 dark:text-slate-200"
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.concept}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 truncate">
                              {item.categoryName}
                            </span>
                            {item.status === "pending" && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/20">
                                Pendiente
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={`text-xs font-black tracking-tight ${
                          item.type === "income"
                            ? "text-emerald-400"
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

      {/* 4. Tarjeta Flotante: Asistente Inteligente */}
      <div 
        onClick={() => setIsDetectorOpen(true)}
        className="surface-card rounded-2xl p-4 shadow-md bg-white dark:bg-[#0A0A0C] text-slate-900 dark:text-white cursor-pointer active:scale-98 transition flex items-center justify-between gap-3 group border border-slate-200 dark:border-white/[0.08]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-white/10 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              Asistente Rápido
              <span className="text-[9px] font-bold bg-white/10 text-slate-700 dark:text-zinc-300 px-1.5 py-0.5 rounded-md border border-white/10">
                IA
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              Pega un SMS de tu banco, escanea un ticket o captura tu gasto
            </p>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-slate-400 dark:text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition" />
      </div>

      {/* 5. Botones de Acción Ergonómicos: Gasto / Ingreso / Transferencia */}
      <div className="grid grid-cols-3 gap-2.5 pt-1">
        <button
          onClick={() => openTactileModal("expense")}
          className="p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/25 active:scale-95 transition flex flex-col items-center justify-center text-center gap-1.5"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/30">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-black text-rose-400 leading-tight">
            Gasto
          </p>
        </button>

        <button
          onClick={() => openTactileModal("income")}
          className="p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/25 active:scale-95 transition flex flex-col items-center justify-center text-center gap-1.5"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-black text-emerald-400 leading-tight">
            Ingreso
          </p>
        </button>

        <button
          onClick={() => openTactileModal("transfer")}
          className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 transition flex flex-col items-center justify-center text-center gap-1.5"
        >
          <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center shadow-md">
            <Repeat className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-black text-white leading-tight">
            Transferir
          </p>
        </button>
      </div>

      {/* Modales Montados */}
      <TactileTransactionModal
        isOpen={tactileModalOpen}
        onClose={() => {
          setTactileModalOpen(false);
          setSelectedTransactionToEdit(null);
        }}
        initialType={tactileModalType}
        transaction={selectedTransactionToEdit}
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
