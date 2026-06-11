import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { CategoryBarChart, TrendAreaChart } from '@/components/analytics/AnalyticsCharts';
import { TrendingUp, PieChart, Target, CalendarDays } from 'lucide-react';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>No autenticado</div>;
  }

  // Obtener todas las facturas del usuario con su categoría
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, categories(name, color)')
    .eq('user_id', user.id)
    .order('fecha', { ascending: true });

  const validInvoices = invoices || [];

  // Mapear colores de Tailwind a Hex para Recharts
  const tailwindToHex: Record<string, string> = {
    'bg-brand-cerulean': '#38bdf8',
    'bg-blue-400': '#60a5fa',
    'bg-emerald-500': '#10b981',
    'bg-red-400': '#f87171',
    'bg-orange-400': '#fb923c',
    'bg-gray-400': '#9ca3af',
  };

  // 1. Agrupar por Categoría
  const categoryMap = new Map<string, { name: string, value: number, hexColor: string }>();
  
  validInvoices.forEach(inv => {
    const catName = inv.categories?.name || 'Sin clasificar';
    const twColor = inv.categories?.color || 'bg-gray-400';
    const hexColor = tailwindToHex[twColor] || '#9ca3af';

    if (!categoryMap.has(catName)) {
      categoryMap.set(catName, { name: catName, value: 0, hexColor });
    }
    const current = categoryMap.get(catName)!;
    current.value += Number(inv.total);
  });

  const categoryData = Array.from(categoryMap.values()).sort((a, b) => b.value - a.value);

  // 2. Agrupar por Mes (Tendencia)
  const monthMap = new Map<string, number>();
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  validInvoices.forEach(inv => {
    const d = new Date(inv.fecha);
    const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
    
    monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + Number(inv.total));
  });

  const trendData = Array.from(monthMap.entries()).map(([month, value]) => ({ month, value }));

  // Key Metrics
  const totalGasto = validInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const avgMensual = trendData.length > 0 ? totalGasto / trendData.length : 0;
  const topCategory = categoryData.length > 0 ? categoryData[0].name : 'N/A';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-brand-carbon dark:text-white tracking-tight">Análisis de Gastos</h2>
        <p className="text-sm text-brand-graphite dark:text-zinc-400 mt-1">
          Visualiza a dónde va tu dinero y descubre tendencias en tus hábitos de consumo.
        </p>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-brand-graphite border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-brand-graphite dark:text-zinc-400">Gasto Total Acumulado</h3>
          </div>
          <p className="text-2xl font-bold text-brand-carbon dark:text-white">{formatCurrency(totalGasto)}</p>
        </div>

        <div className="bg-white dark:bg-brand-graphite border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-brand-graphite dark:text-zinc-400">Promedio Mensual</h3>
          </div>
          <p className="text-2xl font-bold text-brand-carbon dark:text-white">{formatCurrency(avgMensual)}</p>
        </div>

        <div className="bg-white dark:bg-brand-graphite border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-brand-graphite dark:text-zinc-400">Categoría Mayor Gasto</h3>
          </div>
          <p className="text-xl font-bold text-brand-carbon dark:text-white truncate">{topCategory}</p>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfica de Barras por Categoría */}
        <div className="bg-white dark:bg-brand-graphite border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-brand-graphite dark:text-zinc-400" />
            <h3 className="text-lg font-semibold text-brand-carbon dark:text-white">Gastos por Categoría</h3>
          </div>
          <div className="h-80 w-full">
            <CategoryBarChart data={categoryData} />
          </div>
        </div>

        {/* Gráfica de Área Mensual */}
        <div className="bg-white dark:bg-brand-graphite border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-brand-graphite dark:text-zinc-400" />
            <h3 className="text-lg font-semibold text-brand-carbon dark:text-white">Tendencia Histórica</h3>
          </div>
          <div className="h-80 w-full">
            <TrendAreaChart data={trendData} />
          </div>
        </div>

      </div>
    </div>
  );
}
