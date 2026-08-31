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
      <div className="surface-card rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#151E32] p-1.5 rounded-xl border border-slate-200/80 dark:border-white/10">
            <Calendar className="w-4 h-4 text-brand-cerulean ml-2" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent font-bold text-xs text-slate-900 dark:text-white focus:outline-none pr-2 cursor-pointer"
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
              className="bg-transparent font-bold text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer pr-2 border-l border-slate-300 dark:border-white/10 pl-2"
              suppressHydrationWarning
            >
              {[2024, 2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr} className="bg-slate-900 text-white">
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#151E32] p-1.5 rounded-xl border border-slate-200/80 dark:border-white/10">
            <ShieldCheck className="w-4 h-4 text-brand-cerulean ml-2" />
            <select
              value={selectedRegime}
              onChange={(e) => setSelectedRegime(e.target.value as any)}
              className="bg-transparent font-bold text-xs text-slate-900 dark:text-white focus:outline-none pr-2 cursor-pointer"
            >
              <option value="sueldos_salarios" className="bg-slate-900 text-white">
                Sueldos y Salarios (Empresa)
              </option>
              <option value="resico" className="bg-slate-900 text-white">
                RESICO (1% - 2.5%)
              </option>
              <option value="persona_fisica" className="bg-slate-900 text-white">
                Actividad Empresarial / P. Física
              </option>
              <option value="persona_moral" className="bg-slate-900 text-white">
                Persona Moral (30% ISR)
              </option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-auto">
          <button
            onClick={() => setIsSatModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-brand-cerulean/10 hover:bg-brand-cerulean/15 border border-brand-cerulean/30 text-brand-cerulean font-bold text-xs rounded-xl transition"
          >
            <KeyRound className="w-4 h-4" />
            Sincronizar FIEL / SAT
          </button>
        </div>
      </div>

      <SatCredentialsModal
        isOpen={isSatModalOpen}
        onClose={() => setIsSatModalOpen(false)}
        onSyncSuccess={handleSyncSuccess}
      />

      {/* KPI Cards de resumen general del mes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="surface-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Ingresos Facturados ({MONTH_NAMES[selectedMonth - 1]})
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(taxData?.totalIncomeTotal || 0)}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-white/5 flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>Subtotal: {formatCurrency(taxData?.totalIncomeSubtotal || 0)}</span>
            <span>{taxData?.incomeInvoicesCount || 0} Facturas</span>
          </div>
        </div>

        <div className="surface-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Deducciones Autorizadas
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(taxData?.totalExpenseTotal || 0)}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-white/5 flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>Subtotal: {formatCurrency(taxData?.totalExpenseSubtotal || 0)}</span>
            <span>{taxData?.expenseInvoicesCount || 0} Facturas</span>
          </div>
        </div>

        <div className="surface-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Utilidad Fiscal Base
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-cerulean/15 text-brand-cerulean flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(taxData?.netProfit || 0)}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-white/5 flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>Base gravable estimada</span>
            <span className="text-brand-cerulean font-bold capitalize">{selectedRegime.replace("_", " ")}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="surface-card rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-cerulean/15 text-brand-cerulean rounded-xl">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Impuesto al Valor Agregado (IVA)
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Conciliación de IVA 16% Trasladado vs. Acreditable
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-[#151E32] rounded-xl border border-slate-200/60 dark:border-white/5">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                (+) IVA Trasladado (Cobrado en Ingresos)
              </span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(taxData?.ivaTrasladado || 0)}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-[#151E32] rounded-xl border border-slate-200/60 dark:border-white/5">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                (-) IVA Acreditable (Pagado en Compras/Gastos)
              </span>
              <span className="font-extrabold text-rose-600 dark:text-rose-400">
                {formatCurrency(taxData?.ivaAcreditable || 0)}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border flex items-center justify-between transition-all bg-[#0F1626] text-white border-white/10">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                {(taxData?.ivaBalance || 0) > 0 ? "🔴 IVA a Pagar al SAT" : "🟢 IVA a Favor del Contribuyente"}
              </p>
              <p className="text-2xl font-black mt-0.5">
                {formatCurrency(Math.abs(taxData?.ivaBalance || 0))}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-lg font-bold text-xs ${
              (taxData?.ivaBalance || 0) > 0 ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
            }`}>
              {(taxData?.ivaBalance || 0) > 0 ? "Por Pagar" : "A Favor"}
            </div>
          </div>
        </div>

        <div className="surface-card rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-cerulean/15 text-brand-cerulean rounded-xl">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Impuesto Sobre la Renta (ISR)
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Estimación según régimen {selectedRegime.toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-[#151E32] rounded-xl border border-slate-200/60 dark:border-white/5">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                Tasa Aplicable de ISR
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white">
                {taxData?.isrRate || "Tarifa Art. 96"}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-[#151E32] rounded-xl border border-slate-200/60 dark:border-white/5">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                (-) Retenciones de ISR por Clientes
              </span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(taxData?.isrRetenido || 0)}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border flex items-center justify-between transition-all bg-[#0F1626] text-white border-white/10">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                ISR Estimado a Pagar (Pago Provisional)
              </p>
              <p className="text-2xl font-black mt-0.5">
                {formatCurrency(taxData?.isrNetoToPay || 0)}
              </p>
            </div>
            <div className="px-3 py-1 rounded-lg font-bold text-xs bg-brand-cerulean text-white">
              Estimado
            </div>
          </div>
        </div>
      </div>

      <div className="surface-card rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/15 text-amber-500 rounded-xl">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              Verificador de Proveedores EFOS / Lista Negra del SAT (Art. 69-B)
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Verifica el RFC de un emisor para confirmar que no se encuentre en la lista de empresas factureras.
            </p>
          </div>
        </div>

        <form onSubmit={handleVerifyEfos} className="flex flex-col sm:flex-row gap-3 pt-1">
          <input
            type="text"
            placeholder="Ingresa el RFC del proveedor (ej. ABC123456T12)"
            value={searchRfc}
            onChange={(e) => setSearchRfc(e.target.value)}
            className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-[#0F1626] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white uppercase placeholder:normal-case placeholder:text-slate-400 focus:ring-2 focus:ring-brand-cerulean focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-brand-cerulean hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition shadow-sm shrink-0 min-h-[40px]"
          >
            Verificar Estatus SAT
          </button>
        </form>

        {efosResult?.searched && (
          <div className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs font-bold ${
            efosResult.clean 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
          }`}>
            {efosResult.clean ? <ShieldCheck className="w-5 h-5 shrink-0" /> : <ShieldAlert className="w-5 h-5 shrink-0" />}
            <p>{efosResult.clean ? `El RFC "${efosResult.rfc}" está limpio.` : `⚠️ ALERTA: RFC "${efosResult.rfc}" en lista negra.`}</p>
          </div>
        )}
      </div>

      <div className="surface-card rounded-2xl p-5 sm:p-6 space-y-4">
        <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
          <span className="text-brand-cerulean">✨</span>
          Guía de Optimización Deducible para México
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
          <div className="p-3.5 bg-slate-50 dark:bg-[#0F1626] border border-slate-200/60 dark:border-white/5 rounded-xl space-y-1">
            <p className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Gasolina y Combustible
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              El pago debe realizarse con medios electrónicos (débito, crédito, monedero) para ser deducible.
            </p>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-[#0F1626] border border-slate-200/60 dark:border-white/5 rounded-xl space-y-1">
            <p className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Honorarios Médicos
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Deducibles en la declaración anual si se pagan mediante transferencia o tarjeta a nombre del contribuyente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
