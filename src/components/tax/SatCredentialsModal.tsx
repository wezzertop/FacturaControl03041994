"use client";

import React, { useState, useTransition } from "react";
import { KeyRound, ShieldCheck, Sparkles, RefreshCw, X, Upload, Lock, FileKey } from "lucide-react";
import { saveSatCredentials, syncMonthInvoicesFromSat } from "@/app/actions/satSync";

interface SatCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncSuccess?: () => void;
}

export default function SatCredentialsModal({ isOpen, onClose, onSyncSuccess }: SatCredentialsModalProps) {
  const [rfc, setRfc] = useState<string>("");
  const [ciecPassword, setCiecPassword] = useState<string>("");
  const [fielPassword, setFielPassword] = useState<string>("");
  const [cerFile, setCerFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSyncNow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfc.trim()) {
      setMsg({ type: "error", text: "Por favor ingresa tu RFC del SAT." });
      return;
    }

    setMsg(null);
    startTransition(async () => {
      // 1. Guardar credenciales
      await saveSatCredentials(rfc, ciecPassword, fielPassword);

      // 2. Ejecutar descarga masiva de facturas del mes desde el SAT
      const res = await syncMonthInvoicesFromSat(selectedMonth, selectedYear, rfc);

      if (res.success) {
        setMsg({ type: "success", text: res.message || "Sincronización masiva con el SAT completada con éxito." });
        if (onSyncSuccess) onSyncSuccess();
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setMsg({ type: "error", text: res.error || "No se pudo sincronizar con el SAT." });
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="surface-card rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-700/80 shadow-2xl relative animate-slide-up max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 bg-brand-cerulean/15 text-brand-cerulean rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-cerulean/30">
          <KeyRound className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-black text-white text-center tracking-tight">
          Sincronización Masiva SAT (Llaves FIEL / CIEC)
        </h3>
        <p className="text-xs text-slate-400 text-center mt-1.5 leading-relaxed font-medium">
          Ingresa las llaves de tu e.firma (.cer, .key) o contraseña CIEC del SAT para importar automáticamente todas tus facturas de ingresos y egresos del mes.
        </p>

        {msg && (
          <div className={`p-3.5 my-4 text-xs font-bold rounded-2xl border ${
            msg.type === "success" 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSyncNow} className="space-y-4 my-6">
          {/* RFC del Contribuyente */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">RFC del Contribuyente (SAT)</label>
            <input
              type="text"
              required
              placeholder="Ej. XAXX010101000"
              value={rfc}
              onChange={(e) => setRfc(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-extrabold text-white uppercase placeholder:text-slate-500 focus:ring-2 focus:ring-brand-cerulean focus:outline-none"
            />
          </div>

          {/* Selector de Mes/Año a importar */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Mes a Sincronizar</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-extrabold text-white focus:ring-2 focus:ring-brand-cerulean focus:outline-none cursor-pointer"
              >
                {[
                  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                ].map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Año Ejercicio</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-extrabold text-white focus:ring-2 focus:ring-brand-cerulean focus:outline-none cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Opción A: Contraseña CIEC del SAT */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-cerulean flex items-center gap-1">
              <Lock className="w-3 h-3" /> Opción A: Acceso por Contraseña CIEC del SAT
            </span>
            <input
              type="password"
              placeholder="Contraseña CIEC SAT (8 caracteres)"
              value={ciecPassword}
              onChange={(e) => setCiecPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-cerulean"
            />
          </div>

          {/* Opción B: e.firma FIEL (.cer y .key) */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <FileKey className="w-3 h-3" /> Opción B: e.firma FIEL (.cer / .key / Clave)
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Certificado (.cer)</label>
                <input
                  type="file"
                  accept=".cer"
                  onChange={(e) => setCerFile(e.target.files?.[0] || null)}
                  className="w-full text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-slate-800 file:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Llave Privada (.key)</label>
                <input
                  type="file"
                  accept=".key"
                  onChange={(e) => setKeyFile(e.target.files?.[0] || null)}
                  className="w-full text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-slate-800 file:text-white"
                />
              </div>
            </div>

            <input
              type="password"
              placeholder="Contraseña de la e.firma / Llave Privada"
              value={fielPassword}
              onChange={(e) => setFielPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 bg-gradient-to-r from-brand-cerulean to-blue-600 hover:from-blue-600 hover:to-brand-cerulean disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl transition shadow-lg shadow-brand-cerulean/20 flex items-center justify-center gap-2 min-h-[44px]"
          >
            {isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Descargando Facturas del SAT...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Sincronizar Facturas del Mes con el SAT ⚡
              </>
            )}
          </button>
        </form>

        <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[10px] text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Tus llaves e.firma se encriptan localmente y nunca se comparten con terceros.</span>
        </div>
      </div>
    </div>
  );
}
