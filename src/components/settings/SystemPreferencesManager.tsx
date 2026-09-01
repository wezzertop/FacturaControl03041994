"use client";

import React, { useState } from "react";
import { 
  Sliders, 
  DollarSign, 
  Moon, 
  Sun, 
  ShieldCheck, 
  FileSpreadsheet, 
  Check, 
  Sparkles,
  Smartphone,
  Globe
} from "lucide-react";
import { useTheme } from "next-themes";

export default function SystemPreferencesManager() {
  const { theme, setTheme } = useTheme();
  const [currency, setCurrency] = useState<string>("MXN");
  const [saved, setSaved] = useState<boolean>(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="surface-card rounded-2xl p-6 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0A0A0C] shadow-sm space-y-6">
      
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Preferencias de la Aplicación</h3>
            <p className="text-xs text-zinc-400">Personaliza la apariencia, divisa y formatos de tus finanzas</p>
          </div>
        </div>

        {saved && (
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Guardado
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Divisa Principal */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#121216] border border-white/[0.04] space-y-2">
          <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Divisa Principal
          </label>
          <select
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value);
              handleSave();
            }}
            className="w-full px-3 py-2 bg-white dark:bg-[#18181C] border border-white/[0.08] rounded-xl text-xs font-bold text-white focus:outline-none cursor-pointer"
          >
            <option value="MXN">Peso Mexicano (MXN $)</option>
            <option value="USD">Dólar Estadounidense (USD $)</option>
            <option value="EUR">Euro (EUR €)</option>
          </select>
          <span className="text-[10px] text-zinc-500 block">
            Todas tus cuentas se consolidan y formatean en esta moneda.
          </span>
        </div>

        {/* Apariencia / Tema */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#121216] border border-white/[0.04] space-y-2">
          <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Moon className="w-4 h-4 text-purple-400" />
            Tema Visual
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setTheme("dark");
                handleSave();
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                theme === "dark"
                  ? "bg-purple-600 text-white border-purple-500 shadow-sm font-black"
                  : "bg-white dark:bg-[#18181C] text-zinc-400 border-white/[0.06] hover:text-white"
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              Oscuro (OLED)
            </button>

            <button
              type="button"
              onClick={() => {
                setTheme("light");
                handleSave();
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                theme === "light"
                  ? "bg-blue-600 text-white border-blue-500 shadow-sm font-black"
                  : "bg-white dark:bg-[#18181C] text-zinc-400 border-white/[0.06] hover:text-white"
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              Claro
            </button>
          </div>
          <span className="text-[10px] text-zinc-500 block">
            Optimizado para bajo consumo de batería y máxima legibilidad.
          </span>
        </div>

      </div>

      {/* Privacidad y Seguridad Local */}
      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">
            Privacidad Financiera y Cero Datos Sensibles
          </h4>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Tu información vive protegida en tu espacio personal. No almacenamos credenciales bancarias ni requerimos información fiscal invasiva para que lleves el control de tus finanzas con total tranquilidad.
          </p>
        </div>
      </div>

    </div>
  );
}
