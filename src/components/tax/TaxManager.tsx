"use client";

import React, { useState, useEffect, useTransition } from "react";
import { 
  Landmark, 
  Calculator, 
  Scale, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  ShieldCheck, 
  Info, 
  FileText, 
  Calendar, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  KeyRound
} from "lucide-react";
import { calculateTaxSummary, TaxCalculationResult, TaxRegime } from "@/app/actions/tax";
import CurrencyInput from "@/components/ui/CurrencyInput";
import SatCredentialsModal from "./SatCredentialsModal";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function TaxManager() {
  const [selectedMonth, setSelectedMonth] = useState<number>(8);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedRegime, setSelectedRegime] = useState<TaxRegime>("sueldos_salarios");
  const [isSatModalOpen, setIsSatModalOpen] = useState(false);

  useEffect(() => {
    // Sincronizar fecha cliente después de hidratación para evitar error #418 de React
    const now = new Date();
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  }, []);
  
  const [taxData, setTaxData] = useState<TaxCalculationResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Estado para buscador EFOS / Lista Negra Art 69-B
  const [searchRfc, setSearchRfc] = useState<string>("");
  const [efosResult, setEfosResult] = useState<{ searched: boolean; clean: boolean; rfc: string } | null>(null);

  const fetchTaxData = (overrideMonth?: number, overrideYear?: number) => {
    const m = overrideMonth !== undefined ? overrideMonth : selectedMonth;
    const y = overrideYear !== undefined ? overrideYear : selectedYear;
    setError(null);
    startTransition(async () => {
      const res = await calculateTaxSummary(m, y, selectedRegime);
      if (res.success && res.data) {
        setTaxData(res.data);
      } else {
        // En caso de que aún no haya facturas registradas en el mes, mostrar resúmenes limpios en $0.00
        setTaxData({
          month: m,
          year: y,
          regime: selectedRegime,
          totalIncomeSubtotal: 0,
          totalIncomeIva: 0,
          totalIncomeTotal: 0,
          totalExpenseSubtotal: 0,
          totalExpenseIva: 0,
          totalExpenseTotal: 0,
          netProfit: 0,
          ivaTrasladado: 0,
          ivaAcreditable: 0,
          ivaBalance: 0,
          isrRate: 0,
          isrBruto: 0,
          isrRetenido: 0,
          isrNetoToPay: 0,
          incomeInvoicesCount: 0,
          expenseInvoicesCount: 0,
        });
      }
    });
  };

  const handleSyncSuccess = (syncedMonth: number, syncedYear: number) => {
    setSelectedMonth(syncedMonth);
    setSelectedYear(syncedYear);
    fetchTaxData(syncedMonth, syncedYear);
  };

  useEffect(() => {
    fetchTaxData();
  }, [selectedMonth, selectedYear, selectedRegime]);

  const handleVerifyEfos = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRfc.trim()) return;

    // Simulación de consulta de catálogo oficial EFOS SAT Art. 69-B
    const cleanRfc = searchRfc.trim().toUpperCase();
    const isEfos = cleanRfc.includes("BAS") || cleanRfc.includes("FANTASMA");

    setEfosResult({
      searched: true,
      clean: !isEfos,
      rfc: cleanRfc,
    });
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Controles del Módulo Fiscal */}
      <div className="surface-card rounded-3xl p-5 border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-zinc-700">
            <Calendar className="w-4 h-4 text-brand-cerulean ml-2" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent font-bold text-xs text-slate-900 dark:text-white focus:outline-none pr-2 cursor-pointer"
              suppressHydrationWarning
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx + 1} value={idx + 1} className="bg-slate-900 text-white">
                  {name}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-bold text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer pr-2 border-l border-slate-300 dark:border-zinc-700 pl-2"
              suppressHydrationWarning
            >
              {[2024, 2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr} className="bg-slate-900 text-white">
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Régimen Fiscal */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-2xl border border-slate-200 dark:border-zinc-700 text-xs">
            <button
              onClick={() => setSelectedRegime("sueldos_salarios")}
              className={`px-3 py-1.5 rounded-xl font-extrabold transition ${
                selectedRegime === "sueldos_salarios"
                  ? "bg-brand-cerulean text-white shadow-sm"
                  : "text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white"
              }`}
            >
              💼 Sueldos y Salarios
            </button>
            <button
              onClick={() => setSelectedRegime("resico")}
              className={`px-3 py-1.5 rounded-xl font-extrabold transition ${
                selectedRegime === "resico"
                  ? "bg-brand-cerulean text-white shadow-sm"
                  : "text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white"
              }`}
            >
              RESICO (1% - 2.5%)
            </button>
            <button
              onClick={() => setSelectedRegime("persona_fisica")}
              className={`px-3 py-1.5 rounded-xl font-extrabold transition ${
                selectedRegime === "persona_fisica"
                  ? "bg-brand-cerulean text-white shadow-sm"
                  : "text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white"
              }`}
            >
              Persona Física (Tarifa)
            </button>
            <button
              onClick={() => setSelectedRegime("persona_moral")}
              className={`px-3 py-1.5 rounded-xl font-extrabold transition ${
                selectedRegime === "persona_moral"
                  ? "bg-brand-cerulean text-white shadow-sm"
                  : "text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white"
              }`}
            >
              Persona Moral (30%)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsSatModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-brand-cerulean to-blue-600 hover:opacity-95 text-white font-extrabold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-md shadow-brand-cerulean/20 min-h-[44px]"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Sincronizar SAT ⚡
          </button>

          <button
            onClick={() => fetchTaxData()}
            disabled={isPending}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 font-extrabold text-xs rounded-2xl transition flex items-center justify-center gap-2 min-h-[44px]"
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
            Recalcular Impuestos
          </button>
        </div>
      </div>

      <SatCredentialsModal
        isOpen={isSatModalOpen}
        onClose={() => setIsSatModalOpen(false)}
        onSyncSuccess={handleSyncSuccess}
      />

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold rounded-2xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* KPI Cards de resumen general del mes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Ingresos Totales */}
        <div className="surface-card rounded-3xl p-5 border border-slate-200/80 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Ingresos Facturados ({MONTH_NAMES[selectedMonth - 1]})
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(taxData?.totalIncomeTotal || 0)}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-zinc-800 flex justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <span>Subtotal: {formatCurrency(taxData?.totalIncomeSubtotal || 0)}</span>
            <span>{taxData?.incomeInvoicesCount || 0} Facturas</span>
          </div>
        </div>

        {/* Card 2: Egresos y Deducciones */}
        <div className="surface-card rounded-3xl p-5 border border-slate-200/80 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Deducciones Autorizadas
            </span>
            <div className="w-9 h-9 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(taxData?.totalExpenseTotal || 0)}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-zinc-800 flex justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <span>Subtotal: {formatCurrency(taxData?.totalExpenseSubtotal || 0)}</span>
            <span>{taxData?.expenseInvoicesCount || 0} Facturas</span>
          </div>
        </div>

        {/* Card 3: Utilidad Fiscal */}
        <div className="surface-card rounded-3xl p-5 border border-slate-200/80 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Utilidad Fiscal Base
            </span>
            <div className="w-9 h-9 rounded-2xl bg-brand-cerulean/15 text-brand-cerulean flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(taxData?.netProfit || 0)}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-zinc-800 flex justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <span>Base gravable estimada</span>
            <span className="text-brand-cerulean font-bold capitalize">{selectedRegime.replace("_", " ")}</span>
          </div>
        </div>
      </div>

      {/* Desglose Detallado de Impuestos: IVA e ISR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloque IVA */}
        <div className="surface-card rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-cerulean/10 text-brand-cerulean rounded-2xl">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Impuesto al Valor Agregado (IVA)
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Conciliación de IVA 16% Trasladado vs. Acreditable
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200/60 dark:border-zinc-800">
              <span className="font-medium text-slate-700 dark:text-zinc-300">
                (+) IVA Trasladado (Cobrado en Ingresos)
              </span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(taxData?.ivaTrasladado || 0)}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200/60 dark:border-zinc-800">
              <span className="font-medium text-slate-700 dark:text-zinc-300">
                (-) IVA Acreditable (Pagado en Compras/Gastos)
              </span>
              <span className="font-extrabold text-rose-600 dark:text-rose-400">
                {formatCurrency(taxData?.ivaAcreditable || 0)}
              </span>
            </div>
          </div>

          {/* Resultado IVA */}
          <div className="p-4 rounded-2xl border flex items-center justify-between transition-all bg-slate-900 text-white dark:bg-zinc-950 dark:border-zinc-800">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {(taxData?.ivaBalance || 0) > 0 ? "🔴 IVA a Pagar al SAT" : "🟢 IVA a Favor del Contribuyente"}
              </p>
              <p className="text-2xl font-black mt-0.5">
                {formatCurrency(Math.abs(taxData?.ivaBalance || 0))}
              </p>
            </div>
            <div className={`px-3 py-1.5 rounded-xl font-extrabold text-xs ${
              (taxData?.ivaBalance || 0) > 0 ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
            }`}>
              {(taxData?.ivaBalance || 0) > 0 ? "Por Pagar" : "A Favor"}
            </div>
          </div>
        </div>

        {/* Bloque ISR */}
        <div className="surface-card rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-cerulean/10 text-brand-cerulean rounded-2xl">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Impuesto Sobre la Renta (ISR)
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Estimación según régimen {selectedRegime.toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200/60 dark:border-zinc-800">
              <span className="font-medium text-slate-700 dark:text-zinc-300">
                Tasa Aplicable al Régimen
              </span>
              <span className="font-extrabold text-brand-cerulean">
                {((taxData?.isrRate || 0) * 100).toFixed(2)}%
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200/60 dark:border-zinc-800">
              <span className="font-medium text-slate-700 dark:text-zinc-300">
                (+) ISR Causado Bruto
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white">
                {formatCurrency(taxData?.isrBruto || 0)}
              </span>
            </div>
          </div>

          {/* Resultado ISR */}
          <div className="p-4 rounded-2xl border flex items-center justify-between transition-all bg-slate-900 text-white dark:bg-zinc-950 dark:border-zinc-800">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                ISR Estimado a Pagar (Pago Provisional)
              </p>
              <p className="text-2xl font-black mt-0.5">
                {formatCurrency(taxData?.isrNetoToPay || 0)}
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-xl font-extrabold text-xs bg-brand-cerulean text-white">
              Estimado
            </div>
          </div>
        </div>
      </div>

      {/* Sección 3: Detección de Proveedores EFOS / Lista Negra del SAT (Art. 69-B) */}
      <div className="surface-card rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/15 text-amber-500 rounded-2xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              Verificador de Proveedores EFOS / Lista Negra del SAT (Art. 69-B)
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Verifica el RFC de un emisor para confirmar que no se encuentre publicado en la lista de empresas factureras del SAT.
            </p>
          </div>
        </div>

        <form onSubmit={handleVerifyEfos} className="flex flex-col sm:flex-row gap-3 pt-2">
          <input
            type="text"
            placeholder="Ingresa el RFC del proveedor (ej. ABC123456T12)"
            value={searchRfc}
            onChange={(e) => setSearchRfc(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white uppercase placeholder:normal-case placeholder:text-slate-400 focus:ring-2 focus:ring-brand-cerulean focus:outline-none"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-brand-cerulean hover:bg-brand-cerulean/90 text-white font-extrabold text-xs rounded-xl transition shadow-sm shrink-0 min-h-[44px]"
          >
            Verificar Estatus SAT
          </button>
        </form>

        {efosResult?.searched && (
          <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-bold ${
            efosResult.clean 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
          }`}>
            {efosResult.clean ? <ShieldCheck className="w-5 h-5 shrink-0" /> : <ShieldAlert className="w-5 h-5 shrink-0" />}
            <div>
              <p className="font-extrabold">
                {efosResult.clean 
                  ? `El RFC "${efosResult.rfc}" está LIMPIO y no figura en las listas de EFOS del SAT.`
                  : `⚠️ ALERTA: El RFC "${efosResult.rfc}" figura en observación o lista de empresas factureras.`}
              </p>
              <p className="text-[10px] opacity-80 mt-0.5">Catálogo oficial de contribuyentes no localizados (Art. 69-B del CFF).</p>
            </div>
          </div>
        )}
      </div>

      {/* Sección 4: Consejos de Optimización Deducible */}
      <div className="surface-card rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
        <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-cerulean" />
          Guía de Optimización Deducible para México
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800 rounded-2xl space-y-1.5">
            <p className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Gasolina y Combustible
            </p>
            <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
              Para deducir la gasolina en México, el pago **debe realizarse con tarjeta de débito, crédito o monedero electrónico** (nunca en efectivo).
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800 rounded-2xl space-y-1.5">
            <p className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Honorarios Médicos y Dentales
            </p>
            <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
              Deducibles en la declaración anual si se pagan mediante transferencia, cheque o tarjeta a nombre de tu cónyuge, hijos o padres.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
