'use client';

import React, { useEffect } from 'react';
import { X, Receipt, Building2, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { Invoice } from '@/types/database';

interface InvoiceDetailsDrawerProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function InvoiceDetailsDrawer({ invoice, isOpen, onClose }: InvoiceDetailsDrawerProps) {
  // Evitar scroll en el body cuando el panel está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !invoice) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const items = invoice.items || [];

  return (
    <>
      {/* Overlay oscuro */}
      <div 
        className="fixed inset-0 bg-brand-carbon/40 dark:bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel lateral */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-brand-white dark:bg-brand-graphite shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-200 dark:border-zinc-800 flex flex-col overflow-hidden`}>
        
        {/* Header del Panel */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-cerulean/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-brand-cerulean" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-carbon dark:text-white">Detalle de Factura</h2>
              <p className="text-xs text-brand-graphite dark:text-zinc-400">UUID Interno: {invoice.id.split('-')[0]}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-brand-graphite dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          
          {/* Sección de Emisor y Montos Principales */}
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-brand-graphite dark:text-zinc-400 flex items-center gap-1.5 mb-1">
                  <Building2 className="w-4 h-4" /> Proveedor
                </p>
                <p className="font-bold text-brand-carbon dark:text-white text-lg">{invoice.nombre_emisor}</p>
                <p className="text-sm font-medium text-brand-graphite dark:text-zinc-500">{invoice.rfc_emisor}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {invoice.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-brand-graphite dark:text-zinc-400">
              <Calendar className="w-4 h-4" />
              {formatDate(invoice.fecha)}
            </div>

            {invoice.categories && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900">
                <div className={`w-2.5 h-2.5 rounded-full ${invoice.categories.color}`} />
                <span className="text-sm font-medium text-brand-carbon dark:text-zinc-300">{invoice.categories.name}</span>
              </div>
            )}
          </div>

          {/* Ticket de Compra (Conceptos) */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-gray-50 dark:bg-zinc-900/80 border-b border-gray-200 dark:border-zinc-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-graphite dark:text-zinc-400" />
              <h3 className="text-sm font-bold text-brand-carbon dark:text-white">Ticket de Compra</h3>
            </div>
            
            <div className="divide-y divide-gray-100 dark:divide-zinc-800/50">
              {items.length > 0 ? (
                items.map((item, index) => (
                  <div key={index} className="p-4 flex flex-col gap-2">
                    <p className="text-sm font-medium text-brand-carbon dark:text-zinc-200">{item.descripcion}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-brand-graphite dark:text-zinc-500">
                        {item.cantidad} x {formatCurrency(item.valor_unitario)}
                      </span>
                      <span className="font-semibold text-brand-carbon dark:text-zinc-300">
                        {formatCurrency(item.importe)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-brand-graphite dark:text-zinc-500">
                  No hay desglose de productos para esta factura.
                </div>
              )}
            </div>

            {/* Totales */}
            <div className="p-4 bg-gray-50 dark:bg-zinc-900/80 border-t border-gray-200 dark:border-zinc-800 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-brand-graphite dark:text-zinc-400">Subtotal</span>
                <span className="font-medium text-brand-carbon dark:text-zinc-300">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-graphite dark:text-zinc-400">IVA (Trasladado)</span>
                <span className="font-medium text-brand-carbon dark:text-zinc-300">{formatCurrency(invoice.iva)}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-gray-200 dark:border-zinc-700/50 flex justify-between items-center">
                <span className="font-bold text-brand-carbon dark:text-white">Total</span>
                <span className="text-lg font-black text-brand-cerulean dark:text-brand-cerulean">
                  {formatCurrency(invoice.total)}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </>
  );
}
