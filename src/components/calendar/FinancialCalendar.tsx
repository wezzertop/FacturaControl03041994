"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Landmark,
  Clock,
  X,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Scale,
  Filter,
  Search,
  PlusCircle,
  Eye,
  Layers,
  LayoutGrid,
  ListFilter,
  Sparkles,
  Zap,
  ShieldAlert,
  PiggyBank,
  ArrowRight,
  Award,
  Leaf,
  Info,
  Edit2,
  Trash2,
  ExternalLink,
  RefreshCw,
  Tag,
  AlertCircle
} from "lucide-react";
import BrandServiceIcon from "@/components/ui/BrandServiceIcon";
import { deleteRecurringPayment, deleteTransaction, executeRecurringPaymentNow } from "@/app/actions/wallets";

interface FinancialCalendarProps {
  invoices: any[];
  transactions: any[];
  recurringPayments: any[];
  wallets: any[];
  loans: any[];
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// Reordenamiento: Domingo en lateral Izquierdo (col 1) y Sábado en lateral Derecho (col 7)
const WEEKDAYS_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const WEEKDAYS_SHORT_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount || 0);
};

export default function FinancialCalendar({
  invoices = [],
  transactions = [],
  recurringPayments = [],
  wallets = [],
  loans = []
}: FinancialCalendarProps) {
  const today = new Date();
  
  // Pestañas principales: 'calendar' (Calendario), 'projections' (Proyección de Ahorro), 'critical' (Vencimientos Críticos)
  const [activeTab, setActiveTab] = useState<'calendar' | 'projections' | 'critical'>('calendar');

  // Estado de vista del calendario: 'month' (Mensual) o 'week' (Semanal)
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [currentWeekDate, setCurrentWeekDate] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleDeleteRecurring = async (id: string, concept: string) => {
    if (!confirm(`¿Eliminar la regla recurrente "${concept}"?`)) return;
    startTransition(async () => {
      const res = await deleteRecurringPayment(id);
      if (res.success) {
        showStatus(`Regla "${concept}" eliminada exitosamente`);
        router.refresh();
      } else {
        showStatus(res.error || 'Error al eliminar regla', 'error');
      }
    });
  };

  const handleExecuteRecurring = async (id: string, concept: string) => {
    if (!confirm(`¿Registrar en este momento el cobro/abono de "${concept}" en tu cartera?`)) return;
    startTransition(async () => {
      const res = await executeRecurringPaymentNow(id);
      if (res.success) {
        showStatus(`¡Movimiento "${concept}" registrado en tu cartera!`);
        router.refresh();
      } else {
        showStatus(res.error || 'Error al ejecutar movimiento', 'error');
      }
    });
  };

  const handleDeleteTransaction = async (id: string, concept: string) => {
    if (!confirm(`¿Eliminar la transacción "${concept}"? El saldo de la cartera se actualizará automáticamente.`)) return;
    startTransition(async () => {
      const res = await deleteTransaction(id);
      if (res.success) {
        showStatus(`Transacción "${concept}" eliminada`);
        router.refresh();
      } else {
        showStatus(res.error || 'Error al eliminar transacción', 'error');
      }
    });
  };

  // Filtros
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'income' | 'expense' | 'credit' | 'loans' | 'recurring'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Simulador de Ahorro Inteligente
  const [savingsPercentage, setSavingsPercentage] = useState<number>(20); // 20% por defecto
  const [customMonthlySavings, setCustomMonthlySavings] = useState<string>('');
  const [annualInvestmentReturn, setAnnualInvestmentReturn] = useState<number>(10); // 10% estilo CETES/Fintechs MX

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // --- NAVEGACIÓN MES ---
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // --- NAVEGACIÓN SEMANA ---
  const handlePrevWeek = () => {
    const d = new Date(currentWeekDate);
    d.setDate(d.getDate() - 7);
    setCurrentWeekDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentWeekDate);
    d.setDate(d.getDate() + 7);
    setCurrentWeekDate(d);
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setCurrentWeekDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // --- OBTENER EVENTOS DE UN DÍA ESPECÍFICO ---
  const isRecurringEventOnDate = (
    item: { is_active?: boolean; frequency?: string; start_date?: string; next_execution_date?: string; end_date?: string | null },
    targetDate: Date
  ): boolean => {
    if (item.is_active === false) return false;
    const nextExecStr = item.next_execution_date ? item.next_execution_date.split('T')[0] : null;
    const startStr = item.start_date ? item.start_date.split('T')[0] : nextExecStr;
    if (!startStr && !nextExecStr) return false;

    const refStr = startStr || nextExecStr!;
    const [sY, sM, sD] = refStr.split('-').map(Number);
    const start = new Date(sY, sM - 1, sD, 12, 0, 0);
    const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 12, 0, 0);

    if (target < start) return false;

    // Verificar fecha fin si está configurada
    if (item.end_date) {
      const [eY, eM, eD] = item.end_date.split('T')[0].split('-').map(Number);
      const end = new Date(eY, eM - 1, eD, 12, 0, 0);
      if (target > end) return false;
    }

    const diffTime = target.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const freq = item.frequency || 'monthly';

    if (freq === 'days_14') {
      return diffDays % 14 === 0;
    }
    if (freq === 'every_15_days') {
      return diffDays % 15 === 0;
    }
    if (freq === 'weekly') {
      return diffDays % 7 === 0;
    }
    if (freq === 'days_15') {
      const tD = target.getDate();
      const tLastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
      return tD === 15 || tD === tLastDay;
    }
    if (freq === 'monthly') {
      return target.getDate() === sD;
    }
    if (freq === 'yearly') {
      return target.getMonth() === start.getMonth() && target.getDate() === sD;
    }
    return false;
  };

  const getEventsForDate = (dateObj: Date) => {
    const dayOfMonth = dateObj.getDate();
    const isThisMonth = dateObj.getMonth() === month && dateObj.getFullYear() === year;

    let dayTxList = transactions.filter(tx => {
      if (!tx.date) return false;
      if (tx.concept === 'Saldo inicial' || tx.concept === 'Deuda inicial') return false;
      return isSameDay(new Date(tx.date), dateObj);
    });

    let dayInvoiceList = invoices.filter(inv => {
      if (!inv.fecha) return false;
      return isSameDay(new Date(inv.fecha), dateObj);
    });

    let dayRecurringList = recurringPayments.filter(rec => isRecurringEventOnDate(rec, dateObj));

    const creditWallets = wallets.filter(w => w.type === 'credit');
    let dayCreditCutOffs = creditWallets.filter(w => w.cut_off_day === dayOfMonth && isThisMonth);
    let dayCreditDues = creditWallets.filter(w => w.due_day === dayOfMonth && isThisMonth);

    let dayLoanPayments = loans.filter(l => isRecurringEventOnDate(l, dateObj));

    // Filtro de búsqueda por texto
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      dayTxList = dayTxList.filter(tx => (tx.concept || '').toLowerCase().includes(q) || (tx.categories?.name || '').toLowerCase().includes(q));
      dayInvoiceList = dayInvoiceList.filter(inv => (inv.nombre_emisor || inv.nombre_receptor || inv.uuid || '').toLowerCase().includes(q));
      dayRecurringList = dayRecurringList.filter(rec => (rec.concept || '').toLowerCase().includes(q));
      dayCreditCutOffs = dayCreditCutOffs.filter(w => (w.name || '').toLowerCase().includes(q));
      dayCreditDues = dayCreditDues.filter(w => (w.name || '').toLowerCase().includes(q));
      dayLoanPayments = dayLoanPayments.filter(l => (l.name || l.bank || '').toLowerCase().includes(q));
    }

    // Filtro por tipo de evento
    if (eventTypeFilter === 'income') {
      dayTxList = dayTxList.filter(tx => tx.type === 'income');
      dayInvoiceList = dayInvoiceList.filter(inv => inv.invoice_type === 'ingreso' || inv.invoice_type === 'nomina');
      dayRecurringList = dayRecurringList.filter(rec => rec.type === 'income');
      dayCreditCutOffs = [];
      dayCreditDues = [];
      dayLoanPayments = [];
    } else if (eventTypeFilter === 'expense') {
      dayTxList = dayTxList.filter(tx => tx.type === 'expense');
      dayInvoiceList = dayInvoiceList.filter(inv => inv.invoice_type === 'egreso');
      dayRecurringList = dayRecurringList.filter(rec => rec.type === 'expense');
      dayCreditCutOffs = [];
      dayCreditDues = [];
      dayLoanPayments = [];
    } else if (eventTypeFilter === 'credit') {
      dayTxList = [];
      dayInvoiceList = [];
      dayRecurringList = [];
      dayLoanPayments = [];
    } else if (eventTypeFilter === 'loans') {
      dayTxList = [];
      dayInvoiceList = [];
      dayRecurringList = [];
      dayCreditCutOffs = [];
      dayCreditDues = [];
    } else if (eventTypeFilter === 'recurring') {
      dayTxList = [];
      dayInvoiceList = [];
      dayCreditCutOffs = [];
      dayCreditDues = [];
      dayLoanPayments = [];
    }

    let incomeSum = 0;
    let expenseSum = 0;

    dayTxList.forEach(tx => {
      if (tx.type === 'income') incomeSum += Number(tx.amount || 0);
      else expenseSum += Number(tx.amount || 0);
    });

    dayInvoiceList.forEach(inv => {
      const hasTx = dayTxList.some(tx => tx.invoice_id === inv.id);
      if (!hasTx) {
        if (inv.invoice_type === 'ingreso' || inv.invoice_type === 'nomina') {
          incomeSum += Number(inv.total || 0);
        } else {
          expenseSum += Number(inv.total || 0);
        }
      }
    });

    dayRecurringList.forEach(rec => {
      if (rec.type === 'income') incomeSum += Number(rec.amount || 0);
      else expenseSum += Number(rec.amount || 0);
    });

    // Detectar si es día de nómina o ingreso importante
    const hasPayrollOrIncome = dayRecurringList.some(r => r.type === 'income') || dayInvoiceList.some(i => i.invoice_type === 'nomina');

    return {
      transactions: dayTxList,
      invoices: dayInvoiceList,
      recurring: dayRecurringList,
      creditCutOffs: dayCreditCutOffs,
      creditDues: dayCreditDues,
      loanPayments: dayLoanPayments,
      incomeSum,
      expenseSum,
      hasPayrollOrIncome,
      hasEvents:
        dayTxList.length > 0 ||
        dayInvoiceList.length > 0 ||
        dayRecurringList.length > 0 ||
        dayCreditCutOffs.length > 0 ||
        dayCreditDues.length > 0 ||
        dayLoanPayments.length > 0
    };
  };

  // --- CÁLCULO DE CUADRÍCULA MES (DOMINGO A SÁBADO) ---
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDaysInMonth = lastDayOfMonth.getDate();

  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Domingo, 6 = Sábado
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const calendarCells = [];

  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i);
    calendarCells.push({ date: d, isCurrentMonth: false });
  }

  for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
    const d = new Date(year, month, dayNum);
    calendarCells.push({ date: d, isCurrentMonth: true });
  }

  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
    const d = new Date(year, month + 1, dayNum);
    calendarCells.push({ date: d, isCurrentMonth: false });
  }

  // --- CÁLCULO DE DÍAS PARA VISTA SEMANAL ---
  const startOfWeek = new Date(currentWeekDate);
  const dayIndex = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - dayIndex);

  const weekCells: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    weekCells.push(d);
  }
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  // --- CÁLCULO DE KPIS Y MÉTRICAS INTELIGENTES ---
  let monthlyTotalIncome = 0;
  let monthlyTotalExpense = 0;
  let monthlyTotalDebts = 0;
  let noSpendDaysCount = 0;
  let criticalCommitments: { date: Date; type: string; title: string; amount: number; isUrgent: boolean }[] = [];

  calendarCells.forEach(cell => {
    if (cell.isCurrentMonth) {
      const events = getEventsForDate(cell.date);
      monthlyTotalIncome += events.incomeSum;
      monthlyTotalExpense += events.expenseSum;

      if (events.expenseSum === 0 && events.incomeSum === 0) {
        noSpendDaysCount++;
      }

      // Recopilar compromisos críticos del mes
      events.creditDues.forEach(w => {
        const amt = Number(w.statement_payment_due || 0);
        monthlyTotalDebts += amt;
        criticalCommitments.push({
          date: cell.date,
          type: 'Tarjeta de Crédito',
          title: `Pago límite ${w.name}`,
          amount: amt,
          isUrgent: cell.date.getDate() - today.getDate() <= 5 && cell.date >= today
        });
      });

      events.loanPayments.forEach(l => {
        const amt = Number(l.payment_amount || 0);
        monthlyTotalDebts += amt;
        criticalCommitments.push({
          date: cell.date,
          type: 'Préstamo',
          title: `Cuota ${l.name} (${l.bank})`,
          amount: amt,
          isUrgent: cell.date.getDate() - today.getDate() <= 5 && cell.date >= today
        });
      });
    }
  });

  const monthlyNetCashflow = monthlyTotalIncome - monthlyTotalExpense;
  const currentSavingsRate = monthlyTotalIncome > 0 ? (monthlyNetCashflow / monthlyTotalIncome) * 100 : 0;
  const averageDailyExpense = monthlyTotalExpense / totalDaysInMonth;

  // --- CÁLCULOS DEL SIMULADOR DE AHORRO A FUTURO ---
  const effectiveMonthlySavings = customMonthlySavings !== '' && !isNaN(Number(customMonthlySavings))
    ? Number(customMonthlySavings)
    : (monthlyTotalIncome * (savingsPercentage / 100));

  // Fórmula de Interés Compuesto Mensual: Ahorro * [((1 + r)^n - 1) / r]
  const calculateCompoundGrowth = (monthlyAmount: number, months: number, annualRate: number) => {
    if (monthlyAmount <= 0) return 0;
    if (annualRate <= 0) return monthlyAmount * months;
    
    const monthlyRate = (annualRate / 100) / 12;
    const futureValue = monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    return futureValue;
  };

  const savingsEndCurrentMonth = Math.max(0, monthlyNetCashflow);
  const savingsIn1YearNet = effectiveMonthlySavings * 12;
  const savingsIn1YearInvested = calculateCompoundGrowth(effectiveMonthlySavings, 12, annualInvestmentReturn);

  const savingsIn3YearsNet = effectiveMonthlySavings * 36;
  const savingsIn3YearsInvested = calculateCompoundGrowth(effectiveMonthlySavings, 36, annualInvestmentReturn);

  const savingsIn5YearsNet = effectiveMonthlySavings * 60;
  const savingsIn5YearsInvested = calculateCompoundGrowth(effectiveMonthlySavings, 60, annualInvestmentReturn);

  const selectedDayEvents = selectedDay ? getEventsForDate(selectedDay) : null;

  return (
    <div className="space-y-6">

      {/* Selector de Pestañas Superiores del Módulo */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 transition shrink-0 ${
              activeTab === 'calendar'
                ? 'bg-gradient-to-r from-brand-cerulean to-blue-600 text-white shadow-md shadow-brand-cerulean/25'
                : 'bg-slate-100 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Calendario Interactivo</span>
          </button>

          <button
            onClick={() => setActiveTab('projections')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 transition shrink-0 ${
              activeTab === 'projections'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25'
                : 'bg-slate-100 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Proyector de Ahorro y Futuro</span>
          </button>

          <button
            onClick={() => setActiveTab('critical')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 transition shrink-0 ${
              activeTab === 'critical'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/25'
                : 'bg-slate-100 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Fechas Críticas del Mes ({criticalCommitments.length})</span>
          </button>
        </div>
      </div>

      {/* --- SECCIÓN 1: CALENDARIO PRINCIPAL (VISTA MES / SEMANA) --- */}
      {activeTab === 'calendar' && (
        <>
          {/* Tarjetas KPI de Resumen Mensual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="surface-card rounded-2xl p-5 flex items-center justify-between border border-slate-200/80 dark:border-white/10 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Ingresos del Mes</p>
                <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(monthlyTotalIncome)}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Nómina y facturas de cobro</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="surface-card rounded-2xl p-5 flex items-center justify-between border border-slate-200/80 dark:border-white/10 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Egresos del Mes</p>
                <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                  {formatCurrency(monthlyTotalExpense)}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Promedio: {formatCurrency(averageDailyExpense)}/día</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>

            <div className="surface-card rounded-2xl p-5 flex items-center justify-between border border-slate-200/80 dark:border-white/10 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Flujo Neto / Balance</p>
                <p className={`text-xl font-extrabold mt-1 ${monthlyNetCashflow >= 0 ? 'text-brand-cerulean' : 'text-amber-500'}`}>
                  {formatCurrency(monthlyNetCashflow)}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Capacidad real de ahorro</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
            </div>

            <div className="surface-card rounded-2xl p-5 flex items-center justify-between border border-slate-200/80 dark:border-white/10 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Compromisos / Deudas</p>
                <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                  {formatCurrency(monthlyTotalDebts)}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Tarjetas de crédito y préstamos</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Encabezado del Calendario y Controles */}
          <div className="surface-card rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-sm">
            <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-zinc-900/50">
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                      {viewMode === 'month'
                        ? `${MONTH_NAMES[month]} ${year}`
                        : `Semana del ${startOfWeek.getDate()} de ${MONTH_NAMES[startOfWeek.getMonth()]} al ${endOfWeek.getDate()} de ${MONTH_NAMES[endOfWeek.getMonth()]}`}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      {viewMode === 'month' ? 'Vista Mensual' : 'Vista Semanal'} (Domingo a la Izquierda / Sábado a la Derecha)
                    </p>
                  </div>
                </div>

                {/* Alternador de Vista */}
                <div className="inline-flex p-1 rounded-xl bg-slate-200/70 dark:bg-zinc-800 text-xs font-bold shrink-0">
                  <button
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                      viewMode === 'month'
                        ? 'bg-white dark:bg-zinc-900 text-brand-cerulean shadow-sm'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Mes</span>
                  </button>
                  <button
                    onClick={() => setViewMode('week')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                      viewMode === 'week'
                        ? 'bg-white dark:bg-zinc-900 text-brand-cerulean shadow-sm'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Semana</span>
                  </button>
                </div>
              </div>

              {/* Botones de Navegación */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToday}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition shadow-sm"
                >
                  Hoy
                </button>
                <div className="flex items-center rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                  <button
                    onClick={viewMode === 'month' ? handlePrevMonth : handlePrevWeek}
                    className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="w-px h-5 bg-slate-200 dark:bg-zinc-800" />
                  <button
                    onClick={viewMode === 'month' ? handleNextMonth : handleNextWeek}
                    className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filtros Rápidos */}
            <div className="px-5 py-3 bg-slate-100/60 dark:bg-zinc-900/40 border-b border-slate-200/80 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                <span className="text-slate-400 dark:text-zinc-500 mr-1 flex items-center gap-1">
                  <ListFilter className="w-3.5 h-3.5" /> Filtrar:
                </span>
                <button
                  onClick={() => setEventTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs transition ${eventTypeFilter === 'all' ? 'bg-brand-cerulean text-white font-extrabold shadow-sm' : 'bg-slate-200/80 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-300 dark:hover:bg-zinc-700 font-bold'}`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setEventTypeFilter('income')}
                  className={`px-3 py-1.5 rounded-xl text-xs transition ${eventTypeFilter === 'income' ? 'bg-emerald-600 text-white font-extrabold shadow-sm' : 'bg-slate-200/80 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-300 dark:hover:bg-zinc-700 font-bold'}`}
                >
                  🟢 Ingresos
                </button>
                <button
                  onClick={() => setEventTypeFilter('expense')}
                  className={`px-3 py-1.5 rounded-xl text-xs transition ${eventTypeFilter === 'expense' ? 'bg-rose-600 text-white font-extrabold shadow-sm' : 'bg-slate-200/80 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-300 dark:hover:bg-zinc-700 font-bold'}`}
                >
                  🔴 Egresos
                </button>
                <button
                  onClick={() => setEventTypeFilter('credit')}
                  className={`px-3 py-1.5 rounded-xl text-xs transition ${eventTypeFilter === 'credit' ? 'bg-amber-600 text-white font-extrabold shadow-sm' : 'bg-slate-200/80 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-300 dark:hover:bg-zinc-700 font-bold'}`}
                >
                  💳 Tarjetas
                </button>
                <button
                  onClick={() => setEventTypeFilter('loans')}
                  className={`px-3 py-1.5 rounded-xl text-xs transition ${eventTypeFilter === 'loans' ? 'bg-indigo-600 text-white font-extrabold shadow-sm' : 'bg-slate-200/80 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-300 dark:hover:bg-zinc-700 font-bold'}`}
                >
                  🏦 Préstamos
                </button>
                <button
                  onClick={() => setEventTypeFilter('recurring')}
                  className={`px-3 py-1.5 rounded-xl text-xs transition ${eventTypeFilter === 'recurring' ? 'bg-purple-600 text-white font-extrabold shadow-sm' : 'bg-slate-200/80 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-300 dark:hover:bg-zinc-700 font-bold'}`}
                >
                  🔄 Recurrentes
                </button>
              </div>

              <div className="relative shrink-0 w-full md:w-56">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar evento o concepto..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-cerulean"
                />
              </div>
            </div>

            {/* Días de la Semana: DOMINGO a SÁBADO */}
            <div className="grid grid-cols-7 border-b border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-zinc-900/80 text-center text-[10px] sm:text-xs font-bold uppercase text-slate-500 dark:text-zinc-400">
              {WEEKDAYS_ES.map((day, idx) => (
                <div key={day} className={`py-2.5 sm:py-3 px-0.5 truncate ${idx === 0 || idx === 6 ? 'text-brand-cerulean font-extrabold' : ''}`}>
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{WEEKDAYS_SHORT_ES[idx]}</span>
                </div>
              ))}
            </div>

            {/* Cuadrícula Vista Mensual */}
            {viewMode === 'month' && (
              <div className="grid grid-cols-7 divide-x divide-y divide-slate-200/70 dark:divide-zinc-800/80 bg-white dark:bg-zinc-950">
                {calendarCells.map((cell, index) => {
                  const events = getEventsForDate(cell.date);
                  const isToday = isSameDay(cell.date, today);

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDay(cell.date)}
                      className={`min-h-[115px] md:min-h-[140px] p-2 text-left flex flex-col justify-between transition-colors relative hover:bg-brand-cerulean/5 dark:hover:bg-zinc-900/60 ${
                        cell.isCurrentMonth
                          ? "bg-white dark:bg-zinc-950 text-slate-900 dark:text-white"
                          : "bg-slate-50/50 dark:bg-zinc-900/20 text-slate-400 dark:text-zinc-600"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`inline-grid place-items-center w-7 h-7 rounded-full text-xs font-bold ${
                            isToday
                              ? "bg-brand-cerulean text-white shadow-md shadow-brand-cerulean/30 ring-2 ring-brand-cerulean ring-offset-2 dark:ring-offset-zinc-950"
                              : cell.isCurrentMonth
                              ? "text-slate-900 dark:text-zinc-200"
                              : "text-slate-400 dark:text-zinc-600"
                          }`}
                        >
                          {cell.date.getDate()}
                        </span>

                        {events.hasPayrollOrIncome && (
                          <span className="px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-600 text-[9px] font-bold flex items-center gap-0.5" title="Día de Nómina / Cobro">
                            <Sparkles className="w-2.5 h-2.5" /> Nómina
                          </span>
                        )}
                      </div>

                      {/* Insignias de Eventos del Día (Optimizado para Celular y Escritorio) */}
                      <div className="space-y-1 mt-1 w-full overflow-hidden">
                        
                        {/* Vista en Celulares (< md): Puntos de colores compactos con micro importes */}
                        <div className="flex md:hidden flex-wrap items-center justify-center gap-1 mt-1">
                          {events.incomeSum > 0 && (
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" title={`Ingreso: ${formatCurrency(events.incomeSum)}`} />
                          )}
                          {events.expenseSum > 0 && (
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" title={`Egreso: ${formatCurrency(events.expenseSum)}`} />
                          )}
                          {events.creditCutOffs.length > 0 && (
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm" title="Corte de Tarjeta" />
                          )}
                          {events.creditDues.length > 0 && (
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shadow-sm" title="Pago de Tarjeta" />
                          )}
                          {events.loanPayments.length > 0 && (
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm" title="Cuota Préstamo" />
                          )}
                        </div>

                        {/* Vista en Escritorio (>= md): Tarjetas con texto e importes completos */}
                        <div className="hidden md:block space-y-1">
                          {events.incomeSum > 0 && (
                            <div className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold truncate flex items-center gap-1">
                              <ArrowUpRight className="w-3 h-3 shrink-0" />
                              <span className="truncate">{formatCurrency(events.incomeSum)}</span>
                            </div>
                          )}

                          {events.expenseSum > 0 && (
                            <div className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold truncate flex items-center gap-1">
                              <ArrowDownLeft className="w-3 h-3 shrink-0" />
                              <span className="truncate">{formatCurrency(events.expenseSum)}</span>
                            </div>
                          )}

                          {events.creditCutOffs.length > 0 && (
                            <div className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[9px] font-bold truncate flex items-center gap-1">
                              <CreditCard className="w-3 h-3 shrink-0" />
                              <span className="truncate">Corte {events.creditCutOffs[0].name}</span>
                            </div>
                          )}

                          {events.creditDues.length > 0 && (
                            <div className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[9px] font-bold truncate flex items-center gap-1">
                              <CreditCard className="w-3 h-3 shrink-0" />
                              <span className="truncate">Pago {events.creditDues[0].name}</span>
                            </div>
                          )}

                          {events.loanPayments.length > 0 && (
                            <div className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 text-[9px] font-bold truncate flex items-center gap-1">
                              <Landmark className="w-3 h-3 shrink-0" />
                              <span className="truncate">Pago {events.loanPayments[0].name}</span>
                            </div>
                          )}
                        </div>

                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Vista Semanal */}
            {viewMode === 'week' && (
              <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-200/70 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
                {weekCells.map((weekDate, index) => {
                  const events = getEventsForDate(weekDate);
                  const isToday = isSameDay(weekDate, today);

                  return (
                    <div key={index} className="p-3 min-h-[300px] flex flex-col justify-between space-y-3 bg-white dark:bg-zinc-950">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-900 pb-2">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-cerulean">
                            {WEEKDAYS_ES[weekDate.getDay()]}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-zinc-400">
                            {weekDate.getDate()} {MONTH_NAMES[weekDate.getMonth()]}
                          </p>
                        </div>

                        <span
                          className={`inline-grid place-items-center w-7 h-7 rounded-full text-xs font-bold ${
                            isToday
                              ? "bg-brand-cerulean text-white shadow-md shadow-brand-cerulean/30 ring-2 ring-brand-cerulean ring-offset-2 dark:ring-offset-zinc-950"
                              : "text-slate-900 dark:text-zinc-200"
                          }`}
                        >
                          {weekDate.getDate()}
                        </span>
                      </div>

                      <div className="space-y-2 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">
                        {!events.hasEvents ? (
                          <p className="text-[11px] text-slate-400 dark:text-zinc-600 italic text-center py-4">Sin registros</p>
                        ) : (
                          <>
                            {events.incomeSum > 0 && (
                              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-between">
                                <span className="flex items-center gap-1"><ArrowUpRight className="w-3.5 h-3.5" /> Ingresos</span>
                                <span>+{formatCurrency(events.incomeSum)}</span>
                              </div>
                            )}

                            {events.expenseSum > 0 && (
                              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-between">
                                <span className="flex items-center gap-1"><ArrowDownLeft className="w-3.5 h-3.5" /> Egresos</span>
                                <span>-{formatCurrency(events.expenseSum)}</span>
                              </div>
                            )}

                            {events.creditDues.map(w => (
                              <div key={`w-due-${w.id}`} className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold">
                                <p className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> Pago {w.name}</p>
                                <p className="text-[11px] text-right font-extrabold">{formatCurrency(Number(w.statement_payment_due || 0))}</p>
                              </div>
                            ))}

                            {events.loanPayments.map(l => (
                              <div key={`w-loan-${l.id}`} className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-800 dark:text-indigo-300 text-xs font-bold">
                                <p className="flex items-center gap-1"><Landmark className="w-3.5 h-3.5" /> Cuota {l.name}</p>
                                <p className="text-[11px] text-right font-extrabold">{formatCurrency(Number(l.payment_amount || 0))}</p>
                              </div>
                            ))}
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedDay(weekDate)}
                        className="w-full py-1.5 text-center text-xs font-bold text-brand-cerulean hover:bg-brand-cerulean/10 rounded-xl transition flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ver Detalle
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* --- SECCIÓN 2: SIMULADOR & PROYECTOR DE AHORRO A FUTURO --- */}
      {activeTab === 'projections' && (
        <div className="space-y-6 animate-in fade-in zoom-in-95">
          {/* Header del Simulador */}
          <div className="surface-card rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 bg-gradient-to-br from-emerald-500/10 via-brand-cerulean/10 to-transparent">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-2">
                  <Sparkles className="w-3.5 h-3.5" /> Motor de Proyección Financiera
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  ¿Cuánto podrías acumular si ahorras mes a mes?
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
                  Simula tu crecimiento patrimonial a 1, 3 y 5 años según tu flujo neto real.
                </p>
              </div>

              <div className="surface-card rounded-xl p-3.5 border border-slate-200 dark:border-white/10 text-right shrink-0">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Flujo Disponible</p>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(monthlyNetCashflow)}<span className="text-xs text-slate-400 font-normal">/mes</span>
                </p>
              </div>
            </div>
          </div>

          {/* Controles de Configuración del Ahorro */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Control 1: Porcentaje de Ahorro */}
            <div className="surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand-cerulean/15 text-brand-cerulean flex items-center justify-center font-bold text-xs">1</div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">% Ahorro Mensual</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-brand-cerulean">
                  <span>{savingsPercentage}%</span>
                  <span>{formatCurrency(monthlyTotalIncome * (savingsPercentage / 100))}/mes</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={savingsPercentage}
                  onChange={(e) => {
                    setSavingsPercentage(Number(e.target.value));
                    setCustomMonthlySavings('');
                  }}
                  className="w-full h-2 bg-slate-200 dark:bg-[#141418] rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>
            </div>

            {/* Control 2: Monto Fijo Mensual */}
            <div className="surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold text-xs">2</div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Monto Fijo ($)</h3>
              </div>
              
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="number"
                  value={customMonthlySavings}
                  onChange={(e) => setCustomMonthlySavings(e.target.value)}
                  placeholder={`Ej: ${formatCurrency(monthlyNetCashflow > 0 ? monthlyNetCashflow : 2000)}`}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Control 3: Tasa de Rendimiento de Inversión */}
            <div className="surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.08] space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold text-xs">3</div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Rendimiento (CETES/Fintech)</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setAnnualInvestmentReturn(0)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${annualInvestmentReturn === 0 ? 'bg-white text-black border-white' : 'bg-slate-50 dark:bg-[#0A0A0C] text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-white/[0.08]'}`}
                >
                  0%
                </button>
                <button
                  onClick={() => setAnnualInvestmentReturn(10)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${annualInvestmentReturn === 10 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 dark:bg-[#0A0A0C] text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-white/[0.08]'}`}
                >
                  10% CETES
                </button>
                <button
                  onClick={() => setAnnualInvestmentReturn(13)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${annualInvestmentReturn === 13 ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 dark:bg-[#0A0A0C] text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-white/[0.08]'}`}
                >
                  13% Nu/Stori
                </button>
              </div>
            </div>

          </div>

          {/* Tarjetas de Proyección Temporal (1 Año, 3 Años, 5 Años) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Proyección a 1 Año */}
            <div className="surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">En 1 Año (12 Meses)</span>
                <span className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold text-xs">12M</span>
              </div>

              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {formatCurrency(annualInvestmentReturn > 0 ? savingsIn1YearInvested : savingsIn1YearNet)}
                </p>
              </div>
            </div>

            {/* Proyección a 3 Años */}
            <div className="surface-card rounded-2xl p-5 border-2 border-emerald-500/40 bg-emerald-500/5 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">En 3 Años (36 Meses)</span>
              </div>

              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {formatCurrency(annualInvestmentReturn > 0 ? savingsIn3YearsInvested : savingsIn3YearsNet)}
                </p>
              </div>
            </div>

            {/* Proyección a 5 Años */}
            <div className="surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">En 5 Años (60 Meses)</span>
                <span className="w-7 h-7 rounded-lg bg-brand-cerulean/15 text-brand-cerulean flex items-center justify-center font-bold text-xs">60M</span>
              </div>

              <div>
                <p className="text-2xl font-black text-brand-cerulean">
                  {formatCurrency(annualInvestmentReturn > 0 ? savingsIn5YearsInvested : savingsIn5YearsNet)}
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- SECCIÓN 3: LISTADO DE COMPROMISOS Y VENCIMIENTOS CRÍTICOS --- */}
      {activeTab === 'critical' && (
        <div className="surface-card rounded-2xl border border-slate-200/80 dark:border-white/[0.08] p-5 space-y-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                Compromisos Financieros y Fechas Límite
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
              {criticalCommitments.length} Vencimientos
            </span>
          </div>

          {criticalCommitments.length === 0 ? (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-900 dark:text-white">¡No tienes deudas ni vencimientos pendientes este mes!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {criticalCommitments
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center justify-between transition ${
                      item.isUrgent
                        ? 'bg-rose-500/10 border-rose-500/30'
                        : 'bg-slate-50 dark:bg-[#0A0A0C] border-slate-200/80 dark:border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.type === 'Préstamo' ? 'bg-indigo-500/15 text-indigo-400' : 'bg-amber-500/15 text-amber-400'}`}>
                        {item.type === 'Préstamo' ? <Landmark className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</p>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                          {item.date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white">{formatCurrency(item.amount)}</p>
                      {item.isUrgent && (
                        <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">¡Próximo!</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Modal / Panel Deslizable de Detalle del Día Seleccionado */}
      {selectedDay && selectedDayEvents && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="surface-card w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200/80 dark:border-white/[0.1] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] bg-white dark:bg-[#0A0A0C]">
            
            {/* Tirador táctil en celular */}
            <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
              <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
            </div>

            {/* Header del Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50/80 dark:bg-[#121216]/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-brand-cerulean uppercase tracking-wider block">
                  Detalle de Movimientos
                </span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white capitalize mt-0.5">
                  {selectedDay.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mensaje de Estado */}
            {statusMessage && (
              <div className={`mx-4 mt-3 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
                statusMessage.type === 'success' 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}>
                {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Lista de Movimientos y Vencimientos */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 custom-scrollbar">
              {!selectedDayEvents.hasEvents ? (
                <div className="py-10 text-center text-slate-500 dark:text-zinc-400">
                  <CalendarIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-700 mb-2 opacity-50" />
                  <p className="text-xs font-bold text-slate-600 dark:text-zinc-300">Sin movimientos programados</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">No hay cargos, nóminas ni vencimientos para esta fecha.</p>
                </div>
              ) : (
                <>
                  {/* Tarjetas de Recurrentes (Nóminas y Suscripciones) */}
                  {selectedDayEvents.recurring.map(rec => {
                    const isIncome = rec.type === 'income';
                    const freqLabel = rec.frequency === 'days_14' ? 'Catorcenal (14 días)' : 
                                      rec.frequency === 'days_15' ? 'Quincenal (15 y fin de mes)' : 
                                      rec.frequency === 'every_15_days' ? 'Cada 15 días exactos' : 
                                      rec.frequency === 'weekly' ? 'Semanal' : 'Mensual';

                    return (
                      <div 
                        key={`rec-${rec.id}`} 
                        className={`p-3.5 rounded-2xl border transition flex flex-col gap-3 ${
                          isIncome 
                            ? 'border-emerald-500/30 bg-emerald-500/5' 
                            : 'border-slate-200 dark:border-white/[0.08] bg-slate-50/60 dark:bg-[#141418]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {isIncome ? (
                              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                                <TrendingUp className="w-5 h-5" />
                              </div>
                            ) : (
                              <BrandServiceIcon brand={rec.concept} size="md" />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-900 dark:text-white truncate">{rec.concept}</p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${isIncome ? 'bg-emerald-500/20 text-emerald-400' : 'bg-brand-cerulean/15 text-brand-cerulean'}`}>
                                  {freqLabel}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-medium">
                                  {rec.wallets?.name || 'Cartera'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`text-sm font-black ${isIncome ? 'text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                              {isIncome ? '+' : '-'}{formatCurrency(Number(rec.amount || 0))}
                            </span>
                          </div>
                        </div>

                        {/* Botones de Acción Rápida para Recurrentes */}
                        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-200/50 dark:border-white/[0.06]">
                          <button
                            type="button"
                            onClick={() => handleExecuteRecurring(rec.id, rec.concept)}
                            disabled={isPending}
                            title="Registrar cobro/abono en este momento"
                            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold flex items-center gap-1 transition"
                          >
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span>Ejecutar Ahora</span>
                          </button>

                          <Link
                            href="/recurring"
                            onClick={() => setSelectedDay(null)}
                            title="Gestionar en panel de recurrentes"
                            className="px-2.5 py-1 rounded-xl border border-white/[0.08] hover:bg-white/10 text-zinc-300 text-[10px] font-bold flex items-center gap-1 transition"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Gestionar</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDeleteRecurring(rec.id, rec.concept)}
                            disabled={isPending}
                            title="Eliminar regla recurrente"
                            className="p-1.5 rounded-xl border border-rose-500/20 hover:bg-rose-500/15 text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Tarjetas de Transacciones Reales */}
                  {selectedDayEvents.transactions.map(tx => {
                    const isIncome = tx.type === 'income';
                    return (
                      <div 
                        key={`tx-${tx.id}`} 
                        className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-[#141418] border border-slate-200 dark:border-white/[0.08] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {isIncome ? (
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                              <TrendingUp className="w-5 h-5" />
                            </div>
                          ) : (
                            <BrandServiceIcon brand={tx.concept} size="md" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 dark:text-white truncate">{tx.concept}</p>
                            <p className="text-[10px] text-zinc-400 truncate">
                              {tx.wallets?.name || 'Cartera'} {tx.categories ? `• ${tx.categories.name}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-xs font-black ${isIncome ? 'text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                            {isIncome ? '+' : '-'}{formatCurrency(Number(tx.amount || 0))}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(tx.id, tx.concept)}
                            disabled={isPending}
                            title="Eliminar transacción"
                            className="p-1.5 rounded-xl border border-rose-500/20 hover:bg-rose-500/15 text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Tarjetas de Cortes y Vencimientos de Tarjetas */}
                  {selectedDayEvents.creditCutOffs.map(w => (
                    <div key={`cutoff-${w.id}`} className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">Día de Corte: {w.name}</p>
                          <p className="text-[10px] text-amber-400/90 font-medium">Cierre del periodo de compras</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedDayEvents.creditDues.map(w => (
                    <div key={`due-${w.id}`} className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/30 text-amber-300 flex items-center justify-center shrink-0">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">Fecha Límite: {w.name}</p>
                          <p className="text-[10px] text-amber-300/90 font-medium">Pago para no generar intereses</p>
                        </div>
                      </div>
                      <span className="font-black text-slate-900 dark:text-white text-xs">
                        {formatCurrency(Number(w.statement_payment_due || 0))}
                      </span>
                    </div>
                  ))}

                  {/* Tarjetas de Cuotas de Préstamo */}
                  {selectedDayEvents.loanPayments.map(l => (
                    <div key={`loan-${l.id}`} className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                          <Landmark className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">Cuota Préstamo: {l.name}</p>
                          <p className="text-[10px] text-indigo-300 font-medium">{l.bank} ({l.frequency === 'monthly' ? 'Mensual' : 'Quincenal'})</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-slate-900 dark:text-white text-xs">
                          {formatCurrency(Number(l.payment_amount || 0))}
                        </span>
                        <Link 
                          href="/loans"
                          onClick={() => setSelectedDay(null)}
                          className="p-1.5 rounded-xl border border-white/[0.08] hover:bg-white/10 text-zinc-400 hover:text-white transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Footer con Botón de Registrar Movimiento */}
            <div className="p-4 border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-[#121216] flex items-center gap-2">
              <Link
                href="/wallets?triggerTx=true"
                onClick={() => setSelectedDay(null)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-cerulean hover:bg-brand-cerulean/90 text-white font-black text-xs rounded-xl transition shadow-lg shadow-brand-cerulean/20 active:scale-[0.98]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Registrar Movimiento Manual</span>
              </Link>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
