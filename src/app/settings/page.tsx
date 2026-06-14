import React from 'react';
import RFCManager from '@/components/settings/RFCManager';

export default function SettingsPage() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-brand-carbon dark:text-white tracking-tight">Configuración</h2>
          <p className="text-sm text-brand-graphite dark:text-zinc-400 mt-1">
            Gestiona tu identidad fiscal y perfil del usuario.
          </p>
        </div>
      </div>

      <RFCManager />
    </div>
  );
}
