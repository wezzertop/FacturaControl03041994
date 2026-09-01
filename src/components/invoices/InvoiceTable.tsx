"use client";

import React, { useState, useEffect } from "react";
import { FileText, Search } from "lucide-react";
import InvoiceDetailsDrawer from "./InvoiceDetailsDrawer";

export interface InvoiceTableRow {
  id: string | number;
  nombre_emisor?: string | null;
  rfc_emisor?: string | null;
  total?: number | string | null;
  fecha?: string | null;
  status?: string | null;
  category_id?: string | null;
  description?: string | null;
  categories?: {
    id?: string | null;
    name?: string | null;
    color?: string | null;
  } | null;
  [key: string]: unknown;
}

interface InvoiceTableProps {
  invoices: InvoiceTableRow[];
  categories?: any[];
  providerMappings?: any[];
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

export default function InvoiceTable({ 
  invoices, 
  categories, 
  providerMappings = [], 
  compact = false 
}: InvoiceTableProps) {
  const [localInvoices, setLocalInvoices] = useState<InvoiceTableRow[]>(invoices);
  const [localProviderMappings, setLocalProviderMappings] = useState<any[]>(providerMappings);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceTableRow | null>(null);

  useEffect(() => {
    setLocalInvoices(invoices);
  }, [invoices]);

  useEffect(() => {
    setLocalProviderMappings(providerMappings);
  }, [providerMappings]);

  const getInvoiceDisplayName = (invoice: InvoiceTableRow) => {
    const mapping = localProviderMappings.find(
      m => m.rfc?.trim().toUpperCase() === invoice.rfc_emisor?.trim().toUpperCase()
    );
    return mapping ? mapping.commercial_name : (invoice.nombre_emisor || "Proveedor sin nombre");
  };

  if (localInvoices.length === 0) {
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
      {/* Mobile view */}
      <div className="md:hidden">
        <div className="grid grid-cols-1 gap-3">
          {localInvoices.map((invoice) => (
            <button
              key={`mobile-${invoice.id}`}
              type="button"
              onClick={() => setSelectedInvoice(invoice)}
              className="surface-card rounded-lg p-4 text-left transition active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                    {getInvoiceDisplayName(invoice)}
                  </h4>
                  <p className="mt-1 truncate text-[10px] text-slate-500 dark:text-slate-400">
                    {invoice.nombre_emisor && getInvoiceDisplayName(invoice) !== invoice.nombre_emisor 
                      ? invoice.nombre_emisor 
                      : (invoice.invoice_type === 'nomina' ? 'CFDI Nómina' : 'CFDI Egreso')}
                  </p>
                  {invoice.description && (
                    <p className="mt-1 text-[10px] text-brand-cerulean font-medium line-clamp-1 italic">
                      "{invoice.description}"
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-slate-950 dark:text-white">{formatCurrency(invoice.total)}</p>
                  <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{formatDate(invoice.fecha)}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/5">
                {invoice.categories ? (
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold text-white ${invoice.categories.color || "bg-slate-400"}`}>
                    {invoice.categories.name}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                    Sin clasificar
                  </span>
                )}
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  {invoice.status || "Vigente"}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop view */}
      <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white/80 shadow-sm dark:border-white/10 dark:bg-zinc-950/45 md:block">
        <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-white/10">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Search className="h-4 w-4" />
            {localInvoices.length} registro{localInvoices.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-white/5 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Proveedor / Comercio</th>
                <th className="px-5 py-3 font-semibold">Fecha</th>
                {!compact ? <th className="px-5 py-3 font-semibold">Categoría</th> : null}
                <th className="px-5 py-3 text-right font-semibold">Monto</th>
                <th className="px-5 py-3 text-center font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {localInvoices.map((invoice) => (
                <tr
                  key={`desktop-${invoice.id}`}
                  onClick={() => setSelectedInvoice(invoice)}
                  className="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <td className="max-w-[18rem] px-5 py-4 font-medium text-slate-900 dark:text-slate-100">
                    <span className="block truncate">{getInvoiceDisplayName(invoice)}</span>
                    {invoice.nombre_emisor && getInvoiceDisplayName(invoice) !== invoice.nombre_emisor ? (
                      <span className="block text-[10px] text-slate-400 truncate mt-0.5">{invoice.nombre_emisor}</span>
                    ) : null}
                    {invoice.description && (
                      <span className="block text-[10px] text-brand-cerulean font-medium truncate mt-0.5 italic">
                        "{invoice.description}"
                      </span>
                    )}
                  </td>
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
        categories={categories || []}
        providerMappings={localProviderMappings}
        onCategoryChange={(invoiceId, newCategoryId) => {
          const newCategory = (categories || []).find(c => c.id === newCategoryId);
          setLocalInvoices(prev => prev.map(inv => 
            inv.id === invoiceId 
              ? { ...inv, category_id: newCategoryId, categories: newCategory } 
              : inv
          ));
          if (selectedInvoice && selectedInvoice.id === invoiceId) {
            setSelectedInvoice(prev => prev ? { ...prev, category_id: newCategoryId, categories: newCategory } : null);
          }
        }}
        onProviderMappingChange={(rfc, newCommercialName) => {
          const upperRfc = rfc.trim().toUpperCase();
          setLocalProviderMappings(prev => {
            const exists = prev.some(m => m.rfc?.trim().toUpperCase() === upperRfc);
            if (exists) {
              if (!newCommercialName.trim()) {
                return prev.filter(m => m.rfc?.trim().toUpperCase() !== upperRfc);
              }
              return prev.map(m => m.rfc?.trim().toUpperCase() === upperRfc ? { ...m, commercial_name: newCommercialName } : m);
            } else {
              if (!newCommercialName.trim()) return prev;
              return [...prev, { rfc: upperRfc, commercial_name: newCommercialName }];
            }
          });
        }}
        onDescriptionChange={(invoiceId, newDescription) => {
          setLocalInvoices(prev => prev.map(inv => 
            inv.id === invoiceId 
              ? { ...inv, description: newDescription } 
              : inv
          ));
          if (selectedInvoice && selectedInvoice.id === invoiceId) {
            setSelectedInvoice(prev => prev ? { ...prev, description: newDescription } : null);
          }
        }}
      />
    </>
  );
}
