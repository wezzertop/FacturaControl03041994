import React from 'react';
import XMLDragAndDrop from '@/components/upload/XMLDragAndDrop';

export default function UploadPage() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-4 sm:p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-brand-carbon dark:text-white tracking-tight">Cargar XML</h2>
        <p className="text-sm text-brand-graphite dark:text-zinc-400 mt-1">
          Sube tus facturas (CFDI 4.0) de ingresos, egresos o nóminas en formato XML para procesarlas e identificarlas al instante.
        </p>
      </div>

      <XMLDragAndDrop />
    </div>
  );
}
