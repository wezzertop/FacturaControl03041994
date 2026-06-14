import React from 'react';
import { createClient } from '@/utils/supabase/server';
import InvoiceTable from '@/components/invoices/InvoiceTable';
import { 
  DollarSign, 
  Receipt, 
  CreditCard, 
  TrendingUp, 
  ShoppingCart, 
  Fuel, 
  Coffee,
  MoreHorizontal,
  PieChart,
  Zap,
  HeartPulse,
  Utensils,
  Wallet,
  ArrowUpRight
} from 'lucide-react';

// Mapeo simple de iconos
const IconMap: Record<string, any> = {
  ShoppingCart,
  Fuel,
  Zap,
  HeartPulse,
  Utensils,
  MoreHorizontal,
  Receipt
};

export default async function FinancialOverview() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Obtener facturas (con categorías)
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, categories(*)')
    .eq('user_id', user.id)
    .order('fecha', { ascending: false });

  const validInvoices = (invoices as any[]) || [];

  // 2. Obtener carteras
  const { data: wallets } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id);
    
  const validWallets = (wallets as any[]) || [];
  const totalWalletsBalance = validWallets.reduce((acc, w) => acc + Number(w.balance), 0);

  // 3. Obtener transacciones (con categorías)
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, categories(*)')
    .eq('user_id', user.id);

  const validTransactions = (transactions as any[]) || [];

  // Calcular sumatorios
  // Facturas de ingreso (nómina y emitidas)
  const invoicesIncome = validInvoices
    .filter(inv => inv.invoice_type === 'nomina' || inv.invoice_type === 'ingreso')
    .reduce((acc, inv) => acc + Number(inv.total), 0);

  // Facturas de egreso (gastos)
  const invoicesExpense = validInvoices
    .filter(inv => inv.invoice_type === 'egreso')
    .reduce((acc, inv) => acc + Number(inv.total), 0);

  const invoicesIva = validInvoices
    .filter(inv => inv.invoice_type === 'egreso')
    .reduce((acc, inv) => acc + Number(inv.iva), 0);

  // Transacciones manuales de ingreso (no vinculadas a facturas)
  const manualIncome = validTransactions
    .filter(tx => tx.type === 'income' && !tx.invoice_id)
    .reduce((acc, tx) => acc + Number(tx.amount), 0);

  // Transacciones manuales de gasto (no vinculadas a facturas, ej. efectivo)
  const manualExpense = validTransactions
    .filter(tx => tx.type === 'expense' && !tx.invoice_id)
    .reduce((acc, tx) => acc + Number(tx.amount), 0);

  // Totales consolidados
  const totalIngreso = invoicesIncome + manualIncome;
  const totalGasto = invoicesExpense + manualExpense;
  const facturasCount = validInvoices.filter(inv => inv.invoice_type === 'egreso').length;

  const KPICards = [
    { 
      title: 'Ingresos Totales (Nómina / Efectivo)', 
      amount: `$${totalIngreso.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      icon: ArrowUpRight,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    { 
      title: 'Gastos Totales (Facturas / Efectivo)', 
      amount: `$${totalGasto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      icon: DollarSign,
      color: 'text-brand-cerulean',
      bg: 'bg-brand-cerulean/10'
    },
    { 
      title: 'Disponible en Carteras', 
      amount: `$${totalWalletsBalance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      icon: Wallet,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
  ];

  // Tomar los últimos 5 gastos de facturas
  const latestTransactions = validInvoices
    .filter(inv => inv.invoice_type === 'egreso')
    .slice(0, 5);

  // Agrupar por categoría para la Dona (XML + Efectivo)
  const categoryTotals: Record<string, { value: number; color: string }> = {};
  
  // Agregar gastos XML
  validInvoices.filter(inv => inv.invoice_type === 'egreso').forEach(inv => {
    const catName = inv.categories?.name || 'Otros';
    const catColor = inv.categories?.color || 'bg-gray-300 dark:bg-zinc-700';
    
    if (!categoryTotals[catName]) {
      categoryTotals[catName] = { value: 0, color: catColor };
    }
    categoryTotals[catName].value += Number(inv.total);
  });

  // Agregar gastos en efectivo / manuales
  validTransactions.filter(tx => tx.type === 'expense' && !tx.invoice_id).forEach(tx => {
    const catName = tx.categories?.name || 'Otros';
    const catColor = tx.categories?.color || 'bg-gray-300 dark:bg-zinc-700';
    
    if (!categoryTotals[catName]) {
      categoryTotals[catName] = { value: 0, color: catColor };
    }
    categoryTotals[catName].value += Number(tx.amount);
  });

  const donutData = Object.entries(categoryTotals)
    .map(([label, data]) => ({
      label,
      value: data.value,
      percentage: totalGasto > 0 ? Math.round((data.value / totalGasto) * 100) + '%' : '0%',
      color: data.color
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);

  if (donutData.length === 0) {
    donutData.push({ label: 'Sin Datos', value: 0, percentage: '0%', color: 'bg-gray-200 dark:bg-zinc-800' });
  }

  // Agrupar por día de la semana para la tendencia (Gastos XML + Efectivo)
  const weekDays = [0, 0, 0, 0, 0, 0, 0];
  
  validInvoices.filter(inv => inv.invoice_type === 'egreso').forEach(inv => {
    const d = new Date(inv.fecha);
    const day = d.getDay();
    const shiftedDay = day === 0 ? 6 : day - 1; // Lunes = 0, Domingo = 6
    weekDays[shiftedDay] += Number(inv.total);
  });

  validTransactions.filter(tx => tx.type === 'expense' && !tx.invoice_id).forEach(tx => {
    const d = new Date(tx.date);
    const day = d.getDay();
    const shiftedDay = day === 0 ? 6 : day - 1; // Lunes = 0, Domingo = 6
    weekDays[shiftedDay] += Number(tx.amount);
  });

  const maxDay = Math.max(...weekDays, 1);
  const trendHeights = weekDays.map(val => (val / maxDay) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-carbon dark:text-white tracking-tight">Resumen Financiero</h2>
          <p className="text-sm text-brand-graphite dark:text-zinc-400 mt-1">Tu panorama de gastos y carteras consolidado en tiempo real.</p>
        </div>
      </div>
 
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {KPICards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-brand-white dark:bg-brand-graphite border border-gray-200 dark:border-zinc-800 rounded-xl p-5 relative overflow-hidden group hover:border-gray-300 dark:hover:border-zinc-700 transition-colors shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-lg ${kpi.bg}`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </div>
              
              <div>
                <p className="text-sm text-brand-graphite dark:text-zinc-400 font-medium mb-1">{kpi.title}</p>
                <h3 className="text-2xl font-bold text-brand-carbon dark:text-white tracking-tight">{kpi.amount}</h3>
              </div>

              {/* Decorative gradient blur */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-transparent to-brand-cerulean opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 blur-2xl transition-opacity duration-500" />
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly Trend Line Chart */}
        <div className="bg-brand-white dark:bg-brand-graphite border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-brand-carbon dark:text-white">Tendencia Semanal de Gastos</h3>
            <TrendingUp className="w-4 h-4 text-brand-graphite dark:text-zinc-500" />
          </div>
          <div className="h-48 flex items-end justify-between gap-2">
            {trendHeights.map((height, i) => (
              <div key={i} className="w-full h-full relative group flex items-end">
                <div 
                  className="w-full bg-gradient-to-t from-brand-cerulean/30 to-brand-cerulean/80 rounded-t-sm transition-all duration-300 group-hover:from-brand-cerulean/50 group-hover:to-brand-cerulean"
                  style={{ height: `${height}%` }}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-brand-carbon text-xs text-white px-2 py-1 rounded shadow-lg transition-opacity whitespace-nowrap z-10">
                    ${weekDays[i].toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-xs text-brand-graphite dark:text-zinc-500 font-medium">
            <span>Lun</span><span>Mar</span><span>Mie</span><span>Jue</span><span>Vie</span><span>Sab</span><span>Dom</span>
          </div>
        </div>

        {/* Expense Distribution Donut Chart */}
        <div className="bg-brand-white dark:bg-brand-graphite border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-brand-carbon dark:text-white">Distribución de Gastos</h3>
            <PieChart className="w-4 h-4 text-brand-graphite dark:text-zinc-500" />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-6 min-h-[12rem] py-2">
            <div className="relative w-32 h-32 flex-shrink-0">
              <div className="absolute inset-0 rounded-full border-[12px] border-transparent border-t-brand-cerulean border-r-blue-400 border-b-emerald-500 border-l-gray-300 dark:border-l-zinc-700 transform rotate-45" />
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-xs text-brand-graphite dark:text-zinc-500">Total</span>
                <span className="text-sm font-bold text-brand-carbon dark:text-white">
                  ${(totalGasto / 1000).toFixed(1)}k
                </span>
              </div>
            </div>

            <div className="flex-1 w-full sm:ml-8 space-y-3">
              {donutData.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-sm text-brand-carbon dark:text-zinc-300 truncate max-w-[150px]">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium text-brand-carbon dark:text-white">{item.percentage}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="lg:col-span-2 bg-brand-white dark:bg-brand-graphite border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-brand-carbon dark:text-white">Últimos Gastos de Facturas (XML)</h3>
        </div>
        
        <div className="mx--6">
          <InvoiceTable invoices={latestTransactions} compact={true} />
        </div>
      </div>
    </div>
  );
}
