"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  DollarSign, 
  Wallet, 
  CreditCard, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { setupInitialData } from '@/app/actions/onboarding';

interface WalletSetup {
  name: string;
  type: 'cash' | 'debit' | 'credit';
  initialBalance: number;
  creditLimit: number;
  cutOffDay: number;
  dueDay: number;
  enabled: boolean;
  isPayrollRecipient: boolean;
}

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paso 1
  const [rfc, setRfc] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Paso 2
  const [hasPayroll, setHasPayroll] = useState(true);
  const [payrollAmount, setPayrollAmount] = useState<number>(15000);
  const [nextPayrollDate, setNextPayrollDate] = useState(() => {
    const d = new Date();
    // Sugerir la próxima quincena o fin de mes
    if (d.getDate() < 15) {
      d.setDate(15);
    } else {
      // Último día de mes
      d.setMonth(d.getMonth() + 1);
      d.setDate(0);
    }
    return d.toISOString().split('T')[0];
  });
  const [payrollFrequency, setPayrollFrequency] = useState<'days_14' | 'days_15' | 'monthly'>('days_15');

  // Paso 3
  const [wallets, setWallets] = useState<WalletSetup[]>([
    {
      name: 'Efectivo',
      type: 'cash',
      initialBalance: 1000,
      creditLimit: 0,
      cutOffDay: 1,
      dueDay: 1,
      enabled: true,
      isPayrollRecipient: false
    },
    {
      name: 'Tarjeta de Débito',
      type: 'debit',
      initialBalance: 5000,
      creditLimit: 0,
      cutOffDay: 1,
      dueDay: 1,
      enabled: true,
      isPayrollRecipient: true
    },
    {
      name: 'Tarjeta de Crédito',
      type: 'credit',
      initialBalance: 0, // representa deuda inicial
      creditLimit: 25000,
      cutOffDay: 10,
      dueDay: 30,
      enabled: false,
      isPayrollRecipient: false
    }
  ]);

  const handleWalletChange = (index: number, fields: Partial<WalletSetup>) => {
    setWallets(prev => prev.map((w, i) => i === index ? { ...w, ...fields } : w));
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (rfc.trim()) {
        const cleanRfc = rfc.trim().toUpperCase();
        if (cleanRfc.length < 12 || cleanRfc.length > 13) {
          setError('El RFC debe tener entre 12 y 13 caracteres.');
          return;
        }
      }
    }
    if (step === 2 && hasPayroll) {
      if (!payrollAmount || payrollAmount <= 0) {
        setError('Por favor ingresa un monto de nómina válido.');
        return;
      }
      if (!nextPayrollDate) {
        setError('Por favor selecciona la fecha del próximo pago.');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setError(null);

    const activeWallets = wallets.filter(w => w.enabled);
    if (activeWallets.length === 0) {
      setError('Debes activar al menos una cartera (Efectivo o Débito) para poder continuar.');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        rfc: rfc.trim() || undefined,
        startDate,
        hasPayroll,
        payrollAmount: hasPayroll ? Number(payrollAmount) : 0,
        nextPayrollDate,
        payrollFrequency,
        wallets: activeWallets.map(w => ({
          name: w.name,
          type: w.type,
          initialBalance: Number(w.initialBalance),
          creditLimit: w.type === 'credit' ? Number(w.creditLimit) : 0,
          cutOffDay: w.type === 'credit' ? Number(w.cutOffDay) : undefined,
          dueDay: w.type === 'credit' ? Number(w.dueDay) : undefined,
          isPayrollRecipient: w.type === 'debit' && w.isPayrollRecipient
        }))
      };

      const res = await setupInitialData(payload);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || 'Ocurrió un error al guardar la configuración inicial.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Error inesperado de red. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-xl overflow-hidden transition-all duration-300">
        
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-brand-cerulean to-blue-600 h-2 w-full" />
        
        <div className="p-6 md:p-10">
          
          {/* Progress Indicator */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-2 items-center">
              <Sparkles className="w-5 h-5 text-brand-cerulean" />
              <span className="text-xs font-bold uppercase tracking-wider text-brand-cerulean">Configuración de Inicio</span>
            </div>
            <div className="text-xs font-semibold text-gray-500">
              Paso {step} de 4
            </div>
          </div>

          <div className="w-full bg-gray-100 dark:bg-zinc-800 h-1.5 rounded-full mb-8 overflow-hidden">
            <div 
              className="bg-brand-cerulean h-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl p-4 flex gap-3 items-center">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-xs text-red-700 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}

          {/* Wizard Steps */}

          {/* Paso 1: Datos Base */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">¡Empecemos desde cero!</h2>
                <p className="text-xs text-gray-500 mt-1">Establece tu fecha de inicio y proporciona tu RFC para organizar correctamente tus facturas.</p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Fecha de Inicio del Control Financiero</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input 
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">Todos los movimientos y balances se registrarán a partir de esta fecha.</span>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">RFC de Facturación (Opcional)</label>
                  <input 
                    type="text"
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value)}
                    placeholder="Escribe tu RFC"
                    className="w-full px-4 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none uppercase dark:text-white"
                  />
                  <span className="text-[10px] text-gray-400">Se utiliza para discernir si las facturas XML cargadas son ingresos o egresos.</span>
                </div>
              </div>
            </div>
          )}

          {/* Paso 2: Nómina Recurrente */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pago de Nómina / Salario</h2>
                <p className="text-xs text-gray-500 mt-1">¿Recibes ingresos por concepto de nómina de forma recurrente?</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setHasPayroll(true)}
                  className={`p-4 border rounded-2xl flex flex-col items-center gap-2 transition-all ${
                    hasPayroll 
                      ? 'border-brand-cerulean bg-brand-cerulean/5 text-brand-cerulean' 
                      : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 text-gray-600 dark:text-zinc-400'
                  }`}
                >
                  <CheckCircle className={`w-5 h-5 ${hasPayroll ? 'text-brand-cerulean' : 'text-gray-300'}`} />
                  <span className="text-xs font-bold">Sí, recibo nómina</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHasPayroll(false)}
                  className={`p-4 border rounded-2xl flex flex-col items-center gap-2 transition-all ${
                    !hasPayroll 
                      ? 'border-brand-cerulean bg-brand-cerulean/5 text-brand-cerulean' 
                      : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 text-gray-600 dark:text-zinc-400'
                  }`}
                >
                  <CheckCircle className={`w-5 h-5 ${!hasPayroll ? 'text-brand-cerulean' : 'text-gray-300'}`} />
                  <span className="text-xs font-bold">No / Otro esquema</span>
                </button>
              </div>

              {hasPayroll && (
                <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-zinc-800 transition-all">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Monto Neto Estimado ($)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input 
                          type="number"
                          value={payrollAmount}
                          onChange={(e) => setPayrollAmount(Number(e.target.value))}
                          placeholder="Monto de pago"
                          className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Fecha del Próximo Pago</label>
                      <input 
                        type="date"
                        value={nextPayrollDate}
                        onChange={(e) => setNextPayrollDate(e.target.value)}
                        className="w-full px-4 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Frecuencia de Nómina</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Cada 14 días (Catorcenal)', value: 'days_14' },
                        { label: 'Cada 15 días (Quincenal)', value: 'days_15' },
                        { label: 'Cada mes (Mensual)', value: 'monthly' }
                      ].map((freq) => (
                        <button
                          key={freq.value}
                          type="button"
                          onClick={() => setPayrollFrequency(freq.value as any)}
                          className={`p-2.5 border text-[10px] font-bold rounded-xl text-center transition-all ${
                            payrollFrequency === freq.value
                              ? 'border-brand-cerulean bg-brand-cerulean/5 text-brand-cerulean'
                              : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 text-gray-600 dark:text-zinc-400'
                          }`}
                        >
                          {freq.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paso 3: Carteras iniciales */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cuentas y Carteras Iniciales</h2>
                <p className="text-xs text-gray-500 mt-1">Activa las cuentas con las que inicias y coloca sus saldos para que coincidan con la realidad.</p>
              </div>

              <div className="space-y-4">
                {wallets.map((wallet, index) => (
                  <div 
                    key={wallet.type}
                    className={`p-4 border rounded-2xl transition-all ${
                      wallet.enabled 
                        ? 'border-brand-cerulean bg-white dark:bg-zinc-900 shadow-sm' 
                        : 'border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/10'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex gap-2 items-center">
                        <div className="p-2 bg-brand-cerulean/10 text-brand-cerulean rounded-lg">
                          {wallet.type === 'credit' ? <CreditCard className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                        </div>
                        <div>
                          <input 
                            type="text" 
                            value={wallet.name}
                            onChange={(e) => handleWalletChange(index, { name: e.target.value })}
                            className="text-xs font-bold bg-transparent border-b border-transparent focus:border-gray-300 focus:outline-none dark:text-white"
                            disabled={!wallet.enabled}
                          />
                          <p className="text-[10px] text-gray-400 capitalize">{wallet.type === 'cash' ? 'Efectivo' : wallet.type === 'debit' ? 'Débito' : 'Crédito'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {wallet.type === 'credit' && (
                          <span className="text-[10px] text-gray-500 font-medium">Tarjeta Opcional</span>
                        )}
                        <input
                          type="checkbox"
                          checked={wallet.enabled}
                          onChange={(e) => handleWalletChange(index, { enabled: e.target.checked })}
                          className="w-4 h-4 text-brand-cerulean rounded border-gray-300 focus:ring-brand-cerulean focus:ring-2"
                        />
                      </div>
                    </div>

                    {wallet.enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-zinc-850">
                        {wallet.type === 'credit' ? (
                          <>
                            <div className="flex flex-col space-y-1">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Deuda Actual ($)</label>
                              <div className="relative">
                                <DollarSign className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                                <input 
                                  type="number"
                                  value={wallet.initialBalance}
                                  onChange={(e) => handleWalletChange(index, { initialBalance: Number(e.target.value) })}
                                  className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-lg focus:ring-1 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                                  min="0"
                                />
                              </div>
                            </div>
                            <div className="flex flex-col space-y-1">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Límite de Crédito ($)</label>
                              <div className="relative">
                                <DollarSign className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                                <input 
                                  type="number"
                                  value={wallet.creditLimit}
                                  onChange={(e) => handleWalletChange(index, { creditLimit: Number(e.target.value) })}
                                  className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-lg focus:ring-1 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                                  min="1"
                                />
                              </div>
                            </div>
                            <div className="flex flex-col space-y-1">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Día de Corte</label>
                              <input 
                                type="number"
                                value={wallet.cutOffDay}
                                onChange={(e) => handleWalletChange(index, { cutOffDay: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-lg focus:ring-1 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                                min="1"
                                max="31"
                              />
                            </div>
                            <div className="flex flex-col space-y-1">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Día de Pago</label>
                              <input 
                                type="number"
                                value={wallet.dueDay}
                                onChange={(e) => handleWalletChange(index, { dueDay: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-lg focus:ring-1 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                                min="1"
                                max="31"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex flex-col space-y-1">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Saldo Inicial Disponible ($)</label>
                              <div className="relative">
                                <DollarSign className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                                <input 
                                  type="number"
                                  value={wallet.initialBalance}
                                  onChange={(e) => handleWalletChange(index, { initialBalance: Number(e.target.value) })}
                                  className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-lg focus:ring-1 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                                />
                              </div>
                            </div>

                            {wallet.type === 'debit' && hasPayroll && (
                              <div className="flex items-center pt-5">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    checked={wallet.isPayrollRecipient}
                                    onChange={(e) => {
                                      // Asegurar que solo este tenga isPayrollRecipient a true
                                      setWallets(prev => prev.map((w, idx) => {
                                        if (idx === index) return { ...w, isPayrollRecipient: e.target.checked };
                                        if (w.type === 'debit') return { ...w, isPayrollRecipient: !e.target.checked };
                                        return w;
                                      }));
                                    }}
                                    className="w-3.5 h-3.5 text-brand-cerulean rounded border-gray-300"
                                  />
                                  <span className="text-[10px] font-bold text-gray-600 dark:text-zinc-400">Recibe mi nómina aquí</span>
                                </label>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Paso 4: Resumen */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center py-2">
                <div className="mx-auto w-12 h-12 bg-brand-cerulean/10 text-brand-cerulean rounded-full flex items-center justify-center mb-3">
                  <Check className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Confirmar Configuración</h2>
                <p className="text-xs text-gray-500 mt-1">Listo para inicializar tu cuenta con los siguientes datos.</p>
              </div>

              <div className="border border-gray-200 dark:border-zinc-800 rounded-2xl bg-gray-50/50 dark:bg-zinc-900/30 p-4 space-y-4">
                <div className="flex justify-between items-center text-xs border-b border-gray-150 dark:border-zinc-800 pb-2">
                  <span className="text-gray-500 font-medium">Fecha de Control:</span>
                  <span className="font-bold text-gray-800 dark:text-white">{startDate}</span>
                </div>

                {rfc && (
                  <div className="flex justify-between items-center text-xs border-b border-gray-150 dark:border-zinc-800 pb-2">
                    <span className="text-gray-500 font-medium">RFC:</span>
                    <span className="font-bold text-gray-800 dark:text-white uppercase">{rfc}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs border-b border-gray-150 dark:border-zinc-800 pb-2">
                  <span className="text-gray-500 font-medium">Sueldo / Nómina:</span>
                  <span className="font-bold text-gray-800 dark:text-white">
                    {hasPayroll 
                      ? `$${payrollAmount.toLocaleString('es-MX')} (${
                          payrollFrequency === 'days_14' ? 'Catorcenal' : 
                          payrollFrequency === 'days_15' ? 'Quincenal' : 'Mensual'
                        })` 
                      : 'No configurado'}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-gray-500 font-medium block">Carteras a Crear:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {wallets.filter(w => w.enabled).map(w => (
                      <div key={w.type} className="flex justify-between items-center p-2.5 border border-gray-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-xs">
                        <div className="flex items-center gap-1.5">
                          {w.type === 'credit' ? <CreditCard className="w-3.5 h-3.5 text-blue-500" /> : <Wallet className="w-3.5 h-3.5 text-emerald-500" />}
                          <span className="font-semibold text-gray-800 dark:text-white">{w.name}</span>
                        </div>
                        <span className="font-bold text-gray-700 dark:text-zinc-300">
                          {w.type === 'credit' 
                            ? `Deuda: $${w.initialBalance.toLocaleString('es-MX')}` 
                            : `$${w.initialBalance.toLocaleString('es-MX')}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-150 dark:border-zinc-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-200 dark:border-zinc-800 text-xs font-bold rounded-xl text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Atrás
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 bg-brand-cerulean hover:bg-brand-cerulean/90 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-sm"
              >
                Continuar
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-brand-cerulean to-blue-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-md hover:opacity-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Configurando sistema...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Iniciar Control Financiero
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
