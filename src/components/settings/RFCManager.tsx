"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { Shield, CheckCircle2, AlertCircle, RefreshCw, Key } from 'lucide-react';
import { saveUserRFC, getUserRFC } from '@/app/actions/wallets';

export default function RFCManager() {
  const [rfc, setRfc] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadRFC();
  }, []);

  const loadRFC = async () => {
    setIsLoading(true);
    try {
      const userRfc = await getUserRFC();
      if (userRfc) {
        setRfc(userRfc);
      }
    } catch (err) {
      console.error('Error al cargar RFC:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfc.trim()) {
      setErrorMessage('El RFC no puede estar vacío.');
      return;
    }

    // Validación básica de longitud de RFC en México (12 o 13 caracteres)
    const cleanRfc = rfc.trim().toUpperCase();
    if (cleanRfc.length < 12 || cleanRfc.length > 13) {
      setErrorMessage('Un RFC válido debe tener 12 (personas morales) o 13 (personas físicas) caracteres.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await saveUserRFC(cleanRfc);
      if (res.success) {
        setSuccessMessage('Tu RFC ha sido actualizado correctamente.');
        setRfc(cleanRfc);
      } else {
        setErrorMessage(res.error || 'No se pudo guardar el RFC.');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <RefreshCw className="w-6 h-6 text-brand-cerulean animate-spin" />
        <p className="text-xs text-brand-graphite dark:text-zinc-400">Cargando tus datos de configuración...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      
      {/* Information Card */}
      <div className="bg-brand-cerulean/5 border border-brand-cerulean/10 rounded-xl p-4 flex gap-3 items-start">
        <Shield className="w-5 h-5 text-brand-cerulean shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-brand-cerulean uppercase tracking-wider">¿Para qué sirve mi RFC?</h4>
          <p className="text-xs text-brand-graphite dark:text-zinc-400 mt-1 leading-relaxed">
            Tu RFC es indispensable para poder clasificar automáticamente tus facturas. 
            Cuando subes un XML, el sistema compara tu RFC con el del emisor para determinar si la factura es un **Ingreso** (emitida por ti) o un **Gasto/Egreso** (recibida de un proveedor).
          </p>
        </div>
      </div>

      {/* Main Panel */}
      <div className="border border-gray-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/50 p-6 md:p-8 shadow-sm">
        <h3 className="text-base font-bold text-brand-carbon dark:text-white mb-6 flex items-center gap-2">
          <Key className="w-5 h-5 text-brand-cerulean" />
          Configuración de Identidad Fiscal
        </h3>

        {successMessage && (
          <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-3 flex gap-2 items-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl p-3 flex gap-2 items-center">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-400 font-medium">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-brand-graphite dark:text-zinc-400">
              Registro Federal de Contribuyentes (RFC)
            </label>
            <input 
              type="text" 
              required
              maxLength={13}
              placeholder="Ej. ABCD123456EF7"
              value={rfc}
              onChange={(e) => setRfc(e.target.value)}
              className="w-full bg-brand-smoke dark:bg-brand-carbon border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-brand-carbon dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-650 focus:outline-none focus:border-brand-cerulean focus:ring-1 focus:ring-brand-cerulean transition-all uppercase font-mono tracking-wider"
            />
          </div>

          <button 
            type="submit"
            disabled={isPending}
            className="w-full bg-brand-carbon dark:bg-white text-white dark:text-brand-carbon py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </form>
      </div>

    </div>
  );
}
