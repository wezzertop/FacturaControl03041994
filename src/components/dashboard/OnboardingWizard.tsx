"use client";

import React, { useState, useMemo } from 'react';
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
  Plus,
  Trash2,
  Tv,
  Music,
  Wifi,
  Zap,
  Home,
  Dumbbell,
  ArrowUpRight,
  ArrowDownLeft,
  Bell,
  Sliders,
  Clock,
  X
} from 'lucide-react';
import { setupInitialData, OnboardingRecurringExpense } from '@/app/actions/onboarding';
import CurrencyInput from '@/components/ui/CurrencyInput';
import RoboticMascot, { MascotMood } from '@/components/dashboard/RoboticMascot';
import BrandServiceIcon from '@/components/ui/BrandServiceIcon';

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

interface RecurringPreset {
  id: string;
  concept: string;
  amount: number;
  icon: any;
  enabled: boolean;
  dayOfMonth: number;
  notifyDaysBefore: number;
}

const DEFAULT_PRESETS: RecurringPreset[] = [
  { id: 'netflix', concept: 'Netflix / Streaming', amount: 219, icon: Tv, enabled: false, dayOfMonth: 5, notifyDaysBefore: 1 },
  { id: 'spotify', concept: 'Spotify / Música', amount: 129, icon: Music, enabled: false, dayOfMonth: 10, notifyDaysBefore: 1 },
  { id: 'internet', concept: 'Internet / Telefonía', amount: 599, icon: Wifi, enabled: false, dayOfMonth: 15, notifyDaysBefore: 2 },
  { id: 'luz', concept: 'Servicio de Luz / CFE', amount: 450, icon: Zap, enabled: false, dayOfMonth: 18, notifyDaysBefore: 3 },
  { id: 'renta', concept: 'Renta / Mantenimiento', amount: 5000, icon: Home, enabled: false, dayOfMonth: 1, notifyDaysBefore: 3 },
  { id: 'gym', concept: 'Gimnasio / Deportes', amount: 650, icon: Dumbbell, enabled: false, dayOfMonth: 20, notifyDaysBefore: 1 },
];

const WEEKDAYS_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Paso 1: Datos Base
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Paso 2: Nómina & Proyección Inteligente
  const [hasPayroll, setHasPayroll] = useState<boolean>(true);
  const [payrollAmount, setPayrollAmount] = useState<number>(15000);
  const [payrollFrequency, setPayrollFrequency] = useState<'days_14' | 'days_15' | 'every_15_days' | 'monthly' | 'weekly'>('days_14');
  const [nextPayrollDate, setNextPayrollDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  // Ajuste Proporcional del Primer Pago
  const [hasProportionalFirstPayment, setHasProportionalFirstPayment] = useState<boolean>(false);
  const [firstPaymentAmount, setFirstPaymentAmount] = useState<number>(7500);
  const [firstPaymentDate, setFirstPaymentDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  // Recordatorios
  const [notifyDaysBefore, setNotifyDaysBefore] = useState<number>(1);

  // Paso 3: Carteras
  const [wallets, setWallets] = useState<WalletSetup[]>([
    {
      name: 'Efectivo',
      type: 'cash',
      initialBalance: 500,
      creditLimit: 0,
      cutOffDay: 1,
      dueDay: 1,
      enabled: true,
      isPayrollRecipient: false
    },
    {
      name: 'Débito Principal',
      type: 'debit',
      initialBalance: 3500,
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
      cutOffDay: 15,
      dueDay: 5,
      enabled: false,
      isPayrollRecipient: false
    }
  ]);

  // Paso 4: Gastos y Suscripciones Recurrentes
  const [presets, setPresets] = useState<RecurringPreset[]>(DEFAULT_PRESETS);
  const [customExpenses, setCustomExpenses] = useState<Array<{ id: string; concept: string; amount: number; dayOfMonth: number; notifyDaysBefore: number }>>([]);
  const [customConcept, setCustomConcept] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [customDay, setCustomDay] = useState<number>(15);
  const [customNotifyDays, setCustomNotifyDays] = useState<number>(1);

  // Paso 5: Préstamos
  const [hasLoan, setHasLoan] = useState<boolean>(false);
  const [loanName, setLoanName] = useState<string>('Préstamo Personal');
  const [loanBank, setLoanBank] = useState<string>('BBVA');
  const [loanAmount, setLoanAmount] = useState<number>(50000);
  const [loanBalance, setLoanBalance] = useState<number>(35000);
  const [loanRate, setLoanRate] = useState<number>(18.5);
  const [loanPayments, setLoanPayments] = useState<number>(24);
  const [loanPaymentAmount, setLoanPaymentAmount] = useState<number>(2500);
  const [loanFrequency, setLoanFrequency] = useState<'days_14' | 'days_15' | 'monthly'>('monthly');

  // Helper para calcular próximos pagos de nómina proyectados
  const projectedPayrolls = useMemo(() => {
    if (!hasPayroll) return [];
    const baseDateStr = hasProportionalFirstPayment && firstPaymentDate ? firstPaymentDate : nextPayrollDate;
    if (!baseDateStr) return [];

    const [y, m, d] = baseDateStr.split('-').map(Number);
    const dates: Array<{ date: Date; amount: number }> = [];
    let current = new Date(y, m - 1, d);

    for (let i = 0; i < 4; i++) {
      const amt = (i === 0 && hasProportionalFirstPayment) ? firstPaymentAmount : payrollAmount;
      dates.push({ date: new Date(current), amount: amt });

      if (payrollFrequency === 'days_14') {
        current.setDate(current.getDate() + 14);
      } else if (payrollFrequency === 'every_15_days') {
        current.setDate(current.getDate() + 15);
      } else if (payrollFrequency === 'weekly') {
        current.setDate(current.getDate() + 7);
      } else if (payrollFrequency === 'days_15') {
        const curDay = current.getDate();
        if (curDay <= 15) {
          const lastDay = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
          current.setDate(lastDay);
        } else {
          current.setMonth(current.getMonth() + 1);
          current.setDate(15);
        }
      } else {
        current.setMonth(current.getMonth() + 1);
      }
    }
    return dates;
  }, [hasPayroll, nextPayrollDate, payrollFrequency, hasProportionalFirstPayment, firstPaymentDate, firstPaymentAmount, payrollAmount]);

  // Proyección financiera mensual
  const monthlyIncome = useMemo(() => {
    if (!hasPayroll) return 0;
    if (payrollFrequency === 'days_14') return (payrollAmount * 26) / 12;
    if (payrollFrequency === 'every_15_days') return (payrollAmount * 365 / 15) / 12;
    if (payrollFrequency === 'weekly') return (payrollAmount * 52) / 12;
    if (payrollFrequency === 'days_15') return payrollAmount * 2;
    return payrollAmount;
  }, [hasPayroll, payrollAmount, payrollFrequency]);

  const monthlyRecurringExpenses = useMemo(() => {
    const fromPresets = presets.filter(p => p.enabled).reduce((sum, p) => sum + p.amount, 0);
    const fromCustom = customExpenses.reduce((sum, c) => sum + c.amount, 0);
    const fromLoan = hasLoan ? loanPaymentAmount : 0;
    return fromPresets + fromCustom + fromLoan;
  }, [presets, customExpenses, hasLoan, loanPaymentAmount]);

  const freeCashFlow = monthlyIncome - monthlyRecurringExpenses;

  const handleWalletChange = (index: number, fields: Partial<WalletSetup>) => {
    setWallets(prev => prev.map((w, i) => i === index ? { ...w, ...fields } : w));
  };

  const activeWalletsList = wallets.filter(w => w.enabled);

  const handleAddCustomExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customConcept.trim() || customAmount <= 0) return;
    setCustomExpenses(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        concept: customConcept.trim(),
        amount: customAmount,
        dayOfMonth: Math.min(Math.max(customDay, 1), 31),
        notifyDaysBefore: customNotifyDays
      }
    ]);
    setCustomConcept('');
    setCustomAmount(0);
  };

  const handleRemoveCustomExpense = (id: string) => {
    setCustomExpenses(prev => prev.filter(c => c.id !== id));
  };

  const togglePreset = (id: string) => {
    setPresets(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const handlePresetAmountChange = (id: string, amount: number) => {
    setPresets(prev => prev.map(p => p.id === id ? { ...p, amount } : p));
  };

  const handleNext = () => {
    setError(null);
    if (step === 2 && hasPayroll) {
      if (!payrollAmount || payrollAmount <= 0) {
        setError('Por favor ingresa un monto de nómina válido.');
        return;
      }
      if (!nextPayrollDate) {
        setError('Por favor selecciona la fecha del primer/próximo pago.');
        return;
      }
    }
    if (step === 3 && activeWalletsList.length === 0) {
      setError('Debes habilitar al menos una cuenta o cartera para empezar.');
      return;
    }
    setStep(s => s + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(s => Math.max(s - 1, 1));
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError(null);

    // Consolidar gastos recurrentes
    const consolidatedRecurring: OnboardingRecurringExpense[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');

    presets.filter(p => p.enabled && p.amount > 0).forEach(p => {
      const dayStr = p.dayOfMonth.toString().padStart(2, '0');
      consolidatedRecurring.push({
        concept: p.concept,
        amount: p.amount,
        frequency: 'monthly',
        nextExecutionDate: `${currentYear}-${currentMonth}-${dayStr}`,
        notifyDaysBefore: p.notifyDaysBefore
      });
    });

    customExpenses.forEach(c => {
      const dayStr = c.dayOfMonth.toString().padStart(2, '0');
      consolidatedRecurring.push({
        concept: c.concept,
        amount: c.amount,
        frequency: 'monthly',
        nextExecutionDate: `${currentYear}-${currentMonth}-${dayStr}`,
        notifyDaysBefore: c.notifyDaysBefore
      });
    });

    try {
      const payload = {
        startDate,
        hasPayroll,
        payrollAmount: Number(payrollAmount),
        hasProportionalFirstPayment,
        firstPaymentAmount: Number(firstPaymentAmount),
        firstPaymentDate,
        nextPayrollDate,
        payrollFrequency,
        notifyDaysBefore,
        wallets: activeWalletsList.map(w => ({
          name: w.name,
          type: w.type,
          initialBalance: Number(w.initialBalance),
          creditLimit: w.type === 'credit' ? Number(w.creditLimit) : 0,
          cutOffDay: w.type === 'credit' ? Number(w.cutOffDay) : undefined,
          dueDay: w.type === 'credit' ? Number(w.dueDay) : undefined,
          isPayrollRecipient: w.type === 'debit' && w.isPayrollRecipient
        })),
        recurringExpenses: consolidatedRecurring,
        hasLoan,
        loan: hasLoan ? {
          name: loanName.trim(),
          bank: loanBank.trim(),
          amount_granted: Number(loanAmount),
          current_balance: Number(loanBalance),
          interest_rate: Number(loanRate),
          total_payments: Number(loanPayments),
          frequency: loanFrequency,
          payment_amount: Number(loanPaymentAmount),
          start_date: startDate,
          wallet_name: activeWalletsList[0]?.name || 'Efectivo'
        } : undefined
      };

      const res = await setupInitialData(payload);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || 'Ocurrió un error al guardar la configuración.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error('Error al inicializar datos:', err);
      setError(err.message || 'Error de conexión.');
      setIsSubmitting(false);
    }
  };

  const getMoodForStep = (stepNum: number): MascotMood => {
    switch (stepNum) {
      case 1: return "welcoming";
      case 2: return "income";
      case 3: return "wallets";
      case 4: return "categories";
      case 5: return "loans";
      default: return "success";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="surface-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0A0A0C] shadow-2xl">
        
        {/* Header & Progress */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-cerulean" />
            <span className="text-xs font-black uppercase tracking-wider text-brand-cerulean">Configuración de Inicio</span>
          </div>
          <div className="text-xs font-bold text-slate-500 dark:text-zinc-400">
            Paso {step} de 6
          </div>
        </div>

        <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full mb-6 overflow-hidden">
          <div 
            className="bg-brand-cerulean h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>

        {/* Mascota Robótica Lukas */}
        <div className="mb-6">
          <RoboticMascot mood={getMoodForStep(step)} />
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl p-4 flex gap-3 items-center">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* PASO 1: Fecha de Inicio */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">¡Empecemos desde cero!</h2>
              <p className="text-xs text-zinc-400 mt-1">Establece tu fecha de inicio para organizar tus carteras, nóminas y movimientos diarios.</p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-bold text-slate-900 dark:text-white">Fecha de Inicio del Control Financiero</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-bold border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#121216] rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                    required
                  />
                </div>
                <span className="text-[10px] text-zinc-500">Todos los movimientos y balances se registrarán y proyectarán a partir de esta fecha.</span>
              </div>
            </div>
          </div>
        )}

        {/* PASO 2: Nómina & Esquemas Universales */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Ingresos & Esquema de Nómina</h2>
              <p className="text-xs text-zinc-400 mt-1">Configura con exactitud cómo y cuándo recibes tus pagos o sueldos.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setHasPayroll(true)}
                className={`p-3.5 border rounded-2xl flex flex-col items-center gap-2 transition-all ${
                  hasPayroll 
                    ? 'border-brand-cerulean bg-brand-cerulean/10 text-white font-bold' 
                    : 'border-slate-200 dark:border-white/[0.08] hover:border-zinc-500 text-zinc-400'
                }`}
              >
                <CheckCircle className={`w-5 h-5 ${hasPayroll ? 'text-brand-cerulean' : 'text-zinc-500'}`} />
                <span className="text-xs font-bold">Sí, recibo sueldo periódico</span>
              </button>

              <button
                type="button"
                onClick={() => setHasPayroll(false)}
                className={`p-3.5 border rounded-2xl flex flex-col items-center gap-2 transition-all ${
                  !hasPayroll 
                    ? 'border-brand-cerulean bg-brand-cerulean/10 text-white font-bold' 
                    : 'border-slate-200 dark:border-white/[0.08] hover:border-zinc-500 text-zinc-400'
                }`}
              >
                <X className={`w-5 h-5 ${!hasPayroll ? 'text-brand-cerulean' : 'text-zinc-500'}`} />
                <span className="text-xs font-bold">No / Ingresos variables</span>
              </button>
            </div>

            {hasPayroll && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-bold text-slate-900 dark:text-white">Monto Regular por Pago</label>
                    <CurrencyInput
                      value={payrollAmount}
                      onChange={setPayrollAmount}
                      className="w-full px-3.5 py-2.5 text-xs font-black border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#121216] rounded-xl focus:ring-2 focus:ring-brand-cerulean dark:text-white"
                      placeholder="$0.00"
                    />
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-bold text-slate-900 dark:text-white">Modalidad de Frecuencia</label>
                    <select
                      value={payrollFrequency}
                      onChange={(e: any) => setPayrollFrequency(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-bold border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#121216] rounded-xl focus:ring-2 focus:ring-brand-cerulean dark:text-white"
                    >
                      <option value="days_14">Catorcenal (cada 14 días exactos)</option>
                      <option value="days_15">Quincenal Calendario (Día 15 y Fin de Mes)</option>
                      <option value="every_15_days">Cada 15 días exactos (conteo por días)</option>
                      <option value="monthly">Mensual (un día fijo al mes)</option>
                      <option value="weekly">Semanal (cada 7 días)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-bold text-slate-900 dark:text-white">Fecha de Inicio / Primer Pago</label>
                    <input
                      type="date"
                      value={nextPayrollDate}
                      onChange={(e) => setNextPayrollDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-bold border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#121216] rounded-xl focus:ring-2 focus:ring-brand-cerulean dark:text-white"
                      required
                    />
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5 text-amber-400" /> Recordatorio / Notificación
                    </label>
                    <select
                      value={notifyDaysBefore}
                      onChange={(e) => setNotifyDaysBefore(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-xs font-bold border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#121216] rounded-xl focus:ring-2 focus:ring-brand-cerulean dark:text-white"
                    >
                      <option value={0}>El mismo día del pago (09:00 AM)</option>
                      <option value={1}>1 día antes</option>
                      <option value={2}>2 días antes</option>
                      <option value={3}>3 días antes</option>
                      <option value={7}>1 semana antes</option>
                      <option value={-1}>Sin recordatorio</option>
                    </select>
                  </div>
                </div>

                {/* Ajuste Proporcional del Primer Pago */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#121216] border border-white/[0.06] space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasProportionalFirstPayment}
                      onChange={(e) => setHasProportionalFirstPayment(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-cerulean focus:ring-brand-cerulean"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        ¿Tu primer cobro es proporcional o ajustado?
                      </span>
                      <span className="text-[10px] text-zinc-400 block">
                        Útil si entraste a trabajar a mitad de quincena (ej. entraste el día 9 y el día 15 recibes solo 6 o 7 días).
                      </span>
                    </div>
                  </label>

                  {hasProportionalFirstPayment && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400">Monto del Primer Pago Ajustado</label>
                        <CurrencyInput
                          value={firstPaymentAmount}
                          onChange={setFirstPaymentAmount}
                          className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-[#18181C] border border-white/[0.08] rounded-xl dark:text-white"
                          placeholder="$0.00"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-zinc-400">Fecha del Primer Pago Ajustado</label>
                        <input
                          type="date"
                          value={firstPaymentDate}
                          onChange={(e) => setFirstPaymentDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-[#18181C] border border-white/[0.08] rounded-xl dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Caja de Próximos Pagos Calculados */}
                {projectedPayrolls.length > 0 && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2.5">
                    <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Próximos Pagos Proyectados en Calendario:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      {projectedPayrolls.map((item, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-slate-900/80 border border-white/[0.06] text-center">
                          <p className="text-[10px] text-zinc-400 font-bold uppercase">{WEEKDAYS_NAMES[item.date.getDay()]}</p>
                          <p className="text-xs font-black text-white mt-0.5">{item.date.getDate()} de {MONTH_NAMES[item.date.getMonth()]}</p>
                          <p className="text-[11px] font-black text-emerald-400 mt-1">${item.amount.toLocaleString('es-MX')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PASO 3: Carteras & Cuentas */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Tus Cuentas & Carteras</h2>
              <p className="text-xs text-zinc-400 mt-1">Selecciona y configura los saldos disponibles iniciales en cada cuenta.</p>
            </div>

            <div className="space-y-3">
              {wallets.map((wallet, index) => (
                <div 
                  key={wallet.name}
                  className={`p-4 rounded-2xl border transition-all ${
                    wallet.enabled 
                      ? 'border-brand-cerulean/50 bg-slate-50 dark:bg-[#121216]' 
                      : 'border-slate-200 dark:border-white/[0.04] bg-slate-50/50 dark:bg-zinc-900/20 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wallet.enabled}
                        onChange={(e) => handleWalletChange(index, { enabled: e.target.checked })}
                        className="w-4 h-4 rounded text-brand-cerulean focus:ring-brand-cerulean"
                      />
                      <span className="text-xs font-black text-slate-900 dark:text-white">{wallet.name}</span>
                    </label>

                    {wallet.type === 'debit' && wallet.enabled && hasPayroll && (
                      <label className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="payrollRecipient"
                          checked={wallet.isPayrollRecipient}
                          onChange={() => {
                            setWallets(prev => prev.map((w, i) => ({
                              ...w,
                              isPayrollRecipient: i === index
                            })));
                          }}
                          className="text-emerald-500 focus:ring-emerald-400"
                        />
                        Recibe Nómina
                      </label>
                    )}
                  </div>

                  {wallet.enabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200/60 dark:border-white/[0.06]">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400">
                          {wallet.type === 'credit' ? 'Saldo Deudor Actual' : 'Saldo Disponible Actual'}
                        </label>
                        <CurrencyInput
                          value={wallet.initialBalance}
                          onChange={(val) => handleWalletChange(index, { initialBalance: val })}
                          className="w-full px-3 py-2 text-xs font-bold border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#18181C] rounded-xl dark:text-white"
                          placeholder="$0.00"
                        />
                      </div>

                      {wallet.type === 'credit' && (
                        <div>
                          <label className="text-[10px] font-bold text-zinc-400">Límite de Crédito</label>
                          <CurrencyInput
                            value={wallet.creditLimit}
                            onChange={(val) => handleWalletChange(index, { creditLimit: val })}
                            className="w-full px-3 py-2 text-xs font-bold border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#18181C] rounded-xl dark:text-white"
                            placeholder="$0.00"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PASO 4: Gastos Fijos & Suscripciones Recurrentes con Notificaciones */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Gastos & Suscripciones Recurrentes</h2>
              <p className="text-xs text-zinc-400 mt-1">Activa tus suscripciones y personaliza las alertas para que nunca se te pase un pago.</p>
            </div>

            {/* Presets Rápidos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {presets.map(preset => {
                const IconComponent = preset.icon;
                return (
                  <div 
                    key={preset.id}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-2 ${
                      preset.enabled
                        ? 'border-brand-cerulean bg-brand-cerulean/10'
                        : 'border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#121216]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BrandServiceIcon brand={preset.id} size="sm" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{preset.concept}</p>
                        <p className="text-[10px] text-zinc-400 font-medium">Día {preset.dayOfMonth} de cada mes</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {preset.enabled ? (
                        <div className="w-20">
                          <CurrencyInput
                            value={preset.amount}
                            onChange={(val) => handlePresetAmountChange(preset.id, val)}
                            className="w-full px-2 py-1 text-xs font-bold bg-white dark:bg-[#18181C] border border-white/[0.1] rounded-lg text-right dark:text-white"
                          />
                        </div>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => togglePreset(preset.id)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition ${
                          preset.enabled
                            ? 'bg-brand-cerulean text-white border-brand-cerulean'
                            : 'bg-transparent text-zinc-400 border-white/[0.1] hover:text-white'
                        }`}
                      >
                        {preset.enabled ? 'Activo' : '+ Agregar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Agregar Gasto Personalizado */}
            <form onSubmit={handleAddCustomExpense} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#121216] border border-white/[0.06] space-y-3">
              <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-brand-cerulean" />
                Agregar Otro Pago Recurrente Personalizado
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Ej. Colegiatura o Seguro"
                  value={customConcept}
                  onChange={(e) => setCustomConcept(e.target.value)}
                  className="px-3 py-2 text-xs font-bold bg-white dark:bg-[#18181C] border border-white/[0.08] rounded-xl dark:text-white"
                />
                <CurrencyInput
                  placeholder="Monto ($)"
                  value={customAmount}
                  onChange={setCustomAmount}
                  className="px-3 py-2 text-xs font-bold bg-white dark:bg-[#18181C] border border-white/[0.08] rounded-xl dark:text-white"
                />
                <input
                  type="number"
                  min={1}
                  max={31}
                  placeholder="Día (1-31)"
                  value={customDay}
                  onChange={(e) => setCustomDay(Number(e.target.value))}
                  className="px-3 py-2 text-xs font-bold bg-white dark:bg-[#18181C] border border-white/[0.08] rounded-xl dark:text-white"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-brand-cerulean hover:bg-brand-cerulean/90 text-white rounded-xl text-xs font-black transition"
                >
                  Guardar
                </button>
              </div>

              {customExpenses.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  {customExpenses.map(c => (
                    <div key={c.id} className="flex justify-between items-center text-xs p-2 rounded-xl bg-white dark:bg-[#18181C]">
                      <span className="font-bold text-white">{c.concept} (Día {c.dayOfMonth})</span>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-rose-400">${c.amount.toLocaleString('es-MX')}</span>
                        <button type="button" onClick={() => handleRemoveCustomExpense(c.id)} className="text-zinc-500 hover:text-rose-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>
        )}

        {/* PASO 5: Préstamos & Financiamiento */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Préstamos & Créditos Personales</h2>
              <p className="text-xs text-zinc-400 mt-1">¿Tienes algún crédito activo para programar sus mensualidades y amortizaciones?</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setHasLoan(true)}
                className={`p-3.5 border rounded-2xl flex flex-col items-center gap-2 transition-all ${
                  hasLoan 
                    ? 'border-brand-cerulean bg-brand-cerulean/10 text-white font-bold' 
                    : 'border-slate-200 dark:border-white/[0.08] hover:border-zinc-500 text-zinc-400'
                }`}
              >
                <Landmark className={`w-5 h-5 ${hasLoan ? 'text-brand-cerulean' : 'text-zinc-500'}`} />
                <span className="text-xs font-bold">Sí, tengo un crédito</span>
              </button>

              <button
                type="button"
                onClick={() => setHasLoan(false)}
                className={`p-3.5 border rounded-2xl flex flex-col items-center gap-2 transition-all ${
                  !hasLoan 
                    ? 'border-brand-cerulean bg-brand-cerulean/10 text-white font-bold' 
                    : 'border-slate-200 dark:border-white/[0.08] hover:border-zinc-500 text-zinc-400'
                }`}
              >
                <X className={`w-5 h-5 ${!hasLoan ? 'text-brand-cerulean' : 'text-zinc-500'}`} />
                <span className="text-xs font-bold">No tengo deudas</span>
              </button>
            </div>

            {hasLoan && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#121216] border border-white/[0.06] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400">Nombre del Préstamo</label>
                    <input
                      type="text"
                      value={loanName}
                      onChange={(e) => setLoanName(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-[#18181C] border border-white/[0.08] rounded-xl dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400">Banco / Institución</label>
                    <input
                      type="text"
                      value={loanBank}
                      onChange={(e) => setLoanBank(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-[#18181C] border border-white/[0.08] rounded-xl dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400">Saldo Pendiente de Pago</label>
                    <CurrencyInput
                      value={loanBalance}
                      onChange={setLoanBalance}
                      className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-[#18181C] border border-white/[0.08] rounded-xl dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400">Pago por Mensualidad</label>
                    <CurrencyInput
                      value={loanPaymentAmount}
                      onChange={setLoanPaymentAmount}
                      className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-[#18181C] border border-white/[0.08] rounded-xl dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PASO 6: Resumen Financiero Inteligente & Despegue */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Resumen Financiero Proyectado</h2>
              <p className="text-xs text-zinc-400 mt-1">Revisa tu estructura financiera antes de activar tu plataforma.</p>
            </div>

            {/* KPI Cards de Proyección */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-[10px] font-bold text-emerald-400 uppercase flex items-center justify-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Ingreso Mensual
                </p>
                <p className="text-base font-black text-white mt-1">${monthlyIncome.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                <p className="text-[10px] font-bold text-rose-400 uppercase flex items-center justify-center gap-1">
                  <ArrowDownLeft className="w-3.5 h-3.5" /> Gastos Fijos
                </p>
                <p className="text-base font-black text-white mt-1">${monthlyRecurringExpenses.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-brand-cerulean/10 border border-brand-cerulean/20 text-center">
                <p className="text-[10px] font-bold text-brand-cerulean uppercase flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Flujo Libre Est.
                </p>
                <p className="text-base font-black text-white mt-1">${freeCashFlow.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</p>
              </div>
            </div>

            {/* Detalle Consolidado */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#121216] border border-white/[0.06] space-y-3">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-white/[0.06]">
                <span className="text-zinc-400">Fecha de Inicio:</span>
                <span className="font-bold text-white">{startDate}</span>
              </div>

              <div className="flex justify-between items-center text-xs pb-2 border-b border-white/[0.06]">
                <span className="text-zinc-400">Nómina / Sueldo:</span>
                <span className="font-bold text-white">
                  {hasPayroll ? (
                    `$${payrollAmount.toLocaleString('es-MX')} (${
                      payrollFrequency === 'days_14' ? 'Catorcenal (cada 14 días)' : 
                      payrollFrequency === 'days_15' ? 'Quincenal (Día 15 y Fin de Mes)' : 
                      payrollFrequency === 'every_15_days' ? 'Cada 15 días exactos' :
                      payrollFrequency === 'weekly' ? 'Semanal' : 'Mensual'
                    })`
                  ) : 'No configurado'}
                </span>
              </div>

              {hasProportionalFirstPayment && (
                <div className="flex justify-between items-center text-xs pb-2 border-b border-white/[0.06]">
                  <span className="text-zinc-400">Primer Pago Proporcional:</span>
                  <span className="font-bold text-emerald-400">
                    ${firstPaymentAmount.toLocaleString('es-MX')} ({firstPaymentDate})
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs pb-2 border-b border-white/[0.06]">
                <span className="text-zinc-400">Carteras a Activar:</span>
                <span className="font-bold text-white">{activeWalletsList.map(w => w.name).join(', ')}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Suscripciones & Gastos Fijos:</span>
                <span className="font-bold text-rose-400">
                  {presets.filter(p => p.enabled).length + customExpenses.length} programados (${monthlyRecurringExpenses.toLocaleString('es-MX')}/mes)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Botones de Navegación */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200/60 dark:border-white/[0.06] mt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs font-bold text-zinc-400 hover:text-white transition flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
          ) : <div />}

          {step < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-brand-cerulean hover:bg-brand-cerulean/90 text-white text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-brand-cerulean/30"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-black transition flex items-center gap-2 shadow-lg shadow-emerald-500/30 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Activando tu Espacio...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Activar Plataforma Financiera
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
