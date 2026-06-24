import React from "react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import InvoiceTable from "@/components/invoices/InvoiceTable";
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  PieChart,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

interface KpiCard {
  title: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone: string;
}

interface CategoryValue {
  name?: string | null;
  color?: string | null;
}

interface InvoiceRow {
  id: string | number;
  invoice_type?: string | null;
  total?: number | string | null;
  iva?: number | string | null;
  fecha?: string | null;
  categories?: CategoryValue | null;
  [key: string]: unknown;
}

interface WalletRow {
  balance?: number | string | null;
  [key: string]: unknown;
}

interface TransactionRow {
  type?: string | null;
  amount?: number | string | null;
  date?: string | null;
  invoice_id?: string | number | null;
  categories?: CategoryValue | null;
  [key: string]: unknown;
}

export default async function FinancialOverview() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [invoicesResponse, walletsResponse, transactionsResponse] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, categories(*)")
      .eq("user_id", user.id)
      .order("fecha", { ascending: false }),
    supabase.from("wallets").select("*").eq("user_id", user.id),
    supabase.from("transactions").select("*, categories(*)").eq("user_id", user.id),
  ]);

  const validInvoices = (invoicesResponse.data || []) as InvoiceRow[];
  const validWallets = (walletsResponse.data || []) as WalletRow[];
  const validTransactions = (transactionsResponse.data || []) as TransactionRow[];

  const totalWalletsBalance = validWallets.reduce((acc, wallet) => acc + Number(wallet.balance), 0);
  const invoicesIncome = validInvoices
    .filter((invoice) => invoice.invoice_type === "nomina" || invoice.invoice_type === "ingreso")
    .reduce((acc, invoice) => acc + Number(invoice.total), 0);
  const invoicesExpense = validInvoices
    .filter((invoice) => invoice.invoice_type === "egreso")
    .reduce((acc, invoice) => acc + Number(invoice.total), 0);
  const manualIncome = validTransactions
    .filter((transaction) => transaction.type === "income" && !transaction.invoice_id)
    .reduce((acc, transaction) => acc + Number(transaction.amount), 0);
  const manualExpense = validTransactions
    .filter((transaction) => transaction.type === "expense" && !transaction.invoice_id)
    .reduce((acc, transaction) => acc + Number(transaction.amount), 0);

  const totalIngreso = invoicesIncome + manualIncome;
  const totalGasto = invoicesExpense + manualExpense;
  const balance = totalIngreso - totalGasto + totalWalletsBalance;
  const latestTransactions = validInvoices.filter((invoice) => invoice.invoice_type === "egreso").slice(0, 5);

  const kpiCards: KpiCard[] = [
    {
      title: "Ingresos consolidados",
      value: currency.format(totalIngreso),
      helper: "Nómina, facturas emitidas y efectivo",
      icon: ArrowUpRight,
      tone: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
    },
    {
      title: "Gastos registrados",
      value: currency.format(totalGasto),
      helper: "Facturas XML y movimientos manuales",
      icon: ArrowDownRight,
      tone: "text-brand-cerulean bg-brand-cerulean/10",
    },
    {
      title: "Saldo en carteras",
      value: currency.format(totalWalletsBalance),
      helper: `${validWallets.length} cartera${validWallets.length === 1 ? "" : "s"} activa${validWallets.length === 1 ? "" : "s"}`,
      icon: Wallet,
      tone: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
    },
  ];

  const categoryTotals: Record<string, { value: number; color: string }> = {};

  validInvoices
    .filter((invoice) => invoice.invoice_type === "egreso")
    .forEach((invoice) => {
      const category = invoice.categories?.name || "Otros";
      const color = invoice.categories?.color || "bg-slate-400";
      categoryTotals[category] ??= { value: 0, color };
      categoryTotals[category].value += Number(invoice.total);
    });

  validTransactions
    .filter((transaction) => transaction.type === "expense" && !transaction.invoice_id)
    .forEach((transaction) => {
      const category = transaction.categories?.name || "Otros";
      const color = transaction.categories?.color || "bg-slate-400";
      categoryTotals[category] ??= { value: 0, color };
      categoryTotals[category].value += Number(transaction.amount);
    });

  const categoryData = Object.entries(categoryTotals)
    .map(([label, data]) => ({
      label,
      value: data.value,
      percentage: totalGasto > 0 ? Math.round((data.value / totalGasto) * 100) : 0,
      color: data.color,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const weekDays = [0, 0, 0, 0, 0, 0, 0];
  const addToWeekday = (dateValue: string, amount: number) => {
    const day = new Date(dateValue).getDay();
    weekDays[day === 0 ? 6 : day - 1] += amount;
  };

  validInvoices
    .filter((invoice) => invoice.invoice_type === "egreso")
    .forEach((invoice) => addToWeekday(invoice.fecha || new Date().toISOString(), Number(invoice.total)));
  validTransactions
    .filter((transaction) => transaction.type === "expense" && !transaction.invoice_id)
    .forEach((transaction) => addToWeekday(transaction.date || new Date().toISOString(), Number(transaction.amount)));

  const maxDay = Math.max(...weekDays, 1);
  const trendHeights = weekDays.map((value) => Math.max((value / maxDay) * 100, value > 0 ? 8 : 2));

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-lg p-5 md:p-6">
        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase text-brand-cerulean">Resumen en vivo</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white md:text-3xl">
              Panorama financiero
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Ingresos, gastos, carteras y facturas consolidados para tomar decisiones rápidas sin revisar cada XML por separado.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Balance operativo</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{currency.format(balance)}</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-brand-cerulean/10 text-brand-cerulean">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.title} className="surface-card rounded-lg p-5 transition hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-4">
                <div className={`grid h-11 w-11 place-items-center rounded-lg ${kpi.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <Receipt className="h-4 w-4 text-slate-400" />
              </div>
              <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">{kpi.title}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{kpi.value}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">{kpi.helper}</p>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="surface-card rounded-lg p-5 md:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-950 dark:text-white">Tendencia semanal</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Gasto por día</p>
            </div>
            <TrendingUp className="h-5 w-5 text-brand-cerulean" />
          </div>
          <div className="flex h-52 items-end justify-between gap-2">
            {trendHeights.map((height, index) => (
              <div key={index} className="group flex h-full w-full items-end">
                <div className="relative w-full rounded-t-md bg-brand-cerulean/75 transition group-hover:bg-brand-cerulean" style={{ height: `${height}%` }}>
                  <span className="absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded-md bg-slate-950 px-2 py-1 text-xs font-medium text-white shadow-lg group-hover:block">
                    {currency.format(weekDays[index])}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-xs font-medium text-slate-500 dark:text-slate-500">
            <span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span>
          </div>
        </div>

        <div className="surface-card rounded-lg p-5 md:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-950 dark:text-white">Gastos por categoría</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Top de consumo consolidado</p>
            </div>
            <PieChart className="h-5 w-5 text-brand-cerulean" />
          </div>

          {categoryData.length > 0 ? (
            <div className="space-y-4">
              {categoryData.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.color}`} />
                      <span className="truncate font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
                    </div>
                    <span className="shrink-0 font-semibold text-slate-950 dark:text-white">{item.percentage}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <div className="h-full rounded-full bg-brand-cerulean" style={{ width: `${Math.max(item.percentage, 3)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-slate-300 text-center dark:border-white/10">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Aún no hay gastos</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Carga XML o registra movimientos para ver el desglose.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="surface-card rounded-lg p-5 md:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-950 dark:text-white">Últimos gastos de facturas</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Los XML de egreso más recientes.</p>
          </div>
        </div>
        <InvoiceTable invoices={latestTransactions} compact />
      </section>
    </div>
  );
}



