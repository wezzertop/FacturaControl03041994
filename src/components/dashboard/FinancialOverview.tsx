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
  Utensils
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

  // Obtener datos reales
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, categories(*)')
    .eq('user_id', user.id)
    .order('fecha', { ascending: false });

  const validInvoices = invoices || [];
  
  // Calcular sumatorios reales
  const totalGasto = validInvoices.reduce((acc, inv) => acc + Number(inv.total), 0);
  const totalIva = validInvoices.reduce((acc, inv) => acc + Number(inv.iva), 0);
  const facturasCount = validInvoices.length;

  const KPICards = [
    { 
      title: 'Gastos Totales', 
      amount: `$${totalGasto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      icon: DollarSign,
      color: 'text-brand-cerulean',
      bg: 'bg-brand-cerulean/10'
    },
    { 
      title: 'IVA Acreditable', 
      amount: `$${totalIva.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      icon: Receipt,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    { 
      title: 'Facturas Procesadas', 
      amount: `${facturasCount} / 30`, 
      subtitle: 'Plan Gratuito', 
      icon: CreditCard,
      color: 'text-brand-graphite dark:text-zinc-400',
      bg: 'bg-gray-200 dark:bg-zinc-800'
    },
  ];

  // Tomar los últimos 5 movimientos
  const latestTransactions = validInvoices.slice(0, 5);

  // Agrupar por categoría para la Dona
  const categoryTotals: Record<string, { value: number; color: string }> = {};
  validInvoices.forEach(inv => {
    const catName = inv.categories?.name || 'Otros';
    // Mapear color de background a color puro o mantener la clase de tailwind
    const catColor = inv.categories?.color || 'bg-gray-300 dark:bg-zinc-700';
    
    if (!categoryTotals[catName]) {
      categoryTotals[catName] = { value: 0, color: catColor };
    }
    categoryTotals[catName].value += Number(inv.total);
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

  // Agrupar por día de la semana para la tendencia
  const weekDays = [0, 0, 0, 0, 0, 0, 0];
  validInvoices.forEach(inv => {
    const d = new Date(inv.fecha);
    const day = d.getDay();
    const shiftedDay = day === 0 ? 6 : day - 1; // Lunes = 0, Domingo = 6
    weekDays[shiftedDay] += Number(inv.total);
  });
  const maxDay = Math.max(...weekDays, 1);
  const trendHeights = weekDays.map(val => (val / maxDay) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-carbon dark:text-white tracking-tight">Resumen Financiero</h2>
          <p className="text-sm text-brand-graphite dark:text-zinc-400 mt-1">Tu panorama de gastos consolidado en tiempo real.</p>
        </div>
        <button className="px-4 py-2 bg-brand-carbon dark:bg-white text-white dark:text-brand-carbon text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
          Descargar Reporte
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {KPICards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-brand-white dark:bg-brand-graphite border border-gray-200 dark:border-zinc-800 rounded-xl p-5 relative overflow-hidden group hover:border-gray-300 dark:hover:border-zinc-700 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-lg ${kpi.bg}`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                {kpi.subtitle && (
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-brand-graphite dark:text-zinc-400">
                    {kpi.subtitle}
                  </span>
                )}
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
        <div className="bg-brand-white dark:bg-brand-graphite border border-gray-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-brand-carbon dark:text-white">Tendencia Semanal</h3>
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
        <div className="bg-brand-white dark:bg-brand-graphite border border-gray-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-brand-carbon dark:text-white">Distribución de Gastos</h3>
            <PieChart className="w-4 h-4 text-brand-graphite dark:text-zinc-500" />
          </div>
          
          <div className="flex items-center justify-between h-48">
            <div className="relative w-32 h-32 flex-shrink-0">
              <div className="absolute inset-0 rounded-full border-[12px] border-transparent border-t-brand-cerulean border-r-blue-400 border-b-emerald-500 border-l-gray-300 dark:border-l-zinc-700 transform rotate-45" />
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-xs text-brand-graphite dark:text-zinc-500">Total</span>
                <span className="text-sm font-bold text-brand-carbon dark:text-white">
                  ${(totalGasto / 1000).toFixed(1)}k
                </span>
              </div>
            </div>

            <div className="flex-1 ml-8 space-y-3">
              {donutData.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-sm text-brand-carbon dark:text-zinc-300 truncate max-w-[100px]">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium text-brand-carbon dark:text-white">{item.percentage}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="lg:col-span-2 bg-brand-white dark:bg-brand-graphite border border-gray-200 dark:border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-brand-carbon dark:text-white">Últimos Movimientos</h3>
          <button className="text-sm font-medium text-brand-cerulean hover:text-blue-500 transition-colors">
            Ver todos
          </button>
        </div>
        
        <div className="mx--6">
          <InvoiceTable invoices={latestTransactions} compact={true} />
        </div>
      </div>
    </div>
  );
}
