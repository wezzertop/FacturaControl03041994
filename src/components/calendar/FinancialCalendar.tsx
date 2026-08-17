"use client";

import React, { useState } from "react";
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
  Scale
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

const WEEKDAYS_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

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
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navegación de meses
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  // Cálculo de la cuadrícula del calendario (Inicio en Lunes)
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDaysInMonth = lastDayOfMonth.getDate();

  // getDay() devuelve 0 para Domingo, 1 para Lunes...
  // Queremos 0 para Lunes, 6 para Domingo:
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek < 0) startingDayOfWeek = 6;

  // Días del mes anterior para rellenar
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

  // Relleno mes siguiente para completar múltiplos de 7
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
    const d = new Date(year, month + 1, dayNum);
    calendarCells.push({ date: d, isCurrentMonth: false });
  }

  // Helper para comparar si dos fechas caen el mismo día de calendario
  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // Obtener eventos para una fecha específica
  const getEventsForDate = (dateObj: Date) => {
    const dayOfMonth = dateObj.getDate();
    const isThisMonth = dateObj.getMonth() === month && dateObj.getFullYear() === year;

    // Transacciones directas
    const dayTxList = transactions.filter(tx => {
      if (!tx.date) return false;
      return isSameDay(new Date(tx.date), dateObj);
    });

    // Facturas
    const dayInvoiceList = invoices.filter(inv => {
      if (!inv.fecha) return false;
      return isSameDay(new Date(inv.fecha), dateObj);
    });

    // Pagos Recurrentes (Verificar si aplica en este día)
    const dayRecurringList = recurringPayments.filter(rec => {
      if (!rec.is_active || !rec.next_execution_date) return false;
      const recDate = new Date(rec.next_execution_date);
      if (isSameDay(recDate, dateObj)) return true;

      // Si la frecuencia es mensual y cae en este día del mes
      if (rec.frequency === 'monthly' && isThisMonth) {
        const startD = new Date(rec.start_date);
        return startD.getDate() === dayOfMonth;
      }
      return false;
    });

    // Fechas de Corte y Pago de Tarjetas de Crédito
    const creditWallets = wallets.filter(w => w.type === 'credit');
    const dayCreditCutOffs = creditWallets.filter(w => w.cut_off_day === dayOfMonth && isThisMonth);
    const dayCreditDues = creditWallets.filter(w => w.due_day === dayOfMonth && isThisMonth);

    // Amortización de Préstamos
    const dayLoanPayments = loans.filter(l => {
      if (!l.is_active || !l.start_date) return false;
      const startDate = new Date(l.start_date);
      if (l.frequency === 'monthly' && isThisMonth) {
        return startDate.getDate() === dayOfMonth;
      }
      return false;
    });

    // Calcular Totales del día
    let incomeSum = 0;
    let expenseSum = 0;

    dayTxList.forEach(tx => {
      if (tx.type === 'income') incomeSum += Number(tx.amount || 0);
      else expenseSum += Number(tx.amount || 0);
    });

    dayInvoiceList.forEach(inv => {
      // Si la factura no tiene transacción asociada para no duplicar
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

  // Calcular KPIs Mensuales
  let monthlyTotalIncome = 0;
  let monthlyTotalExpense = 0;
  let monthlyTotalDebts = 0;

  calendarCells.forEach(cell => {
    if (cell.isCurrentMonth) {
      const events = getEventsForDate(cell.date);
      monthlyTotalIncome += events.incomeSum;
      monthlyTotalExpense += events.expenseSum;

      // Sumar deudas de tarjetas y préstamos del mes
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

      {/* Encabezado del Calendario y Controles de Navegación */}
      <div className="surface-card rounded-3xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                {MONTH_NAMES[month]} {year}
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Calendario financiero (Formato México - Lunes a Domingo)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
            >
              Hoy
            </button>
            <div className="flex items-center rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 overflow-hidden">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition"
                title="Mes anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-px h-5 bg-slate-200 dark:bg-zinc-800" />
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition"
                title="Mes siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Leyenda de Código de Colores */}
        <div className="px-5 py-3 bg-slate-100/60 dark:bg-zinc-900/30 border-b border-slate-200/80 dark:border-white/10 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Ingresos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Egresos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Corte / Pago Tarjeta
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Cuota de Préstamo
          </span>
        </div>

        {/* Nombres de los Días de la Semana (Lunes a Domingo) */}
        <div className="grid grid-cols-7 border-b border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-zinc-900/80 text-center text-xs font-bold uppercase text-slate-500 dark:text-zinc-400">
          {WEEKDAYS_ES.map((day, idx) => (
            <div key={day} className={`py-3 ${idx >= 5 ? 'text-brand-cerulean' : ''}`}>
              {day}
            </div>
          ))}
        </div>

        {/* Cuadrícula de Días */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-200/70 dark:divide-zinc-800/80 bg-white dark:bg-zinc-950">
          {calendarCells.map((cell, index) => {
            const events = getEventsForDate(cell.date);
            const isToday = isSameDay(cell.date, today);

            return (
              <button
                key={index}
                onClick={() => setSelectedDay(cell.date)}
                className={`min-h-[110px] md:min-h-[135px] p-2 text-left flex flex-col justify-between transition-colors relative hover:bg-brand-cerulean/5 dark:hover:bg-zinc-900/60 ${
                  cell.isCurrentMonth
                    ? "bg-white dark:bg-zinc-950 text-slate-900 dark:text-white"
                    : "bg-slate-50/50 dark:bg-zinc-900/20 text-slate-400 dark:text-zinc-600"
                }`}
              >
                {/* Encabezado del número de día */}
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

                {/* Indicadores / Insignias de Eventos */}
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
                <p className="text-xs text-slate-500 dark:text-zinc-400">Detalle de movimientos y vencimientos programados</p>
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
          </div>
        </div>
      )}

    </div>
  );
}
