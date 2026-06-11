'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { Invoice } from '@/types/database';

interface ExportCSVButtonProps {
  invoices: Invoice[];
}

export default function ExportCSVButton({ invoices }: ExportCSVButtonProps) {
  const handleExport = () => {
    if (!invoices || invoices.length === 0) {
      alert("No hay facturas para exportar.");
      return;
    }

    // Cabeceras del CSV
    const headers = [
      'Fecha',
      'Proveedor (Nombre)',
      'RFC Proveedor',
      'Categoría',
      'Subtotal',
      'IVA',
      'Total',
      'Estado'
    ];

    // Mapear los datos de las facturas a filas del CSV
    const csvRows = invoices.map(inv => {
      const fecha = new Date(inv.fecha).toLocaleDateString('es-MX');
      const nombre = `"${inv.nombre_emisor.replace(/"/g, '""')}"`; // Escapar comillas dobles
      const rfc = inv.rfc_emisor;
      const categoria = inv.categories ? inv.categories.name : 'Sin clasificar';
      const subtotal = inv.subtotal;
      const iva = inv.iva;
      const total = inv.total;
      const estado = inv.status;

      return [fecha, nombre, rfc, categoria, subtotal, iva, total, estado].join(',');
    });

    // Unir todo con saltos de línea y añadir BOM para que Excel lea la ñ y acentos correctamente
    const csvContent = "\uFEFF" + [headers.join(','), ...csvRows].join('\n');

    // Crear un blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_Facturas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button 
      onClick={handleExport}
      className="bg-brand-white dark:bg-zinc-800 text-brand-graphite dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
    >
      <Download className="w-4 h-4" />
      Exportar Excel
    </button>
  );
}
