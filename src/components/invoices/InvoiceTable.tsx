"use client";

import React, { useState } from "react";
import { FileText, Search } from "lucide-react";
import InvoiceDetailsDrawer from "./InvoiceDetailsDrawer";

export interface InvoiceTableRow {
  id: string | number;
  nombre_emisor?: string | null;
  rfc_emisor?: string | null;
  total?: number | string | null;
  fecha?: string | null;
  status?: string | null;
  categories?: {
    name?: string | null;
    color?: string | null;
  } | null;
  [key: string]: unknown;
}

interface InvoiceTableProps {
  invoices: InvoiceTableRow[];
  compact?: boolean;
}

const formatCurrency = (amount: number | string | null | undefined) => {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(amount || 0));
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "Sin fecha";
  return new Date(dateString).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function InvoiceTable({ invoices, compact = false }: InvoiceTableProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceTableRow | null>(null);

  if (invoices.length === 0) {
    return (
      <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-slate-300 bg-white/60 p-8 text-center dark:border-white/10 dark:bg-white/5">
        <div className="max-w-sm">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-brand-cerulean/10 text-brand-cerulean">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">Sin facturas</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Sube tu primer XML para comenzar a visualizar montos, categorías y detalles fiscales.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="md:hidden">
        <div className="grid grid-cols-1 gap-3">
          {invoices.map((invoice) => (
            <button
              key={`mobile-${invoice.id}`}
              type="button"
              onClick={() => setSelectedInvoice(invoice)}
              className="surface-card rounded-lg p-4 text-left transition active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-semibold text-slate-950 dark:text-white">{invoice.nombre_emisor || "Proveedor sin nombre"}</h4>
                  <p className="mt-1 truncate font-mono text-xs text-slate-500 dark:text-slate-400">{invoice.rfc_emisor || "Sin RFC"}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-slate-950 dark:text-white">{formatCurrency(invoice.total)}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(invoice.fecha)}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-200/80 pt-3 dark:border-white/10">
                {invoice.categories ? (
                  <span className={`inline-flex max-w-[60%] items-center rounded-md px-2.5 py-1 text-xs font-semibold text-white ${invoice.categories.color || "bg-slate-400"}`}>
                    <span className="truncate">{invoice.categories.name || "Sin categoría"}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                    Sin clasificar
                  </span>
                )}
                <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-400">
                  {invoice.status || "procesada"}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white/80 shadow-sm dark:border-white/10 dark:bg-zinc-950/45 md:block">
        <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-white/10">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Search className="h-4 w-4" />
            {invoices.length} registro{invoices.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-white/5 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Proveedor</th>
                {!compact ? <th className="px-5 py-3 font-semibold">RFC</th> : null}
                <th className="px-5 py-3 font-semibold">Fecha</th>
                {!compact ? <th className="px-5 py-3 font-semibold">Categoría</th> : null}
                <th className="px-5 py-3 text-right font-semibold">Monto</th>
                <th className="px-5 py-3 text-center font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {invoices.map((invoice) => (
                <tr
                  key={`desktop-${invoice.id}`}
                  onClick={() => setSelectedInvoice(invoice)}
                  className="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <td className="max-w-[18rem] px-5 py-4 font-medium text-slate-900 dark:text-slate-100">
                    <span className="block truncate">{invoice.nombre_emisor || "Proveedor sin nombre"}</span>
                  </td>
                  {!compact ? <td className="px-5 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{invoice.rfc_emisor || "Sin RFC"}</td> : null}
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{formatDate(invoice.fecha)}</td>
                  {!compact ? (
                    <td className="px-5 py-4">
                      {invoice.categories ? (
                        <span className={`inline-flex max-w-40 items-center rounded-md px-2.5 py-1 text-xs font-semibold text-white ${invoice.categories.color || "bg-slate-400"}`}>
                          <span className="truncate">{invoice.categories.name || "Sin categoría"}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                          Sin clasificar
                        </span>
                      )}
                    </td>
                  ) : null}
                  <td className="px-5 py-4 text-right font-semibold text-slate-950 dark:text-white">{formatCurrency(invoice.total)}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-400">
                      {invoice.status || "procesada"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <InvoiceDetailsDrawer
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </>
  );
}
