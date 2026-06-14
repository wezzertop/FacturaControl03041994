import React from 'react';
import { Zap } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-brand-smoke dark:bg-brand-carbon">
      <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-cerulean to-blue-400 shadow-lg shadow-brand-cerulean/25 animate-pulse">
          <Zap className="h-8 w-8 text-white animate-bounce" />
        </div>
        <p className="text-sm font-semibold tracking-wide text-brand-graphite dark:text-zinc-400 animate-pulse">
          Cargando panel...
        </p>
      </div>
    </div>
  );
}
