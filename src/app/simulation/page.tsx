import React from 'react';
import { Calculator, HelpCircle } from 'lucide-react';

export default function SimulationPage() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-brand-carbon dark:text-white tracking-tight">Simulación Fiscal</h2>
          <p className="text-sm text-brand-graphite dark:text-zinc-400 mt-1">
            Calcula tus impuestos proyectados.
          </p>
        </div>
      </div>

      <div className="text-center py-20 bg-brand-white dark:bg-brand-graphite border border-gray-200 dark:border-zinc-800 rounded-xl">
        <div className="w-16 h-16 bg-brand-smoke dark:bg-brand-carbon rounded-full flex items-center justify-center mx-auto mb-4">
          <Calculator className="w-8 h-8 text-brand-cerulean opacity-50" />
        </div>
        <h3 className="text-lg font-medium text-brand-carbon dark:text-white">Módulo en Construcción</h3>
        <p className="text-sm text-brand-graphite dark:text-zinc-400 mt-2 max-w-md mx-auto">
          Pronto podrás estimar tu ISR a pagar o a favor basado en tu régimen fiscal y tus facturas subidas en el mes.
        </p>
      </div>
    </div>
  );
}
