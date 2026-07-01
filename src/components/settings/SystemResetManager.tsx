"use client";

import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';
import { resetUserData } from '@/app/actions/wallets';
import { useRouter } from 'next/navigation';

export default function SystemResetManager() {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [safetyText, setSafetyText] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CONFIRMATION_PHRASE = "RESTABLECER TODO";

  const handleReset = async () => {
    if (safetyText !== CONFIRMATION_PHRASE) {
      setError(`Debes escribir exactamente "${CONFIRMATION_PHRASE}" para continuar.`);
      return;
    }

    setIsPending(true);
    setError(null);
    try {
      const res = await resetUserData();
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          setShowConfirm(false);
          router.push('/');
          router.refresh();
        }, 1500);
      } else {
        setError(res.error || 'Ocurrió un error inesperado al restablecer.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión con el servidor.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="border border-red-200 dark:border-red-950 bg-red-50/10 dark:bg-red-950/10 rounded-2xl p-6 md:p-8 shadow-sm">
      <h3 className="text-base font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
        <ShieldAlert className="w-5 h-5" />
        Restablecer Sistema
      </h3>
      <p className="text-xs text-brand-graphite dark:text-zinc-400 mb-6 leading-relaxed">
        Esta acción es **irreversible**. Borrará permanentemente todas tus carteras de efectivo, tarjetas de débito/crédito, 
        el historial completo de transacciones, tus facturas conciliadas del SAT y cualquier regla de pago recurrente.
      </p>

      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="px-4 py-2 border border-red-200 dark:border-red-900 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
      >
        <Trash2 className="w-4 h-4" />
        Restablecer todo a cero
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 md:p-8">
            <div className="flex gap-3 items-start mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-950/50 rounded-xl text-red-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">¿Estás absolutamente seguro?</h4>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Esta acción eliminará de forma irreversible toda tu información contable del servidor. No podrás recuperar estos datos.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl p-3 text-[11px] text-red-600 font-medium">
                {error}
              </div>
            )}

            {success ? (
              <div className="py-4 text-center space-y-2">
                <div className="mx-auto w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-emerald-600">Base de datos restablecida. Redireccionando...</p>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">
                    Escribe <span className="font-extrabold text-red-500">RESTABLECER TODO</span> para confirmar:
                  </label>
                  <input
                    type="text"
                    value={safetyText}
                    onChange={(e) => setSafetyText(e.target.value)}
                    placeholder="Escribe la frase de seguridad"
                    className="w-full px-3 py-2 text-xs border border-gray-250 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none dark:text-white uppercase font-semibold"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-900">
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirm(false);
                      setSafetyText('');
                      setError(null);
                    }}
                    disabled={isPending}
                    className="px-4 py-2 border border-gray-200 dark:border-zinc-800 text-xs font-semibold rounded-xl text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isPending || safetyText !== CONFIRMATION_PHRASE}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                  >
                    {isPending ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Borrando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar permanentemente
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
