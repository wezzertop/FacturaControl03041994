"use client";

import React, { useState } from "react";
import { Download, FileSpreadsheet, X, Calendar, CheckCircle2 } from "lucide-react";

interface ExportTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: any[];
  wallets: any[];
}

export default function ExportTransactionsModal({
  isOpen,
  onClose,
  transactions = [],
  wallets = []
}: ExportTransactionsModalProps) {
  const [selectedWalletId, setSelectedWalletId] = useState<string>("all");
  const [dateRange, setDateRange] = useState<"all" | "this_month" | "last_month" | "year">("all");
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  if (!isOpen) return null;

  const handleExportCSV = () => {
    setIsExporting(true);

    const now = new Date();
    let filtered = [...transactions];

    if (selectedWalletId !== "all") {
      filtered = filtered.filter(t => t.wallet_id === selectedWalletId);
    }

    if (dateRange === "this_month") {
      filtered = filtered.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (dateRange === "last_month") {
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      filtered = filtered.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
      });
    } else if (dateRange === "year") {
      filtered = filtered.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === now.getFullYear();
      });
    }

    // Generar CSV
    const headers = ["ID", "Fecha", "Tipo", "Concepto", "Categoría", "Cartera", "Monto (MXN)"];
    const rows = filtered.map(t => {
      const wName = wallets.find(w => w.id === t.wallet_id)?.name || "Cartera";
      const catName = t.categories?.name || "Sin Categoría";
      const cleanConcept = `"${(t.concept || '').replace(/"/g, '""')}"`;
      return [
        t.id,
        t.date ? new Date(t.date).toISOString().split('T')[0] : '',
        t.type === 'income' ? 'Ingreso' : 'Egreso',
        cleanConcept,
        `"${catName}"`,
        `"${wName}"`,
        Number(t.amount || 0).toFixed(2)
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FacturaControl_Movimientos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExporting(false);
    setExported(true);
    setTimeout(() => {
      setExported(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="surface-card rounded-2xl p-6 max-w-md w-full border border-white/[0.08] shadow-2xl relative animate-slide-up bg-white dark:bg-[#000000] text-slate-900 dark:text-white space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] pb-3">
          <h3 className="text-base font-black flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            Exportar Historial Contable
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-zinc-400">
          Descarga un archivo CSV compatible con Excel, Google Sheets y sistemas contables con todos tus movimientos detallados.
        </p>

        <div className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-zinc-400 block mb-1">Filtrar por Cartera / Tarjeta</label>
            <select
              value={selectedWalletId}
              onChange={(e) => setSelectedWalletId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-white focus:outline-none"
            >
              <option value="all" className="bg-neutral-900 text-white">Todas las Carteras ({transactions.length} movimientos)</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id} className="bg-neutral-900 text-white">
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-400 block mb-1">Rango de Fecha</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "all", label: "Todo el Historial" },
                { id: "this_month", label: "Este Mes" },
                { id: "last_month", label: "Mes Anterior" },
                { id: "year", label: "Año en Curso" }
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setDateRange(r.id as any)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center ${
                    dateRange === r.id
                      ? "bg-white text-black border-white shadow-sm"
                      : "bg-slate-50 dark:bg-[#0A0A0C] text-zinc-400 border-white/[0.06] hover:text-white"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {exported && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            ¡Archivo CSV descargado con éxito!
          </div>
        )}

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={isExporting}
          className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 active:scale-95 min-h-[44px] mt-2"
        >
          <Download className="w-4 h-4 text-black" />
          {isExporting ? "Generando CSV..." : "Descargar Archivo CSV (Excel) 📊"}
        </button>

      </div>
    </div>
  );
}
