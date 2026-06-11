'use client';

import React, { useState } from 'react';
import { Invoice } from '@/types/database';
import InvoiceDetailsDrawer from './InvoiceDetailsDrawer';

interface InvoiceTableProps {
  invoices: any[];
  compact?: boolean; // Si es true, muestra menos columnas (útil para dashboard)
}

export default function InvoiceTable({ invoices, compact = false }: InvoiceTableProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  };

  if (invoices.length === 0) {
    return (
      <div className="text-center py-16 bg-brand-white dark:bg-brand-graphite border border-gray-200 dark:border-zinc-800 rounded-xl">
        <h3 className="text-lg font-medium text-brand-carbon dark:text-white">Sin facturas</h3>
        <p className="text-sm text-brand-graphite dark:text-zinc-400 mt-2">Sube tu primer archivo XML para comenzar a visualizar tus datos.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-transparent md:bg-brand-white md:dark:bg-brand-graphite md:border md:border-gray-200 md:dark:border-zinc-800 rounded-xl md:overflow-hidden md:shadow-sm">
        
        {/* Vista Móvil (Tarjetas) */}
        <div className="grid grid-cols-1 gap-3 md:hidden pb-4">
          {invoices.map((inv) => (
            <div 
              key={`mobile-${inv.id}`}
              onClick={() => setSelectedInvoice(inv)}
              className="bg-brand-white dark:bg-brand-graphite border border-gray-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm active:scale-[0.98] transition-transform cursor-pointer flex flex-col gap-3"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-brand-carbon dark:text-white text-sm leading-tight line-clamp-2">
                    {inv.nombre_emisor}
                  </h4>
                  <p className="text-xs text-brand-graphite dark:text-zinc-400 mt-1 font-mono">{inv.rfc_emisor}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-brand-carbon dark:text-white text-base">
                    {formatCurrency(inv.total)}
                  </p>
                  <p className="text-[10px] text-brand-graphite dark:text-zinc-500 mt-1">{formatDate(inv.fecha)}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between border-t border-gray-100 dark:border-zinc-800/80 pt-3">
                {inv.categories ? (
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium text-white ${inv.categories.color}`}>
                    {inv.categories.name}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-300">
                    Sin clasificar
                  </span>
                )}
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  {inv.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Vista Escritorio (Tabla) */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-zinc-900 text-brand-graphite dark:text-zinc-400 font-medium border-b border-gray-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Proveedor (Emisor)</th>
                {!compact && <th className="px-6 py-4 font-semibold">RFC</th>}
                <th className="px-6 py-4 font-semibold">Fecha</th>
                {!compact && <th className="px-6 py-4 font-semibold">Categoría</th>}
                <th className="px-6 py-4 font-semibold text-right">Monto Total</th>
                <th className="px-6 py-4 font-semibold text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50">
              {invoices.map((inv) => (
                <tr 
                  key={`desktop-${inv.id}`} 
                  onClick={() => setSelectedInvoice(inv)}
                  className="hover:bg-brand-smoke/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 font-medium text-brand-carbon dark:text-zinc-200 group-hover:text-brand-cerulean transition-colors">{inv.nombre_emisor}</td>
                  {!compact && <td className="px-6 py-4 text-brand-graphite dark:text-zinc-400 font-mono text-xs">{inv.rfc_emisor}</td>}
                  <td className="px-6 py-4 text-brand-graphite dark:text-zinc-400">{formatDate(inv.fecha)}</td>
                  {!compact && (
                    <td className="px-6 py-4">
                      {inv.categories ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium text-white ${inv.categories.color}`}>
                          {inv.categories.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-300">
                          Sin clasificar
                        </span>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 text-right font-bold text-brand-carbon dark:text-white">
                    {formatCurrency(inv.total)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                      {inv.status}
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
