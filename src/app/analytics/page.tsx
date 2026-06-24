import React from "react";
import { createClient } from "@/utils/supabase/server";
import { CategoryBarChart, TrendAreaChart } from "@/components/analytics/AnalyticsCharts";
import { CalendarDays, PieChart, Target, TrendingUp } from "lucide-react";
import PageShell from "@/components/layout/PageShell";

export const dynamic = "force-dynamic";

interface CategoryValue {
  name?: string | null;
  color?: string | null;
}

interface InvoiceAnalyticsRow {
  invoice_type?: string | null;
  total?: number | string | null;
  fecha?: string | null;
  categories?: CategoryValue | null;
}

interface TransactionAnalyticsRow {
  type?: string | null;
  amount?: number | string | null;
  date?: string | null;
  invoice_id?: string | number | null;
  categories?: CategoryValue | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);
};

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-8 text-center text-sm text-slate-500">No autenticado</div>;
  }

  const [invoicesResponse, transactionsResponse] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, categories(name, color)")
      .eq("user_id", user.id)
      .order("fecha", { ascending: true }),
    supabase.from("transactions").select("*, categories(name, color)").eq("user_id", user.id),
  ]);

  const validInvoices = (invoicesResponse.data || []) as InvoiceAnalyticsRow[];
  const validTransactions = (transactionsResponse.data || []) as TransactionAnalyticsRow[];

  const tailwindToHex: Record<string, string> = {
    "bg-brand-cerulean": "#007EA7",
    "bg-blue-400": "#60a5fa",
    "bg-emerald-500": "#10b981",
    "bg-red-400": "#f87171",
    "bg-orange-400": "#fb923c",
    "bg-purple-500": "#a855f7",
    "bg-gray-400": "#9ca3af",
    "bg-slate-400": "#94a3b8",
  };

  const categoryMap = new Map<string, { name: string; value: number; hexColor: string }>();
  const addCategoryAmount = (categoryName: string, tailwindColor: string, amount: number) => {
    const hexColor = tailwindToHex[tailwindColor] || "#94a3b8";
    if (!categoryMap.has(categoryName)) {
      categoryMap.set(categoryName, { name: categoryName, value: 0, hexColor });
    }
    categoryMap.get(categoryName)!.value += amount;
  };

  validInvoices
    .filter((invoice) => invoice.invoice_type === "egreso")
    .forEach((invoice) => addCategoryAmount(invoice.categories?.name || "Otros", invoice.categories?.color || "bg-slate-400", Number(invoice.total)));

  validTransactions
    .filter((transaction) => transaction.type === "expense" && !transaction.invoice_id)
    .forEach((transaction) => addCategoryAmount(transaction.categories?.name || "Otros", transaction.categories?.color || "bg-slate-400", Number(transaction.amount)));

  const categoryData = Array.from(categoryMap.values()).sort((a, b) => b.value - a.value);

  const monthMap = new Map<string, number>();
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const addMonthAmount = (dateValue: string, amount: number) => {
    const date = new Date(dateValue);
    const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(2)}`;
    monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + amount);
  };

  validInvoices
    .filter((invoice) => invoice.invoice_type === "egreso")
    .forEach((invoice) => addMonthAmount(invoice.fecha || new Date().toISOString(), Number(invoice.total)));

  validTransactions
    .filter((transaction) => transaction.type === "expense" && !transaction.invoice_id)
    .forEach((transaction) => addMonthAmount(transaction.date || new Date().toISOString(), Number(transaction.amount)));

  const trendData = Array.from(monthMap.entries()).map(([month, value]) => ({ month, value }));
  const totalGasto = categoryData.reduce((sum, category) => sum + category.value, 0);
  const avgMensual = trendData.length > 0 ? totalGasto / trendData.length : 0;
  const topCategory = categoryData.length > 0 ? categoryData[0].name : "Sin datos";

  const metrics = [
    { title: "Gasto total", value: formatCurrency(totalGasto), icon: TrendingUp, tone: "text-brand-cerulean bg-brand-cerulean/10" },
    { title: "Promedio mensual", value: formatCurrency(avgMensual), icon: CalendarDays, tone: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400" },
    { title: "Mayor categoría", value: topCategory, icon: Target, tone: "text-amber-600 bg-amber-500/10 dark:text-amber-400" },
  ];

  return (
    <PageShell
      eyebrow="Análisis"
      title="Análisis de gastos"
      description="Visualiza a dónde va tu dinero y detecta tendencias combinando facturas y movimientos en efectivo."
    >
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.title} className="surface-card rounded-lg p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className={`grid h-10 w-10 place-items-center rounded-lg ${metric.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{metric.title}</h3>
              </div>
              <p className="truncate text-2xl font-semibold text-slate-950 dark:text-white">{metric.value}</p>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="surface-card rounded-lg p-5 md:p-6">
          <div className="mb-6 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-brand-cerulean" />
            <h3 className="text-base font-semibold text-slate-950 dark:text-white">Gastos por categoría</h3>
          </div>
          <div className="h-80 w-full">
            <CategoryBarChart data={categoryData} />
          </div>
        </div>

        <div className="surface-card rounded-lg p-5 md:p-6">
          <div className="mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-cerulean" />
            <h3 className="text-base font-semibold text-slate-950 dark:text-white">Tendencia histórica</h3>
          </div>
          <div className="h-80 w-full">
            <TrendAreaChart data={trendData} />
          </div>
        </div>
      </section>
    </PageShell>
  );
}



