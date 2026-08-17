"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  ListFilter
} from "lucide-react";

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

// Reordenamiento solicitado: Domingo en lateral Izquierdo (col 1) y Sábado en lateral Derecho (col 7)
const WEEKDAYS_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

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
  
  // Estado de vista: 'month' (Mensual) o 'week' (Semanal)
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [currentWeekDate, setCurrentWeekDate] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Filtros
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'income' | 'expense' | 'credit' | 'loans' | 'recurring'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Helper para comparar si dos fechas caen el mismo día de calendario
  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // --- OBTENER EVENTOS DE UN DÍA ESPECÍFICO ---
  const getEventsForDate = (dateObj: Date) => {
    const dayOfMonth = dateObj.getDate();
    const isThisMonth = dateObj.getMonth() === month && dateObj.getFullYear() === year;

    // 1. Transacciones
    let dayTxList = transactions.filter(tx => {
      if (!tx.date) return false;
      return isSameDay(new Date(tx.date), dateObj);
    });

    // 2. Facturas (que no tengan tx previa para evitar duplicados)
    let dayInvoiceList = invoices.filter(inv => {
      if (!inv.fecha) return false;
      return isSameDay(new Date(inv.fecha), dateObj);
    });

    // 3. Pagos Recurrentes
    let dayRecurringList = recurringPayments.filter(rec => {
      if (!rec.is_active || !rec.next_execution_date) return false;
      const recDate = new Date(rec.next_execution_date);
      if (isSameDay(recDate, dateObj)) return true;
      if (rec.frequency === 'monthly' && isThisMonth) {
        const startD = new Date(rec.start_date);
        return startD.getDate() === dayOfMonth;
      }
      return false;
    });

    // 4. Tarjetas de Crédito (Corte y Límite de Pago)
    const creditWallets = wallets.filter(w => w.type === 'credit');
    let dayCreditCutOffs = creditWallets.filter(w => w.cut_off_day === dayOfMonth && isThisMonth);
    let dayCreditDues = creditWallets.filter(w => w.due_day === dayOfMonth && isThisMonth);

    // 5. Préstamos
    let dayLoanPayments = loans.filter(l => {
      if (!l.is_active || !l.start_date) return false;
      const startDate = new Date(l.start_date);
      if (l.frequency === 'monthly' && isThisMonth) {
        return startDate.getDate() === dayOfMonth;
      }
      return false;
    });

    // --- APLICAR FILTRO DE BÚSQUEDA POR TEXTO ---
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      dayTxList = dayTxList.filter(tx => (tx.concept || '').toLowerCase().includes(q) || (tx.categories?.name || '').toLowerCase().includes(q));
      dayInvoiceList = dayInvoiceList.filter(inv => (inv.nombre_emisor || inv.nombre_receptor || inv.uuid || '').toLowerCase().includes(q));
      dayRecurringList = dayRecurringList.filter(rec => (rec.concept || '').toLowerCase().includes(q));
      dayCreditCutOffs = dayCreditCutOffs.filter(w => (w.name || '').toLowerCase().includes(q));
      dayCreditDues = dayCreditDues.filter(w => (w.name || '').toLowerCase().includes(q));
      dayLoanPayments = dayLoanPayments.filter(l => (l.name || l.bank || '').toLowerCase().includes(q));
    }

    // --- APLICAR FILTRO POR TIPO DE EVENTO ---
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

    // Sumar Totales del día
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

    return {
      transactions: dayTxList,
      invoices: dayInvoiceList,
      recurring: dayRecurringList,
      creditCutOffs: dayCreditCutOffs,
      creditDues: dayCreditDues,
      loanPayments: dayLoanPayments,
      incomeSum,
      expenseSum,
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

  // getDay() devuelve 0 para Domingo (Columna 1) y 6 para Sábado (Columna 7)
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Domingo, 6 = Sábado

  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const calendarCells = [];

  // Relleno mes anterior
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i);
    calendarCells.push({ date: d, isCurrentMonth: false });
  }

  // Días del mes actual
  for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
    const d = new Date(year, month, dayNum);
    calendarCells.push({ date: d, isCurrentMonth: true });
  }

  // Relleno mes siguiente para completar cuadrícula de 7 columnas
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
    const d = new Date(year, month + 1, dayNum);
    calendarCells.push({ date: d, isCurrentMonth: false });
  }

  // --- CÁLCULO DE DÍAS PARA VISTA SEMANAL (DOMINGO A SÁBADO) ---
  const startOfWeek = new Date(currentWeekDate);
  const dayIndex = startOfWeek.getDay(); // 0 = Domingo
  startOfWeek.setDate(startOfWeek.getDate() - dayIndex); // Llevar al Domingo de la semana

  const weekCells: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    weekCells.push(d);
  }

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  // --- CÁLCULO DE KPIS MENSUALES ---
  let monthlyTotalIncome = 0;
  let monthlyTotalExpense = 0;
  let monthlyTotalDebts = 0;

  calendarCells.forEach(cell => {
    if (cell.isCurrentMonth) {
      const events = getEventsForDate(cell.date);
      monthlyTotalIncome += events.incomeSum;
      monthlyTotalExpense += events.expenseSum;

      events.creditDues.forEach(w => {
        monthlyTotalDebts += Number(w.statement_payment_due || 0);
      });
      events.loanPayments.forEach(l => {
        monthlyTotalDebts += Number(l.payment_amount || 0);
      });
    }
  });

  const monthlyNetCashflow = monthlyTotalIncome - monthlyTotalExpense;
  const selectedDayEvents = selectedDay ? getEventsForDate(selectedDay) : null;

  return (
    <div className="space-y-6">

      {/* Tarjetas de Resumen KPI Mensual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-card rounded-2xl p-5 flex items-center justify-between border border-slate-200/80 dark:border-white/10 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Ingresos Mensuales</p>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(monthlyTotalIncome)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="surface-card rounded-2xl p-5 flex items-center justify-between border border-slate-200/80 dark:border-white/10 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Egresos Mensuales</p>
            <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
              {formatCurrency(monthlyTotalExpense)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="surface-card rounded-2xl p-5 flex items-center justify-between border border-slate-200/80 dark:border-white/10 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Flujo de Caja Neto</p>
            <p className={`text-xl font-extrabold mt-1 ${monthlyNetCashflow >= 0 ? 'text-brand-cerulean' : 'text-amber-500'}`}>
              {formatCurrency(monthlyNetCashflow)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        <div className="surface-card rounded-2xl p-5 flex items-center justify-between border border-slate-200/80 dark:border-white/10 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Vencimientos / Deudas</p>
            <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {formatCurrency(monthlyTotalDebts)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra Superior: Selector de Vista (Mes/Semana), Navegación y Filtros */}
      <div className="surface-card rounded-3xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-sm">
        
        <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-zinc-900/50">
          
          {/* Título y Selector de Vista */}
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

            {/* Alternador de Vista (Mes / Semana) */}
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

          {/* Controles de Navegación y Hoy */}
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
                title={viewMode === 'month' ? "Mes anterior" : "Semana anterior"}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-px h-5 bg-slate-200 dark:bg-zinc-800" />
              <button
                onClick={viewMode === 'month' ? handleNextMonth : handleNextWeek}
                className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition"
                title={viewMode === 'month' ? "Mes siguiente" : "Semana siguiente"}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filtros Rápidos por Categoria / Tipo de Evento y Buscador */}
        <div className="px-5 py-3 bg-slate-100/60 dark:bg-zinc-900/40 border-b border-slate-200/80 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Botones de Filtro */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <span className="text-slate-400 dark:text-zinc-500 mr-1 flex items-center gap-1">
              <ListFilter className="w-3.5 h-3.5" /> Filtrar:
            </span>
            <button
              onClick={() => setEventTypeFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition ${eventTypeFilter === 'all' ? 'bg-brand-cerulean text-white' : 'bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-zinc-700'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setEventTypeFilter('income')}
              className={`px-2.5 py-1 rounded-lg transition ${eventTypeFilter === 'income' ? 'bg-emerald-600 text-white' : 'bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-zinc-700'}`}
            >
              🟢 Ingresos
            </button>
            <button
              onClick={() => setEventTypeFilter('expense')}
              className={`px-2.5 py-1 rounded-lg transition ${eventTypeFilter === 'expense' ? 'bg-rose-600 text-white' : 'bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-zinc-700'}`}
            >
              🔴 Egresos
            </button>
            <button
              onClick={() => setEventTypeFilter('credit')}
              className={`px-2.5 py-1 rounded-lg transition ${eventTypeFilter === 'credit' ? 'bg-amber-600 text-white' : 'bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-zinc-700'}`}
            >
              💳 Tarjetas
            </button>
            <button
              onClick={() => setEventTypeFilter('loans')}
              className={`px-2.5 py-1 rounded-lg transition ${eventTypeFilter === 'loans' ? 'bg-indigo-600 text-white' : 'bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-zinc-700'}`}
            >
              🏦 Préstamos
            </button>
            <button
              onClick={() => setEventTypeFilter('recurring')}
              className={`px-2.5 py-1 rounded-lg transition ${eventTypeFilter === 'recurring' ? 'bg-purple-600 text-white' : 'bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-zinc-700'}`}
            >
              🔄 Recurrentes
            </button>
          </div>

          {/* Campo de Búsqueda */}
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

        {/* Nombres de Días de la Semana: DOMINGO en Columna 1 (Izquierda), SÁBADO en Columna 7 (Derecha) */}
        <div className="grid grid-cols-7 border-b border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-zinc-900/80 text-center text-xs font-bold uppercase text-slate-500 dark:text-zinc-400">
          {WEEKDAYS_ES.map((day, idx) => (
            <div key={day} className={`py-3 ${idx === 0 || idx === 6 ? 'text-brand-cerulean font-extrabold' : ''}`}>
              {day}
            </div>
          ))}
        </div>

        {/* --- RENDERING DE LA VISTA MENSUAL --- */}
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
                  {/* Día del mes */}
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

                    {events.hasEvents && (
                      <span className="w-2 h-2 rounded-full bg-brand-cerulean animate-pulse" />
                    )}
                  </div>

                  {/* Insignias de Eventos del Día */}
                  <div className="space-y-1 mt-1 w-full overflow-hidden">
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
                </button>
              );
            })}
          </div>
        )}

        {/* --- RENDERING DE LA VISTA SEMANAL --- */}
        {viewMode === 'week' && (
          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-200/70 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
            {weekCells.map((weekDate, index) => {
              const events = getEventsForDate(weekDate);
              const isToday = isSameDay(weekDate, today);

              return (
                <div key={index} className="p-3 min-h-[300px] flex flex-col justify-between space-y-3 bg-white dark:bg-zinc-950">
                  {/* Encabezado del día semanal */}
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

                  {/* Lista de Eventos de la Semana */}
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

                        {events.transactions.map(tx => (
                          <div key={`w-tx-${tx.id}`} className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs">
                            <p className="font-bold text-slate-900 dark:text-white truncate">{tx.concept}</p>
                            <p className="text-[10px] text-slate-500">{tx.wallets?.name || 'Cartera'}</p>
                            <p className={`text-right font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                              {formatCurrency(Number(tx.amount || 0))}
                            </p>
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

      {/* Modal / Panel Deslizable de Detalle del Día Seleccionado */}
      {selectedDay && selectedDayEvents && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="surface-card w-full max-w-lg rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/80 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white capitalize">
                  {selectedDay.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Detalle completo de movimientos y vencimientos</p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
              {!selectedDayEvents.hasEvents ? (
                <div className="py-8 text-center text-slate-500 dark:text-zinc-400">
                  <CalendarIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-700 mb-2" />
                  <p className="text-sm font-medium">Sin movimientos ni vencimientos programados para este día.</p>
                </div>
              ) : (
                <>
                  {/* Cortes y Fechas Límite de Tarjetas */}
                  {selectedDayEvents.creditCutOffs.map(w => (
                    <div key={`cutoff-${w.id}`} className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">Día de Corte: {w.name}</p>
                          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Cierre de periodo de facturación de tarjeta</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedDayEvents.creditDues.map(w => (
                    <div key={`due-${w.id}`} className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/30 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">Fecha Límite de Pago: {w.name}</p>
                          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Pago para no generar intereses</p>
                        </div>
                      </div>
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {formatCurrency(Number(w.statement_payment_due || 0))}
                      </span>
                    </div>
                  ))}

                  {/* Amortización de Préstamos */}
                  {selectedDayEvents.loanPayments.map(l => (
                    <div key={`loan-${l.id}`} className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <Landmark className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">Cuota de Préstamo: {l.name}</p>
                          <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium">{l.bank} ({l.frequency === 'monthly' ? 'Mensual' : 'Quincenal'})</p>
                        </div>
                      </div>
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {formatCurrency(Number(l.payment_amount || 0))}
                      </span>
                    </div>
                  ))}

                  {/* Transacciones Registradas */}
                  {selectedDayEvents.transactions.map(tx => {
                    const isIncome = tx.type === 'income';
                    return (
                      <div key={`tx-${tx.id}`} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isIncome ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                            {isIncome ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{tx.concept}</p>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">{tx.wallets?.name || 'Cartera'} {tx.categories ? `• ${tx.categories.name}` : ''}</p>
                          </div>
                        </div>
                        <span className={`font-extrabold text-sm ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(Number(tx.amount || 0))}
                        </span>
                      </div>
                    );
                  })}

                  {/* Ocurrencias de Pagos Recurrentes */}
                  {selectedDayEvents.recurring.map(rec => {
                    const isIncome = rec.type === 'income';
                    return (
                      <div key={`rec-${rec.id}`} className="p-3.5 rounded-2xl bg-brand-cerulean/10 border border-brand-cerulean/20 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-brand-cerulean/20 text-brand-cerulean flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{rec.concept}</p>
                            <p className="text-xs text-brand-cerulean font-medium truncate">Pago Recurrente Programado</p>
                          </div>
                        </div>
                        <span className={`font-extrabold text-sm ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(Number(rec.amount || 0))}
                        </span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Acciones del Modal */}
            <div className="p-4 border-t border-slate-200/80 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 flex items-center justify-between">
              <Link
                href="/wallets?triggerTx=true"
                onClick={() => setSelectedDay(null)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-cerulean hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition shadow-md shadow-brand-cerulean/20"
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
