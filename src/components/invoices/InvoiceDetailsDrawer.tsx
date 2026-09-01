'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { X, Receipt, Building2, Calendar, FileText, CheckCircle2, ChevronDown, Check } from 'lucide-react';
import { updateInvoiceCategory } from '@/app/actions/invoices';

interface InvoiceDetailsDrawerProps {
  invoice: any | null;
  isOpen: boolean;
  onClose: () => void;
  categories: any[];
  providerMappings?: any[];
  onCategoryChange?: (invoiceId: string, newCategoryId: string) => void;
  onProviderMappingChange?: (rfc: string, newCommercialName: string) => void;
  onDescriptionChange?: (invoiceId: string, newDescription: string) => void;
}

export default function InvoiceDetailsDrawer({ 
  invoice, 
  isOpen, 
  onClose, 
  categories, 
  providerMappings = [],
  onCategoryChange,
  onProviderMappingChange,
  onDescriptionChange
}: InvoiceDetailsDrawerProps) {
  const [isPending, startTransition] = useTransition();

  const [commNameInput, setCommNameInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');

  // Sincronizar campos de entrada cuando cambia el invoice seleccionado o sus mapeos
  useEffect(() => {
    if (invoice) {
      const mapping = providerMappings.find(
        m => m.rfc?.trim().toUpperCase() === invoice.rfc_emisor?.trim().toUpperCase()
      );
      setCommNameInput(mapping ? mapping.commercial_name : '');
      setDescriptionInput(invoice.description || '');
    }
  }, [invoice, providerMappings]);

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

  const handleCategoryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategoryId = e.target.value;
    if (!invoice || !newCategoryId) return;

    startTransition(async () => {
      const res = await updateInvoiceCategory(invoice.id, newCategoryId);
      if (res.success) {
        if (onCategoryChange) {
          onCategoryChange(invoice.id, newCategoryId);
        }
      } else {
        alert(res.error || 'No se pudo actualizar la categoría');
      }
    });
  };

  const handleUpsertCommercialName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice.rfc_emisor) return;

    startTransition(async () => {
      const { upsertProviderMapping } = await import('@/app/actions/invoices');
      const res = await upsertProviderMapping(invoice.rfc_emisor, commNameInput);
      if (res.success) {
        if (onProviderMappingChange) {
          onProviderMappingChange(invoice.rfc_emisor, commNameInput);
        }
      } else {
        alert(res.error || 'Error al guardar el nombre comercial');
      }
    });
  };

  const handleUpdateDescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice.id) return;

    startTransition(async () => {
      const { updateInvoiceDescription } = await import('@/app/actions/invoices');
      const res = await updateInvoiceDescription(invoice.id, descriptionInput);
      if (res.success) {
        if (onDescriptionChange) {
          onDescriptionChange(invoice.id, descriptionInput);
        }
      } else {
        alert(res.error || 'Error al guardar la descripción');
      }
    });
  };

  const items = invoice.items || [];
  const currentCategoryId = invoice.category_id || invoice.categories?.id || '';

  return (
    <>
      {/* Overlay oscuro */}
      <div 
        className="fixed inset-0 bg-brand-carbon/40 dark:bg-black/60 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />

      {/* Panel lateral */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-brand-white dark:bg-brand-graphite shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out border-l border-gray-200 dark:border-zinc-800 flex flex-col overflow-hidden`}>
        
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
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          {/* Sección de Emisor y Montos Principales */}
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-brand-graphite dark:text-zinc-400 flex items-center gap-1.5 mb-1">
                  <Building2 className="w-4 h-4" /> Proveedor (Razón Social)
                </p>
                <p className="font-bold text-brand-carbon dark:text-white text-base leading-snug">{invoice.nombre_emisor}</p>
                <p className="text-xs font-semibold text-brand-graphite dark:text-zinc-500 font-mono mt-0.5">{invoice.rfc_emisor}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {invoice.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-brand-graphite dark:text-zinc-400">
              <Calendar className="w-4 h-4" />
              {formatDate(invoice.fecha)}
            </div>

            {/* Categoría Seleccionable */}
            <div className="flex flex-col space-y-1.5 pt-2">
              <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Categoría de la Factura</label>
              <div className="relative">
                <select
                  value={currentCategoryId}
                  onChange={handleCategoryChange}
                  disabled={isPending}
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white appearance-none disabled:opacity-50 font-medium"
                >
                  <option value="" disabled>Selecciona una categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Configurar Nombre Comercial (Alias de Proveedor) */}
            <form onSubmit={handleUpsertCommercialName} className="flex flex-col space-y-1.5 pt-2">
              <label className="text-[10px] font-bold text-gray-650 dark:text-zinc-400 uppercase tracking-wider">Nombre Comercial (Alias de Proveedor)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commNameInput}
                  onChange={(e) => setCommNameInput(e.target.value)}
                  placeholder="Ej. Domino's Pizza"
                  className="flex-1 px-3 py-2.5 text-xs border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white font-medium"
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-3.5 py-2.5 bg-brand-cerulean hover:bg-brand-cerulean/90 text-white rounded-xl text-xs font-bold transition flex items-center justify-center shrink-0 disabled:opacity-50"
                  title="Guardar nombre comercial"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
              <span className="text-[9px] text-gray-400">Personaliza el nombre de este comercio para todas sus facturas futuras.</span>
            </form>

            {/* Descripción del Gasto */}
            <form onSubmit={handleUpdateDescription} className="flex flex-col space-y-1.5 pt-2">
              <label className="text-[10px] font-bold text-gray-650 dark:text-zinc-400 uppercase tracking-wider">Descripción o Notas del Gasto</label>
              <div className="flex gap-2 items-end">
                <textarea
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  placeholder="Ej. Cena familiar con mi esposa o compra de insumos"
                  rows={2}
                  className="flex-1 px-3 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white font-medium resize-none"
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-3.5 py-2 bg-brand-cerulean hover:bg-brand-cerulean/90 text-white rounded-xl text-xs font-bold transition flex items-center justify-center shrink-0 h-9 disabled:opacity-50"
                  title="Guardar descripción"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
              <span className="text-[9px] text-gray-400">Añade una descripción específica para saber en qué consistió este gasto.</span>
            </form>
          </div>

          {/* Ticket de Compra (Conceptos) */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-gray-50 dark:bg-zinc-900/80 border-b border-gray-200 dark:border-zinc-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-graphite dark:text-zinc-400" />
              <h3 className="text-sm font-bold text-brand-carbon dark:text-white">Ticket de Compra</h3>
            </div>
            
            <div className="divide-y divide-gray-100 dark:divide-zinc-800/50">
              {items.length > 0 ? (
                items.map((item: any, index: number) => (
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
