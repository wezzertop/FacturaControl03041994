import React from 'react';
import Link from 'next/link';
import { resetPassword } from '@/app/actions/auth';
import { Zap, Mail, Lock, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';

interface ForgotPasswordPageProps {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
}

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;
  const errorMsg = params.error ? decodeURIComponent(params.error) : null;
  const infoMsg = params.message ? decodeURIComponent(params.message) : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-white dark:bg-brand-carbon p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-brand-cerulean/20 dark:bg-brand-cerulean/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white dark:bg-brand-graphite border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="flex justify-center mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-cerulean to-blue-400 flex items-center justify-center shadow-lg">
                <KeyRound className="text-white w-6 h-6" />
              </div>
            </div>
            
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-brand-carbon dark:text-white tracking-tight">Restablecer Contraseña</h1>
              <p className="text-sm text-brand-graphite dark:text-zinc-400 mt-2">
                Ingresa tu correo y la nueva contraseña que deseas asignar a tu cuenta.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {infoMsg && (
              <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-3 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{infoMsg}</span>
              </div>
            )}

            <form action={resetPassword} className="space-y-5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-brand-carbon dark:text-zinc-300" htmlFor="email">
                  Correo Electrónico de la Cuenta
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 dark:text-zinc-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="tu@correo.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-brand-carbon dark:text-white placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-cerulean focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-brand-carbon dark:text-zinc-300" htmlFor="password">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 dark:text-zinc-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-brand-carbon dark:text-white placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-cerulean focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-cerulean hover:bg-blue-600 text-white font-medium rounded-lg transition-colors mt-2"
              >
                Restablecer y Entrar
              </button>
            </form>
          </div>
          
          <div className="px-8 py-5 bg-gray-50 dark:bg-zinc-900/50 border-t border-gray-200 dark:border-zinc-800 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-brand-graphite dark:text-zinc-400 hover:text-brand-cerulean font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Volver a Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
