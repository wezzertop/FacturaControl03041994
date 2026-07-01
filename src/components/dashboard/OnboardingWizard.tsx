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
  Landmark,
  PiggyBank,
  X
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

  // Paso 1: Datos Base
  const [rfc, setRfc] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Paso 2: Nómina
  const [hasPayroll, setHasPayroll] = useState(true);
  const [payrollAmount, setPayrollAmount] = useState<number>(15000);
  const [nextPayrollDate, setNextPayrollDate] = useState(() => {
    const d = new Date();
    if (d.getDate() < 15) {
      d.setDate(15);
    } else {
      d.setMonth(d.getMonth() + 1);
      d.setDate(0);
    }
    return d.toISOString().split('T')[0];
  });
  const [payrollFrequency, setPayrollFrequency] = useState<'days_14' | 'days_15' | 'monthly'>('days_15');

  // Paso 3: Carteras
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
      initialBalance: 0,
      creditLimit: 25000,
      cutOffDay: 10,
      dueDay: 30,
      enabled: false,
      isPayrollRecipient: false
    }
  ]);

  // Paso 4: Préstamos (Opcional - pre-llenado con datos del usuario)
  const [hasLoan, setHasLoan] = useState(false);
  const [loanName, setLoanName] = useState('PR9997');
  const [loanBank, setLoanBank] = useState('BBVA');
  const [loanAmount, setLoanAmount] = useState<string>('15000');
  const [loanBalance, setLoanBalance] = useState<string>('15108.60');
  const [loanRate, setLoanRate] = useState<string>('37.45');
  const [loanTotalPayments, setLoanTotalPayments] = useState<string>('144');
  const [loanFrequency, setLoanFrequency] = useState<'days_14' | 'days_15' | 'monthly'>('days_15');
  const [loanPaymentAmount, setLoanPaymentAmount] = useState<string>('262.13');
  const [loanStartDate, setLoanStartDate] = useState('2026-06-25');
  const [loanHasFirstIrregular, setLoanHasFirstIrregular] = useState(true);
  const [loanFirstPaymentDate, setLoanFirstPaymentDate] = useState('2026-07-01');
  const [loanFirstPaymentAmount, setLoanFirstPaymentAmount] = useState<string>('108.60');
  const [loanWalletName, setLoanWalletName] = useState('Tarjeta de Débito');

  const handleWalletChange = (index: number, fields: Partial<WalletSetup>) => {
    setWallets(prev => prev.map((w, i) => i === index ? { ...w, ...fields } : w));
  };

  const activeWalletsList = wallets.filter(w => w.enabled);

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
    if (step === 3) {
      if (activeWalletsList.length === 0) {
        setError('Debes activar al menos una cartera.');
        return;
      }
      const payrollWallet = activeWalletsList.find(w => w.isPayrollRecipient) || activeWalletsList[0];
      if (payrollWallet) {
        setLoanWalletName(payrollWallet.name);
      }
    }
    if (step === 4 && hasLoan) {
      if (!loanName.trim()) {
        setError('Por favor ingresa un nombre para el préstamo.');
        return;
      }
      if (!loanAmount || Number(loanAmount) <= 0) {
        setError('El monto otorgado debe ser mayor a 0.');
        return;
      }
      if (!loanBalance || Number(loanBalance) <= 0) {
        setError('El saldo pendiente debe ser mayor a 0.');
        return;
      }
      if (!loanPaymentAmount || Number(loanPaymentAmount) <= 0) {
        setError('Ingresa una cuota de pago fija.');
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

    if (activeWalletsList.length === 0) {
      setError('Debes activar al menos una cartera.');
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
        wallets: activeWalletsList.map(w => ({
          name: w.name,
          type: w.type,
          initialBalance: Number(w.initialBalance),
          creditLimit: w.type === 'credit' ? Number(w.creditLimit) : 0,
          cutOffDay: w.type === 'credit' ? Number(w.cutOffDay) : undefined,
          dueDay: w.type === 'credit' ? Number(w.dueDay) : undefined,
          isPayrollRecipient: w.type === 'debit' && w.isPayrollRecipient
        })),
        hasLoan,
        loan: hasLoan ? {
          name: loanName.trim(),
          bank: loanBank.trim(),
          amount_granted: Number(loanAmount),
          current_balance: Number(loanBalance),
          interest_rate: Number(loanRate),
          total_payments: Number(loanTotalPayments),
          frequency: loanFrequency,
          payment_amount: Number(loanPaymentAmount),
          start_date: loanStartDate,
          wallet_name: loanWalletName,
          first_payment_date: loanHasFirstIrregular && loanFirstPaymentDate ? loanFirstPaymentDate : undefined,
          first_payment_amount: loanHasFirstIrregular && loanFirstPaymentAmount ? Number(loanFirstPaymentAmount) : undefined
        } : undefined
      };

      const res = await setupInitialData(payload);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || 'Ocurrió un error al guardar.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Error de red. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-xl overflow-hidden transition-all duration-300">
        
        <div className="bg-gradient-to-r from-brand-cerulean to-blue-600 h-2 w-full" />
        
        <div className="p-6 md:p-10">
          
          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-2 items-center">
              <Sparkles className="w-5 h-5 text-brand-cerulean" />
              <span className="text-xs font-bold uppercase tracking-wider text-brand-cerulean">Configuración de Inicio</span>
            </div>
            <div className="text-xs font-semibold text-gray-500">
              Paso {step} de 5
            </div>
          </div>

          <div className="w-full bg-gray-100 dark:bg-zinc-800 h-1.5 rounded-full mb-8 overflow-hidden">
            <div 
              className="bg-brand-cerulean h-full transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl p-4 flex gap-3 items-center">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-xs text-red-700 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}

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
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-350">RFC de Facturación (Opcional)</label>
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

          {/* Paso 2: Nómina */}
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

          {/* Paso 3: Carteras */}
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

          {/* Paso 4: Préstamos Bancarios (Opcional) */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Préstamos Bancarios Activos</h2>
                <p className="text-xs text-gray-500 mt-1">¿Tienes algún préstamo de consumo o crédito personal actualmente activo con tu banco?</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setHasLoan(true)}
                  className={`p-4 border rounded-2xl flex flex-col items-center gap-2 transition-all ${
                    hasLoan 
                      ? 'border-brand-cerulean bg-brand-cerulean/5 text-brand-cerulean' 
                      : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 text-gray-600 dark:text-zinc-400'
                  }`}
                >
                  <CheckCircle className={`w-5 h-5 ${hasLoan ? 'text-brand-cerulean' : 'text-gray-300'}`} />
                  <span className="text-xs font-bold">Sí, tengo un préstamo activo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHasLoan(false)}
                  className={`p-4 border rounded-2xl flex flex-col items-center gap-2 transition-all ${
                    !hasLoan 
                      ? 'border-brand-cerulean bg-brand-cerulean/5 text-brand-cerulean' 
                      : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 text-gray-600 dark:text-zinc-400'
                  }`}
                >
                  <CheckCircle className={`w-5 h-5 ${!hasLoan ? 'text-brand-cerulean' : 'text-gray-300'}`} />
                  <span className="text-xs font-bold">No tengo préstamos</span>
                </button>
              </div>

              {hasLoan && (
                <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-zinc-800 transition-all">
                  <div className="bg-brand-cerulean/5 border border-brand-cerulean/15 rounded-xl p-3 text-[10px] text-brand-cerulean leading-relaxed font-semibold">
                    💡 Hemos pre-llenado estos campos con los datos del préstamo quincenal BBVA (144 pagos, tasa de 37.45%) para ahorrarte tiempo. Ajusta lo necesario.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nombre del Préstamo</label>
                      <input
                        type="text"
                        value={loanName}
                        onChange={(e) => setLoanName(e.target.value)}
                        placeholder="PR9997"
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-cerulean dark:text-white"
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Banco</label>
                      <input
                        type="text"
                        value={loanBank}
                        onChange={(e) => setLoanBank(e.target.value)}
                        placeholder="BBVA"
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-cerulean dark:text-white"
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Monto Otorgado Original ($)</label>
                      <input
                        type="number"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(e.target.value)}
                        placeholder="15000"
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-cerulean dark:text-white"
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Deuda Pendiente Actual ($)</label>
                      <input
                        type="number"
                        value={loanBalance}
                        onChange={(e) => setLoanBalance(e.target.value)}
                        placeholder="15108.60"
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-cerulean dark:text-white"
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tasa Interés Fija Anual (%)</label>
                      <input
                        type="number"
                        value={loanRate}
                        onChange={(e) => setLoanRate(e.target.value)}
                        placeholder="37.45"
                        step="0.01"
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-cerulean dark:text-white"
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cuota de Pago Fijo ($)</label>
                      <input
                        type="number"
                        value={loanPaymentAmount}
                        onChange={(e) => setLoanPaymentAmount(e.target.value)}
                        placeholder="262.13"
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-cerulean dark:text-white"
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Plazo (Total de Recibos)</label>
                      <input
                        type="number"
                        value={loanTotalPayments}
                        onChange={(e) => setLoanTotalPayments(e.target.value)}
                        placeholder="144"
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-cerulean dark:text-white"
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Fecha Contratación</label>
                      <input
                        type="date"
                        value={loanStartDate}
                        onChange={(e) => setLoanStartDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-cerulean dark:text-white"
                      />
                    </div>

                    <div className="flex flex-col space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cartera de Cobro Asociada</label>
                      <select
                        value={loanWalletName}
                        onChange={(e) => setLoanWalletName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-cerulean dark:text-white"
                      >
                        {activeWalletsList.map(w => (
                          <option key={w.name} value={w.name}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={loanHasFirstIrregular}
                        onChange={(e) => setLoanHasFirstIrregular(e.target.checked)}
                        className="w-3.5 h-3.5 text-brand-cerulean rounded border-gray-300"
                      />
                      <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                        El primer pago es irregular / sólo intereses por broken period
                      </span>
                    </label>

                    {loanHasFirstIrregular && (
                      <div className="grid grid-cols-2 gap-3 p-3 border border-dashed border-gray-200 dark:border-zinc-800 rounded-lg bg-gray-50/50 dark:bg-zinc-900/10">
                        <div className="flex flex-col space-y-1">
                          <label className="text-[9px] font-bold text-gray-500 uppercase">Fecha Primer Pago</label>
                          <input
                            type="date"
                            value={loanFirstPaymentDate}
                            onChange={(e) => setLoanFirstPaymentDate(e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded focus:outline-none dark:text-white"
                          />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <label className="text-[9px] font-bold text-gray-500 uppercase">Monto Primer Pago ($)</label>
                          <input
                            type="number"
                            value={loanFirstPaymentAmount}
                            onChange={(e) => setLoanFirstPaymentAmount(e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded focus:outline-none dark:text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paso 5: Resumen */}
          {step === 5 && (
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

                <div className="space-y-2 border-b border-gray-150 dark:border-zinc-800 pb-3">
                  <span className="text-xs text-gray-500 font-medium block">Carteras a Crear:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeWalletsList.map(w => (
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

                {hasLoan && (
                  <div className="space-y-2">
                    <span className="text-xs text-gray-500 font-medium block">Préstamo Bancario a Vincular:</span>
                    <div className="flex justify-between items-center p-3 border border-gray-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Landmark className="w-4 h-4 text-brand-cerulean" />
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">{loanName} ({loanBank})</p>
                          <p className="text-[10px] text-gray-400">Cuota: ${Number(loanPaymentAmount).toFixed(2)} - Plazo: {loanTotalPayments} pagos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-800 dark:text-zinc-300">Deuda: ${Number(loanBalance).toLocaleString('es-MX')}</p>
                        <p className="text-[9px] text-gray-400">Ligado a: {loanWalletName}</p>
                      </div>
                    </div>
                  </div>
                )}
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

            {step < 5 ? (
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
